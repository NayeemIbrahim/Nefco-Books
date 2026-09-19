<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            AccountSeeder::class,
        ]);

        // Seed default administrator user
        User::firstOrCreate(
            ['email' => 'admin@nefcobooks.com'],
            [
                'name'            => 'Admin User',
                'password'        => Hash::make('admin'),
                'role'            => 'admin',
                'status'          => 'APPROVED',
                'company_name'    => 'Nefco Trading & IT Ltd.',
                'company_address' => 'Dhaka, Bangladesh',
                'bin_number'      => '123456789-0101',
                'phone'           => '+8801711223344',
                'currency_symbol' => '৳',
                'currency_code'   => 'BDT',
            ]
        );
    }
}
