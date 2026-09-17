<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\JournalEntry;
use App\Services\AccountingService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BankingController extends Controller
{
    public function __construct(protected AccountingService $accountingService)
    {
    }

    public function index(): Response
    {
        $accounts = Account::where('sub_type', 'CASH_AND_BANK')->get();
        $allAccounts = Account::orderBy('code')->get();
        $recentJournals = JournalEntry::with('lines.account')->latest('date')->take(10)->get();

        return Inertia::render('Banking/Index', [
            'accounts'       => $accounts,
            'allAccounts'    => $allAccounts,
            'recentJournals' => $recentJournals,
        ]);
    }

    public function storeJournalEntry(Request $request)
    {
        $validated = $request->validate([
            'reference'   => 'nullable|string|max:100',
            'description' => 'required|string|max:255',
            'lines'       => 'required|array|min:2',
            'lines.*.account_code' => 'required|exists:accounts,code',
            'lines.*.debit'        => 'required|numeric|min:0',
            'lines.*.credit'       => 'required|numeric|min:0',
        ]);

        $entryNumber = 'JRN-' . date('Y') . '-' . str_pad((string)(JournalEntry::count() + 1), 4, '0', STR_PAD_LEFT);

        $this->accountingService->createBalancedJournalEntry([
            'entry_number'         => $entryNumber,
            'reference'            => $validated['reference'] ?? null,
            'description'          => $validated['description'],
            'source_document_type' => 'MANUAL',
            'lines'                => $validated['lines'],
        ]);

        return back()->with('success', 'Manual journal entry posted successfully.');
    }
}
