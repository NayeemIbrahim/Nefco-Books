<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('accounts', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->enum('type', ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']);
            $table->enum('sub_type', [
                'CASH_AND_BANK', 'ACCOUNTS_RECEIVABLE', 'OTHER_CURRENT_ASSET', 'FIXED_ASSET',
                'ACCOUNTS_PAYABLE', 'OTHER_CURRENT_LIABILITY', 'LONG_TERM_LIABILITY', 'EQUITY',
                'OPERATING_REVENUE', 'OTHER_REVENUE', 'COST_OF_GOODS_SOLD', 'OPERATING_EXPENSE', 'OTHER_EXPENSE'
            ]);
            $table->text('description')->nullable();
            $table->boolean('is_system')->default(false);
            $table->decimal('balance', 15, 2)->default(0.00);
            $table->timestamps();

            $table->index('type');
        });
    }

    public function down(): void {
        Schema::dropIfExists('accounts');
    }
};
