<?php

namespace App\Http\Controllers;

use App\Models\Bill;
use App\Models\Booking;
use App\Models\Contact;
use App\Models\Invoice;
use App\Models\Item;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function search(Request $request): JsonResponse
    {
        $q = trim((string)$request->get('q', ''));
        if (strlen($q) < 1) {
            return response()->json([
                'contacts' => [],
                'invoices' => [],
                'bills'    => [],
                'items'    => [],
                'bookings' => [],
            ]);
        }

        $contacts = Contact::where('name', 'like', "%{$q}%")
            ->orWhere('phone', 'like', "%{$q}%")
            ->orWhere('whatsapp_number', 'like', "%{$q}%")
            ->orWhere('email', 'like', "%{$q}%")
            ->limit(5)
            ->get(['id', 'name', 'phone', 'whatsapp_number', 'type']);

        $invoices = Invoice::with('contact')
            ->where('invoice_number', 'like', "%{$q}%")
            ->orWhere('order_number', 'like', "%{$q}%")
            ->orWhereHas('contact', fn($c) => $c->where('name', 'like', "%{$q}%"))
            ->limit(5)
            ->get(['id', 'invoice_number', 'order_number', 'contact_id', 'total_amount', 'paid_amount', 'status', 'issue_date']);

        $bills = Bill::with('contact')
            ->where('bill_number', 'like', "%{$q}%")
            ->orWhere('order_number', 'like', "%{$q}%")
            ->orWhereHas('contact', fn($c) => $c->where('name', 'like', "%{$q}%"))
            ->limit(5)
            ->get(['id', 'bill_number', 'contact_id', 'total_amount', 'paid_amount', 'status', 'issue_date']);

        $items = Item::where('name', 'like', "%{$q}%")
            ->orWhere('sku', 'like', "%{$q}%")
            ->limit(5)
            ->get(['id', 'name', 'sku', 'selling_price', 'purchase_price']);

        $bookings = Booking::with('contact')
            ->where('booking_number', 'like', "%{$q}%")
            ->orWhere('order_number', 'like', "%{$q}%")
            ->orWhereHas('contact', fn($c) => $c->where('name', 'like', "%{$q}%"))
            ->limit(5)
            ->get(['id', 'booking_number', 'order_number', 'contact_id', 'total_amount', 'status', 'booking_date']);

        return response()->json([
            'contacts' => $contacts,
            'invoices' => $invoices,
            'bills'    => $bills,
            'items'    => $items,
            'bookings' => $bookings,
        ]);
    }
}
