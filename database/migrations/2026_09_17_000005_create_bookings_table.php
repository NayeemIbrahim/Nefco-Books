<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('booking_number')->unique();
            $table->foreignId('contact_id')->constrained('contacts')->cascadeOnDelete();
            $table->timestamp('booking_date')->useCurrent();
            $table->timestamp('service_date')->nullable();
            $table->enum('status', ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'])->default('PENDING');
            $table->text('notes')->nullable();
            $table->decimal('total_amount', 15, 2)->default(0.00);
            $table->timestamps();
        });

        Schema::create('booking_line_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained('bookings')->cascadeOnDelete();
            $table->foreignId('item_id')->nullable()->constrained('items')->nullOnDelete();
            $table->string('description');
            $table->decimal('quantity', 15, 2)->default(1.00);
            $table->decimal('unit_price', 15, 2)->default(0.00);
            $table->decimal('amount', 15, 2)->default(0.00);
        });
    }

    public function down(): void {
        Schema::dropIfExists('booking_line_items');
        Schema::dropIfExists('bookings');
    }
};
