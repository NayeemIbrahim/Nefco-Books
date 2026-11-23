<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Bill;
use App\Models\Contact;
use App\Models\JournalEntry;
use App\Models\Payment;
use App\Services\AccountingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PaymentMadeController extends Controller
{
    public function __construct(protected AccountingService $accountingService)
    {
    }

    public function index(Request $request): Response
    {
        $query = Payment::with(['contact', 'bill.lineItems', 'bill.contact', 'account'])
            ->where('type', 'VENDOR_PAYMENT');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('payment_number', 'like', "%{$search}%")
                  ->orWhere('reference_number', 'like', "%{$search}%")
                  ->orWhereHas('contact', fn($c) => $c->where('name', 'like', "%{$search}%"));
            });
        }

        $payments = $query->latest('payment_date')->paginate(15)->withQueryString();

        $vendors = Contact::active()
            ->whereIn('type', ['VENDOR', 'BOTH'])
            ->orderBy('name')
            ->get(['id', 'name', 'phone', 'whatsapp_number']);

        $unpaidBills = Bill::with(['contact', 'lineItems'])
            ->whereNotIn('status', ['PAID', 'VOID'])
            ->where(function ($q) {
                $q->whereColumn('paid_amount', '<', 'total_amount')->orWhereNull('paid_amount');
            })
            ->orderBy('due_date')
            ->get();

        $paidFromAccounts = Account::whereIn('code', ['1000', '1010', '1020'])->get(['id', 'name', 'code']);

        $totalPaid = Payment::where('type', 'VENDOR_PAYMENT')->sum('amount');
        $thisMonthPaid = Payment::where('type', 'VENDOR_PAYMENT')
            ->whereYear('payment_date', now()->year)
            ->whereMonth('payment_date', now()->month)
            ->sum('amount');

        $nextSeq = (int)Payment::where('type', 'VENDOR_PAYMENT')->max('id') + 1;
        $nextPaymentNumber = 'VPAY-' . date('Y') . '-' . str_pad((string)$nextSeq, 4, '0', STR_PAD_LEFT);

        return Inertia::render('Purchases/PaymentsMade/Index', [
            'payments'            => $payments,
            'vendors'             => $vendors,
            'unpaid_bills'        => $unpaidBills,
            'paid_from_accounts'  => $paidFromAccounts,
            'next_payment_number' => $nextPaymentNumber,
            'metrics'             => [
                'total_paid'      => $totalPaid,
                'this_month_paid' => $thisMonthPaid,
                'count'           => $payments->total(),
            ],
            'filters'             => $request->only(['search']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'payment_number'   => 'nullable|string|max:100',
            'contact_id'       => 'required|exists:contacts,id',
            'bill_id'          => 'nullable|exists:bills,id',
            'account_id'       => 'required|exists:accounts,id',
            'payment_date'     => 'required|date',
            'amount'           => 'required|numeric|min:0.01',
            'payment_method'   => 'required|in:CASH,BANK_TRANSFER,CHEQUE,MOBILE_BANKING',
            'reference_number' => 'nullable|string|max:100',
            'notes'            => 'nullable|string|max:1000',
        ]);

        $nextSeq = (int)Payment::where('type', 'VENDOR_PAYMENT')->max('id') + 1;
        $payNumber = ! empty($validated['payment_number'])
            ? $validated['payment_number']
            : 'VPAY-' . date('Y') . '-' . str_pad((string)$nextSeq, 4, '0', STR_PAD_LEFT);

        DB::transaction(function () use ($validated, $payNumber) {
            $payment = Payment::create([
                'payment_number'   => $payNumber,
                'type'             => 'VENDOR_PAYMENT',
                'contact_id'       => $validated['contact_id'],
                'bill_id'          => $validated['bill_id'] ?? null,
                'account_id'       => $validated['account_id'],
                'payment_date'     => $validated['payment_date'],
                'amount'           => $validated['amount'],
                'payment_method'   => $validated['payment_method'],
                'reference_number' => $validated['reference_number'] ?? null,
                'notes'            => $validated['notes'] ?? null,
            ]);

            // If a bill is linked, update its paid_amount and status
            if (! empty($validated['bill_id'])) {
                $bill = Bill::lockForUpdate()->find($validated['bill_id']);
                if ($bill) {
                    $newPaid = round((float)$bill->paid_amount + (float)$payment->amount, 2);
                    $newStatus = $newPaid >= (float)$bill->total_amount ? 'PAID' : 'PARTIALLY_PAID';
                    $bill->update([
                        'paid_amount' => $newPaid,
                        'status'      => $newStatus,
                    ]);
                }
            }

            // Post double-entry to General Ledger
            $this->accountingService->postVendorPayment($payment);
        });

        return back()->with('success', "Vendor Payment #{$payNumber} recorded and posted to ledger!");
    }

    public function destroy(Payment $payment): RedirectResponse
    {
        if ($payment->type !== 'VENDOR_PAYMENT') {
            return back()->with('error', 'Invalid payment record.');
        }

        DB::transaction(function () use ($payment) {
            // Roll back bill payment if linked
            if ($payment->bill_id) {
                $bill = Bill::lockForUpdate()->find($payment->bill_id);
                if ($bill) {
                    $newPaid = max(0, round((float)$bill->paid_amount - (float)$payment->amount, 2));
                    $newStatus = $newPaid <= 0 ? 'RECEIVED' : ($newPaid >= (float)$bill->total_amount ? 'PAID' : 'PARTIALLY_PAID');
                    $bill->update([
                        'paid_amount' => $newPaid,
                        'status'      => $newStatus,
                    ]);
                }
            }

            // Delete journal entry & lines
            if ($entry = JournalEntry::where('source_document_type', 'PAYMENT')->where('source_document_id', $payment->id)->first()) {
                // Reverse account balance changes
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

            $payment->delete();
        });

        return back()->with('success', "Vendor Payment #{$payment->payment_number} removed and ledger updated.");
    }
}
