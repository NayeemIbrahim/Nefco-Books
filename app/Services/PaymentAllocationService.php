<?php

namespace App\Services;

use App\Models\Contact;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PaymentAllocationService
{
    /**
     * Allocate a payment automatically using FIFO (Oldest Due Date First).
     * Any excess amount beyond total outstanding invoices remains unallocated as customer advance.
     */
    public function allocateFifo(Payment $payment): void
    {
        $remainingPayment = round((float) $payment->amount, 2);
        if ($remainingPayment <= 0) {
            return;
        }

        $invoices = Invoice::where('contact_id', $payment->contact_id)
            ->whereNotIn('status', ['PAID', 'DRAFT', 'VOID'])
            ->whereRaw('COALESCE(paid_amount, 0) < total_amount')
            ->orderByRaw('COALESCE(due_date, issue_date) ASC')
            ->orderBy('issue_date', 'ASC')
            ->orderBy('id', 'ASC')
            ->lockForUpdate()
            ->get();

        $allocations = [];
        foreach ($invoices as $invoice) {
            if ($remainingPayment <= 0) {
                break;
            }
            $due = round(max(0, (float) $invoice->total_amount - (float) $invoice->paid_amount), 2);
            if ($due <= 0) {
                continue;
            }
            $allocAmount = min($remainingPayment, $due);
            if ($allocAmount > 0) {
                $allocations[] = [
                    'invoice_id' => $invoice->id,
                    'amount'     => $allocAmount,
                ];
                $remainingPayment = round($remainingPayment - $allocAmount, 2);
            }
        }

        $this->applyManualAllocations($payment, $allocations);
    }

    /**
     * Allocate a payment to a single specific invoice (up to its due balance).
     * Excess remains unallocated as customer advance.
     */
    public function allocateSingleInvoice(Payment $payment, int $invoiceId): void
    {
        $invoice = Invoice::lockForUpdate()->find($invoiceId);
        if (! $invoice || (int) $invoice->contact_id !== (int) $payment->contact_id) {
            throw ValidationException::withMessages([
                'invoice_id' => 'Selected invoice does not belong to this customer.',
            ]);
        }

        $otherPaid = (float) PaymentAllocation::where('invoice_id', $invoice->id)
            ->where('payment_id', '!=', $payment->id)
            ->sum('amount');

        $due = round(max(0, (float) $invoice->total_amount - $otherPaid), 2);
        $allocAmount = min(round((float) $payment->amount, 2), $due);

        $allocations = $allocAmount > 0
            ? [['invoice_id' => $invoice->id, 'amount' => $allocAmount]]
            : [];

        $this->applyManualAllocations($payment, $allocations);
    }

    /**
     * Apply manual invoice allocations for a payment.
     * Replaces any previous allocations for this payment and updates all affected invoices & customer balance.
     *
     * @param array<int, array{invoice_id: int|string, amount: float|int|string}> $allocations
     */
    public function applyManualAllocations(Payment $payment, array $allocations): void
    {
        DB::transaction(function () use ($payment, $allocations) {
            // Normalize & aggregate allocations by invoice_id to prevent duplicate invoice rows
            $normalized = [];
            foreach ($allocations as $row) {
                $invId = (int) ($row['invoice_id'] ?? 0);
                $amt   = round((float) ($row['amount'] ?? 0), 2);
                if ($invId > 0 && $amt > 0) {
                    $normalized[$invId] = round(($normalized[$invId] ?? 0) + $amt, 2);
                }
            }

            $totalAllocated = round(array_sum($normalized), 2);
            $paymentAmount  = round((float) $payment->amount, 2);

            if ($totalAllocated > $paymentAmount + 0.001) {
                throw ValidationException::withMessages([
                    'allocations' => "Total allocated amount ({$totalAllocated}) cannot exceed payment amount ({$paymentAmount}).",
                ]);
            }

            // Collect previously allocated invoice IDs so we can re-sync them if removed/reduced
            $previousInvoiceIds = PaymentAllocation::where('payment_id', $payment->id)
                ->pluck('invoice_id')
                ->toArray();

            if ($payment->invoice_id && ! in_array($payment->invoice_id, $previousInvoiceIds)) {
                $previousInvoiceIds[] = $payment->invoice_id;
            }

            // Delete existing allocations for this payment before validating & inserting new ones
            PaymentAllocation::where('payment_id', $payment->id)->delete();

            foreach ($normalized as $invId => $amt) {
                $invoice = Invoice::lockForUpdate()->find($invId);
                if (! $invoice) {
                    throw ValidationException::withMessages([
                        'allocations' => "Invoice #{$invId} not found.",
                    ]);
                }
                if ((int) $invoice->contact_id !== (int) $payment->contact_id) {
                    throw ValidationException::withMessages([
                        'allocations' => "Invoice #{$invoice->invoice_number} does not belong to this customer.",
                    ]);
                }
                if (in_array($invoice->status, ['DRAFT', 'VOID'])) {
                    throw ValidationException::withMessages([
                        'allocations' => "Cannot allocate payment to a {$invoice->status} invoice (#{$invoice->invoice_number}).",
                    ]);
                }

                $otherPaid = round((float) PaymentAllocation::where('invoice_id', $invoice->id)->sum('amount'), 2);
                $remainingDue = round(max(0, (float) $invoice->total_amount - $otherPaid), 2);

                if ($amt > $remainingDue + 0.001) {
                    throw ValidationException::withMessages([
                        'allocations' => "Allocation of {$amt} for Invoice #{$invoice->invoice_number} exceeds its remaining due balance ({$remainingDue}).",
                    ]);
                }

                PaymentAllocation::create([
                    'payment_id' => $payment->id,
                    'invoice_id' => $invoice->id,
                    'amount'     => $amt,
                ]);
            }

            // Keep payment.invoice_id synchronized for single-invoice legacy references
            $newInvoiceIds = array_keys($normalized);
            $payment->updateQuietly([
                'invoice_id' => count($newInvoiceIds) === 1 ? $newInvoiceIds[0] : null,
            ]);

            // Sync every affected invoice (old + new)
            $allAffectedIds = array_unique(array_merge($previousInvoiceIds, $newInvoiceIds));
            foreach ($allAffectedIds as $affectedId) {
                $inv = Invoice::lockForUpdate()->find($affectedId);
                if ($inv) {
                    $this->syncInvoiceStatus($inv);
                }
            }

            // Sync customer balance
            if ($payment->contact) {
                $payment->contact->syncCurrentBalance();
            }
        });
    }

    /**
     * Remove all allocations for a payment (e.g. before deletion) and re-sync affected invoices & contact.
     */
    public function removeAllocationsAndSync(Payment $payment): void
    {
        $affectedIds = PaymentAllocation::where('payment_id', $payment->id)
            ->pluck('invoice_id')
            ->toArray();

        if ($payment->invoice_id && ! in_array($payment->invoice_id, $affectedIds)) {
            $affectedIds[] = $payment->invoice_id;
        }

        PaymentAllocation::where('payment_id', $payment->id)->delete();

        foreach (array_unique($affectedIds) as $invId) {
            $inv = Invoice::lockForUpdate()->find($invId);
            if ($inv) {
                $this->syncInvoiceStatus($inv);
            }
        }

        if ($payment->contact) {
            $payment->contact->syncCurrentBalance();
        }
    }

    /**
     * Recompute an invoice's paid_amount and payment status from its payment_allocations.
     */
    public function syncInvoiceStatus(Invoice $invoice): void
    {
        if (in_array($invoice->status, ['DRAFT', 'VOID'])) {
            return;
        }

        $paidAmount = round((float) PaymentAllocation::where('invoice_id', $invoice->id)->sum('amount'), 2);
        $totalAmount = round((float) $invoice->total_amount, 2);

        if ($paidAmount >= $totalAmount && $totalAmount > 0) {
            $newStatus = 'PAID';
        } elseif ($paidAmount > 0) {
            $newStatus = 'PARTIALLY_PAID';
        } else {
            $newStatus = 'SENT';
        }

        $invoice->update([
            'paid_amount' => $paidAmount,
            'status'      => $newStatus,
        ]);
    }
}
