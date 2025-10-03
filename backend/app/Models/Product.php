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
        'image_paths',
        'stock_quantity',
        'is_active',
        'created_by',
        'created_by_role',
        'expiry_date',
        'min_stock_threshold',
        'auto_restock_quantity',
        'auto_restock_enabled',
    ];

    protected $casts = [
        'image_paths' => 'array',
        'price' => 'decimal:2',
        'is_active' => 'boolean',
        'stock_quantity' => 'integer',
        'expiry_date' => 'date',
        'min_stock_threshold' => 'integer',
        'auto_restock_quantity' => 'integer',
        'auto_restock_enabled' => 'boolean',
    ];

    /**
     * Get the user who created this product.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the reservations for this product.
     */
    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    /**
     * Get all branch stock records for this product
     */
    public function branchStock(): HasMany
    {
        return $this->hasMany(BranchStock::class);
    }

    /**
     * Get total stock across all branches
     */
    public function getTotalStockAttribute(): int
    {
        return $this->branchStock()->sum('stock_quantity');
    }

    /**
     * Get total available stock across all branches
     */
    public function getTotalAvailableStockAttribute(): int
    {
        return $this->branchStock()->sum(\DB::raw('stock_quantity - reserved_quantity'));
    }

    /**
     * Check if product is available in any branch
     */
    public function isAvailableInAnyBranch(): bool
    {
        return $this->branchStock()->whereRaw('stock_quantity > reserved_quantity')->exists();
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
