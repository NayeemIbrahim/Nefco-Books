<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Schema;

class Contact extends Model
{
    protected $fillable = [
        'name', 'company_name', 'email', 'phone', 'whatsapp_number',
        'type', 'address', 'city', 'country', 'tax_number',
        'opening_balance', 'opening_balance_type', 'opening_balance_date',
        'current_balance', 'is_hidden'
    ];

    protected $casts = [
        'opening_balance'      => 'decimal:2',
        'current_balance'      => 'decimal:2',
        'opening_balance_date' => 'date:Y-m-d',
        'is_hidden'            => 'boolean',
    ];

    public function scopeActive($query)
    {
        if (Schema::hasTable('contacts') && Schema::hasColumn('contacts', 'is_hidden')) {
            return $query->where(function ($q) {
                $q->where('is_hidden', false)->orWhereNull('is_hidden');
            });
        }
        return $query;
    }

    public function hasLedgerActivity(): bool
    {
        try {
            if ($this->bookings()->exists()) return true;
            if ($this->invoices()->exists()) return true;
            if ($this->bills()->exists()) return true;
            if ($this->payments()->exists()) return true;
            if (abs((float)$this->current_balance) > 0.001) return true;
            if (abs((float)$this->opening_balance) > 0.001) return true;
        } catch (\Throwable $e) {
            return true;
        }

        return false;
    }

    public static function findByNumber(?string $number, ?int $excludeId = null): ?Contact
    {
        if (empty($number)) {
            return null;
        }

        $raw = trim($number);
        $digits = preg_replace('/\D/', '', $raw);

        // Require at least 7 digits to consider it a real phone number
        if (empty($digits) || strlen($digits) < 7) {
            return null;
        }

        // National number suffix (last 10 digits handles +88017..., 88017..., 017...)
        $suffix = strlen($digits) >= 10 ? substr($digits, -10) : $digits;

        $query = self::query();
        if ($excludeId) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->where(function ($q) use ($raw, $suffix) {
            $q->where('whatsapp_number', $raw)
              ->orWhere('phone', $raw);
            if (! empty($suffix) && strlen($suffix) >= 8) {
                $q->orWhere('whatsapp_number', 'like', "%{$suffix}")
                  ->orWhere('phone', 'like', "%{$suffix}");
            }
        })->first();
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function bills(): HasMany
    {
        return $this->hasMany(Bill::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function journalEntries(): HasMany
    {
        return $this->hasMany(JournalEntry::class);
    }

    public function syncCurrentBalance(): float
    {
        $ob = (float)($this->opening_balance ?? 0);
        $obType = strtoupper($this->opening_balance_type ?: ($this->type === 'VENDOR' ? 'TO_PAY' : 'TO_RECEIVE'));

        $calculated = 0.0;

        if ($this->type === 'VENDOR') {
            // For vendor: To Pay is positive (payable due), To Receive is negative (advance/credit)
            $obContribution = ($obType === 'TO_PAY') ? $ob : -$ob;

            $unpaidBills = (float)$this->bills()
                ->whereNotIn('status', ['VOID'])
                ->selectRaw('COALESCE(SUM(total_amount - COALESCE(paid_amount, 0)), 0) as due')
                ->value('due');

            $calculated = $obContribution + $unpaidBills;
        } else {
            // For customer / both: To Receive is positive (receivable due), To Pay is negative (customer deposit/credit)
            $obContribution = ($obType === 'TO_RECEIVE') ? $ob : -$ob;

            $unpaidInvoices = (float)$this->invoices()
                ->whereNotIn('status', ['DRAFT', 'VOID'])
                ->selectRaw('COALESCE(SUM(total_amount - COALESCE(paid_amount, 0)), 0) as due')
                ->value('due');

            $calculated = $obContribution + $unpaidInvoices;
        }

        $this->updateQuietly(['current_balance' => $calculated]);

        return $calculated;
    }
}

