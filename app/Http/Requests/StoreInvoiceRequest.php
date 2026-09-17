<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'contact_id'       => ['required', 'exists:contacts,id'],
            'booking_id'       => ['nullable', 'exists:bookings,id'],
            'issue_date'       => ['nullable', 'date'],
            'due_date'         => ['required', 'date'],
            'notes'            => ['nullable', 'string', 'max:1000'],
            'terms'            => ['nullable', 'string', 'max:1000'],
            'tax_amount'       => ['nullable', 'numeric', 'min:0'],
            'discount_amount'  => ['nullable', 'numeric', 'min:0'],
            'line_items'       => ['required', 'array', 'min:1'],
            'line_items.*.item_id'     => ['nullable', 'exists:items,id'],
            'line_items.*.description' => ['required', 'string', 'max:255'],
            'line_items.*.quantity'    => ['required', 'numeric', 'min:0.01'],
            'line_items.*.unit_price'  => ['required', 'numeric', 'min:0'],
        ];
    }
}
