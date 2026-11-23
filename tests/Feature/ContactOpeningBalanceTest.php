<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Contact;
use App\Models\JournalEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContactOpeningBalanceTest extends TestCase
{
    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::firstOrCreate(
            ['email' => 'test_ob_admin@example.com'],
            [
                'name'     => 'Test Admin',
                'password' => bcrypt('password'),
                'role'     => 'admin',
                'status'   => 'APPROVED',
            ]
        );

        // Ensure Chart of Accounts
        Account::firstOrCreate(['code' => '1100'], [
            'name' => 'Accounts Receivable', 'type' => 'ASSET', 'sub_type' => 'ACCOUNTS_RECEIVABLE', 'is_system' => true, 'balance' => 0.00
        ]);
        Account::firstOrCreate(['code' => '2000'], [
            'name' => 'Accounts Payable', 'type' => 'LIABILITY', 'sub_type' => 'ACCOUNTS_PAYABLE', 'is_system' => true, 'balance' => 0.00
        ]);
        Account::firstOrCreate(['code' => '3010'], [
            'name' => 'Opening Balance Equity', 'type' => 'EQUITY', 'sub_type' => 'EQUITY', 'is_system' => true, 'balance' => 0.00
        ]);
    }

    public function test_customer_creation_with_opening_balance_posts_balanced_journal_entry(): void
    {
        $initialAR = (float)Account::where('code', '1100')->value('balance');
        $initialEquity = (float)Account::where('code', '3010')->value('balance');

        $response = $this->actingAs($this->user)->post('/contacts', [
            'name'                 => 'Acme Customer OB ' . uniqid(),
            'type'                 => 'CUSTOMER',
            'opening_balance'      => 7500.00,
            'opening_balance_type' => 'TO_RECEIVE',
            'opening_balance_date' => '2026-01-01',
            'city'                 => 'Dhaka',
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect('/contacts');

        $contact = Contact::where('name', 'like', 'Acme Customer OB%')->latest()->first();
        $this->assertNotNull($contact);
        $this->assertEquals(7500.00, (float)$contact->opening_balance);
        $this->assertEquals('TO_RECEIVE', $contact->opening_balance_type);
        $this->assertEquals('2026-01-01', $contact->opening_balance_date->toDateString());
        $this->assertEquals(7500.00, (float)$contact->current_balance);

        // Verify Journal Entry
        $entry = JournalEntry::where('source_document_type', 'OPENING_BALANCE')
            ->where('source_document_id', $contact->id)
            ->first();

        $this->assertNotNull($entry);
        $this->assertEquals('JRN-OB-' . $contact->id, $entry->entry_number);
        $this->assertEquals('POSTED', $entry->status);

        // Check lines: Debit AR (1100) 7500, Credit Equity (3010) 7500
        $debitLine = $entry->lines()->whereHas('account', fn($q) => $q->where('code', '1100'))->first();
        $creditLine = $entry->lines()->whereHas('account', fn($q) => $q->where('code', '3010'))->first();

        $this->assertNotNull($debitLine);
        $this->assertEquals(7500.00, (float)$debitLine->debit);
        $this->assertEquals(0.00, (float)$debitLine->credit);

        $this->assertNotNull($creditLine);
        $this->assertEquals(0.00, (float)$creditLine->debit);
        $this->assertEquals(7500.00, (float)$creditLine->credit);

        // Check account balances
        $this->assertEquals($initialAR + 7500.00, (float)Account::where('code', '1100')->value('balance'));
        $this->assertEquals($initialEquity + 7500.00, (float)Account::where('code', '3010')->value('balance'));
    }

    public function test_vendor_creation_with_opening_balance_posts_balanced_journal_entry(): void
    {
        $initialAP = (float)Account::where('code', '2000')->value('balance');
        $initialEquity = (float)Account::where('code', '3010')->value('balance');

        $response = $this->actingAs($this->user)->post('/contacts', [
            'name'                 => 'Apex Supplies Vendor OB ' . uniqid(),
            'type'                 => 'VENDOR',
            'opening_balance'      => 12000.00,
            'opening_balance_type' => 'TO_PAY',
            'opening_balance_date' => '2026-01-15',
            'city'                 => 'Chittagong',
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect('/contacts');

        $contact = Contact::where('name', 'like', 'Apex Supplies Vendor OB%')->latest()->first();
        $this->assertNotNull($contact);
        $this->assertEquals(12000.00, (float)$contact->opening_balance);
        $this->assertEquals('TO_PAY', $contact->opening_balance_type);
        $this->assertEquals(12000.00, (float)$contact->current_balance);

        // Verify Journal Entry: Debit Equity (3010) 12000, Credit AP (2000) 12000
        $entry = JournalEntry::where('source_document_type', 'OPENING_BALANCE')
            ->where('source_document_id', $contact->id)
            ->first();

        $this->assertNotNull($entry);
        $creditLine = $entry->lines()->whereHas('account', fn($q) => $q->where('code', '2000'))->first();
        $debitLine = $entry->lines()->whereHas('account', fn($q) => $q->where('code', '3010'))->first();

        $this->assertEquals(12000.00, (float)$creditLine->credit);
        $this->assertEquals(12000.00, (float)$debitLine->debit);

        // Account balances
        $this->assertEquals($initialAP + 12000.00, (float)Account::where('code', '2000')->value('balance'));
        $this->assertEquals($initialEquity - 12000.00, (float)Account::where('code', '3010')->value('balance'));
    }

    public function test_updating_opening_balance_updates_without_duplicates(): void
    {
        $contact = Contact::create([
            'name'                 => 'Updateable Customer ' . uniqid(),
            'type'                 => 'CUSTOMER',
            'opening_balance'      => 5000.00,
            'opening_balance_type' => 'TO_RECEIVE',
            'opening_balance_date' => '2026-01-01',
        ]);

        app(\App\Services\AccountingService::class)->syncContactOpeningBalance($contact);

        $initialEntriesCount = JournalEntry::where('source_document_type', 'OPENING_BALANCE')
            ->where('source_document_id', $contact->id)
            ->count();
        $this->assertEquals(1, $initialEntriesCount);

        // Now update opening balance to 9000
        $response = $this->actingAs($this->user)->post("/contacts/{$contact->id}", [
            'name'                 => $contact->name,
            'type'                 => 'CUSTOMER',
            'opening_balance'      => 9000.00,
            'opening_balance_type' => 'TO_RECEIVE',
            'opening_balance_date' => '2026-02-01',
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect('/contacts');

        $contact->refresh();
        $this->assertEquals(9000.00, (float)$contact->opening_balance);
        $this->assertEquals(9000.00, (float)$contact->current_balance);

        // Ensure STILL exactly ONE journal entry exists (NO DUPLICATES)
        $newEntriesCount = JournalEntry::where('source_document_type', 'OPENING_BALANCE')
            ->where('source_document_id', $contact->id)
            ->count();
        $this->assertEquals(1, $newEntriesCount);

        $entry = JournalEntry::where('source_document_type', 'OPENING_BALANCE')
            ->where('source_document_id', $contact->id)
            ->first();

        $debitLine = $entry->lines()->whereHas('account', fn($q) => $q->where('code', '1100'))->first();
        $this->assertEquals(9000.00, (float)$debitLine->debit);
    }

    public function test_clearing_opening_balance_reverses_and_removes_journal_entry(): void
    {
        $contact = Contact::create([
            'name'                 => 'Clearing Customer ' . uniqid(),
            'type'                 => 'CUSTOMER',
            'opening_balance'      => 4000.00,
            'opening_balance_type' => 'TO_RECEIVE',
            'opening_balance_date' => '2026-01-01',
        ]);

        app(\App\Services\AccountingService::class)->syncContactOpeningBalance($contact);

        $this->assertEquals(1, JournalEntry::where('source_document_id', $contact->id)->where('source_document_type', 'OPENING_BALANCE')->count());

        // Update opening balance to 0
        $response = $this->actingAs($this->user)->post("/contacts/{$contact->id}", [
            'name'                 => $contact->name,
            'type'                 => 'CUSTOMER',
            'opening_balance'      => 0.00,
            'opening_balance_type' => 'TO_RECEIVE',
        ]);

        $response->assertSessionHasNoErrors();

        // Journal entry must be gone
        $this->assertEquals(0, JournalEntry::where('source_document_id', $contact->id)->where('source_document_type', 'OPENING_BALANCE')->count());

        $contact->refresh();
        $this->assertEquals(0.00, (float)$contact->current_balance);
    }

    public function test_contact_ledger_json_endpoint_returns_chronological_entries(): void
    {
        $contact = Contact::create([
            'name'                 => 'Ledger View Customer ' . uniqid(),
            'type'                 => 'CUSTOMER',
            'opening_balance'      => 3500.00,
            'opening_balance_type' => 'TO_RECEIVE',
            'opening_balance_date' => '2026-01-01',
        ]);

        app(\App\Services\AccountingService::class)->syncContactOpeningBalance($contact);

        $response = $this->actingAs($this->user)->get("/contacts/{$contact->id}/ledger");
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'contact',
            'current_balance',
            'opening_balance',
            'entries' => [
                '*' => ['id', 'date', 'type', 'reference', 'description', 'debit', 'credit', 'running_balance']
            ]
        ]);

        $data = $response->json();
        $this->assertEquals(3500.00, (float)$data['current_balance']);
        $this->assertCount(1, $data['entries']);
        $this->assertEquals('OPENING_BALANCE', $data['entries'][0]['type']);
        $this->assertEquals(3500.00, (float)$data['entries'][0]['debit']);
        $this->assertEquals(3500.00, (float)$data['entries'][0]['running_balance']);
    }
}
