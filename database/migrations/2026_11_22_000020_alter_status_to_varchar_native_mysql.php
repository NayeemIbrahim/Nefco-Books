<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE `bookings` MODIFY COLUMN `status` VARCHAR(50) NOT NULL DEFAULT 'QUOTE'");
            DB::statement("ALTER TABLE `invoices` MODIFY COLUMN `status` VARCHAR(50) NOT NULL DEFAULT 'UNPAID'");
            DB::statement("ALTER TABLE `bills` MODIFY COLUMN `status` VARCHAR(50) NOT NULL DEFAULT 'UNPAID'");
        } else {
            Schema::table('bookings', function (Blueprint $table) {
                $table->string('status', 50)->default('QUOTE')->change();
            });
            Schema::table('invoices', function (Blueprint $table) {
                $table->string('status', 50)->default('UNPAID')->change();
            });
            Schema::table('bills', function (Blueprint $table) {
                $table->string('status', 50)->default('UNPAID')->change();
            });
        }
    }

    public function down(): void
    {
        $driver = DB::connection()->getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE `bookings` MODIFY COLUMN `status` ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING'");
        } else {
            Schema::table('bookings', function (Blueprint $table) {
                $table->string('status', 50)->default('PENDING')->change();
            });
        }
    }
};
