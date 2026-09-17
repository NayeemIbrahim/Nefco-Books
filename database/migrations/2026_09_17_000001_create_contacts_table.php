<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('contacts', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('company_name')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('whatsapp_number');
            $table->enum('type', ['CUSTOMER', 'VENDOR', 'BOTH'])->default('CUSTOMER');
            $table->string('address')->nullable();
            $table->string('city')->default('Dhaka');
            $table->string('country')->default('Bangladesh');
            $table->string('tax_number')->nullable();
            $table->decimal('opening_balance', 15, 2)->default(0.00);
            $table->decimal('current_balance', 15, 2)->default(0.00);
            $table->timestamps();

            $table->index('type');
        });
    }

    public function down(): void {
        Schema::dropIfExists('contacts');
    }
};
