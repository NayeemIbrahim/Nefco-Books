<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Booking;
use App\Models\Invoice;
use App\Models\Bill;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $ledgerReceivables = (float)(Account::where('code', '1100')->value('balance') ?? 0.00);
        $ledgerPayables    = (float)(Account::where('code', '2000')->value('balance') ?? 0.00);

        // 1. Receivables Metrics (Unpaid / Partially Paid / Due Invoices)
        $unpaidInvoicesQ = Invoice::whereNotIn('status', ['PAID', 'DRAFT', 'VOID'])
            ->where(function ($q) {
                $q->where('paid_amount', '<=', 0)->orWhereNull('paid_amount');
            });
        $unpaidInvoicesCount = (clone $unpaidInvoicesQ)->count();
        $unpaidInvoicesAmount = (float)(clone $unpaidInvoicesQ)->selectRaw('COALESCE(SUM(total_amount - COALESCE(paid_amount, 0)), 0) as t')->value('t');

        $partiallyPaidInvoicesQ = Invoice::where('status', 'PARTIALLY_PAID')
            ->orWhere(function ($q) {
                $q->where('paid_amount', '>', 0)->whereColumn('paid_amount', '<', 'total_amount');
            });
        $partiallyPaidInvoicesCount = (clone $partiallyPaidInvoicesQ)->count();
        $partiallyPaidInvoicesAmount = (float)(clone $partiallyPaidInvoicesQ)->selectRaw('COALESCE(SUM(total_amount - paid_amount), 0) as t')->value('t');

        $overdueInvoicesQ = Invoice::whereNotIn('status', ['PAID', 'DRAFT', 'VOID'])
            ->whereDate('due_date', '<', now()->toDateString())
            ->where(function ($q) {
                $q->whereColumn('paid_amount', '<', 'total_amount')->orWhereNull('paid_amount');
            });
        $overdueInvoicesCount = (clone $overdueInvoicesQ)->count();
        $overdueInvoicesAmount = (float)(clone $overdueInvoicesQ)->selectRaw('COALESCE(SUM(total_amount - COALESCE(paid_amount, 0)), 0) as t')->value('t');

        $totalReceivables = (float)Invoice::whereNotIn('status', ['PAID', 'DRAFT', 'VOID'])
            ->where(function ($q) {
                $q->whereColumn('paid_amount', '<', 'total_amount')->orWhereNull('paid_amount');
            })
            ->selectRaw('COALESCE(SUM(total_amount - COALESCE(paid_amount, 0)), 0) as t')
            ->value('t');
        if ($totalReceivables <= 0 && $ledgerReceivables > 0) {
            $totalReceivables = $ledgerReceivables;
        }

        // 2. Payables Metrics (Unpaid / Partially Paid / Due Bills)
        $unpaidBillsQ = Bill::whereNotIn('status', ['PAID', 'VOID'])
            ->where(function ($q) {
                $q->where('paid_amount', '<=', 0)->orWhereNull('paid_amount');
            });
        $unpaidBillsCount = (clone $unpaidBillsQ)->count();
        $unpaidBillsAmount = (float)(clone $unpaidBillsQ)->selectRaw('COALESCE(SUM(total_amount - COALESCE(paid_amount, 0)), 0) as t')->value('t');

        $partiallyPaidBillsQ = Bill::where('status', 'PARTIALLY_PAID')
            ->orWhere(function ($q) {
                $q->where('paid_amount', '>', 0)->whereColumn('paid_amount', '<', 'total_amount');
            });
        $partiallyPaidBillsCount = (clone $partiallyPaidBillsQ)->count();
        $partiallyPaidBillsAmount = (float)(clone $partiallyPaidBillsQ)->selectRaw('COALESCE(SUM(total_amount - paid_amount), 0) as t')->value('t');

        $overdueBillsQ = Bill::whereNotIn('status', ['PAID', 'VOID'])
            ->whereDate('due_date', '<', now()->toDateString())
            ->where(function ($q) {
                $q->whereColumn('paid_amount', '<', 'total_amount')->orWhereNull('paid_amount');
            });
        $overdueBillsCount = (clone $overdueBillsQ)->count();
        $overdueBillsAmount = (float)(clone $overdueBillsQ)->selectRaw('COALESCE(SUM(total_amount - COALESCE(paid_amount, 0)), 0) as t')->value('t');

        $totalPayables = (float)Bill::whereNotIn('status', ['PAID', 'VOID'])
            ->where(function ($q) {
                $q->whereColumn('paid_amount', '<', 'total_amount')->orWhereNull('paid_amount');
            })
            ->selectRaw('COALESCE(SUM(total_amount - COALESCE(paid_amount, 0)), 0) as t')
            ->value('t');
        if ($totalPayables <= 0 && $ledgerPayables > 0) {
            $totalPayables = $ledgerPayables;
        }

        $dueInvoices = Invoice::with('contact')
            ->whereNotIn('status', ['PAID', 'DRAFT', 'VOID'])
            ->where(function ($q) {
                $q->whereColumn('paid_amount', '<', 'total_amount')->orWhereNull('paid_amount');
            })
            ->orderBy('due_date')
            ->take(5)
            ->get();

        $dueBills = Bill::with('contact')
            ->whereNotIn('status', ['PAID', 'VOID'])
            ->where(function ($q) {
                $q->whereColumn('paid_amount', '<', 'total_amount')->orWhereNull('paid_amount');
            })
            ->orderBy('due_date')
            ->take(5)
            ->get();

        $recentBookings = Booking::with(['contact', 'lineItems.item'])->latest()->take(5)->get();

        return Inertia::render('Dashboard', [
            'receivables' => [
                'total'               => $totalReceivables,
                'unpaid_count'        => $unpaidInvoicesCount,
                'unpaid_amount'       => $unpaidInvoicesAmount,
                'partially_paid_count'=> $partiallyPaidInvoicesCount,
                'partially_paid_amount'=> $partiallyPaidInvoicesAmount,
                'overdue_count'       => $overdueInvoicesCount,
                'overdue_amount'      => $overdueInvoicesAmount,
                'due_invoices'        => $dueInvoices,
            ],
            'payables' => [
                'total'               => $totalPayables,
                'unpaid_count'        => $unpaidBillsCount,
                'unpaid_amount'       => $unpaidBillsAmount,
                'partially_paid_count'=> $partiallyPaidBillsCount,
                'partially_paid_amount'=> $partiallyPaidBillsAmount,
                'overdue_count'       => $overdueBillsCount,
                'overdue_amount'      => $overdueBillsAmount,
                'due_bills'           => $dueBills,
            ],
            'recentBookings' => $recentBookings,
        ]);
    }
}
