<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Manufacturer extends Model
{
    protected $fillable = [
        'name',
        'contact_person',
        'phone',
        'email',
        'product_line',
        'address',
        'website',
        'notes',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get the inventories for this manufacturer
     */
    public function inventories(): HasMany
    {
        return $this->hasMany(EnhancedInventory::class);
    }

    /**
     * Scope to get only active manufacturers
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to filter by product line
     */
    public function scopeByProductLine($query, $productLine)
    {
        return $query->where('product_line', $productLine);
    }

    /**
     * Get formatted contact information
     */
    public function getContactInfoAttribute(): array
    {
        return [
            'name' => $this->name,
            'contact_person' => $this->contact_person,
            'phone' => $this->phone,
            'email' => $this->email,
            'product_line' => $this->product_line,
            'address' => $this->address,
            'website' => $this->website,
        ];
    }
}



