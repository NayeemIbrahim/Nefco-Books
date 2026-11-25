<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Category;
use App\Models\Contact;
use App\Models\Invoice;
use App\Models\Item;
use App\Models\Payment;
use App\Models\User;
use App\Services\AccountingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Class ItemController
 *
 * Manages Products, Services, Inventory, and Quick Counter Sales
 * for Nefco Books. Supports opt-in stock tracking and walk-in sales.
 */
class ItemController extends Controller
{
    /**
     * Generate an automated, non-conflicting SKU code based on item name.
     * Example: "Dell Monitor" -> "del-001"
     */
    public static function generateSku(string $name): string
    {
        $clean = preg_replace('/[^a-zA-Z]/', '', $name);
        $prefix = strtolower(substr($clean, 0, 3));
        if (strlen($prefix) < 3) {
            $prefix = str_pad($prefix, 3, 'x');
        }

        // Find existing SKU prefix to increment sequence
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

    /**
     * Display the Items & Inventory Catalog listing page.
     */
    public function index(Request $request): Response
    {
        $query = Item::with(['category', 'salesAccount']);

        // Search by name or SKU
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('items.name', 'like', "%{$search}%")
                  ->orWhere('items.sku', 'like', "%{$search}%");
            });
        }

        // Category filter (including uncategorized)
        if ($categoryId = $request->input('category_id')) {
            if ($categoryId === 'UNCATEGORIZED') {
                $query->whereNull('items.category_id');
            } elseif ($categoryId !== 'ALL') {
                $query->where('items.category_id', $categoryId);
            }
        }

        // Sorting options
        $sort = $request->input('sort', 'latest');
        if ($sort === 'category') {
            $query->leftJoin('categories', 'items.category_id', '=', 'categories.id')
                  ->orderBy('categories.name', 'asc')
                  ->select('items.*');
        } elseif ($sort === 'name') {
            $query->orderBy('items.name', 'asc');
        } elseif ($sort === 'price_asc') {
            $query->orderBy('items.sales_price', 'asc');
        } elseif ($sort === 'price_desc') {
            $query->orderBy('items.sales_price', 'desc');
        } else {
            $query->orderBy('items.id', 'desc');
        }

        try {
            $items = $query->paginate(15)->withQueryString();
        } catch (\Throwable $e) {
            $items = Item::latest()->paginate(15);
        }

        // Available item categories
        $categories = collect();
        try {
            if (Schema::hasTable('categories')) {
                $categories = Category::where('type', 'ITEM')->orderBy('name')->get()->values();
            }
        } catch (\Throwable $e) {
            $categories = collect();
        }

        // Active customers for Quick Sell selection
        $customers = collect();
        try {
            if (Schema::hasTable('contacts')) {
                $customers = Contact::active()
                    ->whereIn('type', ['CUSTOMER', 'BOTH'])
                    ->orderBy('name')
                    ->get(['id', 'name', 'phone', 'whatsapp_number'])
                    ->values();
            }
        } catch (\Throwable $e) {
            $customers = collect();
        }

        // Revenue accounts for ledger sales mapping
        $salesAccounts = collect();
        try {
            $salesAccounts = Account::where('type', 'REVENUE')->get()->values();
        } catch (\Throwable $e) {
            $salesAccounts = collect();
        }

        // Cash & Bank accounts for immediate Quick Sell receipt
        $paymentAccounts = collect();
        try {
            $paymentAccounts = Account::whereIn('code', ['1000', '1010', '1020'])
                ->get(['id', 'name', 'code'])
                ->values();
            if ($paymentAccounts->isEmpty()) {
                $paymentAccounts = Account::where('type', 'ASSET')
                    ->limit(5)
                    ->get(['id', 'name', 'code'])
                    ->values();
            }
        } catch (\Throwable $e) {
            $paymentAccounts = collect();
        }

        // Business settings
        $defaultUom = 'Pcs';
        $enableStock = false;
        try {
            if (Schema::hasTable('users')) {
                $user = User::first();
                if ($user) {
                    $defaultUom = $user->default_uom ?? 'Pcs';
                    $enableStock = (bool)($user->enable_stock ?? false);
                }
            }
        } catch (\Throwable $e) {
            $defaultUom = 'Pcs';
            $enableStock = false;
        }

        $filters = [
            'search'      => $request->input('search', ''),
            'category_id' => $request->input('category_id', 'ALL'),
            'sort'        => $request->input('sort', 'latest'),
        ];

        return Inertia::render('Items/Index', [
            'items'            => $items,
            'categories'       => $categories,
            'customers'        => $customers,
            'salesAccounts'    => $salesAccounts,
            'payment_accounts' => $paymentAccounts,
            'defaultUom'       => $defaultUom,
            'enable_stock'     => $enableStock,
            'filters'          => (object)$filters,
        ]);
    }

    /**
     * Store a newly created item in the catalog.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:150',
            'sku'            => 'nullable|string|unique:items,sku',
            'type'           => 'nullable|in:GOODS,SERVICE',
            'category_id'    => 'nullable|exists:categories,id',
            'description'    => 'nullable|string',
            'sales_price'    => 'required|numeric|min:0',
            'purchase_price' => 'nullable|numeric|min:0',
            'unit'           => 'nullable|string|max:20',
            'stock_quantity' => 'nullable|numeric|min:0',
        ]);

        if (empty($validated['type'])) {
            $validated['type'] = 'GOODS';
        }

        if (empty($validated['sku'])) {
            $validated['sku'] = self::generateSku($validated['name']);
        }

        if (empty($validated['unit'])) {
            $defaultUom = 'Pcs';
            try {
                if (Schema::hasTable('users') && Schema::hasColumn('users', 'default_uom')) {
                    $defaultUom = User::whereNotNull('default_uom')->value('default_uom') ?? 'Pcs';
                }
            } catch (\Throwable $e) {
                $defaultUom = 'Pcs';
            }
            $validated['unit'] = $defaultUom;
        }

        Item::create($validated);

        return back()->with('success', "Item {$validated['name']} created successfully with SKU: {$validated['sku']}");
    }

    /**
     * Update the specified catalog item.
     */
    public function update(Request $request, Item $item): RedirectResponse
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:150',
            'type'           => 'nullable|in:GOODS,SERVICE',
            'category_id'    => 'nullable|exists:categories,id',
            'description'    => 'nullable|string',
            'sales_price'    => 'required|numeric|min:0',
            'purchase_price' => 'nullable|numeric|min:0',
            'unit'           => 'required|string|max:20',
            'stock_quantity' => 'nullable|numeric|min:0',
        ]);

        if (empty($validated['type'])) {
            $validated['type'] = $item->type ?? 'GOODS';
        }

        $item->update($validated);

        return back()->with('success', "Item {$item->name} updated successfully.");
    }

    /**
     * Remove the specified item from the catalog.
     */
    public function destroy(Item $item): RedirectResponse
    {
        $name = $item->name;
        $item->delete();

        return back()->with('success', "Item '{$name}' deleted successfully.");
    }

    /**
     * Record an immediate Walk-in Customer Counter Sale.
     * Generates a confirmed, paid sales invoice, settles the customer payment,
     * decrements stock, and posts double-entry journal records.
     */
    public function quickSell(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'item_id'            => 'required|exists:items,id',
            'quantity'           => 'required|numeric|min:0.01',
            'unit_price'         => 'required|numeric|min:0',
            'contact_id'         => 'nullable|exists:contacts,id',
            'customer_name'      => 'nullable|string|max:255',
            'deposit_account_id' => 'required|exists:accounts,id',
            'payment_method'     => 'nullable|string|in:CASH,BANK_TRANSFER,CHEQUE,MOBILE_BANKING',
            'notes'              => 'nullable|string|max:500',
        ]);

        $item = Item::findOrFail($validated['item_id']);
        $qty = (float)$validated['quantity'];
        $unitPrice = (float)$validated['unit_price'];
        $totalAmount = round($qty * $unitPrice, 2);

        if (! empty($validated['contact_id'])) {
            $contact = Contact::findOrFail($validated['contact_id']);
            $customerName = $contact->name;
        } else {
            $customerName = !empty(trim($validated['customer_name'] ?? ''))
                ? trim($validated['customer_name'])
                : 'Walk-in Customer';

            // Walk-in Customer requires no phone/whatsapp number
            $contact = Contact::firstOrCreate(
                ['name' => $customerName],
                [
                    'type'            => 'CUSTOMER',
                    'currency'        => 'BDT',
                    'whatsapp_number' => null,
                ]
            );
        }

        $nextSeq = (int)Invoice::max('id') + 1;
        $invNumber = 'INV-' . date('Y') . '-' . str_pad((string)$nextSeq, 4, '0', STR_PAD_LEFT);
        $orderNumber = 'ORD-' . date('Y') . '-' . str_pad((string)$nextSeq, 4, '0', STR_PAD_LEFT);

        DB::transaction(function () use ($invNumber, $orderNumber, $contact, $item, $qty, $unitPrice, $totalAmount, $validated) {
            $invoice = Invoice::create([
                'invoice_number'   => $invNumber,
                'order_number'     => $orderNumber,
                'contact_id'       => $contact->id,
                'issue_date'       => now(),
                'due_date'         => now(),
                'status'           => 'PAID',
                'subtotal'         => $totalAmount,
                'tax_amount'       => 0.00,
                'discount_amount'  => 0.00,
                'shipping_charges' => 0.00,
                'adjustment'       => 0.00,
                'total_amount'     => $totalAmount,
                'paid_amount'      => $totalAmount,
                'notes'            => $validated['notes'] ?? "Quick Sale of {$item->name} to {$contact->name}",
                'terms'            => 'Immediate cash settlement.',
            ]);

            $invoice->lineItems()->create([
                'item_id'     => $item->id,
                'description' => $item->name,
                'quantity'    => $qty,
                'unit_price'  => $unitPrice,
                'amount'      => $totalAmount,
            ]);

            // Decrement stock quantity
            $item->decrement('stock_quantity', $qty);

            // Double entry ledger posting
            app(AccountingService::class)->postInvoice($invoice);

            $nextPaySeq = (int)Payment::where('type', 'CUSTOMER_PAYMENT')->max('id') + 1;
            $payNumber = 'PAY-' . date('Y') . '-' . str_pad((string)$nextPaySeq, 4, '0', STR_PAD_LEFT);

            $payment = Payment::create([
                'payment_number'   => $payNumber,
                'type'             => 'CUSTOMER_PAYMENT',
                'contact_id'       => $contact->id,
                'invoice_id'       => $invoice->id,
                'account_id'       => $validated['deposit_account_id'],
                'payment_date'     => now(),
                'amount'           => $totalAmount,
                'payment_method'   => $validated['payment_method'] ?? 'CASH',
                'notes'            => "Immediate payment on Quick Sale #{$invNumber}",
            ]);

            app(AccountingService::class)->postCustomerPayment($payment);

            \App\Models\PaymentAllocation::create([
                'payment_id' => $payment->id,
                'invoice_id' => $invoice->id,
                'amount'     => $totalAmount,
            ]);
        });

        return back()->with('success', "Quick Sale recorded! Invoice #{$invNumber} created for {$customerName} (৳" . number_format($totalAmount, 2) . ").");
    }
}
