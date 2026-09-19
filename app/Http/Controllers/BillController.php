<?php

namespace App\Http\Controllers;

use App\Models\Bill;
use App\Models\Contact;
use App\Models\Item;
use App\Services\AccountingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class BillController extends Controller
{
    public function __construct(protected AccountingService $accountingService)
    {
    }

    public function index(Request $request): Response
    {
        $query = Bill::with(['contact', 'lineItems']);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('bill_number', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%")
                  ->orWhereHas('contact', fn($c) => $c->where('name', 'like', "%{$search}%"));
            });
        }

        if ($status = $request->input('status')) {
            if ($status !== 'ALL') {
                $query->where('status', $status);
            }
        }

        return Inertia::render('Bills/Index', [
            'bills'   => $query->latest()->paginate(25)->withQueryString(),
            'vendors' => Contact::whereIn('type', ['VENDOR', 'BOTH'])->get(['id', 'name', 'phone', 'whatsapp_number']),
            'items'   => Item::all(),
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'contact_name'    => 'required|string|max:255',
            'whatsapp_number' => 'nullable|string|max:50',
            'bill_date'       => 'required|date',
            'due_date'        => 'nullable|date',
            'notes'           => 'nullable|string',
            'subtotal'        => 'required|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'total_amount'    => 'required|numeric|min:0',
            'line_items'      => 'required|array|min:1',
            'line_items.*.description' => 'required|string',
            'line_items.*.quantity'    => 'required|numeric|min:1',
            'line_items.*.unit_price'  => 'required|numeric|min:0',
            'line_items.*.amount'      => 'required|numeric|min:0',
        ]);

        $vendor = Contact::firstOrCreate(
            ['name' => $validated['contact_name']],
            [
                'type'            => 'VENDOR',
                'currency'        => 'BDT',
                'phone'           => $validated['whatsapp_number'] ?? null,
                'whatsapp_number' => $validated['whatsapp_number'] ?? null,
            ]
        );

        if (! empty($validated['whatsapp_number'])) {
            $vendor->update([
                'phone'           => $validated['whatsapp_number'],
                'whatsapp_number' => $validated['whatsapp_number'],
            ]);
        }

        $billCount = Bill::count() + 1;
        $billNumber = 'BIL-2026-' . str_pad($billCount, 4, '0', STR_PAD_LEFT);

        DB::transaction(function () use ($validated, $vendor, $billNumber) {
            $bill = Bill::create([
                'bill_number'    => $billNumber,
                'contact_id'     => $vendor->id,
                'bill_date'      => $validated['bill_date'],
                'due_date'       => $validated['due_date'] ?? $validated['bill_date'],
                'status'         => 'RECEIVED',
                'subtotal'       => $validated['subtotal'],
                'tax_amount'     => 0,
                'discount_amount'=> $validated['discount_amount'] ?? 0,
                'total_amount'   => $validated['total_amount'],
                'notes'          => $validated['notes'] ?? null,
            ]);

            foreach ($validated['line_items'] as $item) {
                $bill->lineItems()->create([
                    'description' => $item['description'],
                    'quantity'    => $item['quantity'],
                    'unit_price'  => $item['unit_price'],
                    'amount'      => $item['amount'],
                ]);
            }

            // Double-entry posting: Debit 6000 Expenses, Credit 2000 AP
            $this->accountingService->postBill($bill);
        });

        return back()->with('success', "Vendor Bill {$billNumber} recorded and posted to general ledger!");
    }

    public function update(Request $request, Bill $bill): RedirectResponse
    {
        $validated = $request->validate([
            'contact_name'    => 'required|string|max:255',
            'whatsapp_number' => 'nullable|string|max:50',
            'bill_date'       => 'required|date',
            'due_date'        => 'nullable|date',
            'notes'           => 'nullable|string',
            'status'          => 'required|in:RECEIVED,PAID,OVERDUE',
            'subtotal'        => 'required|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'total_amount'    => 'required|numeric|min:0',
            'line_items'      => 'required|array|min:1',
            'line_items.*.description' => 'required|string',
            'line_items.*.quantity'    => 'required|numeric|min:1',
            'line_items.*.unit_price'  => 'required|numeric|min:0',
            'line_items.*.amount'      => 'required|numeric|min:0',
        ]);

        $vendor = Contact::firstOrCreate(
            ['name' => $validated['contact_name']],
            [
                'type'            => 'VENDOR',
                'currency'        => 'BDT',
                'phone'           => $validated['whatsapp_number'] ?? null,
                'whatsapp_number' => $validated['whatsapp_number'] ?? null,
            ]
        );

        DB::transaction(function () use ($validated, $vendor, $bill) {
            $bill->update([
                'contact_id'     => $vendor->id,
                'bill_date'      => $validated['bill_date'],
                'due_date'       => $validated['due_date'] ?? $validated['bill_date'],
                'status'         => $validated['status'],
                'subtotal'       => $validated['subtotal'],
                'tax_amount'     => 0,
                'discount_amount'=> $validated['discount_amount'] ?? 0,
                'total_amount'   => $validated['total_amount'],
                'notes'          => $validated['notes'] ?? null,
            ]);

            $bill->lineItems()->delete();

            foreach ($validated['line_items'] as $item) {
                $bill->lineItems()->create([
                    'description' => $item['description'],
                    'quantity'    => $item['quantity'],
                    'unit_price'  => $item['unit_price'],
                    'amount'      => $item['amount'],
                ]);
            }
        });

        return back()->with('success', "Vendor Bill {$bill->bill_number} updated successfully!");
    }

    public function markAsPaid(Bill $bill): RedirectResponse
    {
        if ($bill->status === 'PAID') {
            return back()->with('info', "Bill {$bill->bill_number} is already marked as PAID.");
        }

        $bill->update(['status' => 'PAID']);

        return back()->with('success', "Bill {$bill->bill_number} marked as PAID.");
    }
}
