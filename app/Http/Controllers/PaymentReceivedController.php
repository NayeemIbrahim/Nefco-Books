<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Contact;
use App\Models\Invoice;
use App\Models\JournalEntry;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Services\AccountingService;
use App\Services\PaymentAllocationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PaymentReceivedController extends Controller
{
    public function __construct(
        protected AccountingService $accountingService,
        protected PaymentAllocationService $allocationService
    ) {
    }

    public function index(Request $request): Response
    {
        $query = Payment::with(['contact', 'invoice.lineItems', 'invoice.contact', 'allocations.invoice.lineItems', 'allocations.invoice.contact', 'account'])
            ->withSum('allocations', 'amount')
            ->where('type', 'CUSTOMER_PAYMENT');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('payment_number', 'like', "%{$search}%")
                  ->orWhere('reference_number', 'like', "%{$search}%")
                  ->orWhereHas('contact', fn($c) => $c->where('name', 'like', "%{$search}%"));
            });
        }

        $payments = $query->latest('payment_date')->latest('id')->paginate(15)->withQueryString();

        $customers = Contact::active()
            ->whereIn('type', ['CUSTOMER', 'BOTH'])
            ->orderBy('name')
            ->get(['id', 'name', 'phone', 'whatsapp_number', 'current_balance']);

        $unpaidInvoices = Invoice::with(['contact', 'lineItems'])
            ->whereNotIn('status', ['PAID', 'DRAFT', 'VOID'])
            ->where(function ($q) {
                $q->whereColumn('paid_amount', '<', 'total_amount')->orWhereNull('paid_amount');
            })
            ->orderByRaw('COALESCE(due_date, issue_date) ASC')
            ->orderBy('issue_date', 'ASC')
            ->orderBy('id', 'ASC')
            ->get();

        $depositAccounts = Account::whereIn('code', ['1000', '1010', '1020'])->get(['id', 'name', 'code']);

        $totalReceived = (float) Payment::where('type', 'CUSTOMER_PAYMENT')->sum('amount');
        $totalAllocated = (float) PaymentAllocation::whereHas('payment', fn($q) => $q->where('type', 'CUSTOMER_PAYMENT'))->sum('amount');
        $unallocatedTotal = max(0, round($totalReceived - $totalAllocated, 2));

        $thisMonthReceived = (float) Payment::where('type', 'CUSTOMER_PAYMENT')
            ->whereYear('payment_date', now()->year)
            ->whereMonth('payment_date', now()->month)
            ->sum('amount');

        $nextSeq = (int) Payment::where('type', 'CUSTOMER_PAYMENT')->max('id') + 1;
        $nextPaymentNumber = 'PAY-' . date('Y') . '-' . str_pad((string) $nextSeq, 4, '0', STR_PAD_LEFT);

        return Inertia::render('Sales/PaymentsReceived/Index', [
            'payments'            => $payments,
            'customers'           => $customers,
            'unpaid_invoices'     => $unpaidInvoices,
            'deposit_accounts'    => $depositAccounts,
            'next_payment_number' => $nextPaymentNumber,
            'metrics'             => [
                'total_received'      => $totalReceived,
                'this_month_received' => $thisMonthReceived,
                'unallocated_total'   => $unallocatedTotal,
                'count'               => $payments->total(),
            ],
            'filters'             => $request->only(['search']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'payment_number'           => 'nullable|string|max:100',
            'contact_id'               => 'required|exists:contacts,id',
            'invoice_id'               => 'nullable|exists:invoices,id',
            'account_id'               => 'required|exists:accounts,id',
            'payment_date'             => 'required|date',
            'amount'                   => 'required|numeric|min:0.01',
            'payment_method'           => 'required|in:CASH,BANK_TRANSFER,CHEQUE,MOBILE_BANKING',
            'reference_number'         => 'nullable|string|max:100',
            'notes'                    => 'nullable|string|max:1000',
            'allocation_mode'          => 'nullable|in:FIFO,MANUAL,ADVANCE',
            'allocations'              => 'nullable|array',
            'allocations.*.invoice_id' => 'required_with:allocations|exists:invoices,id',
            'allocations.*.amount'     => 'required_with:allocations|numeric|min:0',
        ]);

        $nextSeq = (int) Payment::where('type', 'CUSTOMER_PAYMENT')->max('id') + 1;
        $payNumber = ! empty($validated['payment_number'])
            ? $validated['payment_number']
            : 'PAY-' . date('Y') . '-' . str_pad((string) $nextSeq, 4, '0', STR_PAD_LEFT);

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

            // Post single double-entry receipt to General Ledger
            $this->accountingService->postCustomerPayment($payment);

            // Apply invoice allocations
            $mode = $validated['allocation_mode'] ?? null;
            $manualAllocations = $validated['allocations'] ?? null;

            if ($mode === 'MANUAL' || (is_array($manualAllocations) && count($manualAllocations) > 0)) {
                $this->allocationService->applyManualAllocations($payment, $manualAllocations ?? []);
            } elseif (! empty($validated['invoice_id'])) {
                $this->allocationService->allocateSingleInvoice($payment, (int) $validated['invoice_id']);
            } elseif ($mode === 'ADVANCE') {
                $payment->updateQuietly(['invoice_id' => null]);
                $payment->contact?->syncCurrentBalance();
            } else {
                // Default: FIFO (Oldest Due First)
                $this->allocationService->allocateFifo($payment);
            }
        });

        return back()->with('success', "Payment #{$payNumber} recorded and posted to ledger!");
    }

    /**
     * Update invoice allocations for an existing customer payment receipt.
     */
    public function updateAllocations(Request $request, Payment $payment): RedirectResponse
    {
        if ($payment->type !== 'CUSTOMER_PAYMENT') {
            return back()->with('error', 'Only customer payment receipts can be allocated to invoices.');
        }

        $validated = $request->validate([
            'allocations'              => 'nullable|array',
            'allocations.*.invoice_id' => 'required_with:allocations|exists:invoices,id',
            'allocations.*.amount'     => 'required_with:allocations|numeric|min:0',
            'mode'                     => 'nullable|in:FIFO,MANUAL',
        ]);

        if (($validated['mode'] ?? null) === 'FIFO') {
            DB::transaction(function () use ($payment) {
                $this->allocationService->removeAllocationsAndSync($payment);
                $this->allocationService->allocateFifo($payment);
            });
        } else {
            $this->allocationService->applyManualAllocations($payment, $validated['allocations'] ?? []);
        }

        return back()->with('success', "Allocations updated for Payment #{$payment->payment_number}. Invoices and customer ledger synced!");
    }

    public function destroy(Payment $payment): RedirectResponse
    {
        if ($payment->type !== 'CUSTOMER_PAYMENT') {
            return back()->with('error', 'Invalid payment record.');
        }

        DB::transaction(function () use ($payment) {
            // Roll back all invoice allocations & sync affected invoices + customer balance
            $this->allocationService->removeAllocationsAndSync($payment);

            // Delete journal entry & lines
            if ($entry = JournalEntry::where('source_document_type', 'PAYMENT')->where('source_document_id', $payment->id)->first()) {
                // Reverse account balance changes
                foreach ($entry->lines as $line) {
                    $account = $line->account;
                    if ($account) {
                        if (in_array($account->type, ['ASSET', 'EXPENSE'])) {
                            $account->decrement('balance', (float) $line->debit - (float) $line->credit);
                        } else {
                            $account->decrement('balance', (float) $line->credit - (float) $line->debit);
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
