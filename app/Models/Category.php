<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    protected $fillable = ['name', 'type', 'description'];

    public function items(): HasMany
    {
        return $this->hasMany(Item::class);
    }

    public function scopeItems($query)
    {
        return $query->where('type', 'ITEM');
    }

    public function scopeExpenses($query)
    {
        return $query->where('type', 'EXPENSE');
    }
}
