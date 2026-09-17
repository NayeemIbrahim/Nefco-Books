<?php

namespace App\Http\Controllers;

use App\Models\Bill;
use App\Models\Contact;
use App\Models\Item;
use App\Services\AccountingService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BillController extends Controller
{
    public function __construct(protected AccountingService $accountingService)
    {
    }

    public function index(): Response
    {
        return Inertia::render('Bills/Index', [
            'bills'    => Bill::with(['contact', 'lineItems'])->latest()->paginate(15),
            'vendors'  => Contact::whereIn('type', ['VENDOR', 'BOTH'])->get(['id', 'name']),
            'items'    => Item::all(),
        ]);
    }
}
