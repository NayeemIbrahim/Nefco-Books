<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('journal_entries', function (Blueprint $table) {
            $table->id();
            $table->string('entry_number')->unique();
            $table->timestamp('date')->useCurrent();
            $table->string('reference')->nullable();
            $table->text('description')->nullable();
            $table->enum('status', ['DRAFT', 'POSTED', 'VOID'])->default('POSTED');

            $table->string('source_document_type')->nullable(); // INVOICE, BILL, PAYMENT, MANUAL
            $table->unsignedBigInteger('source_document_id')->nullable();

            $table->foreignId('created_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('invoice_id')->nullable()->unique()->constrained('invoices')->nullOnDelete();
            $table->foreignId('bill_id')->nullable()->unique()->constrained('bills')->nullOnDelete();
            $table->foreignId('payment_id')->nullable()->unique()->constrained('payments')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('journal_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('journal_entry_id')->constrained('journal_entries')->cascadeOnDelete();
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->decimal('debit', 15, 2)->default(0.00);
            $table->decimal('credit', 15, 2)->default(0.00);
            $table->string('description')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void {
        Schema::dropIfExists('journal_lines');
        Schema::dropIfExists('journal_entries');
    }
};
