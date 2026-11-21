<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('status', 50)->default('UNPAID')->change();
        });

        Schema::table('bills', function (Blueprint $table) {
            $table->string('status', 50)->default('UNPAID')->change();
        });

        // Convert existing SENT invoices to UNPAID (or PAID/PARTIALLY_PAID)
        DB::table('invoices')
            ->where('status', 'SENT')
            ->whereColumn('paid_amount', '>=', 'total_amount')
            ->update(['status' => 'PAID']);

        DB::table('invoices')
            ->where('status', 'SENT')
            ->where('paid_amount', '>', 0)
            ->whereColumn('paid_amount', '<', 'total_amount')
            ->update(['status' => 'PARTIALLY_PAID']);

        DB::table('invoices')
            ->where('status', 'SENT')
            ->update(['status' => 'UNPAID']);

        // Convert existing RECEIVED bills to UNPAID (or PAID/PARTIALLY_PAID)
        DB::table('bills')
            ->where('status', 'RECEIVED')
            ->whereColumn('paid_amount', '>=', 'total_amount')
            ->update(['status' => 'PAID']);

        DB::table('bills')
            ->where('status', 'RECEIVED')
            ->where('paid_amount', '>', 0)
            ->whereColumn('paid_amount', '<', 'total_amount')
            ->update(['status' => 'PARTIALLY_PAID']);

        DB::table('bills')
            ->where('status', 'RECEIVED')
            ->update(['status' => 'UNPAID']);
    }

    public function down(): void {
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('status', 50)->default('SENT')->change();
        });

        Schema::table('bills', function (Blueprint $table) {
            $table->string('status', 50)->default('RECEIVED')->change();
        });
    }
};
