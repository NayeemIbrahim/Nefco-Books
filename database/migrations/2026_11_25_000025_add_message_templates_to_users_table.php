<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (! Schema::hasColumn('users', 'whatsapp_bill_template')) {
                    $table->text('whatsapp_bill_template')->nullable();
                }
                if (! Schema::hasColumn('users', 'whatsapp_receipt_template')) {
                    $table->text('whatsapp_receipt_template')->nullable();
                }
                if (! Schema::hasColumn('users', 'whatsapp_payment_made_template')) {
                    $table->text('whatsapp_payment_made_template')->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                $cols = [];
                foreach (['whatsapp_bill_template', 'whatsapp_receipt_template', 'whatsapp_payment_made_template'] as $col) {
                    if (Schema::hasColumn('users', $col)) {
                        $cols[] = $col;
                    }
                }
                if (! empty($cols)) {
                    $table->dropColumn($cols);
                }
            });
        }
    }
};
