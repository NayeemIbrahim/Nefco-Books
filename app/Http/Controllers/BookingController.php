<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Contact;
use App\Models\Item;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BookingController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Bookings/Index', [
            'bookings' => Booking::with(['contact', 'lineItems.item'])->latest()->paginate(15),
            'contacts' => Contact::whereIn('type', ['CUSTOMER', 'BOTH'])->get(['id', 'name', 'whatsapp_number']),
            'items'    => Item::get(['id', 'name', 'sales_price', 'unit']),
        ]);
    }

    public function convertToInvoice(Booking $booking)
    {
        return redirect()->route('invoices.index', [
            'convert_booking_id' => $booking->id,
        ]);
    }
}
