<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\Category;
use App\Models\Account;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ItemController extends Controller
{
    public static function generateSku(string $name): string
    {
        $clean = preg_replace('/[^a-zA-Z]/', '', $name);
        $prefix = strtolower(substr($clean, 0, 3));
        if (strlen($prefix) < 3) {
            $prefix = str_pad($prefix, 3, 'x');
        }

        // Find all existing SKUs matching prefix
        $existing = Item::where('sku', 'like', "{$prefix}-%")->pluck('sku')->toArray();
        $maxNum = 0;
        foreach ($existing as $sku) {
            if (preg_match('/' . preg_quote($prefix, '/') . '-(\d+)/i', $sku, $matches)) {
                $num = (int)$matches[1];
                if ($num > $maxNum) {
                    $maxNum = $num;
                }
            }
        }

        $nextNum = str_pad((string)($maxNum + 1), 3, '0', STR_PAD_LEFT);
        return "{$prefix}-{$nextNum}";
    }

    public function index(): Response
    {
        $items = Item::with(['category', 'salesAccount'])->latest()->paginate(25);
        $categories = Category::all();
        $salesAccounts = Account::where('type', 'REVENUE')->get();
        $defaultUom = User::whereNotNull('default_uom')->value('default_uom') ?? 'Pcs';

        return Inertia::render('Items/Index', [
            'items'         => $items,
            'categories'    => $categories,
            'salesAccounts' => $salesAccounts,
            'defaultUom'    => $defaultUom,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:150',
            'sku'            => 'nullable|string|unique:items,sku',
            'type'           => 'required|in:GOODS,SERVICE',
            'sales_price'    => 'required|numeric|min:0',
            'purchase_price' => 'nullable|numeric|min:0',
            'unit'           => 'nullable|string|max:20',
            'stock_quantity' => 'nullable|numeric|min:0',
        ]);

        if (empty($validated['sku'])) {
            $validated['sku'] = self::generateSku($validated['name']);
        }

        if (empty($validated['unit'])) {
            $validated['unit'] = User::whereNotNull('default_uom')->value('default_uom') ?? 'Pcs';
        }

        Item::create($validated);

        return back()->with('success', "Item {$validated['name']} created with SKU: {$validated['sku']}");
    }

    public function update(Request $request, Item $item): RedirectResponse
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:150',
            'type'           => 'required|in:GOODS,SERVICE',
            'sales_price'    => 'required|numeric|min:0',
            'purchase_price' => 'nullable|numeric|min:0',
            'unit'           => 'required|string|max:20',
            'stock_quantity' => 'nullable|numeric|min:0',
        ]);

        $item->update($validated);

        return back()->with('success', "Item {$item->name} updated successfully.");
    }
}
