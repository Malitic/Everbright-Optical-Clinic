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
        'approval_status',
        'branch_id',
        'category_id',
        'image_metadata',
        'primary_image',
        'attributes',
        'brand',
        'model',
        'sku',
    ];

    protected $casts = [
        'image_paths' => 'array',
        'image_metadata' => 'array',
        'attributes' => 'array',
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
     * Get the branch for this product.
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Get the category for this product.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class);
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

    /**
     * Scope to get approved products (visible to customers).
     */
    public function scopeApproved($query)
    {
        return $query->where('approval_status', 'approved');
    }

    /**
     * Scope to get pending products.
     */
    public function scopePending($query)
    {
        return $query->where('approval_status', 'pending');
    }

    /**
     * Scope to get rejected products.
     */
    public function scopeRejected($query)
    {
        return $query->where('approval_status', 'rejected');
    }

    /**
     * Scope to get products by branch.
     */
    public function scopeByBranch($query, $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    /**
     * Check if product is approved and active.
     */
    public function isApprovedAndActive(): bool
    {
        return $this->approval_status === 'approved' && $this->is_active;
    }

    /**
     * Scope to get products by category.
     */
    public function scopeByCategory($query, $categoryId)
    {
        return $query->where('category_id', $categoryId);
    }

    /**
     * Scope to get products by brand.
     */
    public function scopeByBrand($query, $brand)
    {
        return $query->where('brand', $brand);
    }

    /**
     * Scope to get products with primary image.
     */
    public function scopeWithPrimaryImage($query)
    {
        return $query->whereNotNull('primary_image');
    }

    /**
     * Get the primary image path.
     */
    public function getPrimaryImagePathAttribute(): ?string
    {
        if ($this->primary_image) {
            return $this->primary_image;
        }
        
        if ($this->image_paths && count($this->image_paths) > 0) {
            return $this->image_paths[0];
        }
        
        return null;
    }
}
