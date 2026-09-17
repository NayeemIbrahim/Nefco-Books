<?php

namespace App\Services;

use App\Exceptions\UnbalancedJournalEntryException;
use App\Models\Account;
use App\Models\Bill;
use App\Models\Invoice;
use App\Models\JournalEntry;
use App\Models\Payment;
use Exception;
use Illuminate\Support\Facades\DB;

class AccountingService
{
    /**
     * Create a balanced journal entry and update account balances atomically.
     */
    public function createBalancedJournalEntry(array $params): JournalEntry
    {
        // 1. Verify that Debits and Credits balance exactly using bcmath
        $totalDebit = '0.00';
        $totalCredit = '0.00';

        foreach ($params['lines'] as $line) {
            $debit = number_format((float)($line['debit'] ?? 0), 2, '.', '');
            $credit = number_format((float)($line['credit'] ?? 0), 2, '.', '');

            $totalDebit = bcadd($totalDebit, $debit, 2);
            $totalCredit = bcadd($totalCredit, $credit, 2);
        }

        if (bccomp($totalDebit, $totalCredit, 2) !== 0) {
            throw new UnbalancedJournalEntryException($totalDebit, $totalCredit);
        }

        // 2. Execute atomically in a database transaction
        return DB::transaction(function () use ($params) {
            $entry = JournalEntry::create([
                'entry_number'         => $params['entry_number'],
                'date'                 => $params['date'] ?? now(),
                'reference'            => $params['reference'] ?? null,
                'description'          => $params['description'] ?? null,
                'status'               => 'POSTED',
                'source_document_type' => $params['source_document_type'] ?? null,
                'source_document_id'   => $params['source_document_id'] ?? null,
                'created_by_id'        => $params['created_by_id'] ?? auth()->id(),
                'invoice_id'           => $params['invoice_id'] ?? null,
                'bill_id'              => $params['bill_id'] ?? null,
                'payment_id'           => $params['payment_id'] ?? null,
            ]);

            foreach ($params['lines'] as $line) {
                /** @var Account|null $account */
                $account = Account::where('code', $line['account_code'])->lockForUpdate()->first();

                if (! $account) {
                    throw new Exception("Account code '{$line['account_code']}' not found in Chart of Accounts.");
                }

                $debit = (float)($line['debit'] ?? 0);
                $credit = (float)($line['credit'] ?? 0);

                $entry->lines()->create([
                    'account_id'  => $account->id,
                    'debit'       => $debit,
                    'credit'      => $credit,
                    'description' => $line['description'] ?? $params['description'] ?? null,
                ]);

                if (in_array($account->type, ['ASSET', 'EXPENSE'])) {
                    $balanceChange = $debit - $credit;
                } else {
                    $balanceChange = $credit - $debit;
                }

                $account->increment('balance', $balanceChange);
            }

            return $entry->load('lines.account');
        });
    }

    /**
     * Post a confirmed sales invoice to ledger:
     * Debit:  1100 (Accounts Receivable)
     * Credit: 4000 (Sales Revenue)
     */
    public function postInvoice(Invoice $invoice): JournalEntry
    {
        return $this->createBalancedJournalEntry([
            'entry_number'         => 'JRN-INV-' . $invoice->invoice_number,
            'date'                 => $invoice->issue_date,
            'reference'            => $invoice->invoice_number,
            'description'          => "Sales Invoice #{$invoice->invoice_number} for {$invoice->contact->name}",
            'source_document_type' => 'INVOICE',
            'source_document_id'   => $invoice->id,
            'invoice_id'           => $invoice->id,
            'lines' => [
                [
                    'account_code' => '1100', // Accounts Receivable
                    'debit'        => $invoice->total_amount,
                    'credit'       => 0.00,
                    'description'  => "Receivable for invoice #{$invoice->invoice_number}",
                ],
                [
                    'account_code' => '4000', // Sales Revenue
                    'debit'        => 0.00,
                    'credit'       => $invoice->total_amount,
                    'description'  => "Revenue from invoice #{$invoice->invoice_number}",
                ],
            ],
        ]);
    }

    /**
     * Post a received customer payment:
     * Debit:  Cash / Bank Account (1000, 1010, or 1020)
     * Credit: 1100 (Accounts Receivable)
     */
    public function postCustomerPayment(Payment $payment): JournalEntry
    {
        $depositAccount = $payment->account;

        return $this->createBalancedJournalEntry([
            'entry_number'         => 'JRN-PAY-' . $payment->payment_number,
            'date'                 => $payment->payment_date,
            'reference'            => $payment->payment_number,
            'description'          => "Payment received #{$payment->payment_number} from {$payment->contact->name}",
            'source_document_type' => 'PAYMENT',
            'source_document_id'   => $payment->id,
            'payment_id'           => $payment->id,
            'lines' => [
                [
                    'account_code' => $depositAccount->code,
                    'debit'        => $payment->amount,
                    'credit'       => 0.00,
                    'description'  => "Funds deposited to {$depositAccount->name}",
                ],
                [
                    'account_code' => '1100', // Accounts Receivable
                    'debit'        => 0.00,
                    'credit'       => $payment->amount,
                    'description'  => "Settlement of receivable for {$payment->contact->name}",
                ],
            ],
        ]);
    }

    /**
     * Post a vendor purchase bill:
     * Debit:  6000 (Operating Expenses)
     * Credit: 2000 (Accounts Payable)
     */
    public function postBill(Bill $bill): JournalEntry
    {
        return $this->createBalancedJournalEntry([
            'entry_number'         => 'JRN-BIL-' . $bill->bill_number,
            'date'                 => $bill->issue_date,
            'reference'            => $bill->bill_number,
            'description'          => "Vendor Bill #{$bill->bill_number} from {$bill->contact->name}",
            'source_document_type' => 'BILL',
            'source_document_id'   => $bill->id,
            'bill_id'              => $bill->id,
            'lines' => [
                [
                    'account_code' => '6000',
                    'debit'        => $bill->total_amount,
                    'credit'       => 0.00,
                    'description'  => "Expense for bill #{$bill->bill_number}",
                ],
                [
                    'account_code' => '2000',
                    'debit'        => 0.00,
                    'credit'       => $bill->total_amount,
                    'description'  => "Payable for bill #{$bill->bill_number}",
                ],
            ],
        ]);
    }
}
