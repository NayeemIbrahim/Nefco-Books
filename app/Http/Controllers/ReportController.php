<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use App\Services\ReportService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function __construct(
        protected ReportService $reportService
    ) {}

    public function index(): Response
    {
        return Inertia::render('Reports/Index');
    }

    /* ------------------------------------------------------------------------
     | 1. BUSINESS OVERVIEW
     | ------------------------------------------------------------------------ */

    public function profitAndLoss(Request $request): Response
    {
        $filters = $request->only(['preset', 'start_date', 'end_date']);
        $data    = $this->reportService->getProfitAndLoss($filters);

        return Inertia::render('Reports/ProfitAndLoss', array_merge($data, [
            'filters' => $filters,
        ]));
    }

    public function balanceSheet(Request $request): Response
    {
        $filters = $request->only(['preset', 'start_date', 'end_date']);
        $data    = $this->reportService->getBalanceSheet($filters);

        return Inertia::render('Reports/BalanceSheet', array_merge($data, [
            'filters' => $filters,
        ]));
    }

    public function cashFlow(Request $request): Response
    {
        $filters = $request->only(['preset', 'start_date', 'end_date']);
        $data    = $this->reportService->getCashFlowStatement($filters);

        return Inertia::render('Reports/CashFlow', array_merge($data, [
            'filters' => $filters,
        ]));
    }

    /* ------------------------------------------------------------------------
     | 2. SALES
     | ------------------------------------------------------------------------ */

    public function salesSummary(Request $request): Response
    {
        $filters = $request->only(['preset', 'start_date', 'end_date']);
        $data    = $this->reportService->getSalesSummary($filters);

        return Inertia::render('Reports/SalesSummary', array_merge($data, [
            'filters' => $filters,
        ]));
    }

    public function salesByCustomer(Request $request): Response
    {
        $filters = $request->only(['preset', 'start_date', 'end_date']);
        $data    = $this->reportService->getSalesByCustomer($filters);

        return Inertia::render('Reports/SalesByCustomer', array_merge($data, [
            'filters' => $filters,
        ]));
    }

    public function salesByItem(Request $request): Response
    {
        $filters = $request->only(['preset', 'start_date', 'end_date']);
        $data    = $this->reportService->getSalesByItem($filters);

        return Inertia::render('Reports/SalesByItem', array_merge($data, [
            'filters' => $filters,
        ]));
    }

    /* ------------------------------------------------------------------------
     | 3. RECEIVABLES
     | ------------------------------------------------------------------------ */

    public function customerBalanceSummary(Request $request): Response
    {
        $filters = $request->only(['preset', 'start_date', 'end_date']);
        $data    = $this->reportService->getCustomerBalanceSummary($filters);

        return Inertia::render('Reports/CustomerBalanceSummary', array_merge($data, [
            'filters' => $filters,
        ]));
    }

    public function customerStatement(Request $request): Response
    {
        $filters = $request->only(['preset', 'start_date', 'end_date', 'contact_id']);

        // Default to first customer if not selected
        $contactId = $filters['contact_id'] ?? null;
        if (! $contactId) {
            $firstCustomer = Contact::whereIn('type', ['CUSTOMER', 'BOTH'])->orderBy('name')->first();
            $contactId = $firstCustomer ? $firstCustomer->id : null;
        }

        $data = $contactId
            ? $this->reportService->getCustomerStatement((int)$contactId, $filters)
            : ['contact' => null, 'current_balance' => 0, 'entries' => [], 'allCustomers' => Contact::whereIn('type', ['CUSTOMER', 'BOTH'])->get(['id', 'name'])];

        return Inertia::render('Reports/CustomerStatement', array_merge($data, [
            'filters' => array_merge($filters, ['contact_id' => $contactId]),
        ]));
    }

    public function orderDetails(Request $request): Response
    {
        $filters = $request->only(['preset', 'start_date', 'end_date']);
        $data    = $this->reportService->getOrderDetails($filters);

        return Inertia::render('Reports/OrderDetails', array_merge($data, [
            'filters' => $filters,
        ]));
    }

    public function arAgingSummary(Request $request): Response
    {
        $filters = $request->only(['preset', 'start_date', 'end_date']);
        $data    = $this->reportService->getARAgingSummary($filters);

        return Inertia::render('Reports/ARAgingSummary', array_merge($data, [
            'filters' => $filters,
        ]));
    }

    public function invoiceDetails(Request $request): Response
    {
        $filters = $request->only(['preset', 'start_date', 'end_date']);
        $data    = $this->reportService->getInvoiceDetails($filters);

        return Inertia::render('Reports/InvoiceDetails', array_merge($data, [
            'filters' => $filters,
        ]));
    }

    public function receivableSummary(Request $request): Response
    {
        $filters = $request->only(['preset', 'start_date', 'end_date']);
        $data    = $this->reportService->getReceivableSummary($filters);

        return Inertia::render('Reports/ReceivableSummary', array_merge($data, [
            'filters' => $filters,
        ]));
    }

    /* ------------------------------------------------------------------------
     | 4. PAYMENTS RECEIVED
     | ------------------------------------------------------------------------ */

    public function paymentsReceived(Request $request): Response
    {
        $filters = $request->only(['preset', 'start_date', 'end_date']);
        $data    = $this->reportService->getPaymentsReceived($filters);

        return Inertia::render('Reports/PaymentsReceived', array_merge($data, [
            'filters' => $filters,
        ]));
    }

    /* ------------------------------------------------------------------------
     | 5. PAYABLES
     | ------------------------------------------------------------------------ */

    public function vendorBalanceSummary(Request $request): Response
    {
        $filters = $request->only(['preset', 'start_date', 'end_date']);
        $data    = $this->reportService->getVendorBalanceSummary($filters);

        return Inertia::render('Reports/VendorBalanceSummary', array_merge($data, [
            'filters' => $filters,
        ]));
    }

    public function vendorStatement(Request $request): Response
    {
        $filters = $request->only(['preset', 'start_date', 'end_date', 'contact_id']);

        $contactId = $filters['contact_id'] ?? null;
        if (! $contactId) {
            $firstVendor = Contact::where('type', 'VENDOR')->orderBy('name')->first();
            $contactId = $firstVendor ? $firstVendor->id : null;
        }

        $data = $contactId
            ? $this->reportService->getVendorStatement((int)$contactId, $filters)
            : ['contact' => null, 'current_balance' => 0, 'entries' => [], 'allVendors' => Contact::where('type', 'VENDOR')->get(['id', 'name'])];

        return Inertia::render('Reports/VendorStatement', array_merge($data, [
            'filters' => array_merge($filters, ['contact_id' => $contactId]),
        ]));
    }

    public function apAgingSummary(Request $request): Response
    {
        $filters = $request->only(['preset', 'start_date', 'end_date']);
        $data    = $this->reportService->getAPAgingSummary($filters);

        return Inertia::render('Reports/APAgingSummary', array_merge($data, [
            'filters' => $filters,
        ]));
    }

    public function billDetails(Request $request): Response
    {
        $filters = $request->only(['preset', 'start_date', 'end_date']);
        $data    = $this->reportService->getBillDetails($filters);

        return Inertia::render('Reports/BillDetails', array_merge($data, [
            'filters' => $filters,
        ]));
    }

    public function paymentsMade(Request $request): Response
    {
        $filters = $request->only(['preset', 'start_date', 'end_date']);
        $data    = $this->reportService->getPaymentsMade($filters);

        return Inertia::render('Reports/PaymentsMade', array_merge($data, [
            'filters' => $filters,
        ]));
    }

    public function payableSummary(Request $request): Response
    {
        $filters = $request->only(['preset', 'start_date', 'end_date']);
        $data    = $this->reportService->getPayableSummary($filters);

        return Inertia::render('Reports/PayableSummary', array_merge($data, [
            'filters' => $filters,
        ]));
    }

    /* ------------------------------------------------------------------------
     | 6. PURCHASES AND EXPENSES
     | ------------------------------------------------------------------------ */

    public function purchasesByVendor(Request $request): Response
    {
        $filters = $request->only(['preset', 'start_date', 'end_date']);
        $data    = $this->reportService->getPurchasesByVendor($filters);

        return Inertia::render('Reports/PurchasesByVendor', array_merge($data, [
            'filters' => $filters,
        ]));
    }

    public function purchasesByItem(Request $request): Response
    {
        $filters = $request->only(['preset', 'start_date', 'end_date']);
        $data    = $this->reportService->getPurchasesByItem($filters);

        return Inertia::render('Reports/PurchasesByItem', array_merge($data, [
            'filters' => $filters,
        ]));
    }

    public function expenseDetails(Request $request): Response
    {
        $filters = $request->only(['preset', 'start_date', 'end_date']);
        $data    = $this->reportService->getExpenseDetails($filters);

        return Inertia::render('Reports/ExpenseDetails', array_merge($data, [
            'filters' => $filters,
        ]));
    }

    public function expensesByCategory(Request $request): Response
    {
        $filters = $request->only(['preset', 'start_date', 'end_date']);
        $data    = $this->reportService->getExpensesByCategory($filters);

        return Inertia::render('Reports/ExpensesByCategory', array_merge($data, [
            'filters' => $filters,
        ]));
    }

    /* ------------------------------------------------------------------------
     | 7. ACCOUNTANT
     | ------------------------------------------------------------------------ */

    public function trialBalance(Request $request): Response
    {
        $filters = $request->only(['preset', 'start_date', 'end_date']);
        $data    = $this->reportService->getTrialBalance($filters);

        return Inertia::render('Reports/TrialBalance', array_merge($data, [
            'filters' => $filters,
        ]));
    }

    public function generalLedger(Request $request): Response
    {
        $filters = $request->only(['preset', 'start_date', 'end_date', 'account_id']);
        $data    = $this->reportService->getGeneralLedger($filters);

        return Inertia::render('Reports/GeneralLedger', array_merge($data, [
            'filters' => $filters,
        ]));
    }

    public function journalReport(Request $request): Response
    {
        $filters = $request->only(['preset', 'start_date', 'end_date']);
        $data    = $this->reportService->getJournalReport($filters);

        return Inertia::render('Reports/JournalReport', array_merge($data, [
            'filters' => $filters,
        ]));
    }
}
