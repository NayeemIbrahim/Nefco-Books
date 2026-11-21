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
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class BookingController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Booking::with(['contact', 'lineItems.item']);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('booking_number', 'like', "%{$search}%");
                if (Schema::hasColumn('bookings', 'order_number')) {
                    $q->orWhere('order_number', 'like', "%{$search}%");
                }
                if (Schema::hasColumn('bookings', 'invoice_number')) {
                    $q->orWhere('invoice_number', 'like', "%{$search}%");
                }
                $q->orWhereHas('contact', fn($c) => $c->where('name', 'like', "%{$search}%"));
            });
        }

        if ($status = $request->input('status')) {
            if ($status === 'QUOTES' || $status === 'OPEN') {
                $query->where(function ($q) {
                    $q->whereNull('invoice_number')
                      ->orWhere('invoice_number', '');
                })->whereNotIn('status', ['COMPLETED', 'INVOICED']);
            } elseif ($status === 'INVOICED') {
                $query->where(function ($q) {
                    $q->where(function ($sub) {
                        $sub->whereNotNull('invoice_number')->where('invoice_number', '!=', '');
                    })->orWhereIn('status', ['INVOICED', 'COMPLETED']);
                });
            } elseif ($status !== 'ALL') {
                $query->where('status', $status);
            }
        }

        $draftInvoices = Invoice::with(['contact', 'lineItems.item'])
            ->where('status', 'DRAFT')
            ->latest('issue_date')
            ->get();

        return Inertia::render('Bookings/Index', [
            'bookings'       => $query->latest()->paginate(15)->withQueryString(),
            'draft_invoices' => $draftInvoices,
            'contacts'       => Contact::active()->whereIn('type', ['CUSTOMER', 'BOTH'])->get(['id', 'name', 'phone', 'whatsapp_number']),
            'items'          => Item::orderBy('name')->get(['id', 'name', 'sku', 'sales_price', 'unit']),
            'filters'        => $request->only(['search', 'status']),
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

        $bkgCount = Booking::count();
        do {
            $bkgCount++;
            $bookingNumber = 'BKG-2026-' . str_pad($bkgCount, 4, '0', STR_PAD_LEFT);
        } while (Booking::where('booking_number', $bookingNumber)->exists());

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

        DB::transaction(function () use ($validated, $contact, $bookingNumber, $orderNumber, $savedAttachments) {
            $booking = Booking::create([
                'booking_number' => $bookingNumber,
                'order_number'   => $orderNumber,
                'invoice_number' => null,
                'contact_id'     => $contact->id,
                'booking_date'   => $validated['booking_date'],
                'status'         => 'QUOTE',
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

        return back()->with('success', "Quote / Booking {$bookingNumber} created successfully!");
    }

    public function update(Request $request, Booking $booking): RedirectResponse
    {
        $validated = $request->validate([
            'contact_name'    => 'required|string|max:255',
            'whatsapp_number' => 'nullable|string|max:50',
            'order_number'    => 'nullable|string|max:100',
            'booking_date'    => 'required|date',
            'status'          => 'nullable|string|max:50',
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
                'booking_date'   => $validated['booking_date'],
                'status'         => $validated['status'] ?? $booking->status ?? 'QUOTE',
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

        return back()->with('success', "Quote / Booking {$booking->booking_number} updated successfully!");
    }

    public function destroy(Booking $booking): RedirectResponse
    {
        DB::transaction(function () use ($booking) {
            $booking->lineItems()->delete();
            $booking->delete();
        });

        return back()->with('success', "Quote / Booking #{$booking->booking_number} deleted successfully.");
    }

    public function convertToInvoice(Booking $booking, AccountingService $accountingService): RedirectResponse
    {
        $invCount = Invoice::count();
        do {
            $invCount++;
            $invNumber = 'INV-' . date('Y') . '-' . str_pad($invCount, 4, '0', STR_PAD_LEFT);
        } while (Invoice::where('invoice_number', $invNumber)->exists());

        DB::transaction(function () use ($booking, $invNumber, $accountingService) {
            $invoice = Invoice::create([
                'invoice_number'   => $invNumber,
                'order_number'     => $booking->order_number,
                'contact_id'       => $booking->contact_id,
                'booking_id'       => $booking->id,
                'issue_date'       => now(),
                'due_date'         => now(),
                'status'           => 'UNPAID',
                'subtotal'         => $booking->total_amount,
                'tax_amount'       => 0,
                'discount_amount'  => 0,
                'shipping_charges' => 0.00,
                'adjustment'       => 0.00,
                'total_amount'     => $booking->total_amount,
                'paid_amount'      => 0.00,
                'notes'            => $booking->notes,
                'terms'            => 'Payment due within 14 days.',
                'attachments'      => $booking->attachments,
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
                'status'         => 'INVOICED',
                'invoice_number' => $invNumber,
            ]);
        });

        return back()->with('success', "Booking / Deal confirmed and converted to Invoice {$invNumber}!");
    }
}
