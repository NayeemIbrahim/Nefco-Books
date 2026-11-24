<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Booking;
use App\Models\Contact;
use App\Models\Invoice;
use App\Models\Item;
use App\Models\Payment;
use App\Services\AccountingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceController extends Controller
{
    public function __construct(protected AccountingService $accountingService)
    {
    }

    public function index(Request $request): Response
    {
        $query = Invoice::with(['contact', 'lineItems.item']);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhere('order_number', 'like', "%{$search}%")
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
            } elseif ($normStatus === 'DRAFT') {
                $query->where('status', 'DRAFT');
            } elseif ($normStatus !== 'ALL') {
                $query->where('status', $status);
            }
        }

        $invoices = $query->latest('issue_date')->paginate(15)->withQueryString();
        $invoices->getCollection()->transform(function ($invoice) {
            if ($invoice->contact_id) {
                $otherDue = (float)Invoice::where('contact_id', $invoice->contact_id)
                    ->where('id', '!=', $invoice->id)
                    ->whereNotIn('status', ['DRAFT', 'VOID'])
                    ->selectRaw('COALESCE(SUM(total_amount - COALESCE(paid_amount, 0)), 0) as due')
                    ->value('due');

                $ob = (float)($invoice->contact->opening_balance ?? 0);
                $obType = strtoupper($invoice->contact->opening_balance_type ?: 'TO_RECEIVE');
                $obDue = ($obType === 'TO_RECEIVE') ? $ob : -$ob;

                $invoice->previous_due = round(max(0, $otherDue + $obDue), 2);
            } else {
                $invoice->previous_due = 0.00;
            }
            return $invoice;
        });

        $contacts = Contact::active()
            ->whereIn('type', ['CUSTOMER', 'BOTH'])
            ->withCount('invoices')
            ->get(['id', 'name', 'phone', 'whatsapp_number', 'opening_balance', 'opening_balance_type']);
        $items    = Item::get(['id', 'name', 'sku', 'sales_price', 'unit']);
        $depositAccounts = Account::whereIn('code', ['1000', '1010', '1020'])->get(['id', 'name', 'code']);

        $nextSeq = (int)Invoice::max('id') + 1;
        $nextInvoiceNumber = 'INV-' . date('Y') . '-' . str_pad((string)$nextSeq, 4, '0', STR_PAD_LEFT);
        $nextOrderNumber = 'ORD-0001';

        return Inertia::render('Invoices/Index', [
            'invoices'            => $invoices,
            'contacts'            => $contacts,
            'items'               => $items,
            'deposit_accounts'    => $depositAccounts,
            'next_invoice_number' => $nextInvoiceNumber,
            'next_order_number'   => $nextOrderNumber,
            'filters'             => $request->only(['search', 'status']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'invoice_number'         => 'nullable|string|max:100',
            'order_number'           => 'nullable|string|max:100',
            'contact_id'             => 'nullable|exists:contacts,id',
            'contact_name'           => 'nullable|string|max:255',
            'whatsapp_number'        => 'nullable|string|max:50',
            'booking_id'             => 'nullable|exists:bookings,id',
            'issue_date'             => 'nullable|date',
            'due_date'               => 'nullable|date',
            'status'                 => 'nullable|string|in:DRAFT,UNPAID,SENT,PAID,PARTIALLY_PAID',
            'notes'                  => 'nullable|string|max:1000',
            'terms'                  => 'nullable|string|max:1000',
            'discount_amount'        => 'nullable|numeric|min:0',
            'shipping_charges'       => 'nullable|numeric|min:0',
            'adjustment'             => 'nullable|numeric',
            'deposit_amount'         => 'nullable|numeric|min:0',
            'deposit_account_id'     => 'nullable|exists:accounts,id',
            'deposit_payment_method' => 'nullable|string|in:CASH,BANK_TRANSFER,CHEQUE,MOBILE_BANKING',
            'deposit_reference'      => 'nullable|string|max:100',
            'attachments.*'          => 'nullable|file|max:10240',
            'line_items'             => 'required|array|min:1',
            'line_items.*.item_id'     => 'nullable|exists:items,id',
            'line_items.*.description' => 'required|string|max:255',
            'line_items.*.quantity'    => 'required|numeric|min:0.01',
            'line_items.*.unit_price'  => 'required|numeric|min:0',
        ]);

        if (! empty($validated['contact_id'])) {
            $contact = Contact::findOrFail($validated['contact_id']);
            if (! empty($validated['whatsapp_number'])) {
                $contact->update(['whatsapp_number' => $validated['whatsapp_number']]);
            }
        } else {
            $contact = Contact::firstOrCreate(
                ['name' => $validated['contact_name'] ?? 'General Customer'],
                [
                    'type'            => 'CUSTOMER',
                    'currency'        => 'BDT',
                    'whatsapp_number' => $validated['whatsapp_number'] ?? null,
                ]
            );
        }

        $savedAttachments = [];
        if ($request->hasFile('attachments')) {
            $files = array_slice($request->file('attachments'), 0, 10);
            foreach ($files as $file) {
                $path = $file->store('attachments/invoices', 'public');
                $savedAttachments[] = [
                    'name' => $file->getClientOriginalName(),
                    'path' => '/storage/' . $path,
                    'size' => $file->getSize(),
                ];
            }
        }

        $invoice = DB::transaction(function () use ($validated, $contact, $savedAttachments) {
            $subtotal = 0.00;
            $lineItemsData = [];

            foreach ($validated['line_items'] as $line) {
                $qty = (float)$line['quantity'];
                $unitPrice = (float)$line['unit_price'];
                $lineTotal = round($qty * $unitPrice, 2);
                $subtotal += $lineTotal;

                $itemId = $line['item_id'] ?? null;
                if (! $itemId && ! empty($line['description'])) {
                    $itemId = Item::where('name', $line['description'])->value('id');
                }

                $lineItemsData[] = [
                    'item_id'     => $itemId,
                    'description' => $line['description'],
                    'quantity'    => $qty,
                    'unit_price'  => $unitPrice,
                    'amount'      => $lineTotal,
                ];
            }

            $discountAmount  = (float)($validated['discount_amount'] ?? 0);
            $shippingCharges = (float)($validated['shipping_charges'] ?? 0);
            $adjustment      = (float)($validated['adjustment'] ?? 0);
            $totalAmount     = max(0, round($subtotal - $discountAmount + $shippingCharges + $adjustment, 2));

            $depositAmount = (float)($validated['deposit_amount'] ?? 0);
            $depositAmount = min($totalAmount, max(0, $depositAmount));

            $nextSeq = (int)Invoice::max('id') + 1;
            $invNumber = ! empty($validated['invoice_number'])
                ? $validated['invoice_number']
                : 'INV-' . date('Y') . '-' . str_pad((string)$nextSeq, 4, '0', STR_PAD_LEFT);

            if (! empty($validated['order_number'])) {
                $orderNumber = $validated['order_number'];
            } else {
                $custCount = Invoice::where('contact_id', $contact->id)->count() + 1;
                $orderNumber = 'ORD-' . str_pad((string)$custCount, 4, '0', STR_PAD_LEFT);
            }

            $issueDate = ! empty($validated['issue_date']) ? $validated['issue_date'] : now();
            $dueDate   = ! empty($validated['due_date']) ? $validated['due_date'] : $issueDate;

            $reqStatus = $validated['status'] ?? 'UNPAID';
            if ($reqStatus === 'DRAFT') {
                $finalStatus = 'DRAFT';
            } elseif ($depositAmount >= $totalAmount && $totalAmount > 0) {
                $finalStatus = 'PAID';
            } elseif ($depositAmount > 0) {
                $finalStatus = 'PARTIALLY_PAID';
            } else {
                $finalStatus = 'UNPAID';
            }

            $invoice = Invoice::create([
                'invoice_number'   => $invNumber,
                'order_number'     => $orderNumber,
                'contact_id'       => $contact->id,
                'booking_id'       => $validated['booking_id'] ?? null,
                'issue_date'       => $issueDate,
                'due_date'         => $dueDate,
                'status'           => $finalStatus,
                'subtotal'         => $subtotal,
                'tax_amount'       => 0.00,
                'discount_amount'  => $discountAmount,
                'shipping_charges' => $shippingCharges,
                'adjustment'       => $adjustment,
                'total_amount'     => $totalAmount,
                'paid_amount'      => $depositAmount,
                'notes'            => $validated['notes'] ?? null,
                'terms'            => $validated['terms'] ?? 'Payment due within 14 days.',
                'attachments'      => $savedAttachments,
            ]);

            $invoice->lineItems()->createMany($lineItemsData);

            // Double-entry posting for active invoices
            if ($finalStatus !== 'DRAFT') {
                $this->accountingService->postInvoice($invoice);

                // If deposit was paid upfront, create Payment and post customer payment
                if ($depositAmount > 0) {
                    $depositAccountId = $validated['deposit_account_id']
                        ?? Account::where('code', '1000')->value('id')
                        ?? 1;

                    $nextPaySeq = (int)Payment::where('type', 'CUSTOMER_PAYMENT')->max('id') + 1;
                    $payNumber = 'PAY-' . date('Y') . '-' . str_pad((string)$nextPaySeq, 4, '0', STR_PAD_LEFT);

                    $payment = Payment::create([
                        'payment_number'   => $payNumber,
                        'type'             => 'CUSTOMER_PAYMENT',
                        'contact_id'       => $contact->id,
                        'invoice_id'       => $invoice->id,
                        'account_id'       => $depositAccountId,
                        'payment_date'     => $issueDate,
                        'amount'           => $depositAmount,
                        'payment_method'   => $validated['deposit_payment_method'] ?? 'CASH',
                        'reference_number' => $validated['deposit_reference'] ?? null,
                        'notes'            => "Initial deposit received on invoice #{$invNumber}",
                    ]);

                    $this->accountingService->postCustomerPayment($payment);
                }
            }

            if (! empty($validated['booking_id'])) {
                Booking::where('id', $validated['booking_id'])->update([
                    'status'         => 'COMPLETED',
                    'invoice_number' => $invNumber,
                ]);
            }

            return $invoice;
        });

        $msg = $invoice->status === 'DRAFT'
            ? "Draft Invoice #{$invoice->invoice_number} saved (available under Orders & Bookings)!"
            : "Invoice #{$invoice->invoice_number} generated & posted to ledger!";

        return back()->with('success', $msg);
    }

    public function update(Request $request, Invoice $invoice): RedirectResponse
    {
        $validated = $request->validate([
            'invoice_number'   => 'nullable|string|max:100',
            'order_number'     => 'nullable|string|max:100',
            'contact_name'     => 'nullable|string|max:255',
            'whatsapp_number'  => 'nullable|string|max:50',
            'issue_date'       => 'required|date',
            'due_date'         => 'nullable|date',
            'status'           => 'required|in:DRAFT,UNPAID,SENT,PAID,PARTIALLY_PAID,OVERDUE,VOID',
            'notes'            => 'nullable|string|max:1000',
            'terms'            => 'nullable|string|max:1000',
            'discount_amount'  => 'nullable|numeric|min:0',
            'shipping_charges' => 'nullable|numeric|min:0',
            'adjustment'       => 'nullable|numeric',
            'attachments.*'    => 'nullable|file|max:10240',
            'line_items'       => 'required|array|min:1',
            'line_items.*.description' => 'required|string|max:255',
            'line_items.*.quantity'    => 'required|numeric|min:0.01',
            'line_items.*.unit_price'  => 'required|numeric|min:0',
        ]);

        $savedAttachments = $invoice->attachments ?? [];
        if ($request->hasFile('attachments')) {
            $files = array_slice($request->file('attachments'), 0, 10);
            foreach ($files as $file) {
                $path = $file->store('attachments/invoices', 'public');
                $savedAttachments[] = [
                    'name' => $file->getClientOriginalName(),
                    'path' => '/storage/' . $path,
                    'size' => $file->getSize(),
                ];
            }
            $savedAttachments = array_slice($savedAttachments, 0, 10);
        }

        DB::transaction(function () use ($validated, $invoice, $savedAttachments) {
            if (! empty($validated['contact_name'])) {
                $invoice->contact->update([
                    'name'            => $validated['contact_name'],
                    'whatsapp_number' => $validated['whatsapp_number'] ?? $invoice->contact->whatsapp_number,
                ]);
            }

            $subtotal = 0.00;
            $lineItemsData = [];

            foreach ($validated['line_items'] as $line) {
                $qty = (float)$line['quantity'];
                $unitPrice = (float)$line['unit_price'];
                $lineTotal = round($qty * $unitPrice, 2);
                $subtotal += $lineTotal;

                $lineItemsData[] = [
                    'description' => $line['description'],
                    'quantity'    => $qty,
                    'unit_price'  => $unitPrice,
                    'amount'      => $lineTotal,
                ];
            }

            $discountAmount  = (float)($validated['discount_amount'] ?? 0);
            $shippingCharges = (float)($validated['shipping_charges'] ?? 0);
            $adjustment      = (float)($validated['adjustment'] ?? 0);
            $totalAmount     = max(0, round($subtotal - $discountAmount + $shippingCharges + $adjustment, 2));

            $invoice->update([
                'invoice_number'   => $validated['invoice_number'] ?? $invoice->invoice_number,
                'order_number'     => $validated['order_number'] ?? $invoice->order_number,
                'issue_date'       => $validated['issue_date'],
                'due_date'         => !empty($validated['due_date']) ? $validated['due_date'] : $validated['issue_date'],
                'status'           => $validated['status'],
                'subtotal'         => $subtotal,
                'tax_amount'       => 0.00,
                'discount_amount'  => $discountAmount,
                'shipping_charges' => $shippingCharges,
                'adjustment'       => $adjustment,
                'total_amount'     => $totalAmount,
                'notes'            => $validated['notes'] ?? null,
                'terms'            => $validated['terms'] ?? $invoice->terms,
                'attachments'      => $savedAttachments,
            ]);

            $invoice->lineItems()->delete();
            $invoice->lineItems()->createMany($lineItemsData);
        });

        return back()->with('success', "Invoice #{$invoice->invoice_number} updated successfully!");
    }

    public function sendWhatsApp(Invoice $invoice): RedirectResponse
    {
        $invoice->update(['whatsapp_sent' => true]);

        return back()->with('success', "WhatsApp status recorded for {$invoice->contact->name}.");
    }

    public function markAsPaid(Invoice $invoice): RedirectResponse
    {
        if ($invoice->status === 'PAID') {
            return back()->with('info', "Invoice #{$invoice->invoice_number} is already marked as PAID.");
        }

        $invoice->update([
            'status'      => 'PAID',
            'paid_amount' => $invoice->total_amount,
        ]);

        return back()->with('success', "Invoice #{$invoice->invoice_number} marked as PAID.");
    }

    public function issueDraft(Invoice $invoice): RedirectResponse
    {
        if ($invoice->status === 'DRAFT') {
            DB::transaction(function () use ($invoice) {
                $newStatus = ((float)$invoice->paid_amount >= (float)$invoice->total_amount && (float)$invoice->total_amount > 0)
                    ? 'PAID'
                    : (((float)$invoice->paid_amount > 0) ? 'PARTIALLY_PAID' : 'UNPAID');
                $invoice->update(['status' => $newStatus]);
                $this->accountingService->postInvoice($invoice);
            });

            return back()->with('success', "Draft Invoice #{$invoice->invoice_number} has been issued and posted to General Ledger!");
        }

        return back()->with('error', "Invoice is already issued.");
    }

    public function destroy(Invoice $invoice): RedirectResponse
    {
        if ($invoice->status !== 'DRAFT') {
            return back()->with('error', "Only DRAFT invoices can be deleted. Issued invoices are posted to the general ledger.");
        }

        DB::transaction(function () use ($invoice) {
            $invoice->lineItems()->delete();
            $invoice->delete();
        });

        return back()->with('success', "Draft Invoice #{$invoice->invoice_number} has been deleted.");
    }
}
