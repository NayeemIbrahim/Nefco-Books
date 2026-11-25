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

        // Direct Native Schema Healing for categories, users, and items (zero Artisan dependency)
        try {
            if (Schema::hasTable('categories') && !Schema::hasColumn('categories', 'type')) {
                Schema::table('categories', function (\Illuminate\Database\Schema\Blueprint $table) {
                    $table->string('type', 50)->default('ITEM')->after('name');
                });
            }

            if (Schema::hasTable('users')) {
                if (! Schema::hasColumn('users', 'enable_stock')) {
                    Schema::table('users', function (\Illuminate\Database\Schema\Blueprint $table) {
                        $table->boolean('enable_stock')->default(false);
                    });
                }
                if (! Schema::hasColumn('users', 'company_logo')) {
                    Schema::table('users', function (\Illuminate\Database\Schema\Blueprint $table) {
                        $table->string('company_logo', 500)->nullable();
                    });
                }
                if (! Schema::hasColumn('users', 'company_icon')) {
                    Schema::table('users', function (\Illuminate\Database\Schema\Blueprint $table) {
                        $table->string('company_icon', 500)->nullable();
                    });
                }
                if (! Schema::hasColumn('users', 'whatsapp_template')) {
                    Schema::table('users', function (\Illuminate\Database\Schema\Blueprint $table) {
                        $table->text('whatsapp_template')->nullable();
                    });
                }
            }

            if (Schema::hasTable('items') && !Schema::hasColumn('items', 'category_id')) {
                Schema::table('items', function (\Illuminate\Database\Schema\Blueprint $table) {
                    $table->unsignedBigInteger('category_id')->nullable()->after('name');
                });
            }

            if (Schema::hasTable('payments') && !Schema::hasTable('payment_allocations')) {
                Schema::create('payment_allocations', function (\Illuminate\Database\Schema\Blueprint $table) {
                    $table->id();
                    $table->foreignId('payment_id')->constrained('payments')->cascadeOnDelete();
                    $table->foreignId('invoice_id')->constrained('invoices')->cascadeOnDelete();
                    $table->decimal('amount', 15, 2);
                    $table->timestamps();
                    $table->unique(['payment_id', 'invoice_id']);
                });
            }
        } catch (\Throwable $e) {
            Log::warning('Native schema auto-healing notice: ' . $e->getMessage());
        }

        // Self-healing database: auto-run pending migrations if newer schema columns are missing
        try {
            if (! Cache::has('db_schema_v12_migrated')) {
                // Auto-run migrations on server to apply any pending schema changes
                Artisan::call('migrate', ['--force' => true]);

                // Ensure default expense categories exist
                if (Schema::hasTable('categories') && Schema::hasColumn('categories', 'type')) {
                    $hasExpenseCats = \Illuminate\Support\Facades\DB::table('categories')->where('type', 'EXPENSE')->exists();
                    if (! $hasExpenseCats) {
                        $defaultExpenses = [
                            'Office Rent',
                            'Utilities (Electricity/Water/Gas)',
                            'Internet & Telecom',
                            'Salaries & Staff Wages',
                            'Office Supplies & Stationery',
                            'Repairs & Maintenance',
                            'Advertising & Marketing',
                            'Travel & Conveyance',
                            'Professional & Legal Fees',
                            'Bank Fees & Charges',
                            'General & Miscellaneous',
                        ];
                        foreach ($defaultExpenses as $name) {
                            \Illuminate\Support\Facades\DB::table('categories')->insert([
                                'name'        => $name,
                                'type'        => 'EXPENSE',
                                'description' => $name,
                                'created_at'  => now(),
                                'updated_at'  => now(),
                            ]);
                        }
                    }
                }

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
                    if (Schema::hasColumn('users', 'enable_stock')) {
                        $adminData['enable_stock'] = false;
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

                Cache::put('db_schema_v12_migrated', true, now()->addDays(3));
            }
        } catch (\Throwable $e) {
            Log::warning('Automatic migration / database setup notice: ' . $e->getMessage());
        }
    }
}

