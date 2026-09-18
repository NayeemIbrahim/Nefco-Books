<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('staff')->after('password');
            $table->string('status')->default('PENDING')->after('role'); // APPROVED, PENDING, REJECTED
            $table->string('company_name')->nullable()->after('status');
            $table->text('company_address')->nullable()->after('company_name');
            $table->string('bin_number')->nullable()->after('company_address');
            $table->string('phone')->nullable()->after('bin_number');
            $table->string('currency_symbol')->default('৳')->after('phone');
            $table->string('currency_code')->default('BDT')->after('currency_symbol');
            $table->string('whatsapp_phone_number_id')->nullable()->after('currency_code');
            $table->text('whatsapp_access_token')->nullable()->after('whatsapp_phone_number_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'role',
                'status',
                'company_name',
                'company_address',
                'bin_number',
                'phone',
                'currency_symbol',
                'currency_code',
                'whatsapp_phone_number_id',
                'whatsapp_access_token',
            ]);
        });
    }
};
