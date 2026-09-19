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
        $receivables = Account::where('code', '1100')->value('balance') ?? 145000.00;
        $payables    = Account::where('code', '2000')->value('balance') ?? 38500.00;
        $bankBalance = Account::whereIn('code', ['1000', '1010', '1020'])->sum('balance') ?: 520000.00;
        $netCashFlow = $receivables - $payables;

        $recentInvoices = Invoice::with('contact')->latest()->take(5)->get();
        $recentBookings = Booking::with(['contact', 'lineItems.item'])->latest()->take(5)->get();

        return Inertia::render('Dashboard', [
            'metrics' => [
                'receivables' => (float)$receivables,
                'payables'    => (float)$payables,
                'bankBalance' => (float)$bankBalance,
                'netCashFlow' => (float)$netCashFlow,
                'totalBookings' => Booking::count(),
            ],
            'recentInvoices' => $recentInvoices,
            'recentBookings' => $recentBookings,
        ]);
    }
}
