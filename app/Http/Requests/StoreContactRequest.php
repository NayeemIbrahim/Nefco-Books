<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreContactRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'            => ['required', 'string', 'max:150'],
            'company_name'    => ['nullable', 'string', 'max:150'],
            'email'           => ['nullable', 'email', 'max:150'],
            'phone'           => ['nullable', 'string', 'max:30'],
            'whatsapp_number' => ['required', 'string', 'max:30'],
            'type'            => ['required', 'in:CUSTOMER,VENDOR,BOTH'],
            'address'         => ['nullable', 'string', 'max:255'],
            'city'            => ['nullable', 'string', 'max:100'],
            'country'         => ['nullable', 'string', 'max:100'],
            'tax_number'      => ['nullable', 'string', 'max:50'],
            'opening_balance' => ['nullable', 'numeric'],
        ];
    }
}
