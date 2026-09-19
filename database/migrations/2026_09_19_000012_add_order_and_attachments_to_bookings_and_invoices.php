<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->string('order_number')->nullable()->after('booking_number');
            $table->string('invoice_number')->nullable()->after('order_number');
            $table->json('attachments')->nullable()->after('notes');
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->string('order_number')->nullable()->after('invoice_number');
            $table->json('attachments')->nullable()->after('terms');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['order_number', 'invoice_number', 'attachments']);
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['order_number', 'attachments']);
        });
    }
};
