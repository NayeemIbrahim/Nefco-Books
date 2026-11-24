<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;
use Inertia\Testing\AssertableInertia as Assert;

class PaymentsPageRenderTest extends TestCase
{
    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::firstOrCreate(
            ['email' => 'payments_test@example.com'],
            [
                'name'     => 'Payments Tester',
                'password' => bcrypt('password'),
                'role'     => 'admin',
                'status'   => 'APPROVED',
            ]
        );
    }

    public function test_payments_received_page_loads_successfully()
    {
        $response = $this->actingAs($this->user)->get('/sales/payments-received');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Sales/PaymentsReceived/Index')
            ->has('payments')
            ->has('customers')
            ->has('unpaid_invoices')
            ->has('deposit_accounts')
            ->has('metrics')
        );
    }

    public function test_payments_made_page_loads_successfully()
    {
        $response = $this->actingAs($this->user)->get('/purchases/payments-made');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Purchases/PaymentsMade/Index')
            ->has('payments')
            ->has('vendors')
            ->has('unpaid_bills')
            ->has('paid_from_accounts')
            ->has('metrics')
        );
    }
}
