<?php

namespace App\Services;

use App\Models\Account;
use App\Models\Bill;
use App\Models\BillLineItem;
use App\Models\Booking;
use App\Models\Contact;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\InvoiceLineItem;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ReportService
{
    /**
     * Parse date range from filters.
     */
    public function parseDateRange(array $filters): array
    {
        $startDate = ! empty($filters['start_date']) ? Carbon::parse($filters['start_date'])->startOfDay() : null;
        $endDate   = ! empty($filters['end_date'])   ? Carbon::parse($filters['end_date'])->endOfDay()   : null;

        return [$startDate, $endDate];
    }

    /* ------------------------------------------------------------------------
     | 1. BUSINESS OVERVIEW
     | ------------------------------------------------------------------------ */

    public function getProfitAndLoss(array $filters = []): array
    {
        [$startDate, $endDate] = $this->parseDateRange($filters);

        // Fetch accounts
        $revenueAccounts = Account::where('type', 'REVENUE')->get();
        $cogsAccounts    = Account::where('sub_type', 'COST_OF_GOODS_SOLD')->get();
        $expenseAccounts = Account::where('type', 'EXPENSE')->where('sub_type', '!=', 'COST_OF_GOODS_SOLD')->get();

        $calcAccountPeriodBalance = function ($account, $isRevenue = false) use ($startDate, $endDate) {
            if (! $startDate && ! $endDate) {
                return (float) $account->balance;
            }

            $query = JournalLine::where('account_id', $account->id)
                ->whereHas('journalEntry', function ($q) use ($startDate, $endDate) {
                    if ($startDate) $q->where('date', '>=', $startDate->toDateString());
                    if ($endDate)   $q->where('date', '<=', $endDate->toDateString());
                });

            $totalDebit  = (float) $query->sum('debit');
            $totalCredit = (float) $query->sum('credit');

            return $isRevenue ? ($totalCredit - $totalDebit) : ($totalDebit - $totalCredit);
        };

        $revenues = $revenueAccounts->map(function ($acc) use ($calcAccountPeriodBalance) {
            $bal = $calcAccountPeriodBalance($acc, true);
            return [
                'id'      => $acc->id,
                'code'    => $acc->code,
                'name'    => $acc->name,
                'balance' => $bal,
            ];
        });

        $cogs = $cogsAccounts->map(function ($acc) use ($calcAccountPeriodBalance) {
            $bal = $calcAccountPeriodBalance($acc, false);
            return [
                'id'      => $acc->id,
                'code'    => $acc->code,
                'name'    => $acc->name,
                'balance' => $bal,
            ];
        });

        $expenses = $expenseAccounts->map(function ($acc) use ($calcAccountPeriodBalance) {
            $bal = $calcAccountPeriodBalance($acc, false);
            return [
                'id'      => $acc->id,
                'code'    => $acc->code,
                'name'    => $acc->name,
                'balance' => $bal,
            ];
        });

        $totalRevenue = $revenues->sum('balance');
        $totalCogs    = $cogs->sum('balance');
        $grossProfit  = $totalRevenue - $totalCogs;
        $totalExpense = $expenses->sum('balance');
        $netProfit    = $grossProfit - $totalExpense;

        return [
            'revenues'     => $revenues,
            'cogs'         => $cogs,
            'expenses'     => $expenses,
            'totalRevenue' => $totalRevenue,
            'totalCogs'    => $totalCogs,
            'grossProfit'  => $grossProfit,
            'totalExpense' => $totalExpense,
            'netProfit'    => $netProfit,
        ];
    }

    public function getBalanceSheet(array $filters = []): array
    {
        [$startDate, $endDate] = $this->parseDateRange($filters);
        $asOfDate = $endDate ?: ($startDate ?: now());

        $calcAccountBalanceAsOf = function ($account) use ($asOfDate) {
            $query = JournalLine::where('account_id', $account->id)
                ->whereHas('journalEntry', function ($q) use ($asOfDate) {
                    $q->where('date', '<=', $asOfDate->toDateString());
                });

            $totalDebit  = (float) $query->sum('debit');
            $totalCredit = (float) $query->sum('credit');

            if ($account->type === 'ASSET' || $account->type === 'EXPENSE') {
                return $totalDebit - $totalCredit;
            }
            return $totalCredit - $totalDebit;
        };

        $assets      = Account::where('type', 'ASSET')->get()->map(fn($acc) => [
            'id' => $acc->id, 'code' => $acc->code, 'name' => $acc->name, 'sub_type' => $acc->sub_type, 'balance' => $calcAccountBalanceAsOf($acc),
        ]);
        $liabilities = Account::where('type', 'LIABILITY')->get()->map(fn($acc) => [
            'id' => $acc->id, 'code' => $acc->code, 'name' => $acc->name, 'sub_type' => $acc->sub_type, 'balance' => $calcAccountBalanceAsOf($acc),
        ]);
        $equity      = Account::where('type', 'EQUITY')->get()->map(fn($acc) => [
            'id' => $acc->id, 'code' => $acc->code, 'name' => $acc->name, 'sub_type' => $acc->sub_type, 'balance' => $calcAccountBalanceAsOf($acc),
        ]);

        // Net income to date
        $pnl = $this->getProfitAndLoss(['end_date' => $asOfDate->toDateString()]);
        $currentEarnings = $pnl['netProfit'];

        $totalAssets      = $assets->sum('balance');
        $totalLiabilities = $liabilities->sum('balance');
        $totalEquity      = $equity->sum('balance') + $currentEarnings;

        return [
            'assets'           => $assets,
            'liabilities'      => $liabilities,
            'equity'           => $equity,
            'currentEarnings'  => $currentEarnings,
            'totalAssets'      => $totalAssets,
            'totalLiabilities' => $totalLiabilities,
            'totalEquity'      => $totalEquity,
            'asOfDate'         => $asOfDate->toDateString(),
            'isBalanced'       => round($totalAssets, 2) === round($totalLiabilities + $totalEquity, 2),
        ];
    }

    public function getCashFlowStatement(array $filters = []): array
    {
        [$startDate, $endDate] = $this->parseDateRange($filters);

        // Operating activities
        $customerReceipts = (float) Payment::where('type', 'CUSTOMER_PAYMENT')
            ->when($startDate, fn($q) => $q->where('payment_date', '>=', $startDate))
            ->when($endDate,   fn($q) => $q->where('payment_date', '<=', $endDate))
            ->sum('amount');

        $vendorPayments = (float) Payment::where('type', 'VENDOR_PAYMENT')
            ->when($startDate, fn($q) => $q->where('payment_date', '>=', $startDate))
            ->when($endDate,   fn($q) => $q->where('payment_date', '<=', $endDate))
            ->sum('amount');

        $directExpenses = (float) Expense::query()
            ->when($startDate, fn($q) => $q->where('expense_date', '>=', $startDate))
            ->when($endDate,   fn($q) => $q->where('expense_date', '<=', $endDate))
            ->sum('amount');

        $netOperatingCash = $customerReceipts - ($vendorPayments + $directExpenses);

        // Cash Accounts Beginning & Ending Balance
        $cashAccounts = Account::where('type', 'ASSET')
            ->whereIn('sub_type', ['CASH', 'BANK'])
            ->get();

        $calcCash = function ($date) use ($cashAccounts) {
            $sum = 0.00;
            foreach ($cashAccounts as $acc) {
                $lines = JournalLine::where('account_id', $acc->id)
                    ->whereHas('journalEntry', fn($q) => $q->where('date', '<=', $date->toDateString()));
                $sum += ($lines->sum('debit') - $lines->sum('credit'));
            }
            return (float) $sum;
        };

        $beginningDate = $startDate ? $startDate->copy()->subDay() : Carbon::parse('2000-01-01');
        $beginningCash = $calcCash($beginningDate);
        $endingDate    = $endDate ?: now();
        $endingCash    = $calcCash($endingDate);
        $netChangeCash = $endingCash - $beginningCash;

        return [
            'customerReceipts' => $customerReceipts,
            'vendorPayments'   => $vendorPayments,
            'directExpenses'   => $directExpenses,
            'netOperatingCash' => $netOperatingCash,
            'investingCash'    => 0.00,
            'financingCash'    => 0.00,
            'beginningCash'    => $beginningCash,
            'netChangeCash'    => $netChangeCash,
            'endingCash'       => $endingCash,
        ];
    }

    /* ------------------------------------------------------------------------
     | 2. ACCOUNTANT
     | ------------------------------------------------------------------------ */

    public function getTrialBalance(array $filters = []): array
    {
        [$startDate, $endDate] = $this->parseDateRange($filters);

        $accounts = Account::with(['journalLines' => function ($query) use ($startDate, $endDate) {
            if ($startDate || $endDate) {
                $query->whereHas('journalEntry', function ($q) use ($startDate, $endDate) {
                    if ($startDate) $q->where('date', '>=', $startDate->toDateString());
                    if ($endDate)   $q->where('date', '<=', $endDate->toDateString());
                });
            }
        }])->get()->map(function ($acc) {
            $totalDebit  = (float) $acc->journalLines->sum('debit');
            $totalCredit = (float) $acc->journalLines->sum('credit');

            return [
                'id'           => $acc->id,
                'code'         => $acc->code,
                'name'         => $acc->name,
                'type'         => $acc->type,
                'total_debit'  => $totalDebit,
                'total_credit' => $totalCredit,
            ];
        });

        $totalDebitAll  = $accounts->sum('total_debit');
        $totalCreditAll = $accounts->sum('total_credit');

        return [
            'accounts'      => $accounts,
            'totalDebit'    => $totalDebitAll,
            'totalCredit'   => $totalCreditAll,
            'isEquilibrium' => round($totalDebitAll, 2) === round($totalCreditAll, 2),
        ];
    }

    public function getGeneralLedger(array $filters = []): array
    {
        [$startDate, $endDate] = $this->parseDateRange($filters);
        $accountId = $filters['account_id'] ?? null;

        $accountsQuery = Account::query();
        if ($accountId) {
            $accountsQuery->where('id', $accountId);
        }

        $accounts = $accountsQuery->orderBy('code')->get()->map(function ($acc) use ($startDate, $endDate) {
            $lines = JournalLine::with('journalEntry')
                ->where('account_id', $acc->id)
                ->when($startDate, fn($q) => $q->whereHas('journalEntry', fn($sub) => $sub->where('date', '>=', $startDate->toDateString())))
                ->when($endDate,   fn($q) => $q->whereHas('journalEntry', fn($sub) => $sub->where('date', '<=', $endDate->toDateString())))
                ->get()
                ->sortBy(fn($line) => $line->journalEntry->date . '_' . $line->id);

            $runningBalance = 0.00;
            $formattedLines = [];
            foreach ($lines as $line) {
                $debit = (float)$line->debit;
                $credit = (float)$line->credit;

                if (in_array($acc->type, ['ASSET', 'EXPENSE'])) {
                    $runningBalance += ($debit - $credit);
                } else {
                    $runningBalance += ($credit - $debit);
                }

                $formattedLines[] = [
                    'id'              => $line->id,
                    'date'            => $line->journalEntry->date ? Carbon::parse($line->journalEntry->date)->format('Y-m-d') : '',
                    'entry_number'    => $line->journalEntry->entry_number,
                    'reference'       => $line->journalEntry->reference,
                    'description'     => $line->description ?: $line->journalEntry->description,
                    'debit'           => $debit,
                    'credit'          => $credit,
                    'running_balance' => $runningBalance,
                ];
            }

            return [
                'id'              => $acc->id,
                'code'            => $acc->code,
                'name'            => $acc->name,
                'type'            => $acc->type,
                'lines'           => $formattedLines,
                'total_debit'     => collect($formattedLines)->sum('debit'),
                'total_credit'    => collect($formattedLines)->sum('credit'),
                'closing_balance' => $runningBalance,
            ];
        });

        return [
            'accounts' => $accounts,
            'allAccountsList' => Account::orderBy('code')->get(['id', 'code', 'name']),
        ];
    }

    public function getJournalReport(array $filters = []): array
    {
        [$startDate, $endDate] = $this->parseDateRange($filters);

        $entries = JournalEntry::with(['lines.account', 'contact'])
            ->when($startDate, fn($q) => $q->where('date', '>=', $startDate->toDateString()))
            ->when($endDate,   fn($q) => $q->where('date', '<=', $endDate->toDateString()))
            ->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->get()
            ->map(function ($entry) {
                $totalDebit = (float) $entry->lines->sum('debit');
                $totalCredit = (float) $entry->lines->sum('credit');

                return [
                    'id'                   => $entry->id,
                    'entry_number'         => $entry->entry_number,
                    'date'                 => $entry->date ? Carbon::parse($entry->date)->format('Y-m-d') : '',
                    'reference'            => $entry->reference,
                    'description'          => $entry->description,
                    'source_document_type' => $entry->source_document_type,
                    'contact_name'         => $entry->contact ? $entry->contact->name : null,
                    'total_debit'          => $totalDebit,
                    'total_credit'         => $totalCredit,
                    'is_balanced'          => round($totalDebit, 2) === round($totalCredit, 2),
                    'lines'                => $entry->lines->map(fn($line) => [
                        'account_code' => $line->account ? $line->account->code : '',
                        'account_name' => $line->account ? $line->account->name : '',
                        'description'  => $line->description,
                        'debit'        => (float) $line->debit,
                        'credit'       => (float) $line->credit,
                    ]),
                ];
            });

        return [
            'entries'      => $entries,
            'total_debits' => $entries->sum('total_debit'),
            'total_credits'=> $entries->sum('total_credit'),
        ];
    }

    /* ------------------------------------------------------------------------
     | 3. SALES
     | ------------------------------------------------------------------------ */

    public function getSalesSummary(array $filters = []): array
    {
        [$startDate, $endDate] = $this->parseDateRange($filters);

        $query = Invoice::query()
            ->when($startDate, fn($q) => $q->where('issue_date', '>=', $startDate))
            ->when($endDate,   fn($q) => $q->where('issue_date', '<=', $endDate));

        $totalInvoices = (clone $query)->count();
        $subtotal      = (float) (clone $query)->sum('subtotal');
        $taxAmount     = (float) (clone $query)->sum('tax_amount');
        $discount      = (float) (clone $query)->sum('discount_amount');
        $shipping      = (float) (clone $query)->sum('shipping_charges');
        $adjustment    = (float) (clone $query)->sum('adjustment');
        $totalSales    = (float) (clone $query)->sum('total_amount');
        $paidAmount    = (float) (clone $query)->sum('paid_amount');
        $balanceDue    = $totalSales - $paidAmount;

        return [
            'totalInvoices' => $totalInvoices,
            'subtotal'      => $subtotal,
            'taxAmount'     => $taxAmount,
            'discount'      => $discount,
            'shipping'      => $shipping,
            'adjustment'    => $adjustment,
            'totalSales'    => $totalSales,
            'paidAmount'    => $paidAmount,
            'balanceDue'    => $balanceDue,
        ];
    }

    public function getSalesByCustomer(array $filters = []): array
    {
        [$startDate, $endDate] = $this->parseDateRange($filters);

        $customers = Contact::whereIn('type', ['CUSTOMER', 'BOTH'])
            ->with(['invoices' => function ($q) use ($startDate, $endDate) {
                if ($startDate) $q->where('issue_date', '>=', $startDate);
                if ($endDate)   $q->where('issue_date', '<=', $endDate);
            }])
            ->get()
            ->map(function ($c) {
                $invCount   = $c->invoices->count();
                $totalSales = (float) $c->invoices->sum('total_amount');
                $totalPaid  = (float) $c->invoices->sum('paid_amount');
                $balanceDue = $totalSales - $totalPaid;

                return [
                    'id'          => $c->id,
                    'name'        => $c->name,
                    'phone'       => $c->phone ?: $c->whatsapp_number,
                    'invCount'    => $invCount,
                    'totalSales'  => $totalSales,
                    'totalPaid'   => $totalPaid,
                    'balanceDue'  => $balanceDue,
                ];
            })
            ->filter(fn($c) => $c['invCount'] > 0 || $c['totalSales'] > 0)
            ->values();

        return [
            'customers'       => $customers,
            'totalSalesAll'   => $customers->sum('totalSales'),
            'totalPaidAll'    => $customers->sum('totalPaid'),
            'totalBalanceDue' => $customers->sum('balanceDue'),
        ];
    }

    public function getSalesByItem(array $filters = []): array
    {
        [$startDate, $endDate] = $this->parseDateRange($filters);

        $lines = InvoiceLineItem::with(['invoice', 'item'])
            ->whereHas('invoice', function ($q) use ($startDate, $endDate) {
                if ($startDate) $q->where('issue_date', '>=', $startDate);
                if ($endDate)   $q->where('issue_date', '<=', $endDate);
            })
            ->get();

        $grouped = $lines->groupBy(fn($l) => $l->item ? $l->item->name : ($l->description ?: 'Unknown Item'))
            ->map(function ($group, $itemName) {
                $qtyTotal    = (float) $group->sum('quantity');
                $amountTotal = (float) $group->sum('amount');
                $avgPrice    = $qtyTotal > 0 ? ($amountTotal / $qtyTotal) : 0.00;

                return [
                    'name'        => $itemName,
                    'quantity'    => $qtyTotal,
                    'totalAmount' => $amountTotal,
                    'averageRate' => $avgPrice,
                ];
            })
            ->values();

        return [
            'items'       => $grouped,
            'totalAmount' => $grouped->sum('totalAmount'),
            'totalQty'    => $grouped->sum('quantity'),
        ];
    }

    /* ------------------------------------------------------------------------
     | 4. RECEIVABLES & PAYMENTS RECEIVED
     | ------------------------------------------------------------------------ */

    public function getCustomerBalanceSummary(array $filters = []): array
    {
        $customers = Contact::whereIn('type', ['CUSTOMER', 'BOTH'])
            ->orderBy('name')
            ->get()
            ->map(function ($c) {
                $totalInvoiced = (float) $c->invoices()->sum('total_amount');
                $totalReceived = (float) $c->payments()->where('type', 'CUSTOMER_PAYMENT')->sum('amount');
                $openingBal    = (float) ($c->opening_balance ?? 0);
                $opType        = $c->opening_balance_type ?: 'TO_RECEIVE';

                $currentBal = (float) $c->current_balance;

                return [
                    'id'             => $c->id,
                    'name'           => $c->name,
                    'phone'          => $c->phone ?: $c->whatsapp_number,
                    'opening_balance'=> $openingBal,
                    'opening_type'   => $opType,
                    'total_invoiced' => $totalInvoiced,
                    'total_received' => $totalReceived,
                    'closing_balance'=> $currentBal,
                ];
            });

        return [
            'customers'     => $customers,
            'totalReceivable' => $customers->sum(fn($c) => max(0, $c['closing_balance'])),
        ];
    }

    public function getCustomerStatement(int $contactId, array $filters = []): array
    {
        $contact = Contact::findOrFail($contactId);
        [$startDate, $endDate] = $this->parseDateRange($filters);

        $entries = collect();

        // 1. Opening Balance
        if ((float)$contact->opening_balance > 0) {
            $isToReceive = ($contact->opening_balance_type !== 'TO_PAY');
            $entries->push([
                'date'        => $contact->opening_balance_date ? Carbon::parse($contact->opening_balance_date)->format('Y-m-d') : $contact->created_at->format('Y-m-d'),
                'type'        => 'OPENING_BALANCE',
                'reference'   => 'OB-' . str_pad($contact->id, 4, '0', STR_PAD_LEFT),
                'description' => 'Opening Balance (' . ($isToReceive ? 'To Receive' : 'To Pay') . ')',
                'debit'       => $isToReceive ? (float)$contact->opening_balance : 0.00,
                'credit'      => $isToReceive ? 0.00 : (float)$contact->opening_balance,
            ]);
        }

        // 2. Invoices
        $invoices = Invoice::with(['lineItems', 'contact'])
            ->where('contact_id', $contact->id)
            ->when($startDate, fn($q) => $q->where('issue_date', '>=', $startDate))
            ->when($endDate,   fn($q) => $q->where('issue_date', '<=', $endDate))
            ->get();

        foreach ($invoices as $inv) {
            $entries->push([
                'date'        => Carbon::parse($inv->issue_date)->format('Y-m-d'),
                'type'        => 'INVOICE',
                'id'          => $inv->id,
                'reference'   => $inv->invoice_number,
                'description' => "Invoice #{$inv->invoice_number} (Status: {$inv->status})",
                'debit'       => (float) $inv->total_amount,
                'credit'      => 0.00,
                'invoice'     => $inv,
            ]);
        }

        // 3. Payments Received (recorded ONCE per receipt, with invoice-wise allocation details)
        $payments = Payment::with(['allocations.invoice.lineItems', 'allocations.invoice.contact', 'invoice.lineItems', 'invoice.contact'])
            ->where('contact_id', $contact->id)
            ->where('type', 'CUSTOMER_PAYMENT')
            ->when($startDate, fn($q) => $q->where('payment_date', '>=', $startDate))
            ->when($endDate,   fn($q) => $q->where('payment_date', '<=', $endDate))
            ->get();

        foreach ($payments as $pay) {
            $allocList = $pay->allocations->map(fn($al) => [
                'invoice_id'     => $al->invoice_id,
                'invoice_number' => $al->invoice?->invoice_number ?? ('INV-' . $al->invoice_id),
                'amount'         => (float) $al->amount,
                'invoice'        => $al->invoice,
            ])->values()->all();

            $allocatedSum = round((float) $pay->allocations->sum('amount'), 2);
            $unallocated  = max(0.0, round((float) $pay->amount - $allocatedSum, 2));

            $refPart = $pay->reference_number ? " (Ref: {$pay->reference_number})" : "";
            $allocSummary = count($allocList) > 0
                ? " | Allocated to: " . implode(', ', array_map(fn($a) => "{$a['invoice_number']} (৳" . number_format($a['amount'], 2) . ")", $allocList))
                : "";
            $advanceSummary = $unallocated > 0
                ? " | Customer Advance: ৳" . number_format($unallocated, 2)
                : "";

            $entries->push([
                'date'               => Carbon::parse($pay->payment_date)->format('Y-m-d'),
                'type'               => 'PAYMENT',
                'payment_id'         => $pay->id,
                'reference'          => $pay->payment_number,
                'reference_number'   => $pay->reference_number,
                'payment_method'     => $pay->payment_method ?: 'CASH',
                'description'        => "Payment #{$pay->payment_number}{$refPart} via " . ($pay->payment_method ?: 'Cash') . $allocSummary . $advanceSummary,
                'debit'              => 0.00,
                'credit'             => (float) $pay->amount,
                'allocations'        => $allocList,
                'allocated_amount'   => $allocatedSum,
                'unallocated_amount' => $unallocated,
            ]);
        }

        // Sort chronologically and compute running balance
        $sorted = $entries->sortBy('date')->values();
        $running = 0.00;
        $ledger = [];
        foreach ($sorted as $item) {
            $running += ($item['debit'] - $item['credit']);
            $item['running_balance'] = $running;
            $ledger[] = $item;
        }

        return [
            'contact'         => $contact,
            'current_balance' => (float)$contact->current_balance,
            'entries'         => $ledger,
            'allCustomers'    => Contact::whereIn('type', ['CUSTOMER', 'BOTH'])->orderBy('name')->get(['id', 'name']),
        ];
    }

    public function getOrderDetails(array $filters = []): array
    {
        [$startDate, $endDate] = $this->parseDateRange($filters);

        $bookings = Booking::with('contact')
            ->when($startDate, fn($q) => $q->where('booking_date', '>=', $startDate))
            ->when($endDate,   fn($q) => $q->where('booking_date', '<=', $endDate))
            ->orderBy('booking_date', 'desc')
            ->get()
            ->map(fn($b) => [
                'id'             => $b->id,
                'booking_number' => $b->booking_number,
                'order_number'   => $b->order_number,
                'invoice_number' => $b->invoice_number,
                'contact_id'     => $b->contact_id,
                'customer_name'  => $b->contact ? $b->contact->name : 'N/A',
                'booking_date'   => $b->booking_date ? Carbon::parse($b->booking_date)->format('Y-m-d') : '',
                'service_date'   => $b->service_date ? Carbon::parse($b->service_date)->format('Y-m-d') : '',
                'status'         => $b->status,
                'total_amount'   => (float) $b->total_amount,
            ]);

        return [
            'bookings'    => $bookings,
            'totalAmount' => $bookings->sum('total_amount'),
        ];
    }

    public function getARAgingSummary(array $filters = []): array
    {
        $now = now();

        $invoices = Invoice::with('contact')
            ->whereIn('status', ['UNPAID', 'PARTIALLY PAID', 'SENT', 'OVERDUE'])
            ->get();

        $buckets = [
            'current' => 0.00,
            '1_30'    => 0.00,
            '31_60'   => 0.00,
            '61_90'   => 0.00,
            '90_plus' => 0.00,
        ];

        $customerBreakdown = [];

        foreach ($invoices as $inv) {
            $due = (float) $inv->total_amount - (float) $inv->paid_amount;
            if ($due <= 0.001) continue;

            $daysOverdue = 0;
            if ($inv->due_date && Carbon::parse($inv->due_date)->lt($now)) {
                $daysOverdue = Carbon::parse($inv->due_date)->diffInDays($now);
            }

            $cid = $inv->contact_id;
            $cname = $inv->contact ? $inv->contact->name : 'Unknown';

            if (! isset($customerBreakdown[$cid])) {
                $customerBreakdown[$cid] = [
                    'contact_id' => $cid,
                    'name'       => $cname,
                    'current'    => 0.00,
                    '1_30'       => 0.00,
                    '31_60'      => 0.00,
                    '61_90'      => 0.00,
                    '90_plus'    => 0.00,
                    'total'      => 0.00,
                ];
            }

            if ($daysOverdue === 0) {
                $buckets['current'] += $due;
                $customerBreakdown[$cid]['current'] += $due;
            } elseif ($daysOverdue <= 30) {
                $buckets['1_30'] += $due;
                $customerBreakdown[$cid]['1_30'] += $due;
            } elseif ($daysOverdue <= 60) {
                $buckets['31_60'] += $due;
                $customerBreakdown[$cid]['31_60'] += $due;
            } elseif ($daysOverdue <= 90) {
                $buckets['61_90'] += $due;
                $customerBreakdown[$cid]['61_90'] += $due;
            } else {
                $buckets['90_plus'] += $due;
                $customerBreakdown[$cid]['90_plus'] += $due;
            }

            $customerBreakdown[$cid]['total'] += $due;
        }

        return [
            'buckets'           => $buckets,
            'totalOverdue'      => array_sum($buckets),
            'customerBreakdown' => array_values($customerBreakdown),
        ];
    }

    public function getInvoiceDetails(array $filters = []): array
    {
        [$startDate, $endDate] = $this->parseDateRange($filters);

        $invoices = Invoice::with('contact')
            ->when($startDate, fn($q) => $q->where('issue_date', '>=', $startDate))
            ->when($endDate,   fn($q) => $q->where('issue_date', '<=', $endDate))
            ->orderBy('issue_date', 'desc')
            ->get()
            ->map(function ($inv) {
                $total = (float)$inv->total_amount;
                $paid  = (float)$inv->paid_amount;
                return [
                    'id'             => $inv->id,
                    'invoice_number' => $inv->invoice_number,
                    'contact_id'     => $inv->contact_id,
                    'customer_name'  => $inv->contact ? $inv->contact->name : 'N/A',
                    'issue_date'     => $inv->issue_date ? Carbon::parse($inv->issue_date)->format('Y-m-d') : '',
                    'due_date'       => $inv->due_date ? Carbon::parse($inv->due_date)->format('Y-m-d') : '',
                    'status'         => $inv->status,
                    'total_amount'   => $total,
                    'paid_amount'    => $paid,
                    'balance_due'    => $total - $paid,
                ];
            });

        return [
            'invoices'        => $invoices,
            'totalAmountAll'  => $invoices->sum('total_amount'),
            'totalPaidAll'    => $invoices->sum('paid_amount'),
            'totalBalanceDue' => $invoices->sum('balance_due'),
        ];
    }

    public function getReceivableSummary(array $filters = []): array
    {
        $allInvoices = Invoice::all();
        $totalInvoiced = (float) $allInvoices->sum('total_amount');
        $totalPaid     = (float) $allInvoices->sum('paid_amount');
        $balanceDue    = $totalInvoiced - $totalPaid;

        $unpaidCount = $allInvoices->whereIn('status', ['UNPAID', 'PARTIALLY PAID', 'OVERDUE', 'SENT'])->count();
        $paidCount   = $allInvoices->where('status', 'PAID')->count();

        return [
            'totalInvoiced' => $totalInvoiced,
            'totalPaid'     => $totalPaid,
            'balanceDue'    => $balanceDue,
            'unpaidCount'   => $unpaidCount,
            'paidCount'     => $paidCount,
        ];
    }

    public function getPaymentsReceived(array $filters = []): array
    {
        [$startDate, $endDate] = $this->parseDateRange($filters);

        $payments = Payment::with(['contact', 'invoice'])
            ->where('type', 'CUSTOMER_PAYMENT')
            ->when($startDate, fn($q) => $q->where('payment_date', '>=', $startDate))
            ->when($endDate,   fn($q) => $q->where('payment_date', '<=', $endDate))
            ->orderBy('payment_date', 'desc')
            ->get()
            ->map(fn($p) => [
                'id'               => $p->id,
                'payment_number'   => $p->payment_number,
                'payment_date'     => $p->payment_date ? Carbon::parse($p->payment_date)->format('Y-m-d') : '',
                'contact_id'       => $p->contact_id,
                'customer_name'    => $p->contact ? $p->contact->name : 'N/A',
                'invoice_id'       => $p->invoice_id,
                'invoice_number'   => $p->invoice ? $p->invoice->invoice_number : 'Direct Receipt',
                'payment_method'   => $p->payment_method ?: 'Cash',
                'reference_number' => $p->reference_number ?: '-',
                'amount'           => (float) $p->amount,
            ]);

        return [
            'payments'    => $payments,
            'totalAmount' => $payments->sum('amount'),
        ];
    }

    /* ------------------------------------------------------------------------
     | 5. PAYABLES & PAYMENTS MADE
     | ------------------------------------------------------------------------ */

    public function getVendorBalanceSummary(array $filters = []): array
    {
        $vendors = Contact::where('type', 'VENDOR')
            ->orderBy('name')
            ->get()
            ->map(function ($c) {
                $totalBilled = (float) $c->bills()->sum('total_amount');
                $totalPaid   = (float) $c->payments()->where('type', 'VENDOR_PAYMENT')->sum('amount');
                $openingBal  = (float) ($c->opening_balance ?? 0);
                $opType      = $c->opening_balance_type ?: 'TO_PAY';
                $currentBal  = (float) $c->current_balance;

                return [
                    'id'              => $c->id,
                    'name'            => $c->name,
                    'phone'           => $c->phone ?: $c->whatsapp_number,
                    'opening_balance' => $openingBal,
                    'opening_type'    => $opType,
                    'total_billed'    => $totalBilled,
                    'total_paid'      => $totalPaid,
                    'closing_balance' => $currentBal,
                ];
            });

        return [
            'vendors'       => $vendors,
            'totalPayable'  => $vendors->sum(fn($v) => max(0, $v['closing_balance'])),
        ];
    }

    public function getVendorStatement(int $contactId, array $filters = []): array
    {
        $contact = Contact::findOrFail($contactId);
        [$startDate, $endDate] = $this->parseDateRange($filters);

        $entries = collect();

        // 1. Opening Balance
        if ((float)$contact->opening_balance > 0) {
            $isToPay = ($contact->opening_balance_type !== 'TO_RECEIVE');
            $entries->push([
                'date'        => $contact->opening_balance_date ? Carbon::parse($contact->opening_balance_date)->format('Y-m-d') : $contact->created_at->format('Y-m-d'),
                'type'        => 'OPENING_BALANCE',
                'reference'   => 'OB-' . str_pad($contact->id, 4, '0', STR_PAD_LEFT),
                'description' => 'Opening Balance (' . ($isToPay ? 'To Pay' : 'To Receive') . ')',
                'debit'       => $isToPay ? 0.00 : (float)$contact->opening_balance,
                'credit'      => $isToPay ? (float)$contact->opening_balance : 0.00,
            ]);
        }

        // 2. Bills
        $bills = Bill::with(['lineItems', 'contact'])
            ->where('contact_id', $contact->id)
            ->when($startDate, fn($q) => $q->where('issue_date', '>=', $startDate))
            ->when($endDate,   fn($q) => $q->where('issue_date', '<=', $endDate))
            ->get();

        foreach ($bills as $bill) {
            $entries->push([
                'date'        => Carbon::parse($bill->issue_date)->format('Y-m-d'),
                'type'        => 'BILL',
                'id'          => $bill->id,
                'reference'   => $bill->bill_number,
                'description' => "Bill #{$bill->bill_number} (Status: {$bill->status})",
                'debit'       => 0.00,
                'credit'      => (float) $bill->total_amount,
                'bill'        => $bill,
            ]);
        }

        // 3. Payments Made
        $payments = Payment::where('contact_id', $contact->id)
            ->where('type', 'VENDOR_PAYMENT')
            ->when($startDate, fn($q) => $q->where('payment_date', '>=', $startDate))
            ->when($endDate,   fn($q) => $q->where('payment_date', '<=', $endDate))
            ->get();

        foreach ($payments as $pay) {
            $entries->push([
                'date'        => Carbon::parse($pay->payment_date)->format('Y-m-d'),
                'type'        => 'PAYMENT',
                'reference'   => $pay->payment_number,
                'description' => "Payment #{$pay->payment_number} via " . ($pay->payment_method ?: 'Cash'),
                'debit'       => (float) $pay->amount,
                'credit'      => 0.00,
            ]);
        }

        $sorted = $entries->sortBy('date')->values();
        $running = 0.00;
        $ledger = [];
        foreach ($sorted as $item) {
            $running += ($item['credit'] - $item['debit']);
            $item['running_balance'] = $running;
            $ledger[] = $item;
        }

        return [
            'contact'         => $contact,
            'current_balance' => (float)$contact->current_balance,
            'entries'         => $ledger,
            'allVendors'      => Contact::where('type', 'VENDOR')->orderBy('name')->get(['id', 'name']),
        ];
    }

    public function getAPAgingSummary(array $filters = []): array
    {
        $now = now();

        $bills = Bill::with('contact')
            ->whereIn('status', ['UNPAID', 'PARTIALLY PAID', 'OVERDUE'])
            ->get();

        $buckets = [
            'current' => 0.00,
            '1_30'    => 0.00,
            '31_60'   => 0.00,
            '61_90'   => 0.00,
            '90_plus' => 0.00,
        ];

        $vendorBreakdown = [];

        foreach ($bills as $bill) {
            $due = (float) $bill->total_amount - (float) $bill->paid_amount;
            if ($due <= 0.001) continue;

            $daysOverdue = 0;
            if ($bill->due_date && Carbon::parse($bill->due_date)->lt($now)) {
                $daysOverdue = Carbon::parse($bill->due_date)->diffInDays($now);
            }

            $cid = $bill->contact_id;
            $cname = $bill->contact ? $bill->contact->name : 'Unknown Vendor';

            if (! isset($vendorBreakdown[$cid])) {
                $vendorBreakdown[$cid] = [
                    'contact_id' => $cid,
                    'name'       => $cname,
                    'current'    => 0.00,
                    '1_30'       => 0.00,
                    '31_60'      => 0.00,
                    '61_90'      => 0.00,
                    '90_plus'    => 0.00,
                    'total'      => 0.00,
                ];
            }

            if ($daysOverdue === 0) {
                $buckets['current'] += $due;
                $vendorBreakdown[$cid]['current'] += $due;
            } elseif ($daysOverdue <= 30) {
                $buckets['1_30'] += $due;
                $vendorBreakdown[$cid]['1_30'] += $due;
            } elseif ($daysOverdue <= 60) {
                $buckets['31_60'] += $due;
                $vendorBreakdown[$cid]['31_60'] += $due;
            } elseif ($daysOverdue <= 90) {
                $buckets['61_90'] += $due;
                $vendorBreakdown[$cid]['61_90'] += $due;
            } else {
                $buckets['90_plus'] += $due;
                $vendorBreakdown[$cid]['90_plus'] += $due;
            }

            $vendorBreakdown[$cid]['total'] += $due;
        }

        return [
            'buckets'         => $buckets,
            'totalOverdue'    => array_sum($buckets),
            'vendorBreakdown' => array_values($vendorBreakdown),
        ];
    }

    public function getBillDetails(array $filters = []): array
    {
        [$startDate, $endDate] = $this->parseDateRange($filters);

        $bills = Bill::with('contact')
            ->when($startDate, fn($q) => $q->where('issue_date', '>=', $startDate))
            ->when($endDate,   fn($q) => $q->where('issue_date', '<=', $endDate))
            ->orderBy('issue_date', 'desc')
            ->get()
            ->map(function ($b) {
                $total = (float)$b->total_amount;
                $paid  = (float)$b->paid_amount;
                return [
                    'id'          => $b->id,
                    'bill_number' => $b->bill_number,
                    'contact_id'  => $b->contact_id,
                    'vendor_name' => $b->contact ? $b->contact->name : 'N/A',
                    'issue_date'  => $b->issue_date ? Carbon::parse($b->issue_date)->format('Y-m-d') : '',
                    'due_date'    => $b->due_date ? Carbon::parse($b->due_date)->format('Y-m-d') : '',
                    'status'      => $b->status,
                    'total_amount'=> $total,
                    'paid_amount' => $paid,
                    'balance_due' => $total - $paid,
                ];
            });

        return [
            'bills'           => $bills,
            'totalAmountAll'  => $bills->sum('total_amount'),
            'totalPaidAll'    => $bills->sum('paid_amount'),
            'totalBalanceDue' => $bills->sum('balance_due'),
        ];
    }

    public function getPaymentsMade(array $filters = []): array
    {
        [$startDate, $endDate] = $this->parseDateRange($filters);

        $payments = Payment::with(['contact', 'bill'])
            ->where('type', 'VENDOR_PAYMENT')
            ->when($startDate, fn($q) => $q->where('payment_date', '>=', $startDate))
            ->when($endDate,   fn($q) => $q->where('payment_date', '<=', $endDate))
            ->orderBy('payment_date', 'desc')
            ->get()
            ->map(fn($p) => [
                'id'               => $p->id,
                'payment_number'   => $p->payment_number,
                'payment_date'     => $p->payment_date ? Carbon::parse($p->payment_date)->format('Y-m-d') : '',
                'contact_id'       => $p->contact_id,
                'vendor_name'      => $p->contact ? $p->contact->name : 'N/A',
                'bill_id'          => $p->bill_id,
                'bill_number'      => $p->bill ? $p->bill->bill_number : 'Direct Payment',
                'payment_method'   => $p->payment_method ?: 'Cash',
                'reference_number' => $p->reference_number ?: '-',
                'amount'           => (float) $p->amount,
            ]);

        return [
            'payments'    => $payments,
            'totalAmount' => $payments->sum('amount'),
        ];
    }

    public function getPayableSummary(array $filters = []): array
    {
        $allBills = Bill::all();
        $totalBilled = (float) $allBills->sum('total_amount');
        $totalPaid   = (float) $allBills->sum('paid_amount');
        $balanceDue  = $totalBilled - $totalPaid;

        $unpaidCount = $allBills->whereIn('status', ['UNPAID', 'PARTIALLY PAID', 'OVERDUE'])->count();
        $paidCount   = $allBills->where('status', 'PAID')->count();

        return [
            'totalBilled' => $totalBilled,
            'totalPaid'   => $totalPaid,
            'balanceDue'  => $balanceDue,
            'unpaidCount' => $unpaidCount,
            'paidCount'   => $paidCount,
        ];
    }

    /* ------------------------------------------------------------------------
     | 6. PURCHASES AND EXPENSES
     | ------------------------------------------------------------------------ */

    public function getPurchasesByVendor(array $filters = []): array
    {
        [$startDate, $endDate] = $this->parseDateRange($filters);

        $vendors = Contact::where('type', 'VENDOR')
            ->with(['bills' => function ($q) use ($startDate, $endDate) {
                if ($startDate) $q->where('issue_date', '>=', $startDate);
                if ($endDate)   $q->where('issue_date', '<=', $endDate);
            }])
            ->get()
            ->map(function ($v) {
                $billCount   = $v->bills->count();
                $totalAmount = (float) $v->bills->sum('total_amount');
                $totalPaid   = (float) $v->bills->sum('paid_amount');

                return [
                    'id'          => $v->id,
                    'name'        => $v->name,
                    'phone'       => $v->phone ?: $v->whatsapp_number,
                    'billCount'   => $billCount,
                    'totalAmount' => $totalAmount,
                    'totalPaid'   => $totalPaid,
                    'balanceDue'  => $totalAmount - $totalPaid,
                ];
            })
            ->filter(fn($v) => $v['billCount'] > 0 || $v['totalAmount'] > 0)
            ->values();

        return [
            'vendors'         => $vendors,
            'totalAmountAll'  => $vendors->sum('totalAmount'),
            'totalPaidAll'    => $vendors->sum('totalPaid'),
            'totalBalanceDue' => $vendors->sum('balanceDue'),
        ];
    }

    public function getPurchasesByItem(array $filters = []): array
    {
        [$startDate, $endDate] = $this->parseDateRange($filters);

        $lines = BillLineItem::with(['bill', 'item'])
            ->whereHas('bill', function ($q) use ($startDate, $endDate) {
                if ($startDate) $q->where('issue_date', '>=', $startDate);
                if ($endDate)   $q->where('issue_date', '<=', $endDate);
            })
            ->get();

        $grouped = $lines->groupBy(fn($l) => $l->item ? $l->item->name : ($l->description ?: 'Unknown Item'))
            ->map(function ($group, $itemName) {
                $qtyTotal    = (float) $group->sum('quantity');
                $amountTotal = (float) $group->sum('amount');
                $avgPrice    = $qtyTotal > 0 ? ($amountTotal / $qtyTotal) : 0.00;

                return [
                    'name'        => $itemName,
                    'quantity'    => $qtyTotal,
                    'totalAmount' => $amountTotal,
                    'averageRate' => $avgPrice,
                ];
            })
            ->values();

        return [
            'items'       => $grouped,
            'totalAmount' => $grouped->sum('totalAmount'),
            'totalQty'    => $grouped->sum('quantity'),
        ];
    }

    public function getExpenseDetails(array $filters = []): array
    {
        [$startDate, $endDate] = $this->parseDateRange($filters);

        $expenses = Expense::with(['expenseAccount', 'paidThroughAccount', 'contact'])
            ->when($startDate, fn($q) => $q->where('expense_date', '>=', $startDate))
            ->when($endDate,   fn($q) => $q->where('expense_date', '<=', $endDate))
            ->orderBy('expense_date', 'desc')
            ->get()
            ->map(fn($e) => [
                'id'                   => $e->id,
                'expense_number'       => $e->expense_number,
                'expense_date'         => $e->expense_date ? Carbon::parse($e->expense_date)->format('Y-m-d') : '',
                'category'             => $e->category ?: ($e->expenseAccount ? $e->expenseAccount->name : 'General Expense'),
                'account_name'         => $e->expenseAccount ? $e->expenseAccount->name : 'N/A',
                'paid_through_account' => $e->paidThroughAccount ? $e->paidThroughAccount->name : 'Cash',
                'vendor_name'          => $e->contact ? $e->contact->name : '-',
                'reference_number'     => $e->reference_number ?: '-',
                'amount'               => (float) $e->amount,
            ]);

        return [
            'expenses'    => $expenses,
            'totalAmount' => $expenses->sum('amount'),
        ];
    }

    public function getExpensesByCategory(array $filters = []): array
    {
        [$startDate, $endDate] = $this->parseDateRange($filters);

        $expenses = Expense::with('expenseAccount')
            ->when($startDate, fn($q) => $q->where('expense_date', '>=', $startDate))
            ->when($endDate,   fn($q) => $q->where('expense_date', '<=', $endDate))
            ->get();

        $totalAll = (float) $expenses->sum('amount');

        $grouped = $expenses->groupBy(function ($e) {
            return $e->category ?: ($e->expenseAccount ? $e->expenseAccount->name : 'General Expense');
        })->map(function ($group, $catName) use ($totalAll) {
            $catAmount = (float) $group->sum('amount');
            $percentage = $totalAll > 0 ? round(($catAmount / $totalAll) * 100, 1) : 0;
            return [
                'category'   => $catName,
                'count'      => $group->count(),
                'amount'     => $catAmount,
                'percentage' => $percentage,
            ];
        })->values()->sortByDesc('amount')->values();

        return [
            'categories'  => $grouped,
            'totalAmount' => $totalAll,
        ];
    }
}
