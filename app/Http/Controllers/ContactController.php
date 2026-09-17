<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreContactRequest;
use App\Models\Contact;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ContactController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Contact::query();

        if ($type = $request->input('type')) {
            if ($type !== 'ALL') {
                $query->where('type', $type);
            }
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('company_name', 'like', "%{$search}%")
                  ->orWhere('whatsapp_number', 'like', "%{$search}%");
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
        $contact = Contact::create($request->validated());

        return redirect()->route('contacts.index')->with('success', "Contact {$contact->name} added successfully.");
    }

    public function destroy(Contact $contact)
    {
        $contact->delete();
        return back()->with('success', 'Contact removed.');
    }
}
