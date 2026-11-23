<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\BankingController;
use App\Http\Controllers\BillController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\PaymentMadeController;
use App\Http\Controllers\PaymentReceivedController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SettingsController;
use Illuminate\Support\Facades\Route;

// Authentication Routes
Route::get('login', [LoginController::class, 'create'])->name('login');
Route::post('login', [LoginController::class, 'store']);
Route::post('logout', [LoginController::class, 'destroy'])->name('logout');
Route::get('register', [RegisterController::class, 'create'])->name('register');
Route::post('register', [RegisterController::class, 'store']);

// 1. Dashboard
Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

// 2. Contacts (CRM)
Route::resource('contacts', ContactController::class);
Route::post('contacts/{contact}', [ContactController::class, 'update'])->name('contacts.update');
Route::post('contacts/{contact}/restore', [ContactController::class, 'restore'])->name('contacts.restore');
Route::get('contacts/{contact}/ledger', [ContactController::class, 'ledger'])->name('contacts.ledger');

// 3. Items & Inventory
Route::post('items/quick-sell', [ItemController::class, 'quickSell'])->name('items.quick-sell');
Route::resource('items', ItemController::class);
Route::post('items/{item}', [ItemController::class, 'update'])->name('items.update');

// 4. Sales Module
// 4.1 Bookings & Orders (Suboption of Sales)
Route::get('sales/bookings', [BookingController::class, 'index'])->name('sales.bookings');
Route::post('sales/bookings', [BookingController::class, 'store'])->name('sales.bookings.store');
Route::post('sales/bookings/{booking}', [BookingController::class, 'update'])->name('sales.bookings.update');
Route::delete('sales/bookings/{booking}', [BookingController::class, 'destroy'])->name('sales.bookings.destroy');
Route::post('sales/bookings/{booking}/convert-to-invoice', [BookingController::class, 'convertToInvoice']);
Route::post('sales/bookings/{booking}/convert', [BookingController::class, 'convertToInvoice']);
Route::resource('bookings', BookingController::class);
Route::post('bookings/{booking}', [BookingController::class, 'update'])->name('bookings.update');
Route::delete('bookings/{booking}', [BookingController::class, 'destroy'])->name('bookings.destroy');
Route::post('bookings/{booking}/convert-to-invoice', [BookingController::class, 'convertToInvoice'])->name('bookings.convert');
Route::post('bookings/{booking}/convert', [BookingController::class, 'convertToInvoice']);

// 4.2 Invoices & Sales
Route::get('invoices', [InvoiceController::class, 'index'])->name('invoices.index');
Route::post('invoices', [InvoiceController::class, 'store'])->name('invoices.store');
Route::post('invoices/{invoice}', [InvoiceController::class, 'update'])->name('invoices.update');
Route::delete('invoices/{invoice}', [InvoiceController::class, 'destroy'])->name('invoices.destroy');
Route::delete('sales/invoices/{invoice}', [InvoiceController::class, 'destroy']);
Route::post('invoices/{invoice}/mark-paid', [InvoiceController::class, 'markAsPaid'])->name('invoices.mark-paid');
Route::post('invoices/{invoice}/issue', [InvoiceController::class, 'issueDraft'])->name('invoices.issue');
Route::resource('sales/invoices', InvoiceController::class)->names('invoices.sales');
Route::post('sales/invoices/{invoice}/send-whatsapp', [InvoiceController::class, 'sendWhatsApp'])->name('invoices.whatsapp');
Route::post('invoices/{invoice}/send-whatsapp', [InvoiceController::class, 'sendWhatsApp']);

// 4.3 Payments Received (Suboption of Sales)
Route::get('sales/payments-received', [PaymentReceivedController::class, 'index'])->name('sales.payments-received');
Route::post('sales/payments-received', [PaymentReceivedController::class, 'store'])->name('sales.payments-received.store');
Route::delete('sales/payments-received/{payment}', [PaymentReceivedController::class, 'destroy'])->name('sales.payments-received.destroy');
Route::get('payments-received', [PaymentReceivedController::class, 'index']);
Route::post('payments-received', [PaymentReceivedController::class, 'store']);
Route::delete('payments-received/{payment}', [PaymentReceivedController::class, 'destroy']);

