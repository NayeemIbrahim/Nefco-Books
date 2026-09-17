<?php

namespace Database\Seeders;

use App\Models\Account;
use Illuminate\Database\Seeder;

class AccountSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = [
            // Assets
            ['code' => '1000', 'name' => 'Petty Cash', 'type' => 'ASSET', 'sub_type' => 'CASH_AND_BANK', 'is_system' => true, 'balance' => 20000.00],
            ['code' => '1010', 'name' => 'Main Bank Account (Standard Chartered BDT)', 'type' => 'ASSET', 'sub_type' => 'CASH_AND_BANK', 'is_system' => true, 'balance' => 450000.00],
            ['code' => '1020', 'name' => 'bKash / Nagad Merchant Account', 'type' => 'ASSET', 'sub_type' => 'CASH_AND_BANK', 'is_system' => true, 'balance' => 50000.00],
            ['code' => '1100', 'name' => 'Accounts Receivable', 'type' => 'ASSET', 'sub_type' => 'ACCOUNTS_RECEIVABLE', 'is_system' => true, 'balance' => 75000.00],
            // Liabilities
            ['code' => '2000', 'name' => 'Accounts Payable', 'type' => 'LIABILITY', 'sub_type' => 'ACCOUNTS_PAYABLE', 'is_system' => true, 'balance' => 8500.00],
            // Equity
            ['code' => '3000', 'name' => "Owner's Equity", 'type' => 'EQUITY', 'sub_type' => 'EQUITY', 'is_system' => true, 'balance' => 520000.00],
            // Revenue
            ['code' => '4000', 'name' => 'Sales Revenue', 'type' => 'REVENUE', 'sub_type' => 'OPERATING_REVENUE', 'is_system' => true, 'balance' => 75000.00],
            // Expenses
            ['code' => '5000', 'name' => 'Cost of Goods Sold (COGS)', 'type' => 'EXPENSE', 'sub_type' => 'COST_OF_GOODS_SOLD', 'is_system' => true, 'balance' => 0.00],
            ['code' => '6000', 'name' => 'Operating Expenses', 'type' => 'EXPENSE', 'sub_type' => 'OPERATING_EXPENSE', 'is_system' => true, 'balance' => 8500.00],
        ];

        foreach ($accounts as $acc) {
            Account::updateOrCreate(['code' => $acc['code']], $acc);
        }
    }
}
