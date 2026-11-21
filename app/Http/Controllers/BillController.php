<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Bill;
use App\Models\Contact;
use App\Models\Item;
use App\Models\Payment;
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
            $normStatus = strtoupper(str_replace(' ', '_', $status));
            if ($normStatus === 'UNPAID') {
                $query->where('status', '!=', 'PAID')
                      ->where('status', '!=', 'VOID')
                      ->where(function ($q) {
                          $q->whereColumn('paid_amount', '<', 'total_amount')
                            ->orWhereNull('paid_amount');
                      });
            } elseif ($normStatus === 'PARTIALLY_PAID') {
                $query->where(function ($q) {
                    $q->where('status', 'PARTIALLY_PAID')
                      ->orWhere(function ($sub) {
                          $sub->where('paid_amount', '>', 0)
                              ->whereColumn('paid_amount', '<', 'total_amount');
                      });
                });
            } elseif ($normStatus === 'PAID') {
                $query->where(function ($q) {
                    $q->where('status', 'PAID')
                      ->orWhereColumn('paid_amount', '>=', 'total_amount');
                });
            } elseif ($normStatus === 'OVERDUE') {
                $query->where(function ($q) {
                    $q->where('status', 'OVERDUE')
                      ->orWhere(function ($sub) {
                          $sub->whereDate('due_date', '<', now()->toDateString())
                              ->whereColumn('paid_amount', '<', 'total_amount');
                      });
                });
            } elseif ($normStatus !== 'ALL') {
                $query->where('status', $status);
            }
        }

        return Inertia::render('Bills/Index', [
            'bills'   => $query->latest()->paginate(15)->withQueryString(),
            'vendors' => Contact::active()->whereIn('type', ['VENDOR', 'BOTH'])->get(['id', 'name', 'phone', 'whatsapp_number']),
            'items'   => Item::all(),
            'deposit_accounts' => Account::whereIn('code', ['1000', '1010', '1020'])->get(['id', 'name', 'code']),
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
            'deposit_amount'  => 'nullable|numeric|min:0',
            'deposit_account_id' => 'nullable|exists:accounts,id',
            'deposit_payment_method' => 'nullable|string|in:CASH,BANK_TRANSFER,CHEQUE,MOBILE_BANKING',
            'deposit_reference' => 'nullable|string|max:100',
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

        $initialPayment = (float)($validated['deposit_amount'] ?? 0);
        $totalAmount    = (float)$validated['total_amount'];
        $initialPayment = min($totalAmount, max(0, $initialPayment));

        if ($initialPayment >= $totalAmount && $totalAmount > 0) {
            $status = 'PAID';
        } elseif ($initialPayment > 0) {
            $status = 'PARTIALLY_PAID';
        } else {
            $status = 'UNPAID';
        }

        $billCount = Bill::count();
        do {
            $billCount++;
            $billNumber = 'BIL-2026-' . str_pad($billCount, 4, '0', STR_PAD_LEFT);
        } while (Bill::where('bill_number', $billNumber)->exists());

        $defaultDueDate = date('Y-m-d', strtotime(($validated['bill_date'] ?? now()->toDateString()) . ' +2 days'));

        DB::transaction(function () use ($validated, $vendor, $billNumber, $defaultDueDate, $status, $initialPayment) {
            $bill = Bill::create([
                'bill_number'    => $billNumber,
                'contact_id'     => $vendor->id,
                'bill_date'      => $validated['bill_date'],
                'due_date'       => ! empty($validated['due_date']) ? $validated['due_date'] : $defaultDueDate,
                'status'         => $status,
                'subtotal'       => $validated['subtotal'],
                'tax_amount'     => 0,
                'discount_amount'=> $validated['discount_amount'] ?? 0,
                'total_amount'   => $validated['total_amount'],
                'paid_amount'    => $initialPayment,
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

            // Record initial vendor payment if paid upfront
            if ($initialPayment > 0) {
                $paymentAccountId = $validated['deposit_account_id']
                    ?? Account::where('code', '1000')->value('id')
                    ?? 1;

                $nextSeq = (int)Payment::where('type', 'VENDOR_PAYMENT')->max('id') + 1;
                $payNumber = 'VPAY-' . date('Y') . '-' . str_pad((string)$nextSeq, 4, '0', STR_PAD_LEFT);

                $payment = Payment::create([
                    'payment_number'   => $payNumber,
                    'type'             => 'VENDOR_PAYMENT',
                    'contact_id'       => $vendor->id,
                    'bill_id'          => $bill->id,
                    'account_id'       => $paymentAccountId,
                    'payment_date'     => $validated['bill_date'],
                    'amount'           => $initialPayment,
                    'payment_method'   => $validated['deposit_payment_method'] ?? 'CASH',
                    'reference_number' => $validated['deposit_reference'] ?? null,
                    'notes'            => "Initial payment on vendor bill #{$billNumber}",
                ]);

                $this->accountingService->postVendorPayment($payment);
            }
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
            'status'          => 'required|in:UNPAID,RECEIVED,PAID,PARTIALLY_PAID,OVERDUE',
            'subtotal'        => 'required|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'total_amount'    => 'required|numeric|min:0',
            'deposit_amount'  => 'nullable|numeric|min:0',
            'deposit_account_id' => 'nullable|exists:accounts,id',
            'deposit_payment_method' => 'nullable|string|in:CASH,BANK_TRANSFER,CHEQUE,MOBILE_BANKING',
            'deposit_reference' => 'nullable|string|max:100',
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

        $defaultDueDate = date('Y-m-d', strtotime(($validated['bill_date'] ?? now()->toDateString()) . ' +2 days'));

        DB::transaction(function () use ($validated, $vendor, $bill, $defaultDueDate) {
            $billData = [
                'contact_id'     => $vendor->id,
                'bill_date'      => $validated['bill_date'],
                'due_date'       => ! empty($validated['due_date']) ? $validated['due_date'] : $defaultDueDate,
                'status'         => $validated['status'],
                'subtotal'       => $validated['subtotal'],
                'tax_amount'     => 0,
                'discount_amount'=> $validated['discount_amount'] ?? 0,
                'total_amount'   => $validated['total_amount'],
                'notes'          => $validated['notes'] ?? null,
            ];

            if ($validated['status'] === 'PAID') {
                $billData['paid_amount'] = $validated['total_amount'];
            }

            $bill->update($billData);

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
        if ($bill->status === 'PAID' && (float)$bill->paid_amount >= (float)$bill->total_amount) {
            return back()->with('info', "Bill {$bill->bill_number} is already marked as PAID.");
        }

        $bill->update([
            'status'      => 'PAID',
            'paid_amount' => $bill->total_amount,
        ]);

        return back()->with('success', "Bill {$bill->bill_number} marked as PAID.");
    }
}