// 5. Purchases Module
// 5.1 Bills & Purchases
Route::get('bills', [BillController::class, 'index'])->name('bills.index');
Route::post('bills', [BillController::class, 'store'])->name('bills.store');
Route::post('bills/{bill}', [BillController::class, 'update'])->name('bills.update');
Route::post('bills/{bill}/mark-paid', [BillController::class, 'markAsPaid'])->name('bills.mark-paid');
Route::post('bills/{bill}/mark-as-paid', [BillController::class, 'markAsPaid'])->name('bills.mark-as-paid');
Route::post('purchases/bills/{bill}/mark-paid', [BillController::class, 'markAsPaid'])->name('bills.purchases.mark-paid');
Route::post('purchases/bills/{bill}/mark-as-paid', [BillController::class, 'markAsPaid'])->name('bills.purchases.mark-as-paid');
Route::resource('purchases/bills', BillController::class)->names('bills.purchases');

// 5.2 Operating Expenses (Suboption of Purchases)
Route::get('purchases/expenses', [ExpenseController::class, 'index'])->name('purchases.expenses');
Route::post('purchases/expenses', [ExpenseController::class, 'store'])->name('purchases.expenses.store');
Route::delete('purchases/expenses/{expense}', [ExpenseController::class, 'destroy'])->name('purchases.expenses.destroy');
Route::get('expenses', [ExpenseController::class, 'index']);
Route::post('expenses', [ExpenseController::class, 'store']);
Route::delete('expenses/{expense}', [ExpenseController::class, 'destroy']);

// 5.3 Payments Made (Suboption of Purchases)
Route::get('purchases/payments-made', [PaymentMadeController::class, 'index'])->name('purchases.payments-made');
Route::post('purchases/payments-made', [PaymentMadeController::class, 'store'])->name('purchases.payments-made.store');
Route::delete('purchases/payments-made/{payment}', [PaymentMadeController::class, 'destroy'])->name('purchases.payments-made.destroy');
Route::get('payments-made', [PaymentMadeController::class, 'index']);
Route::post('payments-made', [PaymentMadeController::class, 'store']);
Route::delete('payments-made/{payment}', [PaymentMadeController::class, 'destroy']);

// 7. Banking & Ledger
Route::get('banking', [BankingController::class, 'index'])->name('banking.index');
Route::post('banking/journal', [BankingController::class, 'storeJournalEntry'])->name('banking.journal');
Route::post('banking/journal-entries', [BankingController::class, 'storeJournalEntry'])->name('banking.journal.store');

