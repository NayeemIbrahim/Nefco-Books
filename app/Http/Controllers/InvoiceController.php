<?php

namespace App\Http\Controllers;

use App\Jobs\SendWhatsAppInvoiceJob;
use App\Models\Booking;
use App\Models\Contact;
use App\Models\Invoice;
use App\Models\Item;
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
                  ->orWhereHas('contact', fn($c) => $c->where('name', 'like', "%{$search}%"));
            });
        }

        if ($status = $request->input('status')) {
            if ($status !== 'ALL') {
                $query->where('status', $status);
            }
        }

        $invoices = $query->latest('issue_date')->paginate(15)->withQueryString();
        $contacts = Contact::active()->whereIn('type', ['CUSTOMER', 'BOTH'])->get(['id', 'name', 'phone', 'whatsapp_number']);
        $items    = Item::get(['id', 'name', 'sku', 'sales_price', 'unit']);

        $nextSeq = (int)Invoice::max('id') + 1;
        $nextInvoiceNumber = 'INV-' . date('Y') . '-' . str_pad((string)$nextSeq, 4, '0', STR_PAD_LEFT);
        $nextOrderNumber = 'ORD-' . date('Y') . '-' . str_pad((string)$nextSeq, 4, '0', STR_PAD_LEFT);

        return Inertia::render('Invoices/Index', [
            'invoices'            => $invoices,
            'contacts'            => $contacts,
            'items'               => $items,
            'next_invoice_number' => $nextInvoiceNumber,
            'next_order_number'   => $nextOrderNumber,
            'filters'             => $request->only(['search', 'status']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'invoice_number'   => 'nullable|string|max:100',
            'order_number'     => 'nullable|string|max:100',
            'contact_id'       => 'nullable|exists:contacts,id',
            'contact_name'     => 'nullable|string|max:255',
            'whatsapp_number'  => 'nullable|string|max:50',
            'booking_id'       => 'nullable|exists:bookings,id',
            'issue_date'       => 'nullable|date',
            'due_date'         => 'nullable|date',
            'notes'            => 'nullable|string|max:1000',
            'terms'            => 'nullable|string|max:1000',
            'discount_amount'  => 'nullable|numeric|min:0',
            'shipping_charges' => 'nullable|numeric|min:0',
            'adjustment'       => 'nullable|numeric',
            'attachments.*'    => 'nullable|file|max:10240',
            'line_items'       => 'required|array|min:1',
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

                $lineItemsData[] = [
                    'item_id'     => $line['item_id'] ?? null,
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

            $nextSeq = (int)Invoice::max('id') + 1;
            $invNumber = ! empty($validated['invoice_number'])
                ? $validated['invoice_number']
                : 'INV-' . date('Y') . '-' . str_pad((string)$nextSeq, 4, '0', STR_PAD_LEFT);

            $orderNumber = ! empty($validated['order_number'])
                ? $validated['order_number']
                : 'ORD-' . date('Y') . '-' . str_pad((string)$nextSeq, 4, '0', STR_PAD_LEFT);

            $issueDate = ! empty($validated['issue_date']) ? $validated['issue_date'] : now();
            $dueDate   = ! empty($validated['due_date']) ? $validated['due_date'] : $issueDate;

            $invoice = Invoice::create([
                'invoice_number'   => $invNumber,
                'order_number'     => $orderNumber,
                'contact_id'       => $contact->id,
                'booking_id'       => $validated['booking_id'] ?? null,
                'issue_date'       => $issueDate,
                'due_date'         => $dueDate,
                'status'           => 'SENT',
                'subtotal'         => $subtotal,
                'tax_amount'       => 0.00,
                'discount_amount'  => $discountAmount,
                'shipping_charges' => $shippingCharges,
                'adjustment'       => $adjustment,
                'total_amount'     => $totalAmount,
                'paid_amount'      => 0.00,
                'notes'            => $validated['notes'] ?? null,
                'terms'            => $validated['terms'] ?? 'Payment due within 14 days.',
                'attachments'      => $savedAttachments,
            ]);

            $invoice->lineItems()->createMany($lineItemsData);

            // Double-entry posting
            $this->accountingService->postInvoice($invoice);

            if (! empty($validated['booking_id'])) {
                Booking::where('id', $validated['booking_id'])->update([
                    'status'         => 'COMPLETED',
                    'invoice_number' => $invNumber,
                ]);
            }

            return $invoice;
        });

        SendWhatsAppInvoiceJob::dispatch($invoice);

        return back()->with('success', "Invoice #{$invoice->invoice_number} generated!");
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
            'status'           => 'required|in:DRAFT,SENT,PAID,OVERDUE,VOID',
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
        SendWhatsAppInvoiceJob::dispatch($invoice);

        return back()->with('success', "WhatsApp notification dispatched to {$invoice->contact->name}.");
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
}
