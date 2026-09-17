<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreInvoiceRequest;
use App\Jobs\SendWhatsAppInvoiceJob;
use App\Models\Booking;
use App\Models\Contact;
use App\Models\Invoice;
use App\Models\Item;
use App\Services\AccountingService;
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
        $contacts = Contact::whereIn('type', ['CUSTOMER', 'BOTH'])->get(['id', 'name', 'whatsapp_number']);
        $items    = Item::get(['id', 'name', 'sku', 'sales_price', 'unit']);

        return Inertia::render('Invoices/Index', [
            'invoices' => $invoices,
            'contacts' => $contacts,
            'items'    => $items,
            'filters'  => $request->only(['search', 'status']),
        ]);
    }

    public function store(StoreInvoiceRequest $request)
    {
        $validated = $request->validated();

        $invoice = DB::transaction(function () use ($validated) {
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

            $taxAmount = (float)($validated['tax_amount'] ?? 0);
            $discountAmount = (float)($validated['discount_amount'] ?? 0);
            $totalAmount = round($subtotal + $taxAmount - $discountAmount, 2);

            $invNumber = 'INV-' . date('Y') . '-' . str_pad((string)(Invoice::count() + 1), 4, '0', STR_PAD_LEFT);

            $invoice = Invoice::create([
                'invoice_number'  => $invNumber,
                'contact_id'      => $validated['contact_id'],
                'booking_id'      => $validated['booking_id'] ?? null,
                'issue_date'      => $validated['issue_date'] ?? now(),
                'due_date'        => $validated['due_date'],
                'status'          => 'SENT',
                'subtotal'        => $subtotal,
                'tax_amount'      => $taxAmount,
                'discount_amount' => $discountAmount,
                'total_amount'    => $totalAmount,
                'paid_amount'     => 0.00,
                'notes'           => $validated['notes'] ?? null,
                'terms'           => $validated['terms'] ?? 'Payment due within 14 days.',
            ]);

            $invoice->lineItems()->createMany($lineItemsData);

            // Double-entry posting
            $this->accountingService->postInvoice($invoice);

            if (!empty($validated['booking_id'])) {
                Booking::where('id', $validated['booking_id'])->update(['status' => 'COMPLETED']);
            }

            return $invoice;
        });

        // WhatsApp notification queue
        SendWhatsAppInvoiceJob::dispatch($invoice);

        return redirect()->route('invoices.index')->with('success', "Invoice #{$invoice->invoice_number} generated!");
    }

    public function sendWhatsApp(Invoice $invoice)
    {
        SendWhatsAppInvoiceJob::dispatch($invoice);

        return back()->with('success', "WhatsApp notification dispatched to {$invoice->contact->name}.");
    }
}
