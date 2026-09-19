<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    private function resolveUser(): User
    {
        /** @var User|null $user */
        $user = Auth::user();

        if (! $user) {
            $user = User::where('role', 'admin')->first() ?? User::first();
        }

        if (! $user) {
            $user = User::create([
                'name'            => 'Admin User',
                'email'           => 'admin@nefcobooks.com',
                'password'        => Hash::make('admin'),
                'role'            => 'admin',
                'status'          => 'APPROVED',
                'company_name'    => 'Nefco Trading & IT Ltd.',
                'company_address' => 'Dhaka, Bangladesh',
                'bin_number'      => '123456789-0101',
                'phone'           => '+8801711223344',
                'currency_symbol' => '৳',
                'currency_code'   => 'BDT',
            ]);
        }

        return $user;
    }

    public function index(): Response
    {
        $user = $this->resolveUser();

        return Inertia::render('Settings/Index', [
            'profile' => [
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role,
            ],
            'company' => [
                'company_name'           => $user->company_name ?? 'Nefco Trading & IT Ltd.',
                'company_address'        => $user->company_address ?? 'Dhaka, Bangladesh',
                'bin_number'             => $user->bin_number ?? '123456789-0101',
                'phone'                  => $user->phone ?? '+8801711223344',
                'currency_symbol'        => $user->currency_symbol ?? '৳',
                'currency_code'          => $user->currency_code ?? 'BDT',
                'whatsapp_phone_number_id'=> $user->whatsapp_phone_number_id ?? '',
                'whatsapp_access_token'  => $user->whatsapp_access_token ?? '',
            ],
            'users'    => User::latest()->get(),
            'accounts' => Account::orderBy('code')->get(),
        ]);
    }

    public function updateProfile(Request $request): RedirectResponse
    {
        $user = $this->resolveUser();

        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|max:255|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:4',
        ]);

        $data = [
            'name'  => $validated['name'],
            'email' => $validated['email'],
        ];

        if (! empty($validated['password'])) {
            $data['password'] = Hash::make($validated['password']);
        }

        $user->update($data);

        // If not logged in, auto log in as this user
        if (! Auth::check()) {
            Auth::login($user);
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
            'whatsapp_phone_number_id'=> 'nullable|string',
            'whatsapp_access_token'  => 'nullable|string',
        ]);

        User::query()->update($validated);

        return back()->with('success', 'Organization and business settings saved!');
    }

    public function storeAccount(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code'        => 'required|string|max:20|unique:accounts,code',
            'name'        => 'required|string|max:255',
            'type'        => 'required|in:ASSET,LIABILITY,EQUITY,REVENUE,EXPENSE',
            'description' => 'nullable|string',
        ]);

        Account::create([
            'code'        => $validated['code'],
            'name'        => $validated['name'],
            'type'        => $validated['type'],
            'description' => $validated['description'] ?? null,
            'balance'     => 0.00,
            'is_system'   => false,
        ]);

        return back()->with('success', "Account {$validated['code']} - {$validated['name']} created successfully!");
    }

    public function updateAccount(Account $account, Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'type'        => 'required|in:ASSET,LIABILITY,EQUITY,REVENUE,EXPENSE',
            'description' => 'nullable|string',
        ]);

        $account->update($validated);

        return back()->with('success', "Account {$account->code} updated successfully!");
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
