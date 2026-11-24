<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Category;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Class SettingsController
 *
 * Manages organization setup, profile credentials, Chart of Accounts,
 * Category definitions (Item & Expense), and opt-in stock tracking settings.
 */
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
                Account::syncAllBalances();
                $accounts = Account::orderBy('code')->get();
            }
        } catch (\Throwable $e) {
            $accounts = collect();
        }

        $itemCategories = collect();
        $expenseCategories = collect();
        try {
            if (Schema::hasTable('categories')) {
                $itemCategories = Category::where('type', 'ITEM')->orderBy('name')->get();
                $expenseCategories = Category::where('type', 'EXPENSE')->orderBy('name')->get();
            }
        } catch (\Throwable $e) {
            $itemCategories = collect();
            $expenseCategories = collect();
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
                'enable_stock'           => (bool)($user->enable_stock ?? false),
                'company_logo'           => $user->company_logo ?? '',
                'company_icon'           => $user->company_icon ?? '',
                'whatsapp_template'      => $user->whatsapp_template ?? '',
                'whatsapp_phone_number_id'=> $user->whatsapp_phone_number_id ?? '',
                'whatsapp_access_token'  => $user->whatsapp_access_token ?? '',
            ],
            'users'              => $users,
            'accounts'           => $accounts,
            'item_categories'    => $itemCategories,
            'expense_categories' => $expenseCategories,
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
            'enable_stock'           => 'nullable|boolean',
            'company_logo'           => 'nullable|string|max:500',
            'company_icon'           => 'nullable|string|max:500',
            'logo'                   => 'nullable|file|mimes:jpeg,png,jpg,gif,svg,webp,ico|max:5120',
            'icon'                   => 'nullable|file|mimes:jpeg,png,jpg,gif,svg,webp,ico|max:2048',
            'whatsapp_template'      => 'nullable|string|max:5000',
            'whatsapp_phone_number_id'=> 'nullable|string',
            'whatsapp_access_token'  => 'nullable|string',
        ]);

        if ($request->has('enable_stock')) {
            $validated['enable_stock'] = $request->boolean('enable_stock');
        }

        try {
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

                $existingColumns = Schema::getColumnListing('users');
                $dataToUpdate = array_filter(
                    $validated,
                    fn ($key) => in_array($key, $existingColumns),
                    ARRAY_FILTER_USE_KEY
                );

                // Handle Logo Upload
                if ($request->hasFile('logo')) {
                    $logoFile = $request->file('logo');
                    $logoName = 'logo_' . time() . '.' . $logoFile->getClientOriginalExtension();
                    $uploadDir = public_path('uploads');
                    if (! file_exists($uploadDir)) {
                        mkdir($uploadDir, 0755, true);
                    }
                    $logoFile->move($uploadDir, $logoName);
                    $dataToUpdate['company_logo'] = '/uploads/' . $logoName;
                }

                // Handle Icon / Favicon Upload
                if ($request->hasFile('icon')) {
                    $iconFile = $request->file('icon');
                    $iconName = 'icon_' . time() . '.' . $iconFile->getClientOriginalExtension();
                    $uploadDir = public_path('uploads');
                    if (! file_exists($uploadDir)) {
                        mkdir($uploadDir, 0755, true);
                    }
                    $iconFile->move($uploadDir, $iconName);
                    $dataToUpdate['company_icon'] = '/uploads/' . $iconName;
                }

                if ($request->has('whatsapp_template')) {
                    $dataToUpdate['whatsapp_template'] = $request->input('whatsapp_template');
                }

                if (! empty($dataToUpdate)) {
                    $user = $this->resolveUser();
                    if ($user) {
                        $user->update($dataToUpdate);
                    } else {
                        User::query()->update($dataToUpdate);
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Settings updateCompany error: ' . $e->getMessage());
        }

        return back()->with('success', 'Organization and business settings saved!');
    }

    public function toggleStock(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'enable_stock' => 'required|boolean',
        ]);

        try {
            if (Schema::hasTable('users')) {
                if (! Schema::hasColumn('users', 'enable_stock')) {
                    Schema::table('users', function (\Illuminate\Database\Schema\Blueprint $table) {
                        $table->boolean('enable_stock')->default(false);
                    });
                }

                $enableVal = (bool)$validated['enable_stock'];
                $user = $this->resolveUser();
                if ($user) {
                    $user->update(['enable_stock' => $enableVal]);
                } else {
                    User::query()->update(['enable_stock' => $enableVal]);
                }

                $state = $enableVal ? 'ENABLED' : 'DISABLED';
                return back()->with('success', "Stock Tracking {$state} successfully! Items table updated.");
            }
        } catch (\Throwable $e) {
            Log::error('Settings toggleStock error: ' . $e->getMessage());
            return back()->with('error', 'Could not update stock preference: ' . $e->getMessage());
        }

        return back()->with('success', 'Stock preference updated.');
    }

    public function storeAccount(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code'        => 'required|string|max:20|unique:accounts,code',
            'name'        => 'required|string|max:255',
            'type'        => 'required|in:ASSET,LIABILITY,EQUITY,REVENUE,EXPENSE',
            'sub_type'    => 'nullable|string',
            'balance'     => 'nullable|numeric',
            'description' => 'nullable|string',
        ]);

        $defaultSubTypes = [
            'ASSET'     => 'OTHER_CURRENT_ASSET',
            'LIABILITY' => 'OTHER_CURRENT_LIABILITY',
            'EQUITY'    => 'EQUITY',
            'REVENUE'   => 'OPERATING_REVENUE',
            'EXPENSE'   => 'OPERATING_EXPENSE',
        ];

        $subType = ! empty($validated['sub_type']) ? $validated['sub_type'] : ($defaultSubTypes[$validated['type']] ?? 'OTHER_CURRENT_ASSET');

        Account::create([
            'code'        => $validated['code'],
            'name'        => $validated['name'],
            'type'        => $validated['type'],
            'sub_type'    => $subType,
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
            'sub_type'    => 'nullable|string',
            'balance'     => 'nullable|numeric',
            'description' => 'nullable|string',
        ]);

        $account->update([
            'name'        => $validated['name'],
            'type'        => $validated['type'],
            'sub_type'    => ! empty($validated['sub_type']) ? $validated['sub_type'] : $account->sub_type,
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

    public function storeCategory(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:100',
            'type'        => 'required|in:ITEM,EXPENSE',
            'description' => 'nullable|string|max:255',
        ]);

        try {
            if (Schema::hasTable('categories') && ! Schema::hasColumn('categories', 'type')) {
                Schema::table('categories', function (\Illuminate\Database\Schema\Blueprint $table) {
                    $table->string('type', 50)->default('ITEM')->after('name');
                });
            }

            $category = Category::create($validated);

            $typeLabel = $validated['type'] === 'EXPENSE' ? 'Expense' : 'Item';
            return back()->with('success', "{$typeLabel} Category '{$category->name}' created successfully!");
        } catch (\Throwable $e) {
            Log::error('Settings storeCategory error: ' . $e->getMessage());
            return back()->with('error', 'Failed to create category: ' . $e->getMessage());
        }
    }

    public function updateCategory(Request $request, Category $category): RedirectResponse
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
        ]);

        try {
            $category->update($validated);
            return back()->with('success', "Category '{$category->name}' updated successfully!");
        } catch (\Throwable $e) {
            Log::error('Settings updateCategory error: ' . $e->getMessage());
            return back()->with('error', 'Failed to update category: ' . $e->getMessage());
        }
    }

    public function destroyCategory(Category $category): RedirectResponse
    {
        try {
            $name = $category->name;
            $typeLabel = $category->type === 'EXPENSE' ? 'Expense' : 'Item';

            // Detach items if item category
            if ($category->type === 'ITEM' && Schema::hasTable('items') && Schema::hasColumn('items', 'category_id')) {
                \App\Models\Item::where('category_id', $category->id)->update(['category_id' => null]);
            }

            $category->delete();

            return back()->with('success', "{$typeLabel} Category '{$name}' deleted successfully!");
        } catch (\Throwable $e) {
            Log::error('Settings destroyCategory error: ' . $e->getMessage());
            return back()->with('error', 'Failed to delete category: ' . $e->getMessage());
        }
    }
}
