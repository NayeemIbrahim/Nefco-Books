<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreContactRequest;
use App\Models\Contact;
use App\Services\AccountingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class ContactController extends Controller
{
    public function __construct(protected AccountingService $accountingService)
    {
    }
    public function index(Request $request): Response
    {
        $query = Contact::query();
        $hasHiddenCol = Schema::hasTable('contacts') && Schema::hasColumn('contacts', 'is_hidden');

        $type = $request->input('type', 'ALL');

        if ($type === 'HIDDEN') {
            if ($hasHiddenCol) {
                $query->where('is_hidden', true);
            } else {
                $query->whereRaw('0 = 1');
            }
        } else {
            if ($hasHiddenCol) {
                $query->where(function ($q) {
                    $q->where('is_hidden', false)->orWhereNull('is_hidden');
                });
            }

            if ($type !== 'ALL') {
                $query->where('type', $type);
            }
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('company_name', 'like', "%{$search}%")
                  ->orWhere('whatsapp_number', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $contacts = $query->latest()->paginate(15)->withQueryString();

        return Inertia::render('Contacts/Index', [
            'contacts' => $contacts,
            'filters'  => $request->only(['search', 'type']),
        ]);
    }

    public function store(StoreContactRequest $request)
    {
        $validated = $request->validated();

        $phone = $validated['phone'] ?? null;
        $whatsapp = $validated['whatsapp_number'] ?? null;

        if (empty($whatsapp)) {
            $whatsapp = ! empty($phone) ? $phone : '';
        }
        if (empty($phone) && ! empty($whatsapp)) {
            $phone = $whatsapp;
        }

        $validated['phone'] = $phone;
        $validated['whatsapp_number'] = $whatsapp;

        // Check for duplicate phone/WhatsApp number only if non-empty
        $numberToCheck = $validated['whatsapp_number'] ?: ($validated['phone'] ?: null);
        if ($numberToCheck) {
            $existing = Contact::findByNumber($numberToCheck);

            if ($existing) {
                // If contact exists and is currently hidden, restore and update it
                if ($existing->is_hidden) {
                    $existing->update(array_merge($validated, ['is_hidden' => false]));
                    return redirect()->route('contacts.index')->with(
                        'success',
                        "Contact '{$existing->name}' was previously archived and has now been restored and updated!"
                    );
                }

                return back()->withInput()->withErrors([
                    'whatsapp_number' => "Duplicate contact prevented: '{$existing->name}' already uses this number ({$existing->whatsapp_number}).",
                ])->with('error', "Contact '{$existing->name}' already exists with this phone/WhatsApp number ({$existing->whatsapp_number}).");
            }
        }

        $validated['opening_balance'] = isset($validated['opening_balance']) ? (float)$validated['opening_balance'] : 0.00;
        $validated['opening_balance_type'] = $validated['opening_balance_type'] ?? ($validated['type'] === 'VENDOR' ? 'TO_PAY' : 'TO_RECEIVE');
        $validated['opening_balance_date'] = ! empty($validated['opening_balance_date']) ? $validated['opening_balance_date'] : now()->toDateString();

        $contact = Contact::create($validated);

        if ($contact->opening_balance > 0) {
            $this->accountingService->syncContactOpeningBalance($contact);
        } else {
            $contact->syncCurrentBalance();
        }

        return redirect()->route('contacts.index')->with('success', "Contact {$contact->name} added successfully.");
    }

    public function update(Request $request, Contact $contact)
    {
        $validated = $request->validate([
            'name'                 => 'required|string|max:255',
            'company_name'         => 'nullable|string|max:255',
            'email'                => 'nullable|email|max:255',
            'phone'                => 'nullable|string|max:50',
            'whatsapp_number'      => 'nullable|string|max:50',
            'address'              => 'nullable|string',
            'city'                 => 'nullable|string|max:100',
            'country'              => 'nullable|string|max:100',
            'type'                 => 'required|in:CUSTOMER,VENDOR,BOTH',
            'opening_balance'      => 'nullable|numeric|min:0',
            'opening_balance_type' => 'nullable|in:TO_RECEIVE,TO_PAY',
            'opening_balance_date' => 'nullable|date',
        ]);

        $phone = $validated['phone'] ?? null;
        $whatsapp = $validated['whatsapp_number'] ?? null;

        if (empty($phone) && ! empty($whatsapp)) {
            $phone = $whatsapp;
        }
        if (empty($whatsapp) && ! empty($phone)) {
            $whatsapp = $phone;
        }

        $validated['phone'] = $phone;
        $validated['whatsapp_number'] = $whatsapp;

        // Check duplicate number with other contacts
        $numberToCheck = $validated['whatsapp_number'] ?: ($validated['phone'] ?: null);
        if ($numberToCheck) {
            $existing = Contact::findByNumber($numberToCheck, $contact->id);
            if ($existing) {
                return back()->withInput()->withErrors([
                    'whatsapp_number' => "Duplicate number! Contact '{$existing->name}' already uses this number ({$existing->whatsapp_number}).",
                ])->with('error', "Cannot update: '{$existing->name}' already exists with this phone/WhatsApp number.");
            }
        }

        $validated['opening_balance'] = isset($validated['opening_balance']) ? (float)$validated['opening_balance'] : (float)($contact->opening_balance ?? 0);
        $validated['opening_balance_type'] = $validated['opening_balance_type'] ?? $contact->opening_balance_type ?? ($validated['type'] === 'VENDOR' ? 'TO_PAY' : 'TO_RECEIVE');
        $validated['opening_balance_date'] = ! empty($validated['opening_balance_date']) ? $validated['opening_balance_date'] : ($contact->opening_balance_date ? $contact->opening_balance_date->toDateString() : now()->toDateString());

        $contact->update($validated);

        $this->accountingService->syncContactOpeningBalance($contact);
        $contact->syncCurrentBalance();

        return redirect()->route('contacts.index')->with('success', "Contact {$contact->name} updated successfully.");
    }

    public function destroy(Contact $contact)
    {
        if ($contact->hasLedgerActivity()) {
            if (Schema::hasTable('contacts') && Schema::hasColumn('contacts', 'is_hidden')) {
                $contact->update(['is_hidden' => true]);
            }
            return back()->with('info', "Contact '{$contact->name}' has existing ledger and transaction history. To protect accounting records, it cannot be permanently deleted from the database, but has been hidden from active lists.");
        }

        $this->accountingService->deleteContactOpeningBalance($contact);
        $contactName = $contact->name;
        $contact->delete();
        return back()->with('success', "Contact '{$contactName}' permanently deleted from database.");
    }

    public function restore(Contact $contact)
    {
        if (Schema::hasTable('contacts') && Schema::hasColumn('contacts', 'is_hidden')) {
            $contact->update(['is_hidden' => false]);
        }
        return back()->with('success', "Contact '{$contact->name}' restored to active contacts.");
    }

    public function ledger(Contact $contact): JsonResponse
    {
        $contact->syncCurrentBalance();

        $entries = [];

        // 1. Opening Balance row
        if ((float)$contact->opening_balance > 0) {
            $isToReceive = ($contact->opening_balance_type === 'TO_RECEIVE');
            $entries[] = [
                'id'          => 'ob-' . $contact->id,
                'date'        => $contact->opening_balance_date ? $contact->opening_balance_date->toDateString() : ($contact->created_at ? $contact->created_at->toDateString() : now()->toDateString()),
                'type'        => 'OPENING_BALANCE',
                'reference'   => 'OB-' . str_pad($contact->id, 4, '0', STR_PAD_LEFT),
                'description' => 'Opening Balance (' . ($isToReceive ? 'To Receive' : 'To Pay') . ')',
                'debit'       => $isToReceive ? (float)$contact->opening_balance : 0.00,
                'credit'      => ! $isToReceive ? (float)$contact->opening_balance : 0.00,
                'balance'     => $isToReceive ? (float)$contact->opening_balance : -(float)$contact->opening_balance,
            ];
        }

        // 2. Invoices
        foreach ($contact->invoices()->whereNotIn('status', ['DRAFT', 'VOID'])->get() as $inv) {
            $entries[] = [
                'id'          => 'inv-' . $inv->id,
                'date'        => $inv->issue_date ? $inv->issue_date->toDateString() : '',
                'type'        => 'INVOICE',
                'reference'   => $inv->invoice_number,
                'description' => "Invoice #{$inv->invoice_number} (" . ($inv->status ?? 'UNPAID') . ")",
                'debit'       => (float)$inv->total_amount,
                'credit'      => 0.00,
                'amount'      => (float)$inv->total_amount,
                'paid_amount' => (float)$inv->paid_amount,
                'status'      => $inv->status,
            ];
        }

        // 3. Bills
        foreach ($contact->bills()->whereNotIn('status', ['VOID'])->get() as $bill) {
            $entries[] = [
                'id'          => 'bill-' . $bill->id,
                'date'        => $bill->bill_date ? $bill->bill_date->toDateString() : ($bill->issue_date ? $bill->issue_date->toDateString() : ''),
                'type'        => 'BILL',
                'reference'   => $bill->bill_number,
                'description' => "Vendor Bill #{$bill->bill_number} (" . ($bill->status ?? 'UNPAID') . ")",
                'debit'       => 0.00,
                'credit'      => (float)$bill->total_amount,
                'amount'      => (float)$bill->total_amount,
                'paid_amount' => (float)$bill->paid_amount,
                'status'      => $bill->status,
            ];
        }

        // 4. Payments
        foreach ($contact->payments()->latest('payment_date')->get() as $pay) {
            $isVendorPay = ($pay->type === 'VENDOR_PAYMENT' || $pay->bill_id !== null);
            $entries[] = [
                'id'          => 'pay-' . $pay->id,
                'date'        => $pay->payment_date ? $pay->payment_date->toDateString() : '',
                'type'        => 'PAYMENT',
                'reference'   => $pay->payment_number,
                'description' => "Payment #{$pay->payment_number} via " . ($pay->payment_method ?? 'CASH'),
                'debit'       => $isVendorPay ? (float)$pay->amount : 0.00,
                'credit'      => ! $isVendorPay ? (float)$pay->amount : 0.00,
                'amount'      => (float)$pay->amount,
            ];
        }

        // Sort chronologically
        usort($entries, fn($a, $b) => strcmp($a['date'], $b['date']));

        $runningBalance = 0.0;
        foreach ($entries as &$entry) {
            $debit = (float)($entry['debit'] ?? 0);
            $credit = (float)($entry['credit'] ?? 0);
            if ($contact->type === 'VENDOR') {
                $runningBalance += ($credit - $debit);
            } else {
                $runningBalance += ($debit - $credit);
            }
            $entry['running_balance'] = $runningBalance;
        }
        unset($entry);

        return response()->json([
            'contact'         => $contact,
            'current_balance' => (float)$contact->current_balance,
            'opening_balance' => (float)$contact->opening_balance,
            'entries'         => $entries,
        ]);
    }
}

