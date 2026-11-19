<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Contact;
use App\Models\Expense;
use App\Models\JournalEntry;
use App\Services\AccountingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseController extends Controller
{
    public function __construct(protected AccountingService $accountingService)
    {
    }

    public function index(Request $request): Response
    {
        $query = Expense::with(['contact', 'expenseAccount', 'paidThroughAccount']);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('expense_number', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%")
                  ->orWhere('reference_number', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%")
                  ->orWhereHas('contact', fn($c) => $c->where('name', 'like', "%{$search}%"));
            });
        }

        if ($category = $request->input('category')) {
            if ($category !== 'ALL') {
                $query->where('category', $category);
            }
        }

        $expenses = $query->latest('expense_date')->paginate(15)->withQueryString();

        $expenseAccounts = Account::where('type', 'EXPENSE')
            ->orderBy('code')
            ->get(['id', 'name', 'code']);

        $paidThroughAccounts = Account::whereIn('code', ['1000', '1010', '1020'])
            ->orderBy('code')
            ->get(['id', 'name', 'code']);

        $vendors = Contact::active()
            ->orderBy('name')
            ->get(['id', 'name', 'phone']);

        $categories = [
            'Office Rent',
            'Utilities (Electricity/Water/Gas)',
            'Internet & Telecom',
            'Salaries & Staff Wages',
            'Office Supplies & Stationery',
            'Repairs & Maintenance',
            'Advertising & Marketing',
            'Travel, Fuel & Conveyance',
            'Software, Hosting & IT Subscriptions',
            'Food, Entertainment & Refreshments',
            'Legal & Professional Fees',
            'Bank Charges & Fees',
            'General & Miscellaneous Operating Costs',
        ];

        $totalExpenses = Expense::sum('amount');
        $thisMonthExpenses = Expense::whereYear('expense_date', now()->year)
            ->whereMonth('expense_date', now()->month)
            ->sum('amount');

        $nextSeq = (int)Expense::max('id') + 1;
        $nextExpenseNumber = 'EXP-' . date('Y') . '-' . str_pad((string)$nextSeq, 4, '0', STR_PAD_LEFT);

        return Inertia::render('Purchases/Expenses/Index', [
            'expenses'              => $expenses,
            'expense_accounts'      => $expenseAccounts,
            'paid_through_accounts' => $paidThroughAccounts,
            'vendors'               => $vendors,
            'categories'            => $categories,
            'next_expense_number'   => $nextExpenseNumber,
            'metrics'               => [
                'total_expenses'      => $totalExpenses,
                'this_month_expenses' => $thisMonthExpenses,
                'count'               => $expenses->total(),
            ],
            'filters'               => $request->only(['search', 'category']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'expense_number'          => 'nullable|string|max:100',
            'expense_date'            => 'required|date',
            'expense_account_id'      => 'required|exists:accounts,id',
            'paid_through_account_id' => 'required|exists:accounts,id',
            'amount'                  => 'required|numeric|min:0.01',
            'contact_id'              => 'nullable|exists:contacts,id',
            'category'                => 'required|string|max:150',
            'reference_number'        => 'nullable|string|max:100',
            'notes'                   => 'nullable|string|max:1000',
            'attachments.*'           => 'nullable|file|max:10240',
        ]);

        $nextSeq = (int)Expense::max('id') + 1;
        $expNumber = ! empty($validated['expense_number'])
            ? $validated['expense_number']
            : 'EXP-' . date('Y') . '-' . str_pad((string)$nextSeq, 4, '0', STR_PAD_LEFT);

        $savedAttachments = [];
        if ($request->hasFile('attachments')) {
            $files = array_slice($request->file('attachments'), 0, 5);
            foreach ($files as $file) {
                $path = $file->store('attachments/expenses', 'public');
                $savedAttachments[] = [
                    'name' => $file->getClientOriginalName(),
                    'path' => '/storage/' . $path,
                    'size' => $file->getSize(),
                ];
            }
        }

        DB::transaction(function () use ($validated, $expNumber, $savedAttachments) {
            $expense = Expense::create([
                'expense_number'          => $expNumber,
                'expense_date'            => $validated['expense_date'],
                'expense_account_id'      => $validated['expense_account_id'],
                'paid_through_account_id' => $validated['paid_through_account_id'],
                'amount'                  => $validated['amount'],
                'contact_id'              => $validated['contact_id'] ?? null,
                'category'                => $validated['category'],
                'reference_number'        => $validated['reference_number'] ?? null,
                'notes'                   => $validated['notes'] ?? null,
                'attachments'             => $savedAttachments,
            ]);

            // Post double entry to ledger
            $this->accountingService->postExpense($expense);
        });

        return back()->with('success', "Operating Expense #{$expNumber} recorded and posted to ledger!");
    }

    public function destroy(Expense $expense): RedirectResponse
    {
        DB::transaction(function () use ($expense) {
            // Delete journal entry & reverse account balance changes
            if ($entry = JournalEntry::where('source_document_type', 'EXPENSE')->where('source_document_id', $expense->id)->first()) {
                foreach ($entry->lines as $line) {
                    $account = $line->account;
                    if ($account) {
                        if (in_array($account->type, ['ASSET', 'EXPENSE'])) {
                            $account->decrement('balance', (float)$line->debit - (float)$line->credit);
                        } else {
                            $account->decrement('balance', (float)$line->credit - (float)$line->debit);
                        }
                    }
                }
                $entry->lines()->delete();
                $entry->delete();
            }

            $expense->delete();
        });

        return back()->with('success', "Expense #{$expense->expense_number} deleted and ledger updated.");
    }
}
