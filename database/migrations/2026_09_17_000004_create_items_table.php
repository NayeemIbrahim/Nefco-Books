<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('sku')->unique()->nullable();
            $table->enum('type', ['GOODS', 'SERVICE'])->default('SERVICE');
            $table->text('description')->nullable();
            $table->decimal('sales_price', 15, 2)->default(0.00);
            $table->decimal('purchase_price', 15, 2)->default(0.00);
            $table->string('unit')->default('Pcs');
            $table->decimal('stock_quantity', 15, 2)->default(0.00);

            $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->foreignId('sales_account_id')->nullable()->constrained('accounts')->nullOnDelete();
            $table->foreignId('purchase_account_id')->nullable()->constrained('accounts')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('items');
    }
};
