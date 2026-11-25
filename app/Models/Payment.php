<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Payment extends Model
{
    protected $fillable = [
        'payment_number', 'type', 'contact_id', 'invoice_id', 'bill_id',
        'account_id', 'payment_date', 'amount', 'payment_method',
        'reference_number', 'notes'
    ];

    protected $casts = [
        'payment_date' => 'datetime',
        'amount'       => 'decimal:2',
    ];

    protected $appends = [
        'allocated_amount',
        'unallocated_amount',
    ];

    public function allocations(): HasMany
    {
        return $this->hasMany(PaymentAllocation::class);
    }

    public function getAllocatedAmountAttribute(): float
    {
        if (array_key_exists('allocations_sum_amount', $this->attributes)) {
            return round((float) $this->attributes['allocations_sum_amount'], 2);
        }
        if ($this->relationLoaded('allocations')) {
            return round((float) $this->allocations->sum('amount'), 2);
        }
        return round((float) $this->allocations()->sum('amount'), 2);
    }

    public function getUnallocatedAmountAttribute(): float
    {
        return max(0.0, round((float) $this->amount - $this->allocated_amount, 2));
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function bill(): BelongsTo
    {
        return $this->belongsTo(Bill::class);
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function journalEntry(): HasOne
    {
        return $this->hasOne(JournalEntry::class);
    }
}
