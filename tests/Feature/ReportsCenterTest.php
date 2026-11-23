<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Contact;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportsCenterTest extends TestCase
{
    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::firstOrCreate(
            ['email' => 'reports_admin@example.com'],
            [
                'name'     => 'Reports Admin',
                'password' => bcrypt('password'),
                'role'     => 'admin',
                'status'   => 'APPROVED',
            ]
        );

        $this->seed(\Database\Seeders\AccountSeeder::class);
    }

    public function test_reports_center_index_renders_successfully(): void
    {
        $response = $this->actingAs($this->user)->get('/reports');
        $response->assertStatus(200);
    }

    public function test_business_overview_reports_render(): void
    {
        $response = $this->actingAs($this->user)->get('/reports/profit-and-loss');
        $response->assertStatus(200);

        $response = $this->actingAs($this->user)->get('/reports/balance-sheet');
        $response->assertStatus(200);

        $response = $this->actingAs($this->user)->get('/reports/cash-flow');
        $response->assertStatus(200);
    }

    public function test_sales_and_receivables_reports_render(): void
    {
        $response = $this->actingAs($this->user)->get('/reports/sales-summary');
        $response->assertStatus(200);

        $response = $this->actingAs($this->user)->get('/reports/sales-by-customer');
        $response->assertStatus(200);

        $response = $this->actingAs($this->user)->get('/reports/customer-balance-summary');
        $response->assertStatus(200);

        $response = $this->actingAs($this->user)->get('/reports/ar-aging-summary');
        $response->assertStatus(200);

        $response = $this->actingAs($this->user)->get('/reports/invoice-details');
        $response->assertStatus(200);

        $response = $this->actingAs($this->user)->get('/reports/payments-received');
        $response->assertStatus(200);
    }

    public function test_payables_and_purchases_reports_render(): void
    {
        $response = $this->actingAs($this->user)->get('/reports/vendor-balance-summary');
        $response->assertStatus(200);

        $response = $this->actingAs($this->user)->get('/reports/ap-aging-summary');
        $response->assertStatus(200);

        $response = $this->actingAs($this->user)->get('/reports/bill-details');
        $response->assertStatus(200);

        $response = $this->actingAs($this->user)->get('/reports/payments-made');
        $response->assertStatus(200);

        $response = $this->actingAs($this->user)->get('/reports/purchases-by-vendor');
        $response->assertStatus(200);

        $response = $this->actingAs($this->user)->get('/reports/expense-details');
        $response->assertStatus(200);

        $response = $this->actingAs($this->user)->get('/reports/expenses-by-category');
        $response->assertStatus(200);
    }

    public function test_accountant_reports_render(): void
    {
        $response = $this->actingAs($this->user)->get('/reports/trial-balance');
        $response->assertStatus(200);

        $response = $this->actingAs($this->user)->get('/reports/general-ledger');
        $response->assertStatus(200);

        $response = $this->actingAs($this->user)->get('/reports/journal-report');
        $response->assertStatus(200);
    }
}
