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
        $this->assertEquals('SENT', $draft->status);
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
}
