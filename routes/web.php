<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\BankingController;
use App\Http\Controllers\BillController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\ItemController;
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

// 3. Items & Inventory
Route::resource('items', ItemController::class);

// 4. Bookings & Orders
Route::resource('bookings', BookingController::class);
Route::post('bookings/{booking}/convert-to-invoice', [BookingController::class, 'convertToInvoice'])->name('bookings.convert');
Route::post('bookings/{booking}/convert', [BookingController::class, 'convertToInvoice']);

// 5. Invoices & Sales
Route::get('invoices', [InvoiceController::class, 'index'])->name('invoices.index');
Route::post('invoices', [InvoiceController::class, 'store'])->name('invoices.store');
Route::resource('sales/invoices', InvoiceController::class)->names('invoices.sales');
Route::post('sales/invoices/{invoice}/send-whatsapp', [InvoiceController::class, 'sendWhatsApp'])->name('invoices.whatsapp');
Route::post('invoices/{invoice}/send-whatsapp', [InvoiceController::class, 'sendWhatsApp']);

// 6. Bills & Purchases
Route::get('bills', [BillController::class, 'index'])->name('bills.index');
Route::post('bills', [BillController::class, 'store'])->name('bills.store');
Route::post('bills/{bill}/mark-paid', [BillController::class, 'markAsPaid'])->name('bills.mark-paid');
Route::resource('purchases/bills', BillController::class)->names('bills.purchases');

// 7. Banking & Ledger
Route::get('banking', [BankingController::class, 'index'])->name('banking.index');
Route::post('banking/journal', [BankingController::class, 'storeJournalEntry'])->name('banking.journal');
Route::post('banking/journal-entries', [BankingController::class, 'storeJournalEntry'])->name('banking.journal.store');

// 8. Financial Reports
Route::prefix('reports')->name('reports.')->group(function () {
    Route::get('/', [ReportController::class, 'index'])->name('index');
    Route::get('/profit-and-loss', [ReportController::class, 'profitAndLoss'])->name('profit-and-loss');
    Route::get('/profit-loss', [ReportController::class, 'profitAndLoss']);
    Route::get('/balance-sheet', [ReportController::class, 'balanceSheet'])->name('balance-sheet');
    Route::get('/trial-balance', [ReportController::class, 'trialBalance'])->name('trial-balance');
});

// 9. Settings & Organization Management
Route::get('settings', [SettingsController::class, 'index'])->name('settings.index');
Route::post('settings/profile', [SettingsController::class, 'updateProfile'])->name('settings.profile');
Route::post('settings/company', [SettingsController::class, 'updateCompany'])->name('settings.company');
Route::post('settings/users/{user}/approve', [SettingsController::class, 'approveUser'])->name('settings.users.approve');
Route::post('settings/users/{user}/reject', [SettingsController::class, 'rejectUser'])->name('settings.users.reject');
Route::post('settings/users/{user}/toggle-role', [SettingsController::class, 'toggleRole'])->name('settings.users.toggle-role');
