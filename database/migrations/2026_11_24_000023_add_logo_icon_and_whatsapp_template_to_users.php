<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (! Schema::hasColumn('users', 'company_logo')) {
                    $table->string('company_logo', 500)->nullable()->after('company_address');
                }
                if (! Schema::hasColumn('users', 'company_icon')) {
                    $table->string('company_icon', 500)->nullable()->after('company_logo');
                }
                if (! Schema::hasColumn('users', 'whatsapp_template')) {
                    $table->text('whatsapp_template')->nullable()->after('company_icon');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (Schema::hasColumn('users', 'company_logo')) {
                    $table->dropColumn('company_logo');
                }
                if (Schema::hasColumn('users', 'company_icon')) {
                    $table->dropColumn('company_icon');
                }
                if (Schema::hasColumn('users', 'whatsapp_template')) {
                    $table->dropColumn('whatsapp_template');
                }
            });
        }
    }
};
