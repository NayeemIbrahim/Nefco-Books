<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class RegisterController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $isFirstUser = User::count() === 0;

        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role'     => $isFirstUser ? 'admin' : 'staff',
            'status'   => $isFirstUser ? 'APPROVED' : 'PENDING',
        ]);

        if ($isFirstUser) {
            auth()->login($user);
            return redirect('/')->with('success', 'Welcome! You have been configured as System Administrator.');
        }

        return redirect('/login')->with(
            'success',
            'Registration successful! Your account has been submitted for Admin approval. You can log in once approved.'
        );
    }
}
