<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\Contact;
use App\Models\Invoice;
use App\Models\Item;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ItemCategoriesAndQuickSellTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        if (User::count() === 0) {
            User::create([
                'name'         => 'Admin User',
                'email'        => 'admin@nefcobooks.com',
                'password'     => bcrypt('password'),
                'role'         => 'admin',
                'status'       => 'APPROVED',
                'enable_stock' => false,
            ]);
        }
    }

    public function test_can_manage_categories_in_settings(): void
    {
        $user = User::first();
        $this->actingAs($user);

        // Create Item Category
        $response = $this->post(route('settings.categories.store'), [
            'name'        => 'Custom Hardware',
            'type'        => 'ITEM',
            'description' => 'Custom server hardware',
        ]);
        $response->assertRedirect();
        $this->assertDatabaseHas('categories', [
            'name' => 'Custom Hardware',
            'type' => 'ITEM',
        ]);

        $category = Category::where('name', 'Custom Hardware')->first();

        // Update Category
        $response = $this->post(route('settings.categories.update', $category), [
            'name'        => 'Custom Hardware & Parts',
            'description' => 'Updated description',
        ]);
        $response->assertRedirect();
        $this->assertDatabaseHas('categories', [
            'id'   => $category->id,
            'name' => 'Custom Hardware & Parts',
        ]);

        // Delete Category
        $response = $this->delete(route('settings.categories.destroy', $category));
        $response->assertRedirect();
        $this->assertDatabaseMissing('categories', [
            'id' => $category->id,
        ]);
    }

    public function test_can_toggle_enable_stock_in_settings(): void
    {
        $user = User::first();
        $this->actingAs($user);

        $response = $this->post(route('settings.company'), [
            'company_name'    => 'Nefco Test',
            'currency_symbol' => '৳',
            'currency_code'   => 'BDT',
            'enable_stock'    => true,
        ]);
        $response->assertRedirect();
        $this->assertTrue((bool)$user->fresh()->enable_stock);
    }

    public function test_items_index_renders_with_customers_and_categories(): void
    {
        $user = User::first();
        $this->actingAs($user);

        Contact::firstOrCreate(
            ['name' => 'Test Customer Prop'],
            [
                'type' => 'CUSTOMER',
                'currency' => 'BDT',
                'phone' => '01888999000',
            ]
        );

        $response = $this->get(route('items.index'));
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Items/Index')
            ->has('items')
            ->has('categories')
            ->has('customers')
            ->has('payment_accounts')
        );
    }

    public function test_can_create_and_delete_item(): void
    {
        $user = User::first();
        $this->actingAs($user);

        $category = Category::firstOrCreate([
            'name' => 'Monitors' . uniqid(),
            'type' => 'ITEM',
        ]);

        $response = $this->post(route('items.store'), [
            'name'           => 'Dell 24 Inch IPS Monitor',
            'category_id'    => $category->id,
            'sales_price'    => 18500.00,
            'purchase_price' => 15000.00,
            'unit'           => 'Pcs',
            'stock_quantity' => 10,
        ]);
        $response->assertRedirect();
        $this->assertDatabaseHas('items', [
            'name'        => 'Dell 24 Inch IPS Monitor',
            'category_id' => $category->id,
        ]);

        $item = Item::where('name', 'Dell 24 Inch IPS Monitor')->first();

        // Delete Item
        $response = $this->delete(route('items.destroy', $item));
        $response->assertRedirect();
        $this->assertDatabaseMissing('items', [
            'id' => $item->id,
        ]);
    }

    public function test_quick_sell_walk_in_customer_with_no_phone(): void
    {
        $user = User::first();
        $this->actingAs($user);

        $account = Account::firstOrCreate(
            ['code' => '1000'],
            [
                'name'      => 'Petty Cash',
                'type'      => 'ASSET',
                'sub_type'  => 'CASH_AND_CASH_EQUIVALENTS',
                'balance'   => 5000.00,
                'is_system' => true,
            ]
        );

        $item = Item::create([
            'name'           => 'Quick Retail Keyboard',
            'sales_price'    => 800.00,
            'purchase_price' => 600.00,
            'unit'           => 'Pcs',
            'stock_quantity' => 25.00,
        ]);

        $response = $this->post(route('items.quick-sell'), [
            'item_id'            => $item->id,
            'quantity'           => 2,
            'unit_price'         => 800.00,
            'customer_name'      => 'Walk-in Customer',
            'deposit_account_id' => $account->id,
            'payment_method'     => 'CASH',
            'notes'              => 'Counter cash sale',
        ]);

        $response->assertRedirect();

        // Check Contact created without phone
        $contact = Contact::where('name', 'Walk-in Customer')->first();
        $this->assertNotNull($contact);
        $this->assertNull($contact->whatsapp_number);

        // Check Invoice created and status is PAID
        $invoice = Invoice::where('contact_id', $contact->id)->latest()->first();
        $this->assertNotNull($invoice);
        $this->assertEquals('PAID', $invoice->status);
        $this->assertEquals(1600.00, (float)$invoice->total_amount);
        $this->assertEquals(1600.00, (float)$invoice->paid_amount);

        // Check stock decremented
        $this->assertEquals(23.00, (float)$item->fresh()->stock_quantity);
    }

    public function test_quick_sell_to_existing_customer(): void
    {
        $user = User::first();
        $this->actingAs($user);

        $account = Account::firstOrCreate(
            ['code' => '1000'],
            [
                'name'      => 'Petty Cash',
                'type'      => 'ASSET',
                'sub_type'  => 'CASH_AND_CASH_EQUIVALENTS',
                'balance'   => 5000.00,
                'is_system' => true,
            ]
        );

        $existingCustomer = Contact::create([
            'name'            => 'Rahim Traders',
            'type'            => 'CUSTOMER',
            'currency'        => 'BDT',
            'phone'           => '01711000111',
            'whatsapp_number' => '01711000111',
            'status'          => 'ACTIVE',
        ]);

        $item = Item::create([
            'name'           => 'High Speed HDMI Cable',
            'sales_price'    => 450.00,
            'purchase_price' => 300.00,
            'unit'           => 'Pcs',
            'stock_quantity' => 50.00,
        ]);

        $response = $this->post(route('items.quick-sell'), [
            'item_id'            => $item->id,
            'quantity'           => 3,
            'unit_price'         => 450.00,
            'contact_id'         => $existingCustomer->id,
            'deposit_account_id' => $account->id,
            'payment_method'     => 'CASH',
            'notes'              => 'Quick sale to registered party',
        ]);

        $response->assertRedirect();

        // Check invoice was attached directly to existing customer
        $invoice = Invoice::where('contact_id', $existingCustomer->id)->latest()->first();
        $this->assertNotNull($invoice);
        $this->assertEquals('PAID', $invoice->status);
        $this->assertEquals(1350.00, (float)$invoice->total_amount);
        $this->assertEquals(1350.00, (float)$invoice->paid_amount);

        // Check stock decremented
        $this->assertEquals(47.00, (float)$item->fresh()->stock_quantity);
    }
}
