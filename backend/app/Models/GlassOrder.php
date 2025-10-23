<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Auditable;

class GlassOrder extends Model
{
    use SoftDeletes, Auditable;

    protected $fillable = [
        'appointment_id',
        'patient_id',
        'prescription_id',
        'receipt_id',
        'branch_id',
        'reserved_products',
        'prescription_data',
        'frame_type',
        'lens_type',
        'lens_coating',
        'blue_light_filter',
        'progressive_lens',
        'bifocal_lens',
        'lens_material',
        'frame_material',
        'frame_color',
        'lens_color',
        'special_instructions',
        'manufacturer_notes',
        'priority',
        'status',
        'sent_to_manufacturer_at',
        'expected_delivery_date',
        'manufacturer_feedback',
    ];

    protected $casts = [
        'reserved_products' => 'array',
        'prescription_data' => 'array',
        'blue_light_filter' => 'boolean',
        'progressive_lens' => 'boolean',
        'bifocal_lens' => 'boolean',
        'sent_to_manufacturer_at' => 'datetime',
        'expected_delivery_date' => 'datetime',
    ];

    /**
     * Get the appointment that owns the glass order.
     */
    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    /**
     * Get the patient that owns the glass order.
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    /**
     * Get the prescription associated with the glass order.
     */
    public function prescription(): BelongsTo
    {
        return $this->belongsTo(Prescription::class);
    }

    /**
     * Get the receipt associated with the glass order.
     */
    public function receipt(): BelongsTo
    {
        return $this->belongsTo(Receipt::class);
    }

    /**
     * Get the branch where the glass order was created.
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Scope for orders by status.
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope for orders by priority.
     */
    public function scopeByPriority($query, string $priority)
    {
        return $query->where('priority', $priority);
    }

    /**
     * Scope for orders by patient.
     */
    public function scopeForPatient($query, int $patientId)
    {
        return $query->where('patient_id', $patientId);
    }

    /**
     * Scope for orders by branch.
     */
    public function scopeForBranch($query, int $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    /**
     * Get formatted order number.
     */
    public function getFormattedNumberAttribute(): string
    {
        return 'GO-' . str_pad($this->id, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Check if order is ready for manufacturer contact.
     */
    public function isReadyForManufacturer(): bool
    {
        return $this->status === 'pending' && 
               !empty($this->reserved_products) && 
               !empty($this->prescription_data);
    }

    /**
     * Mark as sent to manufacturer.
     */
    public function markAsSentToManufacturer(): void
    {
        $this->update([
            'status' => 'sent_to_manufacturer',
            'sent_to_manufacturer_at' => now(),
        ]);
    }
}
