<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'status',
        'company_name',
        'company_address',
        'bin_number',
        'phone',
        'currency_symbol',
        'currency_code',
        'default_uom',
        'enable_stock',
        'company_logo',
        'company_icon',
        'whatsapp_template',
        'whatsapp_bill_template',
        'whatsapp_receipt_template',
        'whatsapp_payment_made_template',
        'whatsapp_phone_number_id',
        'whatsapp_access_token',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'enable_stock'      => 'boolean',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isApproved(): bool
    {
        return $this->status === 'APPROVED';
    }
}
