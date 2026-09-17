<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('bills', function (Blueprint $table) {
            $table->id();
            $table->string('bill_number')->unique();
            $table->foreignId('contact_id')->constrained('contacts')->cascadeOnDelete();
            $table->timestamp('issue_date')->useCurrent();
            $table->timestamp('due_date');
            $table->enum('status', ['DRAFT', 'RECEIVED', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED'])->default('DRAFT');

            $table->decimal('subtotal', 15, 2)->default(0.00);
            $table->decimal('tax_amount', 15, 2)->default(0.00);
            $table->decimal('total_amount', 15, 2)->default(0.00);
            $table->decimal('paid_amount', 15, 2)->default(0.00);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('bill_line_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bill_id')->constrained('bills')->cascadeOnDelete();
            $table->foreignId('item_id')->nullable()->constrained('items')->nullOnDelete();
            $table->string('description');
            $table->decimal('quantity', 15, 2)->default(1.00);
            $table->decimal('unit_price', 15, 2)->default(0.00);
            $table->decimal('amount', 15, 2)->default(0.00);
        });
    }

    public function down(): void {
        Schema::dropIfExists('bill_line_items');
        Schema::dropIfExists('bills');
    }
};
