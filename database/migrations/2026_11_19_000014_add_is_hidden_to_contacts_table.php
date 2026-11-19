<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('contacts') && ! Schema::hasColumn('contacts', 'is_hidden')) {
            Schema::table('contacts', function (Blueprint $table) {
                $table->boolean('is_hidden')->default(false)->after('current_balance');
                $table->index('is_hidden');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('contacts') && Schema::hasColumn('contacts', 'is_hidden')) {
            Schema::table('contacts', function (Blueprint $table) {
                $table->dropColumn('is_hidden');
            });
        }
    }
};
