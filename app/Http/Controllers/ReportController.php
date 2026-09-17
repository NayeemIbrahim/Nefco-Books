<?php

namespace App\Http\Controllers;

use App\Models\Account;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Reports/Index');
    }

    public function profitAndLoss(): Response
    {
        $revenueAccounts = Account::where('type', 'REVENUE')->get();
        $cogsAccounts    = Account::where('sub_type', 'COST_OF_GOODS_SOLD')->get();
        $expenseAccounts = Account::where('type', 'EXPENSE')->where('sub_type', '!=', 'COST_OF_GOODS_SOLD')->get();

        $totalRevenue = $revenueAccounts->sum('balance');
        $totalCogs    = $cogsAccounts->sum('balance');
        $grossProfit  = $totalRevenue - $totalCogs;
        $totalExpense = $expenseAccounts->sum('balance');
        $netProfit    = $grossProfit - $totalExpense;

        return Inertia::render('Reports/ProfitAndLoss', [
            'revenues'     => $revenueAccounts,
            'cogs'         => $cogsAccounts,
            'expenses'     => $expenseAccounts,
            'totalRevenue' => $totalRevenue,
            'grossProfit'  => $grossProfit,
            'totalExpense' => $totalExpense,
            'netProfit'    => $netProfit,
        ]);
    }

    public function balanceSheet(): Response
    {
        $assets      = Account::where('type', 'ASSET')->get();
        $liabilities = Account::where('type', 'LIABILITY')->get();
        $equity      = Account::where('type', 'EQUITY')->get();

        $totalAssets      = $assets->sum('balance');
        $totalLiabilities = $liabilities->sum('balance');
        $totalEquity      = $equity->sum('balance');

        return Inertia::render('Reports/BalanceSheet', [
            'assets'           => $assets,
            'liabilities'      => $liabilities,
            'equity'           => $equity,
            'totalAssets'      => $totalAssets,
            'totalLiabilities' => $totalLiabilities,
            'totalEquity'      => $totalEquity,
            'isBalanced'       => round($totalAssets, 2) === round($totalLiabilities + $totalEquity, 2),
        ]);
    }

    public function trialBalance(): Response
    {
        $accounts = Account::with(['journalLines'])->get()->map(function ($acc) {
            $totalDebit  = $acc->journalLines->sum('debit');
            $totalCredit = $acc->journalLines->sum('credit');

            return [
                'code'         => $acc->code,
                'name'         => $acc->name,
                'type'         => $acc->type,
                'total_debit'  => $totalDebit,
                'total_credit' => $totalCredit,
            ];
        });

        $totalDebitAll  = $accounts->sum('total_debit');
        $totalCreditAll = $accounts->sum('total_credit');

        return Inertia::render('Reports/TrialBalance', [
            'accounts'       => $accounts,
            'totalDebit'     => $totalDebitAll,
            'totalCredit'    => $totalCreditAll,
            'isEquilibrium'  => round($totalDebitAll, 2) === round($totalCreditAll, 2),
        ]);
    }
}
