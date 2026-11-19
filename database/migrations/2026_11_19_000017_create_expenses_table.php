<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (! Schema::hasTable('expenses')) {
            Schema::create('expenses', function (Blueprint $table) {
                $table->id();
                $table->string('expense_number')->unique();
                $table->date('expense_date');
                $table->foreignId('expense_account_id')->constrained('accounts')->cascadeOnDelete();
                $table->foreignId('paid_through_account_id')->constrained('accounts')->cascadeOnDelete();
                $table->decimal('amount', 15, 2);
                $table->foreignId('contact_id')->nullable()->constrained('contacts')->nullOnDelete();
                $table->string('category')->nullable();
                $table->string('reference_number')->nullable();
                $table->text('notes')->nullable();
                $table->json('attachments')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
