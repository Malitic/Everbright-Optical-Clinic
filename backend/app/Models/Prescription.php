<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Carbon\Carbon;
use App\Traits\Auditable;

class Prescription extends Model
{
    use SoftDeletes, Auditable;

    protected $fillable = [
        'appointment_id',
        'patient_id',
        'optometrist_id',
        'type',
        'prescription_data',
        'issue_date',
        'expiry_date',
        'status',
        'notes',
    ];

    protected $casts = [
        'prescription_data' => 'array',
        'issue_date' => 'date',
        'expiry_date' => 'date',
    ];

    /**
     * Get the appointment that owns the prescription.
     */
    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    /**
     * Get the patient that owns the prescription.
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    /**
     * Get the optometrist that created the prescription.
     */
    public function optometrist(): BelongsTo
    {
        return $this->belongsTo(User::class, 'optometrist_id');
    }

    /**
     * Get the branch where the prescription was created.
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Check if prescription is expired.
     */
    public function isExpired(): bool
    {
        return $this->expiry_date < now();
    }

    /**
     * Check if prescription is active.
     */
    public function isActive(): bool
    {
        return $this->status === 'active' && !$this->isExpired();
    }

    /**
     * Get formatted prescription number.
     */
    public function getFormattedNumberAttribute(): string
    {
        return 'RX-' . str_pad($this->id, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Generate prescription number.
     */
    public static function generatePrescriptionNumber(): string
    {
        $lastPrescription = self::orderBy('id', 'desc')->first();
        $nextId = $lastPrescription ? $lastPrescription->id + 1 : 1;
        return 'RX-' . str_pad($nextId, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Scope for active prescriptions.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active')
                    ->where('expiry_date', '>=', now());
    }

    /**
     * Scope for expired prescriptions.
     */
    public function scopeExpired($query)
    {
        return $query->where('expiry_date', '<', now());
    }

    /**
     * Scope for prescriptions by patient.
     */
    public function scopeForPatient($query, int $patientId)
    {
        return $query->where('patient_id', $patientId);
    }

    /**
     * Scope for prescriptions by optometrist.
     */
    public function scopeByOptometrist($query, int $optometristId)
    {
        return $query->where('optometrist_id', $optometristId);
    }
}
