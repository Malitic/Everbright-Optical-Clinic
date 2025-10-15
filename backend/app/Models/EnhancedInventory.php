<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class EnhancedInventory extends Model
{
    protected $fillable = [
        'branch_id',
        'product_name',
        'sku',
        'quantity',
        'min_threshold',
        'status',
        'manufacturer_id',
        'unit_price',
        'description',
        'image_path',
        'last_restock_date',
        'expiry_date',
        'is_active',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'min_threshold' => 'integer',
        'unit_price' => 'decimal:2',
        'last_restock_date' => 'date',
        'expiry_date' => 'date',
        'is_active' => 'boolean',
    ];

    /**
     * Get the branch for this inventory item
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Get the manufacturer for this inventory item
     */
    public function manufacturer(): BelongsTo
    {
        return $this->belongsTo(Manufacturer::class);
    }

    /**
     * Update status based on quantity
     */
    public function updateStatus(): void
    {
        if ($this->quantity <= 0) {
            $this->status = 'out_of_stock';
        } elseif ($this->quantity <= $this->min_threshold) {
            $this->status = 'low_stock';
        } else {
            $this->status = 'in_stock';
        }
        
        $this->save();
    }

    /**
     * Check if item is low stock
     */
    public function isLowStock(): bool
    {
        return $this->quantity <= $this->min_threshold && $this->quantity > 0;
    }

    /**
     * Check if item is out of stock
     */
    public function isOutOfStock(): bool
    {
        return $this->quantity <= 0;
    }

    /**
     * Check if item is expiring soon (within 30 days)
     */
    public function isExpiringSoon(int $days = 30): bool
    {
        if (!$this->expiry_date) {
            return false;
        }
        
        return $this->expiry_date <= Carbon::now()->addDays($days);
    }

    /**
     * Scope to get only active items
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get items by status
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to get low stock items
     */
    public function scopeLowStock($query)
    {
        return $query->where('status', 'low_stock');
    }

    /**
     * Scope to get out of stock items
     */
    public function scopeOutOfStock($query)
    {
        return $query->where('status', 'out_of_stock');
    }

    /**
     * Scope to get expiring soon items
     */
    public function scopeExpiringSoon($query, $days = 30)
    {
        return $query->where('expiry_date', '<=', Carbon::now()->addDays($days))
                    ->where('expiry_date', '>', Carbon::now());
    }

    /**
     * Scope to filter by branch
     */
    public function scopeByBranch($query, $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    /**
     * Scope to filter by manufacturer
     */
    public function scopeByManufacturer($query, $manufacturerId)
    {
        return $query->where('manufacturer_id', $manufacturerId);
    }
}



