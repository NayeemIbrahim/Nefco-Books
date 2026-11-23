<?php

namespace App\Services;

use App\Exceptions\UnbalancedJournalEntryException;
use App\Models\Account;
use App\Models\Bill;
use App\Models\Contact;
use App\Models\Expense;
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
                'contact_id'           => $params['contact_id'] ?? null,
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

    /**
     * Post a vendor payment made:
     * Debit:  2000 (Accounts Payable)
     * Credit: Cash / Bank Account (1000, 1010, or 1020)
     */
    public function postVendorPayment(Payment $payment): JournalEntry
    {
        $paidFromAccount = $payment->account;

        return $this->createBalancedJournalEntry([
            'entry_number'         => 'JRN-VPAY-' . $payment->payment_number,
            'date'                 => $payment->payment_date,
            'reference'            => $payment->payment_number,
            'description'          => "Vendor payment #{$payment->payment_number} to {$payment->contact->name}",
            'source_document_type' => 'PAYMENT',
            'source_document_id'   => $payment->id,
            'payment_id'           => $payment->id,
            'lines' => [
                [
                    'account_code' => '2000', // Accounts Payable
                    'debit'        => $payment->amount,
                    'credit'       => 0.00,
                    'description'  => "Settlement of payable to {$payment->contact->name}",
                ],
                [
                    'account_code' => $paidFromAccount->code,
                    'debit'        => 0.00,
                    'credit'       => $payment->amount,
                    'description'  => "Funds paid from {$paidFromAccount->name}",
                ],
            ],
        ]);
    }

    /**
     * Post a direct operating expense:
     * Debit:  Operating Expenses (e.g. 6000)
     * Credit: Paid Through Account (e.g. 1000 Petty Cash, 1010 Bank, 1020 bKash)
     */
    public function postExpense(Expense $expense): JournalEntry
    {
        $expenseAccount = $expense->expenseAccount;
        $paidThroughAccount = $expense->paidThroughAccount;
        $payee = $expense->contact ? $expense->contact->name : ($expense->category ?? 'Operating Expense');

        return $this->createBalancedJournalEntry([
            'entry_number'         => 'JRN-EXP-' . $expense->expense_number,
            'date'                 => $expense->expense_date,
            'reference'            => $expense->reference_number ?? $expense->expense_number,
            'description'          => "Operating Expense #{$expense->expense_number} - {$expense->category} ({$payee})",
            'source_document_type' => 'EXPENSE',
            'source_document_id'   => $expense->id,
            'lines' => [
                [
                    'account_code' => $expenseAccount->code,
                    'debit'        => $expense->amount,
                    'credit'       => 0.00,
                    'description'  => "Expense: {$expense->category} - {$payee}",
                ],
                [
                    'account_code' => $paidThroughAccount->code,
                    'debit'        => 0.00,
                    'credit'       => $expense->amount,
                    'description'  => "Disbursement from {$paidThroughAccount->name}",
                ],
            ],
        ]);
    }

    /**
     * Atomically delete a journal entry and reverse all its account balance modifications.
     */
    public function deleteJournalEntry(JournalEntry $entry): void
    {
        DB::transaction(function () use ($entry) {
            foreach ($entry->lines as $line) {
                /** @var Account|null $account */
                $account = Account::where('id', $line->account_id)->lockForUpdate()->first();
                if ($account) {
                    if (in_array($account->type, ['ASSET', 'EXPENSE'])) {
                        $balanceChange = (float)$line->debit - (float)$line->credit;
                    } else {
                        $balanceChange = (float)$line->credit - (float)$line->debit;
                    }
                    $account->decrement('balance', $balanceChange);
                }
            }

            $entry->lines()->delete();
            $entry->delete();
        });
    }

    /**
     * Sync a Customer or Vendor Opening Balance with double-entry ledger.
     * Prevents any duplicate entries by atomically reversing and replacing any prior opening balance.
     *
     * Double-Entry Rules:
     * - Customer TO_RECEIVE (Debit AR 1100 / Credit Opening Balance Equity 3010)
     * - Customer TO_PAY     (Debit Opening Balance Equity 3010 / Credit AR 1100)
     * - Vendor TO_PAY       (Debit Opening Balance Equity 3010 / Credit AP 2000)
     * - Vendor TO_RECEIVE   (Debit AP 2000 / Credit Opening Balance Equity 3010)
     */
    public function syncContactOpeningBalance(Contact $contact): ?JournalEntry
    {
        return DB::transaction(function () use ($contact) {
            // 1. Delete and reverse any existing opening balance journal entry
            $existingEntries = JournalEntry::where(function ($q) use ($contact) {
                $q->where(function ($sub) use ($contact) {
                    $sub->where('source_document_type', 'OPENING_BALANCE')
                        ->where('source_document_id', $contact->id);
                })->orWhere(function ($sub) use ($contact) {
                    $sub->where('contact_id', $contact->id)
                        ->where('source_document_type', 'OPENING_BALANCE');
                })->orWhere('entry_number', 'JRN-OB-' . $contact->id);
            })->get();

            foreach ($existingEntries as $existing) {
                $this->deleteJournalEntry($existing);
            }

            $amount = (float)($contact->opening_balance ?? 0);
            if ($amount <= 0.001) {
                $contact->syncCurrentBalance();
                return null;
            }

            // 2. Ensure Opening Balance Equity account exists
            Account::firstOrCreate(
                ['code' => '3010'],
                [
                    'name'      => 'Opening Balance Equity',
                    'type'      => 'EQUITY',
                    'sub_type'  => 'EQUITY',
                    'is_system' => true,
                    'balance'   => 0.00,
                ]
            );

            $date = ! empty($contact->opening_balance_date)
                ? $contact->opening_balance_date
                : ($contact->created_at ? $contact->created_at->toDateString() : now()->toDateString());

            $type = strtoupper($contact->opening_balance_type ?: ($contact->type === 'VENDOR' ? 'TO_PAY' : 'TO_RECEIVE'));
            $isCustomer = in_array($contact->type, ['CUSTOMER', 'BOTH']);
            $isVendor = ($contact->type === 'VENDOR');

            $lines = [];
            if ($type === 'TO_RECEIVE') {
                // To Receive from Customer (or advance to Vendor)
                $targetCode = $isVendor ? '2000' : '1100'; // Accounts Payable or Accounts Receivable
                $targetDesc = $isVendor
                    ? "Opening advance / debit balance for vendor {$contact->name}"
                    : "Opening receivable for customer {$contact->name}";

                $lines = [
                    [
                        'account_code' => $targetCode,
                        'debit'        => $amount,
                        'credit'       => 0.00,
                        'description'  => $targetDesc,
                    ],
                    [
                        'account_code' => '3010',
                        'debit'        => 0.00,
                        'credit'       => $amount,
                        'description'  => "Opening Balance Equity offset for {$contact->name}",
                    ],
                ];
            } else {
                // TO_PAY: We owe Vendor (or Customer deposit/credit)
                $targetCode = ($isCustomer && ! $isVendor) ? '1100' : '2000';
                $targetDesc = ($isCustomer && ! $isVendor)
                    ? "Opening credit / deposit balance for customer {$contact->name}"
                    : "Opening payable for vendor {$contact->name}";

                $lines = [
                    [
                        'account_code' => '3010',
                        'debit'        => $amount,
                        'credit'       => 0.00,
                        'description'  => "Opening Balance Equity offset for {$contact->name}",
                    ],
                    [
                        'account_code' => $targetCode,
                        'debit'        => 0.00,
                        'credit'       => $amount,
                        'description'  => $targetDesc,
                    ],
                ];
            }

            $entry = $this->createBalancedJournalEntry([
                'entry_number'         => 'JRN-OB-' . $contact->id,
                'date'                 => $date,
                'reference'            => 'OB-' . str_pad($contact->id, 4, '0', STR_PAD_LEFT),
                'description'          => "Opening Balance (" . ($type === 'TO_RECEIVE' ? 'To Receive' : 'To Pay') . ") for {$contact->name}",
                'source_document_type' => 'OPENING_BALANCE',
                'source_document_id'   => $contact->id,
                'contact_id'           => $contact->id,
                'lines'                => $lines,
            ]);

            $contact->syncCurrentBalance();

            return $entry;
        });
    }

    /**
     * Delete any opening balance entry when contact is deleted.
     */
    public function deleteContactOpeningBalance(Contact $contact): void
    {
        $existingEntries = JournalEntry::where(function ($q) use ($contact) {
            $q->where(function ($sub) use ($contact) {
                $sub->where('source_document_type', 'OPENING_BALANCE')
                    ->where('source_document_id', $contact->id);
            })->orWhere(function ($sub) use ($contact) {
                $sub->where('contact_id', $contact->id)
                    ->where('source_document_type', 'OPENING_BALANCE');
            })->orWhere('entry_number', 'JRN-OB-' . $contact->id);
        })->get();

        foreach ($existingEntries as $existing) {
            $this->deleteJournalEntry($existing);
        }

        $contact->syncCurrentBalance();
    }
}
