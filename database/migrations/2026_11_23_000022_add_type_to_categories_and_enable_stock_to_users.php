<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('categories') && !Schema::hasColumn('categories', 'type')) {
            Schema::table('categories', function (Blueprint $table) {
                $table->string('type')->default('ITEM')->after('name');
            });
        }

        if (Schema::hasTable('users') && !Schema::hasColumn('users', 'enable_stock')) {
            Schema::table('users', function (Blueprint $table) {
                $table->boolean('enable_stock')->default(false)->after('uom');
            });
        }

        // Populate initial categories if empty
        $existingItemCategories = DB::table('categories')->where('type', 'ITEM')->count();
        if ($existingItemCategories === 0) {
            DB::table('categories')->insert([
                ['name' => 'General Goods', 'type' => 'ITEM', 'description' => 'Default goods category', 'created_at' => now(), 'updated_at' => now()],
                ['name' => 'Services', 'type' => 'ITEM', 'description' => 'Services and consulting', 'created_at' => now(), 'updated_at' => now()],
                ['name' => 'Hardware', 'type' => 'ITEM', 'description' => 'Hardware & Equipment', 'created_at' => now(), 'updated_at' => now()],
                ['name' => 'Software', 'type' => 'ITEM', 'description' => 'Software & Subscriptions', 'created_at' => now(), 'updated_at' => now()],
            ]);
        }

        $existingExpenseCategories = DB::table('categories')->where('type', 'EXPENSE')->count();
        if ($existingExpenseCategories === 0) {
            $defaultExpenses = [
                'Office Rent',
                'Utilities (Electricity/Water/Gas)',
                'Internet & Telecom',
                'Salaries & Staff Wages',
                'Office Supplies & Stationery',
                'Repairs & Maintenance',
                'Advertising & Marketing',
                'Travel & Conveyance',
                'Professional & Legal Fees',
                'Bank Fees & Charges',
                'General / Miscellaneous',
            ];

            foreach ($defaultExpenses as $expenseCat) {
                DB::table('categories')->insert([
                    'name' => $expenseCat,
                    'type' => 'EXPENSE',
                    'description' => 'Standard expense category',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('categories') && Schema::hasColumn('categories', 'type')) {
            Schema::table('categories', function (Blueprint $table) {
                $table->dropColumn('type');
            });
        }

        if (Schema::hasTable('users') && Schema::hasColumn('users', 'enable_stock')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('enable_stock');
            });
        }
    }
};
