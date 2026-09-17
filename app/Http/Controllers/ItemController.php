<?php

namespace App\Http\Controllers;

use App\Models\Item;
use App\Models\Category;
use App\Models\Account;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ItemController extends Controller
{
    public function index(): Response
    {
        $items = Item::with(['category', 'salesAccount'])->latest()->paginate(15);
        $categories = Category::all();
        $salesAccounts = Account::where('type', 'REVENUE')->get();

        return Inertia::render('Items/Index', [
            'items'         => $items,
            'categories'    => $categories,
            'salesAccounts' => $salesAccounts,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:150',
            'sku'            => 'nullable|string|unique:items,sku',
            'type'           => 'required|in:GOODS,SERVICE',
            'sales_price'    => 'required|numeric|min:0',
            'purchase_price' => 'nullable|numeric|min:0',
            'unit'           => 'required|string|max:20',
            'stock_quantity' => 'nullable|numeric|min:0',
        ]);

        Item::create($validated);

        return back()->with('success', 'Item created successfully.');
    }
}
