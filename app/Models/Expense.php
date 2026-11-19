<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Expense extends Model
{
    protected $fillable = [
        'expense_number',
        'expense_date',
        'expense_account_id',
        'paid_through_account_id',
        'amount',
        'contact_id',
        'category',
        'reference_number',
        'notes',
        'attachments',
    ];

    protected $casts = [
        'expense_date' => 'date',
        'amount'       => 'decimal:2',
        'attachments'  => 'array',
    ];

    public function expenseAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'expense_account_id');
    }

    public function paidThroughAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'paid_through_account_id');
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'contact_id');
    }

    public function journalEntry(): HasOne
    {
        return $this->hasOne(JournalEntry::class, 'source_document_id')
            ->where('source_document_type', 'EXPENSE');
    }
}
