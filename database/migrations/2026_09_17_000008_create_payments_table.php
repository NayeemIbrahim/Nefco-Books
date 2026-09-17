<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->string('payment_number')->unique();
            $table->enum('type', ['CUSTOMER_PAYMENT', 'VENDOR_PAYMENT']);
            $table->foreignId('contact_id')->constrained('contacts')->cascadeOnDelete();
            $table->foreignId('invoice_id')->nullable()->constrained('invoices')->nullOnDelete();
            $table->foreignId('bill_id')->nullable()->constrained('bills')->nullOnDelete();
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();

            $table->timestamp('payment_date')->useCurrent();
            $table->decimal('amount', 15, 2);
            $table->enum('payment_method', ['CASH', 'BANK_TRANSFER', 'CHEQUE', 'MOBILE_BANKING'])->default('CASH');
            $table->string('reference_number')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('payments');
    }
};
