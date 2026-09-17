<?php

use App\Http\Controllers\BankingController;
use App\Http\Controllers\BillController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\ReportController;
use Illuminate\Support\Facades\Route;

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
Route::resource('purchases/bills', BillController::class)->names('bills.purchases');

// 7. Banking & Ledger
Route::get('banking', [BankingController::class, 'index'])->name('banking.index');
Route::post('banking/journal', [BankingController::class, 'storeJournalEntry'])->name('banking.journal');
Route::post('banking/journal-entries', [BankingController::class, 'storeJournalEntry'])->name('banking.journal.store');

// 8. Financial Reports
Route::prefix('reports')->name('reports.')->group(function () {
    Route::get('/', [ReportController::class, 'index'])->name('index');
    Route::get('/profit-and-loss', [ReportController::class, 'profitAndLoss'])->name('profit-and-loss');
    Route::get('/balance-sheet', [ReportController::class, 'balanceSheet'])->name('balance-sheet');
    Route::get('/trial-balance', [ReportController::class, 'trialBalance'])->name('trial-balance');
});
