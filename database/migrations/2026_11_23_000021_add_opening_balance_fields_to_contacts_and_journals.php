<?php

use App\Models\Account;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            if (! Schema::hasColumn('contacts', 'opening_balance_type')) {
                $table->string('opening_balance_type', 20)->default('TO_RECEIVE')->nullable()->after('opening_balance');
            }
            if (! Schema::hasColumn('contacts', 'opening_balance_date')) {
                $table->date('opening_balance_date')->nullable()->after('opening_balance_type');
            }
        });

        Schema::table('journal_entries', function (Blueprint $table) {
            if (! Schema::hasColumn('journal_entries', 'contact_id')) {
                $table->foreignId('contact_id')->nullable()->after('created_by_id')->constrained('contacts')->nullOnDelete();
            }
        });

        // Ensure Opening Balance Equity account exists
        Account::firstOrCreate(
            ['code' => '3010'],
            [
                'name'      => 'Opening Balance Equity',
                'type'      => 'EQUITY',
                'sub_type'  => 'EQUITY',
                'is_system' => true,
                'balance'   => 0.00,
            ]
        );
    }

    public function down(): void
    {
        Schema::table('journal_entries', function (Blueprint $table) {
            if (Schema::hasColumn('journal_entries', 'contact_id')) {
                $table->dropForeign(['contact_id']);
                $table->dropColumn('contact_id');
            }
        });

        Schema::table('contacts', function (Blueprint $table) {
            if (Schema::hasColumn('contacts', 'opening_balance_date')) {
                $table->dropColumn('opening_balance_date');
            }
            if (Schema::hasColumn('contacts', 'opening_balance_type')) {
                $table->dropColumn('opening_balance_type');
            }
        });
    }
};
