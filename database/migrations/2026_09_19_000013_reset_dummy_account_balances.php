<?php

use Illuminate\Database\Migrations\Migration;
use App\Models\Account;

return new class extends Migration
{
    public function up(): void
    {
        // Reset old hardcoded dummy balances to 0.00
        Account::whereIn('code', ['1000', '1010', '1020', '1100', '2000', '3000', '4000', '6000'])
            ->whereIn('balance', [20000.00, 450000.00, 50000.00, 75000.00, 8500.00, 520000.00])
            ->update(['balance' => 0.00]);
    }

    public function down(): void
    {
    }
};