// 8. Financial Reports & Reports Center
Route::prefix('reports')->name('reports.')->group(function () {
    Route::get('/', [ReportController::class, 'index'])->name('index');

    // Business Overview
    Route::get('/profit-and-loss', [ReportController::class, 'profitAndLoss'])->name('profit-and-loss');
    Route::get('/profit-loss', [ReportController::class, 'profitAndLoss']);
    Route::get('/balance-sheet', [ReportController::class, 'balanceSheet'])->name('balance-sheet');
    Route::get('/cash-flow', [ReportController::class, 'cashFlow'])->name('cash-flow');

    // Sales
    Route::get('/sales-summary', [ReportController::class, 'salesSummary'])->name('sales-summary');
    Route::get('/sales-by-customer', [ReportController::class, 'salesByCustomer'])->name('sales-by-customer');
    Route::get('/sales-by-item', [ReportController::class, 'salesByItem'])->name('sales-by-item');

    // Receivables
    Route::get('/customer-balance-summary', [ReportController::class, 'customerBalanceSummary'])->name('customer-balance-summary');
    Route::get('/customer-statement', [ReportController::class, 'customerStatement'])->name('customer-statement');
    Route::get('/order-details', [ReportController::class, 'orderDetails'])->name('order-details');
    Route::get('/ar-aging-summary', [ReportController::class, 'arAgingSummary'])->name('ar-aging-summary');
    Route::get('/invoice-details', [ReportController::class, 'invoiceDetails'])->name('invoice-details');
    Route::get('/receivable-summary', [ReportController::class, 'receivableSummary'])->name('receivable-summary');

    // Payments Received
    Route::get('/payments-received', [ReportController::class, 'paymentsReceived'])->name('payments-received');

    // Payables
    Route::get('/vendor-balance-summary', [ReportController::class, 'vendorBalanceSummary'])->name('vendor-balance-summary');
    Route::get('/vendor-statement', [ReportController::class, 'vendorStatement'])->name('vendor-statement');
    Route::get('/ap-aging-summary', [ReportController::class, 'apAgingSummary'])->name('ap-aging-summary');
    Route::get('/bill-details', [ReportController::class, 'billDetails'])->name('bill-details');
    Route::get('/payments-made', [ReportController::class, 'paymentsMade'])->name('payments-made');
    Route::get('/payable-summary', [ReportController::class, 'payableSummary'])->name('payable-summary');

    // Purchases & Expenses
    Route::get('/purchases-by-vendor', [ReportController::class, 'purchasesByVendor'])->name('purchases-by-vendor');
    Route::get('/purchases-by-item', [ReportController::class, 'purchasesByItem'])->name('purchases-by-item');
    Route::get('/expense-details', [ReportController::class, 'expenseDetails'])->name('expense-details');
    Route::get('/expenses-by-category', [ReportController::class, 'expensesByCategory'])->name('expenses-by-category');

    // Accountant
    Route::get('/trial-balance', [ReportController::class, 'trialBalance'])->name('trial-balance');
    Route::get('/general-ledger', [ReportController::class, 'generalLedger'])->name('general-ledger');
    Route::get('/journal-report', [ReportController::class, 'journalReport'])->name('journal-report');
});

// 9. Settings, Accounts & Organization Management
Route::get('settings', [SettingsController::class, 'index'])->name('settings.index');
Route::post('settings/profile', [SettingsController::class, 'updateProfile'])->name('settings.profile');
Route::post('settings/company', [SettingsController::class, 'updateCompany'])->name('settings.company');
Route::post('settings/toggle-stock', [SettingsController::class, 'toggleStock'])->name('settings.toggle-stock');
Route::post('settings/accounts', [SettingsController::class, 'storeAccount'])->name('settings.accounts.store');
Route::post('settings/accounts/{account}', [SettingsController::class, 'updateAccount'])->name('settings.accounts.update');
Route::post('settings/accounts/{account}/balance', [SettingsController::class, 'updateBalance'])->name('settings.accounts.balance');
Route::post('accounts/{account}/balance', [SettingsController::class, 'updateBalance']);
Route::post('settings/categories', [SettingsController::class, 'storeCategory'])->name('settings.categories.store');
Route::post('settings/categories/{category}', [SettingsController::class, 'updateCategory'])->name('settings.categories.update');
Route::delete('settings/categories/{category}', [SettingsController::class, 'destroyCategory'])->name('settings.categories.destroy');
Route::post('settings/users/{user}/approve', [SettingsController::class, 'approveUser'])->name('settings.users.approve');
Route::post('settings/users/{user}/reject', [SettingsController::class, 'rejectUser'])->name('settings.users.reject');
Route::post('settings/users/{user}/toggle-role', [SettingsController::class, 'toggleRole'])->name('settings.users.toggle-role');

// 10. Database Migration & Schema Sync Helper
Route::get('migrate', function () {
    try {
        \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
        $output = \Illuminate\Support\Facades\Artisan::output();
        return response()->json([
            'status'  => 'success',
            'message' => 'Database migrations executed successfully.',
            'output'  => $output,
        ]);
    } catch (\Throwable $e) {
        return response()->json([
            'status'  => 'error',
            'message' => $e->getMessage(),
        ], 500);
    }
})->name('migrate');

