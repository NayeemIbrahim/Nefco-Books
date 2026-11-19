<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreContactRequest;
use App\Models\Contact;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class ContactController extends Controller
{
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
        if (empty($validated['phone']) && ! empty($validated['whatsapp_number'])) {
            $validated['phone'] = $validated['whatsapp_number'];
        }

        // Check for duplicate phone/WhatsApp number
        $numberToCheck = $validated['whatsapp_number'] ?? ($validated['phone'] ?? null);
        $existing = Contact::findByNumber($numberToCheck);

        if ($existing) {
            // If contact exists and is currently hidden, restore and update it
            if ($existing->is_hidden) {
                $existing->update(array_merge($validated, ['is_hidden' => false]));
                return redirect()->route('contacts.index')->with(
                    'success',
                    "Contact '{$existing->name}' with number {$numberToCheck} was previously hidden and has now been restored and updated!"
                );
            }

            return back()->withInput()->withErrors([
                'whatsapp_number' => "A contact already exists with this phone/WhatsApp number: {$existing->name} ({$existing->whatsapp_number})",
            ])->with('error', "Duplicate contact prevented: '{$existing->name}' already uses this number ({$existing->whatsapp_number}).");
        }

        $contact = Contact::create($validated);

        return redirect()->route('contacts.index')->with('success', "Contact {$contact->name} added successfully.");
    }

    public function update(Request $request, Contact $contact)
    {
        $validated = $request->validate([
            'name'            => 'required|string|max:255',
            'company_name'    => 'nullable|string|max:255',
            'email'           => 'nullable|email|max:255',
            'phone'           => 'nullable|string|max:50',
            'whatsapp_number' => 'nullable|string|max:50',
            'address'         => 'nullable|string',
            'type'            => 'required|in:CUSTOMER,VENDOR,BOTH',
        ]);

        if (empty($validated['phone']) && ! empty($validated['whatsapp_number'])) {
            $validated['phone'] = $validated['whatsapp_number'];
        }

        // Check duplicate number with other contacts
        $numberToCheck = $validated['whatsapp_number'] ?? ($validated['phone'] ?? null);
        if ($numberToCheck) {
            $existing = Contact::findByNumber($numberToCheck, $contact->id);
            if ($existing) {
                return back()->withInput()->withErrors([
                    'whatsapp_number' => "Another contact ({$existing->name}) already uses this number.",
                ])->with('error', "Cannot update: '{$existing->name}' already exists with this phone number.");
            }
        }

        $contact->update($validated);

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
}

