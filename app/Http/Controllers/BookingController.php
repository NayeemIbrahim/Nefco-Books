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
    public function index(): Response
    {
        return Inertia::render('Bookings/Index', [
            'bookings' => Booking::with(['contact', 'lineItems.item'])->latest()->paginate(25),
            'contacts' => Contact::whereIn('type', ['CUSTOMER', 'BOTH'])->get(['id', 'name', 'phone', 'whatsapp_number']),
            'items'    => Item::orderBy('name')->get(['id', 'name', 'sku', 'sales_price', 'unit']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'contact_name'    => 'required|string|max:255',
            'whatsapp_number' => 'nullable|string|max:50',
            'booking_date'    => 'required|date',
            'notes'           => 'nullable|string',
            'total_amount'    => 'required|numeric|min:0',
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

        DB::transaction(function () use ($validated, $contact, $bookingNumber) {
            $booking = Booking::create([
                'booking_number' => $bookingNumber,
                'contact_id'     => $contact->id,
                'booking_date'   => $validated['booking_date'],
                'status'         => 'CONFIRMED',
                'total_amount'   => $validated['total_amount'],
                'notes'          => $validated['notes'] ?? null,
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
            'booking_date'    => 'required|date',
            'status'          => 'required|in:PENDING,CONFIRMED,COMPLETED,CANCELLED',
            'notes'           => 'nullable|string',
            'total_amount'    => 'required|numeric|min:0',
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

        DB::transaction(function () use ($validated, $contact, $booking) {
            $booking->update([
                'contact_id'   => $contact->id,
                'booking_date' => $validated['booking_date'],
                'status'       => $validated['status'],
                'total_amount' => $validated['total_amount'],
                'notes'        => $validated['notes'] ?? null,
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
            $booking->update(['status' => 'COMPLETED']);
        });

        return redirect()->route('invoices.index')->with('success', "Booking converted to Invoice {$invNumber}!");
    }
}
