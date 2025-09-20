<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'price',
        'category',
        'image_paths',
        'stock_quantity',
        'is_active',
        'created_by_role',
    ];

    protected $casts = [
        'image_paths' => 'array',
        'price' => 'decimal:2',
        'is_active' => 'boolean',
        'stock_quantity' => 'integer',
    ];

    /**
     * Get the user who created this product.
     * Note: This is a placeholder since we're using created_by_role instead of created_by
     */
    public function creator(): BelongsTo
    {
        // Since we don't have created_by field, return null for now
        return $this->belongsTo(User::class, 'id');
    }

    /**
     * Get the reservations for this product.
     */
    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    /**
     * Scope to get only active products.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get products with available stock.
     */
    public function scopeInStock($query)
    {
        return $query->where('stock_quantity', '>', 0);
    }
}
