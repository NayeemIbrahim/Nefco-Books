<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Booking;
use App\Models\Invoice;
use App\Models\Bill;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $receivables = (float)(Account::where('code', '1100')->value('balance') ?? 0.00);
        $payables    = (float)(Account::where('code', '2000')->value('balance') ?? 0.00);
        
        $cashAndBankAccounts = Account::where('sub_type', 'CASH_AND_BANK')
            ->orWhereIn('code', ['1000', '1010', '1020'])
            ->orderBy('code')
            ->get();

        $bankBalance = (float)$cashAndBankAccounts->sum('balance');
        $netCashFlow = (float)($receivables - $payables);

        $recentInvoices = Invoice::with('contact')->latest()->take(5)->get();
        $recentBookings = Booking::with(['contact', 'lineItems.item'])->latest()->take(5)->get();

        return Inertia::render('Dashboard', [
            'metrics' => [
                'receivables'   => $receivables,
                'payables'      => $payables,
                'bankBalance'   => $bankBalance,
                'netCashFlow'   => $netCashFlow,
                'totalBookings' => Booking::count(),
            ],
            'cashAndBankAccounts' => $cashAndBankAccounts,
            'recentInvoices'      => $recentInvoices,
            'recentBookings'      => $recentBookings,
        ]);
    }
}
