<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Account extends Model
{
    protected $fillable = [
        'code', 'name', 'type', 'sub_type', 'description', 'is_system', 'balance'
    ];

    protected $casts = [
        'is_system' => 'boolean',
        'balance'   => 'decimal:2',
    ];

    public function journalLines(): HasMany
    {
        return $this->hasMany(JournalLine::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function syncBalanceWithLedger(): float
    {
        $debit = (float)$this->journalLines()->sum('debit');
        $credit = (float)$this->journalLines()->sum('credit');

        $balance = in_array($this->type, ['ASSET', 'EXPENSE'])
            ? ($debit - $credit)
            : ($credit - $debit);

        $this->update(['balance' => $balance]);
        return $balance;
    }

    public static function syncAllBalances(): void
    {
        foreach (static::all() as $account) {
            $account->syncBalanceWithLedger();
        }
    }
}
