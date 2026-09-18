<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();

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
                'whatsapp_phone_number_id'=> $user->whatsapp_phone_number_id ?? '',
                'whatsapp_access_token'  => $user->whatsapp_access_token ?? '',
            ],
            'users' => User::latest()->get(),
        ]);
    }

    public function updateProfile(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = auth()->user();

        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|max:255|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:8|confirmed',
        ]);

        $data = [
            'name'  => $validated['name'],
            'email' => $validated['email'],
        ];

        if (! empty($validated['password'])) {
            $data['password'] = Hash::make($validated['password']);
        }

        $user->update($data);

        return back()->with('success', 'Profile updated successfully!');
    }

    public function updateCompany(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = auth()->user();

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

        // Update company fields on user / org setting
        User::query()->update($validated);

        return back()->with('success', 'Organization and currency settings saved!');
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
