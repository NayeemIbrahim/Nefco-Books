<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Contact;
use App\Models\Invoice;
use App\Models\JournalEntry;
use App\Models\Payment;
use App\Services\AccountingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PaymentReceivedController extends Controller
{
    public function __construct(protected AccountingService $accountingService)
    {
    }

    public function index(Request $request): Response
    {
        $query = Payment::with(['contact', 'invoice', 'account'])
            ->where('type', 'CUSTOMER_PAYMENT');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('payment_number', 'like', "%{$search}%")
                  ->orWhere('reference_number', 'like', "%{$search}%")
                  ->orWhereHas('contact', fn($c) => $c->where('name', 'like', "%{$search}%"));
            });
        }

        $payments = $query->latest('payment_date')->paginate(15)->withQueryString();

        $customers = Contact::active()
            ->whereIn('type', ['CUSTOMER', 'BOTH'])
            ->orderBy('name')
            ->get(['id', 'name', 'phone', 'whatsapp_number']);

        $unpaidInvoices = Invoice::whereIn('status', ['SENT', 'OVERDUE', 'PARTIALLY_PAID'])
            ->get(['id', 'invoice_number', 'contact_id', 'total_amount', 'paid_amount', 'status']);

        $depositAccounts = Account::whereIn('code', ['1000', '1010', '1020'])->get(['id', 'name', 'code']);

        $totalReceived = Payment::where('type', 'CUSTOMER_PAYMENT')->sum('amount');
        $thisMonthReceived = Payment::where('type', 'CUSTOMER_PAYMENT')
            ->whereYear('payment_date', now()->year)
            ->whereMonth('payment_date', now()->month)
            ->sum('amount');

        $nextSeq = (int)Payment::where('type', 'CUSTOMER_PAYMENT')->max('id') + 1;
        $nextPaymentNumber = 'PAY-' . date('Y') . '-' . str_pad((string)$nextSeq, 4, '0', STR_PAD_LEFT);

        return Inertia::render('Sales/PaymentsReceived/Index', [
            'payments'           => $payments,
            'customers'          => $customers,
            'unpaid_invoices'    => $unpaidInvoices,
            'deposit_accounts'   => $depositAccounts,
            'next_payment_number'=> $nextPaymentNumber,
            'metrics'            => [
                'total_received'      => $totalReceived,
                'this_month_received' => $thisMonthReceived,
                'count'               => $payments->total(),
            ],
            'filters'            => $request->only(['search']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'payment_number'   => 'nullable|string|max:100',
            'contact_id'       => 'required|exists:contacts,id',
            'invoice_id'       => 'nullable|exists:invoices,id',
            'account_id'       => 'required|exists:accounts,id',
            'payment_date'     => 'required|date',
            'amount'           => 'required|numeric|min:0.01',
            'payment_method'   => 'required|in:CASH,BANK_TRANSFER,CHEQUE,MOBILE_BANKING',
            'reference_number' => 'nullable|string|max:100',
            'notes'            => 'nullable|string|max:1000',
        ]);

        $nextSeq = (int)Payment::where('type', 'CUSTOMER_PAYMENT')->max('id') + 1;
        $payNumber = ! empty($validated['payment_number'])
            ? $validated['payment_number']
            : 'PAY-' . date('Y') . '-' . str_pad((string)$nextSeq, 4, '0', STR_PAD_LEFT);

        DB::transaction(function () use ($validated, $payNumber) {
            $payment = Payment::create([
                'payment_number'   => $payNumber,
                'type'             => 'CUSTOMER_PAYMENT',
                'contact_id'       => $validated['contact_id'],
                'invoice_id'       => $validated['invoice_id'] ?? null,
                'account_id'       => $validated['account_id'],
                'payment_date'     => $validated['payment_date'],
                'amount'           => $validated['amount'],
                'payment_method'   => $validated['payment_method'],
                'reference_number' => $validated['reference_number'] ?? null,
                'notes'            => $validated['notes'] ?? null,
            ]);

            // If an invoice is linked, update its paid_amount and status
            if (! empty($validated['invoice_id'])) {
                $invoice = Invoice::lockForUpdate()->find($validated['invoice_id']);
                if ($invoice) {
                    $newPaid = round((float)$invoice->paid_amount + (float)$payment->amount, 2);
                    $newStatus = $newPaid >= (float)$invoice->total_amount ? 'PAID' : 'PARTIALLY_PAID';
                    $invoice->update([
                        'paid_amount' => $newPaid,
                        'status'      => $newStatus,
                    ]);
                }
            }

            // Post double-entry to General Ledger
            $this->accountingService->postCustomerPayment($payment);
        });

        return back()->with('success', "Payment #{$payNumber} recorded and posted to ledger!");
    }

    public function destroy(Payment $payment): RedirectResponse
    {
        if ($payment->type !== 'CUSTOMER_PAYMENT') {
            return back()->with('error', 'Invalid payment record.');
        }

        DB::transaction(function () use ($payment) {
            // Roll back invoice payment if linked
            if ($payment->invoice_id) {
                $invoice = Invoice::lockForUpdate()->find($payment->invoice_id);
                if ($invoice) {
                    $newPaid = max(0, round((float)$invoice->paid_amount - (float)$payment->amount, 2));
                    $newStatus = $newPaid <= 0 ? 'SENT' : ($newPaid >= (float)$invoice->total_amount ? 'PAID' : 'PARTIALLY_PAID');
                    $invoice->update([
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

        return back()->with('success', "Payment #{$payment->payment_number} removed and ledger updated.");
    }
}
