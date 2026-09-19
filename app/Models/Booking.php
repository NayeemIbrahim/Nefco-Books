<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Booking extends Model
{
    protected $fillable = [
        'booking_number', 'order_number', 'invoice_number', 'contact_id', 'booking_date', 'service_date',
        'status', 'notes', 'attachments', 'total_amount'
    ];

    protected $casts = [
        'booking_date' => 'datetime',
        'service_date' => 'datetime',
        'total_amount' => 'decimal:2',
        'attachments'  => 'array',
    ];

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function lineItems(): HasMany
    {
        return $this->hasMany(BookingLineItem::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }
}
