<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Item extends Model
{
    protected $fillable = [
        'name', 'sku', 'type', 'description', 'sales_price',
        'purchase_price', 'unit', 'stock_quantity',
        'category_id', 'sales_account_id', 'purchase_account_id'
    ];

    protected $casts = [
        'sales_price'    => 'decimal:2',
        'purchase_price' => 'decimal:2',
        'stock_quantity' => 'decimal:2',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function salesAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'sales_account_id');
    }

    public function purchaseAccount(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'purchase_account_id');
    }
}
