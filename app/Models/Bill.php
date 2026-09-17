<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Bill extends Model
{
    protected $fillable = [
        'bill_number', 'contact_id', 'issue_date', 'due_date', 'status',
        'subtotal', 'tax_amount', 'total_amount', 'paid_amount', 'notes'
    ];

    protected $casts = [
        'issue_date'   => 'datetime',
        'due_date'     => 'datetime',
        'subtotal'     => 'decimal:2',
        'tax_amount'   => 'decimal:2',
        'total_amount' => 'decimal:2',
        'paid_amount'  => 'decimal:2',
    ];

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function lineItems(): HasMany
    {
        return $this->hasMany(BillLineItem::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function journalEntry(): HasOne
    {
        return $this->hasOne(JournalEntry::class);
    }
}
