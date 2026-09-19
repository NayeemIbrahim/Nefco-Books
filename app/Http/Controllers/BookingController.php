<?php

namespace App\Http\Controllers;

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

class BookingController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Booking::with(['contact', 'lineItems.item']);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('booking_number', 'like', "%{$search}%")
                  ->orWhere('order_number', 'like', "%{$search}%")
                  ->orWhere('invoice_number', 'like', "%{$search}%")
                  ->orWhereHas('contact', fn($c) => $c->where('name', 'like', "%{$search}%"));
            });
        }

        if ($status = $request->input('status')) {
            if ($status !== 'ALL') {
                $query->where('status', $status);
            }
        }

        return Inertia::render('Bookings/Index', [
            'bookings' => $query->latest()->paginate(25)->withQueryString(),
            'contacts' => Contact::whereIn('type', ['CUSTOMER', 'BOTH'])->get(['id', 'name', 'phone', 'whatsapp_number']),
            'items'    => Item::orderBy('name')->get(['id', 'name', 'sku', 'sales_price', 'unit']),
            'filters'  => $request->only(['search', 'status']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'contact_name'    => 'required|string|max:255',
            'whatsapp_number' => 'nullable|string|max:50',
            'order_number'    => 'nullable|string|max:100',
            'invoice_number'  => 'nullable|string|max:100',
            'booking_date'    => 'required|date',
            'notes'           => 'nullable|string',
            'total_amount'    => 'required|numeric|min:0',
            'attachments.*'   => 'nullable|file|max:10240', // max 10MB per file
            'line_items'      => 'required|array|min:1',
            'line_items.*.item_id'     => 'nullable|exists:items,id',
            'line_items.*.description' => 'required|string',
            'line_items.*.quantity'    => 'required|numeric|min:0.01',
            'line_items.*.unit_price'  => 'required|numeric|min:0',
            'line_items.*.amount'      => 'required|numeric|min:0',
        ]);

        $contact = Contact::firstOrCreate(
            ['name' => $validated['contact_name']],
            [
                'type'            => 'CUSTOMER',
                'currency'        => 'BDT',
                'phone'           => $validated['whatsapp_number'] ?? null,
                'whatsapp_number' => $validated['whatsapp_number'] ?? null,
            ]
        );

        if (! empty($validated['whatsapp_number'])) {
            $contact->update([
                'phone'           => $validated['whatsapp_number'],
                'whatsapp_number' => $validated['whatsapp_number'],
            ]);
        }

        $bkgCount = Booking::count() + 1;
        $bookingNumber = 'BKG-2026-' . str_pad($bkgCount, 4, '0', STR_PAD_LEFT);
        $orderNumber = ! empty($validated['order_number'])
            ? $validated['order_number']
            : 'ORD-2026-' . str_pad($bkgCount, 4, '0', STR_PAD_LEFT);
        $invoiceNumber = ! empty($validated['invoice_number'])
            ? $validated['invoice_number']
            : 'INV-2026-' . str_pad($bkgCount, 4, '0', STR_PAD_LEFT);

        $savedAttachments = [];
        if ($request->hasFile('attachments')) {
            $files = array_slice($request->file('attachments'), 0, 10);
            foreach ($files as $file) {
                $path = $file->store('attachments/bookings', 'public');
                $savedAttachments[] = [
                    'name' => $file->getClientOriginalName(),
                    'path' => '/storage/' . $path,
                    'size' => $file->getSize(),
                ];
            }
        }

        DB::transaction(function () use ($validated, $contact, $bookingNumber, $orderNumber, $invoiceNumber, $savedAttachments) {
            $booking = Booking::create([
                'booking_number' => $bookingNumber,
                'order_number'   => $orderNumber,
                'invoice_number' => $invoiceNumber,
                'contact_id'     => $contact->id,
                'booking_date'   => $validated['booking_date'],
                'status'         => 'CONFIRMED',
                'total_amount'   => $validated['total_amount'],
                'notes'          => $validated['notes'] ?? null,
                'attachments'    => $savedAttachments,
            ]);

            foreach ($validated['line_items'] as $li) {
                $booking->lineItems()->create([
                    'item_id'     => $li['item_id'] ?? null,
                    'description' => $li['description'],
                    'quantity'    => $li['quantity'],
                    'unit_price'  => $li['unit_price'],
                    'amount'      => $li['amount'],
                ]);
            }
        });

        return back()->with('success', "Booking {$bookingNumber} created successfully!");
    }

    public function update(Request $request, Booking $booking): RedirectResponse
    {
        $validated = $request->validate([
            'contact_name'    => 'required|string|max:255',
            'whatsapp_number' => 'nullable|string|max:50',
            'order_number'    => 'nullable|string|max:100',
            'invoice_number'  => 'nullable|string|max:100',
            'booking_date'    => 'required|date',
            'status'          => 'required|in:PENDING,CONFIRMED,COMPLETED,CANCELLED',
            'notes'           => 'nullable|string',
            'total_amount'    => 'required|numeric|min:0',
            'attachments.*'   => 'nullable|file|max:10240',
            'line_items'      => 'required|array|min:1',
            'line_items.*.item_id'     => 'nullable|exists:items,id',
            'line_items.*.description' => 'required|string',
            'line_items.*.quantity'    => 'required|numeric|min:0.01',
            'line_items.*.unit_price'  => 'required|numeric|min:0',
            'line_items.*.amount'      => 'required|numeric|min:0',
        ]);

        $contact = Contact::firstOrCreate(
            ['name' => $validated['contact_name']],
            [
                'type'            => 'CUSTOMER',
                'currency'        => 'BDT',
                'phone'           => $validated['whatsapp_number'] ?? null,
                'whatsapp_number' => $validated['whatsapp_number'] ?? null,
            ]
        );

        $savedAttachments = $booking->attachments ?? [];
        if ($request->hasFile('attachments')) {
            $files = array_slice($request->file('attachments'), 0, 10);
            foreach ($files as $file) {
                $path = $file->store('attachments/bookings', 'public');
                $savedAttachments[] = [
                    'name' => $file->getClientOriginalName(),
                    'path' => '/storage/' . $path,
                    'size' => $file->getSize(),
                ];
            }
            $savedAttachments = array_slice($savedAttachments, 0, 10);
        }

        DB::transaction(function () use ($validated, $contact, $booking, $savedAttachments) {
            $booking->update([
                'contact_id'     => $contact->id,
                'order_number'   => $validated['order_number'] ?? $booking->order_number,
                'invoice_number' => $validated['invoice_number'] ?? $booking->invoice_number,
                'booking_date'   => $validated['booking_date'],
                'status'         => $validated['status'],
                'total_amount'   => $validated['total_amount'],
                'notes'          => $validated['notes'] ?? null,
                'attachments'    => $savedAttachments,
            ]);

            $booking->lineItems()->delete();

            foreach ($validated['line_items'] as $li) {
                $booking->lineItems()->create([
                    'item_id'     => $li['item_id'] ?? null,
                    'description' => $li['description'],
                    'quantity'    => $li['quantity'],
                    'unit_price'  => $li['unit_price'],
                    'amount'      => $li['amount'],
                ]);
            }
        });

        return back()->with('success', "Booking {$booking->booking_number} updated successfully!");
    }

    public function convertToInvoice(Booking $booking, AccountingService $accountingService): RedirectResponse
    {
        $invCount = Invoice::count() + 1;
        $invNumber = 'INV-' . date('Y') . '-' . str_pad($invCount, 4, '0', STR_PAD_LEFT);

        DB::transaction(function () use ($booking, $invNumber, $accountingService) {
            $invoice = Invoice::create([
                'invoice_number'  => $invNumber,
                'order_number'    => $booking->order_number,
                'contact_id'      => $booking->contact_id,
                'booking_id'      => $booking->id,
                'issue_date'      => now(),
                'due_date'        => now()->addDays(14),
                'status'          => 'SENT',
                'subtotal'        => $booking->total_amount,
                'tax_amount'      => 0,
                'discount_amount' => 0,
                'total_amount'    => $booking->total_amount,
                'notes'           => $booking->notes,
                'terms'           => 'Payment due within 14 days.',
                'attachments'     => $booking->attachments,
            ]);

            foreach ($booking->lineItems as $item) {
                $invoice->lineItems()->create([
                    'item_id'     => $item->item_id,
                    'description' => $item->description,
                    'quantity'    => $item->quantity,
                    'unit_price'  => $item->unit_price,
                    'amount'      => $item->amount,
                ]);
            }

            $accountingService->postInvoice($invoice);
            $booking->update([
                'status'         => 'COMPLETED',
                'invoice_number' => $invNumber,
            ]);
        });

        return redirect()->route('invoices.index')->with('success', "Booking converted to Invoice {$invNumber}!");
    }
}
