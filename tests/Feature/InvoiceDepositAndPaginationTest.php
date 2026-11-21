<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Bill;
use App\Models\Booking;
use App\Models\Contact;
use App\Models\Invoice;
use App\Models\JournalEntry;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvoiceDepositAndPaginationTest extends TestCase
{
    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::first() ?? User::factory()->create();
    }

    public function test_invoice_with_deposit_records_payment_and_balances_ledger(): void
    {
        $contact = Contact::create([
            'name'            => 'Test Deposit Customer',
            'type'            => 'CUSTOMER',
            'currency'        => 'BDT',
            'whatsapp_number' => '+8801700000001',
        ]);

        $account = Account::where('code', '1010')->first(); // Main Bank

        $response = $this->actingAs($this->user)->post('/invoices', [
            'contact_id'             => $contact->id,
            'issue_date'             => '2026-11-19',
            'due_date'               => '2026-11-19',
            'subtotal'               => 10000,
            'total_amount'           => 10000,
            'deposit_amount'         => 4000,
            'deposit_account_id'     => $account->id,
            'deposit_payment_method' => 'BANK_TRANSFER',
            'deposit_reference'      => 'TRX-DEP-9988',
            'line_items'             => [
                [
                    'description' => 'Accounting Software Setup',
                    'quantity'    => 1,
                    'unit_price'  => 10000,
                    'amount'      => 10000,
                ],
            ],
        ]);

        $response->assertSessionHasNoErrors();

        $invoice = Invoice::where('contact_id', $contact->id)->latest('id')->first();
        $this->assertNotNull($invoice);
        $this->assertEquals(10000, (float)$invoice->total_amount);
        $this->assertEquals(4000, (float)$invoice->paid_amount);
        $this->assertEquals('PARTIALLY_PAID', $invoice->status);

        // Check payment record
        $payment = Payment::where('invoice_id', $invoice->id)->first();
        $this->assertNotNull($payment);
        $this->assertEquals(4000, (float)$payment->amount);
        $this->assertEquals('CUSTOMER_PAYMENT', $payment->type);
        $this->assertEquals('BANK_TRANSFER', $payment->payment_method);
        $this->assertEquals('TRX-DEP-9988', $payment->reference_number);

        // Check journal entries posted
        $invoiceJournal = JournalEntry::where('source_document_type', 'INVOICE')
            ->where('source_document_id', $invoice->id)
            ->first();
        $this->assertNotNull($invoiceJournal);

        $paymentJournal = JournalEntry::where('source_document_type', 'PAYMENT')
            ->where('source_document_id', $payment->id)
            ->first();
        $this->assertNotNull($paymentJournal);
    }

    public function test_draft_invoice_moves_to_bookings_and_can_be_issued(): void
    {
        $contact = Contact::create([
            'name'            => 'Draft Order Client',
            'type'            => 'CUSTOMER',
            'currency'        => 'BDT',
            'whatsapp_number' => '+8801700000002',
        ]);

        $response = $this->actingAs($this->user)->post('/invoices', [
            'contact_id'             => $contact->id,
            'issue_date'             => '2026-11-19',
            'due_date'               => '2026-11-19',
            'status'                 => 'DRAFT',
            'subtotal'               => 5000,
            'total_amount'           => 5000,
            'line_items'             => [
                [
                    'description' => 'Draft Consultation Order',
                    'quantity'    => 1,
                    'unit_price'  => 5000,
                    'amount'      => 5000,
                ],
            ],
        ]);

        $response->assertSessionHasNoErrors();

        $draft = Invoice::where('contact_id', $contact->id)->latest('id')->first();
        $this->assertNotNull($draft);
        $this->assertEquals('DRAFT', $draft->status);

        // Verify draft invoice shows up in bookings index
        $bookingsResponse = $this->actingAs($this->user)->get('/sales/bookings');
        $bookingsResponse->assertStatus(200);
        $bookingsResponse->assertInertia(fn ($page) =>
            $page->component('Bookings/Index')
                ->has('draft_invoices')
        );

        // Issue draft invoice
        $issueResponse = $this->actingAs($this->user)->post("/invoices/{$draft->id}/issue");
        $issueResponse->assertSessionHas('success');

        $draft->refresh();
        $this->assertEquals('UNPAID', $draft->status);
    }

    public function test_invoice_and_bills_status_filtering(): void
    {
        $responseInvoices = $this->actingAs($this->user)->get('/invoices?status=UNPAID');
        $responseInvoices->assertStatus(200);

        $responsePartiallyPaid = $this->actingAs($this->user)->get('/invoices?status=PARTIALLY_PAID');
        $responsePartiallyPaid->assertStatus(200);

        $responsePaid = $this->actingAs($this->user)->get('/invoices?status=PAID');
        $responsePaid->assertStatus(200);

        $responseOverdue = $this->actingAs($this->user)->get('/invoices?status=OVERDUE');
        $responseOverdue->assertStatus(200);

        $responseBillsUnpaid = $this->actingAs($this->user)->get('/bills?status=UNPAID');
        $responseBillsUnpaid->assertStatus(200);

        $responseBillsPartiallyPaid = $this->actingAs($this->user)->get('/bills?status=PARTIALLY_PAID');
        $responseBillsPartiallyPaid->assertStatus(200);

        $responseBillsPaid = $this->actingAs($this->user)->get('/bills?status=PAID');
        $responseBillsPaid->assertStatus(200);

        $responseBillsOverdue = $this->actingAs($this->user)->get('/bills?status=OVERDUE');
        $responseBillsOverdue->assertStatus(200);
    }

    public function test_invoice_with_full_deposit_sets_status_paid(): void
    {
        $contact = Contact::create([
            'name'            => 'Full Payment Client',
            'type'            => 'CUSTOMER',
            'currency'        => 'BDT',
            'whatsapp_number' => '+8801700000003',
        ]);

        $account = Account::where('code', '1000')->first();

        $response = $this->actingAs($this->user)->post('/invoices', [
            'contact_id'             => $contact->id,
            'issue_date'             => '2026-11-19',
            'due_date'               => '2026-11-19',
            'subtotal'               => 7500,
            'total_amount'           => 7500,
            'deposit_amount'         => 7500,
            'deposit_account_id'     => $account->id,
            'deposit_payment_method' => 'CASH',
            'line_items'             => [
                [
                    'description' => 'Full Service Fee',
                    'quantity'    => 1,
                    'unit_price'  => 7500,
                    'amount'      => 7500,
                ],
            ],
        ]);

        $response->assertSessionHasNoErrors();

        $invoice = Invoice::where('contact_id', $contact->id)->latest('id')->first();
        $this->assertNotNull($invoice);
        $this->assertEquals(7500, (float)$invoice->total_amount);
        $this->assertEquals(7500, (float)$invoice->paid_amount);
        $this->assertEquals('PAID', $invoice->status);
    }

    public function test_draft_invoice_can_be_deleted_and_sent_invoice_cannot(): void
    {
        $uid = uniqid();
        $contact = Contact::create([
            'name'            => 'Draft Delete Client ' . $uid,
            'type'            => 'CUSTOMER',
            'currency'        => 'BDT',
            'whatsapp_number' => '+88017' . substr($uid, -8),
        ]);

        $draft = Invoice::create([
            'invoice_number' => 'INV-TEST-DRAFT-' . $uid,
            'contact_id'     => $contact->id,
            'issue_date'     => now(),
            'due_date'       => now(),
            'status'         => 'DRAFT',
            'subtotal'       => 2000,
            'total_amount'   => 2000,
            'paid_amount'    => 0,
        ]);
        $draft->lineItems()->create([
            'description' => 'Draft Item',
            'quantity'    => 1,
            'unit_price'  => 2000,
            'amount'      => 2000,
        ]);

        // Delete draft invoice
        $delResponse = $this->actingAs($this->user)->delete("/invoices/{$draft->id}");
        $delResponse->assertSessionHas('success');
        $this->assertDatabaseMissing('invoices', ['id' => $draft->id]);

        // Now test that an issued UNPAID invoice cannot be deleted
        $unpaidInv = Invoice::create([
            'invoice_number' => 'INV-TEST-UNPAID-' . $uid,
            'contact_id'     => $contact->id,
            'issue_date'     => now(),
            'due_date'       => now(),
            'status'         => 'UNPAID',
            'subtotal'       => 3000,
            'total_amount'   => 3000,
            'paid_amount'    => 0,
        ]);

        $failDelResponse = $this->actingAs($this->user)->delete("/invoices/{$unpaidInv->id}");
        $failDelResponse->assertSessionHas('error');
        $this->assertDatabaseHas('invoices', ['id' => $unpaidInv->id]);
    }

    public function test_booking_quote_can_be_deleted_and_converted_to_invoice(): void
    {
        $uid = uniqid();
        $contact = Contact::create([
            'name'            => 'Quote Customer ' . $uid,
            'type'            => 'CUSTOMER',
            'currency'        => 'BDT',
            'whatsapp_number' => '+88018' . substr($uid, -8),
        ]);

        $booking = Booking::create([
            'booking_number' => 'BKG-TEST-' . $uid,
            'contact_id'     => $contact->id,
            'booking_date'   => now(),
            'status'         => 'QUOTE',
            'total_amount'   => 4500,
        ]);
        $booking->lineItems()->create([
            'description' => 'Test Service Item',
            'quantity'    => 1,
            'unit_price'  => 4500,
            'amount'      => 4500,
        ]);

        // Convert quote to invoice
        $convertResponse = $this->actingAs($this->user)->post("/bookings/{$booking->id}/convert");
        $convertResponse->assertSessionHas('success');

        $booking->refresh();
        $this->assertEquals('INVOICED', $booking->status);
        $this->assertNotNull($booking->invoice_number);

        // Delete booking
        $delResponse = $this->actingAs($this->user)->delete("/bookings/{$booking->id}");
        $delResponse->assertSessionHas('success');
        $this->assertDatabaseMissing('bookings', ['id' => $booking->id]);
    }

    public function test_bill_marked_as_paid_sets_paid_amount_equal_to_total(): void
    {
        $uid = uniqid();
        $contact = Contact::create([
            'name'            => 'Test Vendor ' . $uid,
            'type'            => 'VENDOR',
            'currency'        => 'BDT',
            'whatsapp_number' => '+88019' . substr($uid, -8),
        ]);

        $bill = Bill::create([
            'bill_number'  => 'BILL-TEST-PAID-' . $uid,
            'contact_id'   => $contact->id,
            'bill_date'    => now(),
            'due_date'     => now()->addDays(2),
            'status'       => 'RECEIVED',
            'subtotal'     => 8000,
            'total_amount' => 8000,
            'paid_amount'  => 0,
        ]);

        $response = $this->actingAs($this->user)->post("/bills/{$bill->id}/mark-paid");
        $response->assertSessionHas('success');

        $bill->refresh();
        $this->assertEquals('PAID', $bill->status);
        $this->assertEquals(8000, (float)$bill->paid_amount);
    }

    public function test_bill_with_initial_payment_sets_partially_paid_and_creates_vendor_payment(): void
    {
        $uid = uniqid();
        $vendor = Contact::create([
            'name'            => 'Partially Paid Vendor ' . $uid,
            'type'            => 'VENDOR',
            'currency'        => 'BDT',
            'whatsapp_number' => '+88019' . substr($uid, -8),
        ]);

        $account = Account::where('code', '1010')->first(); // Main Bank

        $response = $this->actingAs($this->user)->post('/bills', [
            'contact_name'           => $vendor->name,
            'whatsapp_number'        => $vendor->whatsapp_number,
            'bill_date'              => '2026-11-20',
            'due_date'               => '2026-11-22',
            'subtotal'               => 12000,
            'total_amount'           => 12000,
            'deposit_amount'         => 5000,
            'deposit_account_id'     => $account->id,
            'deposit_payment_method' => 'BANK_TRANSFER',
            'deposit_reference'      => 'TRX-VPAY-1122',
            'line_items'             => [
                [
                    'description' => 'Office Equipment',
                    'quantity'    => 1,
                    'unit_price'  => 12000,
                    'amount'      => 12000,
                ],
            ],
        ]);

        $response->assertSessionHasNoErrors();

        $bill = Bill::where('contact_id', $vendor->id)->latest('id')->first();
        $this->assertNotNull($bill);
        $this->assertEquals('PARTIALLY_PAID', $bill->status);
        $this->assertEquals(12000, (float)$bill->total_amount);
        $this->assertEquals(5000, (float)$bill->paid_amount);

        // Check Vendor Payment record
        $payment = Payment::where('bill_id', $bill->id)->first();
        $this->assertNotNull($payment);
        $this->assertEquals('VENDOR_PAYMENT', $payment->type);
        $this->assertEquals(5000, (float)$payment->amount);
        $this->assertEquals('BANK_TRANSFER', $payment->payment_method);
        $this->assertEquals('TRX-VPAY-1122', $payment->reference_number);

        // Check general ledger entries
        $billJournal = JournalEntry::where('source_document_type', 'BILL')
            ->where('source_document_id', $bill->id)
            ->first();
        $this->assertNotNull($billJournal);

        $paymentJournal = JournalEntry::where('source_document_type', 'PAYMENT')
            ->where('source_document_id', $payment->id)
            ->first();
        $this->assertNotNull($paymentJournal);
    }

    public function test_create_new_booking_quote_deal(): void
    {
        $response = $this->actingAs($this->user)->post('/bookings', [
            'contact_name'    => 'New Deal Customer',
            'whatsapp_number' => '+8801712345678',
            'order_number'    => 'ORD-2026-0001',
            'booking_date'    => '2026-11-22',
            'total_amount'    => 5000,
            'line_items'      => [
                [
                    'description' => 'Website Development',
                    'quantity'    => 1,
                    'unit_price'  => 5000,
                    'amount'      => 5000,
                ],
            ],
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();
    }

    public function test_create_quote_via_sales_bookings_with_auto_order_number(): void
    {
        $response = $this->actingAs($this->user)->post('/sales/bookings', [
            'contact_name'    => 'Auto Order Client',
            'whatsapp_number' => '',
            'booking_date'    => '2026-11-22',
            'total_amount'    => 12500,
            'line_items'      => [
                [
                    'item_id'     => '',
                    'description' => 'Custom Consulting Services',
                    'quantity'    => 2.5,
                    'unit_price'  => 5000,
                    'amount'      => 12500,
                ],
            ],
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $booking = Booking::where('total_amount', 12500)->latest()->first();
        $this->assertNotNull($booking);
        $this->assertNotNull($booking->order_number);
        $this->assertEquals('QUOTE', $booking->status);
    }

    public function test_paying_bill_from_popup_and_viewing_bills_props(): void
    {
        $vendor = Contact::create([
            'name'     => 'Popup Test Vendor ' . uniqid(),
            'type'     => 'VENDOR',
            'currency' => 'BDT',
        ]);
        $bill = Bill::create([
            'bill_number'  => 'BIL-TEST-POPUP-' . uniqid(),
            'contact_id'   => $vendor->id,
            'issue_date'   => now(),
            'due_date'     => now()->addDays(2),
            'status'       => 'UNPAID',
            'subtotal'     => 10000,
            'total_amount' => 10000,
            'paid_amount'  => 0,
        ]);
        $account = Account::where('code', '1000')->first();

        // 1. Pay via payments-made
        $payResponse = $this->actingAs($this->user)->from('/purchases/bills')->post('/purchases/payments-made', [
            'contact_id'     => $vendor->id,
            'bill_id'        => $bill->id,
            'amount'         => 6000,
            'account_id'     => $account->id,
            'payment_method' => 'CASH',
            'payment_date'   => now()->toDateString(),
        ]);
        $payResponse->assertSessionHasNoErrors();
        $payResponse->assertRedirect('/purchases/bills');

        // 2. Visit /bills and /purchases/bills
        $billsResponse = $this->actingAs($this->user)->get('/purchases/bills');
        $billsResponse->assertStatus(200);
        $billsResponse->assertInertia(fn ($page) =>
            $page->component('Bills/Index')
                ->has('bills')
                ->has('deposit_accounts')
        );
    }
}
