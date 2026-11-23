<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Native MySQL schema healing: Ensure ENUM columns are converted to VARCHAR(50)
        try {
            $conn = \Illuminate\Support\Facades\DB::connection();
            if ($conn->getDriverName() === 'mysql') {
                $conn->statement("ALTER TABLE `bookings` MODIFY COLUMN `status` VARCHAR(50) NOT NULL DEFAULT 'QUOTE'");
                $conn->statement("ALTER TABLE `invoices` MODIFY COLUMN `status` VARCHAR(50) NOT NULL DEFAULT 'UNPAID'");
                $conn->statement("ALTER TABLE `bills` MODIFY COLUMN `status` VARCHAR(50) NOT NULL DEFAULT 'UNPAID'");
            }
        } catch (\Throwable $e) {
            // Ignore if tables do not exist yet or already updated
        }

        // Self-healing database: auto-run pending migrations if newer schema columns are missing
        try {
            if (! Cache::has('db_schema_v9_migrated')) {
                // Auto-run migrations on server to apply nullable whatsapp_number and invoice/expenses additions
                Artisan::call('migrate', ['--force' => true]);

                // Ensure Opening Balance Equity account exists
                \App\Models\Account::firstOrCreate(
                    ['code' => '3010'],
                    [
                        'name'      => 'Opening Balance Equity',
                        'type'      => 'EQUITY',
                        'sub_type'  => 'EQUITY',
                        'is_system' => true,
                        'balance'   => 0.00,
                    ]
                );

                // Ensure default admin user exists if users table is empty
                if (Schema::hasTable('users') && User::count() === 0) {
                    $adminData = [
                        'name'     => 'Admin User',
                        'email'    => 'admin@nefcobooks.com',
                        'password' => Hash::make('admin'),
                    ];
                    if (Schema::hasColumn('users', 'role')) {
                        $adminData['role'] = 'admin';
                    }
                    if (Schema::hasColumn('users', 'status')) {
                        $adminData['status'] = 'APPROVED';
                    }
                    if (Schema::hasColumn('users', 'company_name')) {
                        $adminData['company_name'] = 'Nefco Trading & IT Ltd.';
                    }
                    if (Schema::hasColumn('users', 'currency_symbol')) {
                        $adminData['currency_symbol'] = '৳';
                    }
                    if (Schema::hasColumn('users', 'currency_code')) {
                        $adminData['currency_code'] = 'BDT';
                    }
                    if (Schema::hasColumn('users', 'default_uom')) {
                        $adminData['default_uom'] = 'Pcs';
                    }
                    User::create($adminData);
                }

                // Ensure any bills or invoices marked as PAID have paid_amount = total_amount
                if (Schema::hasTable('bills') && Schema::hasColumn('bills', 'paid_amount')) {
                    \Illuminate\Support\Facades\DB::table('bills')
                        ->where('status', 'PAID')
                        ->where(function ($q) {
                            $q->whereColumn('paid_amount', '<', 'total_amount')
                              ->orWhereNull('paid_amount');
                        })
                        ->update(['paid_amount' => \Illuminate\Support\Facades\DB::raw('total_amount')]);
                }

                if (Schema::hasTable('invoices') && Schema::hasColumn('invoices', 'paid_amount')) {
                    \Illuminate\Support\Facades\DB::table('invoices')
                        ->where('status', 'PAID')
                        ->where(function ($q) {
                            $q->whereColumn('paid_amount', '<', 'total_amount')
                              ->orWhereNull('paid_amount');
                        })
                        ->update(['paid_amount' => \Illuminate\Support\Facades\DB::raw('total_amount')]);
                }

                Cache::put('db_schema_v9_migrated', true, now()->addDays(3));
            }
        } catch (\Throwable $e) {
            Log::warning('Automatic migration / database setup notice: ' . $e->getMessage());
        }
    }
}

