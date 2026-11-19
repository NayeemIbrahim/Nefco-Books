<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            if (! Schema::hasColumn('invoices', 'shipping_charges')) {
                $table->decimal('shipping_charges', 15, 2)->default(0.00)->after('discount_amount');
            }
            if (! Schema::hasColumn('invoices', 'adjustment')) {
                $table->decimal('adjustment', 15, 2)->default(0.00)->after('shipping_charges');
            }
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            if (Schema::hasColumn('invoices', 'shipping_charges')) {
                $table->dropColumn('shipping_charges');
            }
            if (Schema::hasColumn('invoices', 'adjustment')) {
                $table->dropColumn('adjustment');
            }
        });
    }
};
