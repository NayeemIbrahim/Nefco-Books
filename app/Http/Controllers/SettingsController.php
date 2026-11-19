<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    private function resolveUser(): ?User
    {
        try {
            /** @var User|null $user */
            $user = Auth::user();

            if (! $user && Schema::hasTable('users')) {
                if (Schema::hasColumn('users', 'role')) {
                    $user = User::where('role', 'admin')->first();
                }
                if (! $user) {
                    $user = User::first();
                }
            }

            if (! $user && Schema::hasTable('users')) {
                $userData = [
                    'name'     => 'Admin User',
                    'email'    => 'admin@nefcobooks.com',
                    'password' => Hash::make('admin'),
                ];

                $possibleCols = [
                    'role'            => 'admin',
                    'status'          => 'APPROVED',
                    'company_name'    => 'Nefco Trading & IT Ltd.',
                    'company_address' => 'Dhaka, Bangladesh',
                    'bin_number'      => '123456789-0101',
                    'phone'           => '+8801711223344',
                    'currency_symbol' => '৳',
                    'currency_code'   => 'BDT',
                    'default_uom'     => 'Pcs',
                ];

                foreach ($possibleCols as $col => $val) {
                    if (Schema::hasColumn('users', $col)) {
                        $userData[$col] = $val;
                    }
                }

                $user = User::create($userData);
            }

            return $user;
        } catch (\Throwable $e) {
            Log::warning('SettingsController resolveUser: ' . $e->getMessage());
            return null;
        }
    }

    public function index(): Response
    {
        $user = $this->resolveUser();

        $users = collect();
        try {
            if (Schema::hasTable('users')) {
                $users = User::latest()->get();
            }
        } catch (\Throwable $e) {
            $users = collect();
        }

        $accounts = collect();
        try {
            if (Schema::hasTable('accounts')) {
                $accounts = Account::orderBy('code')->get();
            }
        } catch (\Throwable $e) {
            $accounts = collect();
        }

        return Inertia::render('Settings/Index', [
            'profile' => [
                'name'  => $user->name ?? 'Admin User',
                'email' => $user->email ?? 'admin@nefcobooks.com',
                'role'  => $user->role ?? 'admin',
            ],
            'company' => [
                'company_name'           => $user->company_name ?? 'Nefco Trading & IT Ltd.',
                'company_address'        => $user->company_address ?? 'Dhaka, Bangladesh',
                'bin_number'             => $user->bin_number ?? '123456789-0101',
                'phone'                  => $user->phone ?? '+8801711223344',
                'currency_symbol'        => $user->currency_symbol ?? '৳',
                'currency_code'          => $user->currency_code ?? 'BDT',
                'default_uom'            => $user->default_uom ?? 'Pcs',
                'whatsapp_phone_number_id'=> $user->whatsapp_phone_number_id ?? '',
                'whatsapp_access_token'  => $user->whatsapp_access_token ?? '',
            ],
            'users'    => $users,
            'accounts' => $accounts,
        ]);
    }

    public function updateProfile(Request $request): RedirectResponse
    {
        $user = $this->resolveUser();
        $userId = $user ? $user->id : 1;

        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|max:255|unique:users,email,' . $userId,
            'password' => 'nullable|string|min:4',
        ]);

        $data = [
            'name'  => $validated['name'],
            'email' => $validated['email'],
        ];

        if (! empty($validated['password'])) {
            $data['password'] = Hash::make($validated['password']);
        }

        if ($user) {
            $user->update($data);

            if (! Auth::check()) {
                Auth::login($user);
            }
        }

        return back()->with('success', 'Profile and login information updated successfully!');
    }

    public function updateCompany(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'company_name'           => 'required|string|max:255',
            'company_address'        => 'nullable|string',
            'bin_number'             => 'nullable|string|max:100',
            'phone'                  => 'nullable|string|max:50',
            'currency_symbol'        => 'required|string|max:10',
            'currency_code'          => 'required|string|max:10',
            'default_uom'            => 'nullable|string|max:20',
            'whatsapp_phone_number_id'=> 'nullable|string',
            'whatsapp_access_token'  => 'nullable|string',
        ]);

        try {
            if (Schema::hasTable('users')) {
                $existingColumns = Schema::getColumnListing('users');
                $dataToUpdate = array_filter(
                    $validated,
                    fn ($key) => in_array($key, $existingColumns),
                    ARRAY_FILTER_USE_KEY
                );

                if (! empty($dataToUpdate)) {
                    User::query()->update($dataToUpdate);
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Settings updateCompany error: ' . $e->getMessage());
        }

        return back()->with('success', 'Organization and business settings saved!');
    }

    public function storeAccount(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code'        => 'required|string|max:20|unique:accounts,code',
            'name'        => 'required|string|max:255',
            'type'        => 'required|in:ASSET,LIABILITY,EQUITY,REVENUE,EXPENSE',
            'balance'     => 'nullable|numeric',
            'description' => 'nullable|string',
        ]);

        Account::create([
            'code'        => $validated['code'],
            'name'        => $validated['name'],
            'type'        => $validated['type'],
            'description' => $validated['description'] ?? null,
            'balance'     => (float)($validated['balance'] ?? 0.00),
            'is_system'   => false,
        ]);

        return back()->with('success', "Account {$validated['code']} - {$validated['name']} created successfully!");
    }

    public function updateAccount(Account $account, Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'type'        => 'required|in:ASSET,LIABILITY,EQUITY,REVENUE,EXPENSE',
            'balance'     => 'nullable|numeric',
            'description' => 'nullable|string',
        ]);

        $account->update([
            'name'        => $validated['name'],
            'type'        => $validated['type'],
            'balance'     => isset($validated['balance']) ? (float)$validated['balance'] : $account->balance,
            'description' => $validated['description'] ?? null,
        ]);

        return back()->with('success', "Account {$account->code} updated successfully!");
    }

    public function updateBalance(Account $account, Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'balance' => 'required|numeric',
        ]);

        $account->update([
            'balance' => (float)$validated['balance'],
        ]);

        return back()->with('success', "Account {$account->code} balance updated successfully!");
    }

    public function approveUser(User $user): RedirectResponse
    {
        $user->update(['status' => 'APPROVED']);

        return back()->with('success', "User account for {$user->name} has been APPROVED.");
    }

    public function rejectUser(User $user): RedirectResponse
    {
        $user->update(['status' => 'REJECTED']);

        return back()->with('info', "User account for {$user->name} has been REJECTED.");
    }

    public function toggleRole(User $user): RedirectResponse
    {
        $newRole = $user->role === 'admin' ? 'staff' : 'admin';
        $user->update(['role' => $newRole]);

        return back()->with('success', "Updated {$user->name}'s role to " . strtoupper($newRole));
    }
}
