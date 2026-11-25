<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Contact;
use App\Models\Invoice;
use App\Models\JournalEntry;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Models\User;
use App\Services\ReportService;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PaymentAllocationTest extends TestCase
{
    protected User $user;
    protected Account $cashAccount;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::first() ?? User::create([
            'name'     => 'Allocation Tester',
            'email'    => 'alloc_tester@example.com',
            'password' => bcrypt('password'),
            'role'     => 'admin',
            'status'   => 'APPROVED',
        ]);

        $this->cashAccount = Account::where('code', '1000')->first()
            ?? Account::where('type', 'ASSET')->first();
    }

    public function test_fifo_allocates_single_payment_across_multiple_invoices_and_records_single_ledger_entry(): void
    {
        $customer = Contact::create([
            'name'            => 'FIFO Multi Customer ' . uniqid(),
            'type'            => 'CUSTOMER',
            'currency'        => 'BDT',
            'whatsapp_number' => '+8801711111111',
        ]);

        // Create 3 invoices with different due dates
        $invOldest = Invoice::create([
            'invoice_number' => 'INV-FIFO-1-' . uniqid(),
            'contact_id'     => $customer->id,
            'issue_date'     => '2026-10-01',
            'due_date'       => '2026-10-05',
            'status'         => 'SENT',
            'subtotal'       => 1000,
            'total_amount'   => 1000,
            'paid_amount'    => 0,
        ]);

        $invMiddle = Invoice::create([
            'invoice_number' => 'INV-FIFO-2-' . uniqid(),
            'contact_id'     => $customer->id,
            'issue_date'     => '2026-10-10',
            'due_date'       => '2026-10-15',
            'status'         => 'SENT',
            'subtotal'       => 1500,
            'total_amount'   => 1500,
            'paid_amount'    => 0,
        ]);

        $invNewest = Invoice::create([
            'invoice_number' => 'INV-FIFO-3-' . uniqid(),
            'contact_id'     => $customer->id,
            'issue_date'     => '2026-10-20',
            'due_date'       => '2026-10-25',
            'status'         => 'SENT',
            'subtotal'       => 2000,
            'total_amount'   => 2000,
            'paid_amount'    => 0,
        ]);

        // Single payment of 1800 with default FIFO allocation
        $response = $this->actingAs($this->user)->post('/sales/payments-received', [
            'contact_id'       => $customer->id,
            'account_id'       => $this->cashAccount->id,
            'payment_date'     => '2026-11-01',
            'amount'           => 1800,
            'payment_method'   => 'BANK_TRANSFER',
            'reference_number' => 'TRX-FIFO-1800',
        ]);

        $response->assertSessionHasNoErrors();

        // Only ONE payment record and ONE journal entry created
        $payments = Payment::where('contact_id', $customer->id)->where('type', 'CUSTOMER_PAYMENT')->get();
        $this->assertCount(1, $payments);
        $payment = $payments->first();
        $this->assertEquals(1800.00, (float) $payment->amount);

        $journals = JournalEntry::where('source_document_type', 'PAYMENT')
            ->where('source_document_id', $payment->id)
            ->get();
        $this->assertCount(1, $journals);

        // Verify FIFO allocations: 1000 to oldest, 800 to middle, 0 to newest
        $invOldest->refresh();
        $invMiddle->refresh();
        $invNewest->refresh();

        $this->assertEquals(1000.00, (float) $invOldest->paid_amount);
        $this->assertEquals('PAID', $invOldest->status);

        $this->assertEquals(800.00, (float) $invMiddle->paid_amount);
        $this->assertEquals('PARTIALLY_PAID', $invMiddle->status);

        $this->assertEquals(0.00, (float) $invNewest->paid_amount);
        $this->assertEquals('SENT', $invNewest->status);

        // Verify unallocated is 0
        $this->assertEquals(1800.00, $payment->allocated_amount);
        $this->assertEquals(0.00, $payment->unallocated_amount);

        // Verify customer balance: (1000 + 1500 + 2000) - 1800 = 2700
        $customer->refresh();
        $this->assertEquals(2700.00, (float) $customer->current_balance);
    }

    public function test_excess_payment_becomes_customer_advance_and_statement_shows_allocations(): void
    {
        $customer = Contact::create([
            'name'     => 'Advance Customer ' . uniqid(),
            'type'     => 'CUSTOMER',
            'currency' => 'BDT',
        ]);

        $inv = Invoice::create([
            'invoice_number' => 'INV-ADV-1-' . uniqid(),
            'contact_id'     => $customer->id,
            'issue_date'     => '2026-11-01',
            'due_date'       => '2026-11-05',
            'status'         => 'SENT',
            'subtotal'       => 1000,
            'total_amount'   => 1000,
            'paid_amount'    => 0,
        ]);

        // Pay 1500 against 1000 invoice -> 1000 allocated, 500 advance
        $this->actingAs($this->user)->post('/sales/payments-received', [
            'contact_id'       => $customer->id,
            'account_id'       => $this->cashAccount->id,
            'payment_date'     => '2026-11-06',
            'amount'           => 1500,
            'payment_method'   => 'CASH',
            'reference_number' => 'ADV-REF-01',
        ])->assertSessionHasNoErrors();

        $payment = Payment::where('contact_id', $customer->id)->first();
        $inv->refresh();

        $this->assertEquals('PAID', $inv->status);
        $this->assertEquals(1000.00, (float) $inv->paid_amount);
        $this->assertEquals(1000.00, $payment->allocated_amount);
        $this->assertEquals(500.00, $payment->unallocated_amount);

        // Customer balance should be -500 (credit/advance)
        $customer->refresh();
        $this->assertEquals(-500.00, (float) $customer->current_balance);

        // Customer Statement must show payment once with reference, date, amount, and allocation details
        $statement = app(ReportService::class)->getCustomerStatement($customer->id, ['preset' => 'ALL_TIME']);
        $paymentEntries = collect($statement['entries'])->where('type', 'PAYMENT');
        $this->assertCount(1, $paymentEntries);

        $payEntry = $paymentEntries->first();
        $this->assertEquals('2026-11-06', $payEntry['date']);
        $this->assertEquals('ADV-REF-01', $payEntry['reference_number']);
        $this->assertEquals(1500.00, $payEntry['credit']);
        $this->assertEquals(500.00, $payEntry['unallocated_amount']);
        $this->assertCount(1, $payEntry['allocations']);
        $this->assertEquals($inv->invoice_number, $payEntry['allocations'][0]['invoice_number']);
        $this->assertEquals(-500.00, $payEntry['running_balance']);
    }

    public function test_manual_allocation_update_recalculates_invoices_and_prevents_overallocation(): void
    {
        $customer = Contact::create([
            'name'     => 'Manual Alloc Customer ' . uniqid(),
            'type'     => 'CUSTOMER',
            'currency' => 'BDT',
        ]);

        $inv1 = Invoice::create([
            'invoice_number' => 'INV-MAN-1-' . uniqid(),
            'contact_id'     => $customer->id,
            'issue_date'     => '2026-11-01',
            'due_date'       => '2026-11-02',
            'status'         => 'SENT',
            'subtotal'       => 1000,
            'total_amount'   => 1000,
            'paid_amount'    => 0,
        ]);

        $inv2 = Invoice::create([
            'invoice_number' => 'INV-MAN-2-' . uniqid(),
            'contact_id'     => $customer->id,
            'issue_date'     => '2026-11-03',
            'due_date'       => '2026-11-10',
            'status'         => 'SENT',
            'subtotal'       => 1000,
            'total_amount'   => 1000,
            'paid_amount'    => 0,
        ]);

        // Manually allocate 1000 entirely to inv2 (skipping inv1)
        $this->actingAs($this->user)->post('/sales/payments-received', [
            'contact_id'      => $customer->id,
            'account_id'      => $this->cashAccount->id,
            'payment_date'    => '2026-11-12',
            'amount'          => 1000,
            'payment_method'  => 'CASH',
            'allocation_mode' => 'MANUAL',
            'allocations'     => [
                ['invoice_id' => $inv2->id, 'amount' => 1000],
            ],
        ])->assertSessionHasNoErrors();

        $inv1->refresh();
        $inv2->refresh();
        $this->assertEquals('SENT', $inv1->status);
        $this->assertEquals(0.00, (float) $inv1->paid_amount);
        $this->assertEquals('PAID', $inv2->status);
        $this->assertEquals(1000.00, (float) $inv2->paid_amount);

        $payment = Payment::where('contact_id', $customer->id)->first();

        // Attempt over-allocation (> payment amount) -> must fail validation
        $overAllocResp = $this->actingAs($this->user)->post("/sales/payments-received/{$payment->id}/allocations", [
            'allocations' => [
                ['invoice_id' => $inv1->id, 'amount' => 600],
                ['invoice_id' => $inv2->id, 'amount' => 600],
            ],
        ]);
        $overAllocResp->assertSessionHasErrors('allocations');

        // Reallocate: 400 to inv1, 600 to inv2
        $this->actingAs($this->user)->post("/sales/payments-received/{$payment->id}/allocations", [
            'allocations' => [
                ['invoice_id' => $inv1->id, 'amount' => 400],
                ['invoice_id' => $inv2->id, 'amount' => 600],
            ],
        ])->assertSessionHasNoErrors();

        $inv1->refresh();
        $inv2->refresh();
        $this->assertEquals(400.00, (float) $inv1->paid_amount);
        $this->assertEquals('PARTIALLY_PAID', $inv1->status);
        $this->assertEquals(600.00, (float) $inv2->paid_amount);
        $this->assertEquals('PARTIALLY_PAID', $inv2->status);

        // Delete payment -> reverses both invoices back to SENT (0 paid)
        $this->actingAs($this->user)->delete("/sales/payments-received/{$payment->id}")
            ->assertSessionHasNoErrors();

        $inv1->refresh();
        $inv2->refresh();
        $this->assertEquals(0.00, (float) $inv1->paid_amount);
        $this->assertEquals('SENT', $inv1->status);
        $this->assertEquals(0.00, (float) $inv2->paid_amount);
        $this->assertEquals('SENT', $inv2->status);
    }
}
