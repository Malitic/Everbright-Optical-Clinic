<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GlassOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'appointment_id',
        'branch_id',
        'created_by',
        'order_number',
        'prescription_data',
        'frame_details',
        'special_instructions',
        'status',
        'production_started_at',
        'sent_to_manufacturer_at',
        'completed_at',
        'estimated_completion_date',
        'manufacturer_name',
        'manufacturer_contact',
        'manufacturer_notes',
        'tracking_number',
        'total_cost',
        'advance_payment',
    ];

    protected $casts = [
        'prescription_data' => 'array',
        'frame_details' => 'array',
        'production_started_at' => 'datetime',
        'sent_to_manufacturer_at' => 'datetime',
        'completed_at' => 'datetime',
        'estimated_completion_date' => 'datetime',
        'total_cost' => 'decimal:2',
        'advance_payment' => 'decimal:2',
    ];

    /**
     * Get the patient this order belongs to
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    /**
     * Get the appointment this order was created from
     */
    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    /**
     * Get the branch this order was created at
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Get the user who created this order
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Generate a unique order number
     */
    public static function generateOrderNumber(): string
    {
        $date = now()->format('Ymd');
        $lastOrder = self::where('order_number', 'like', $date . '%')
                        ->orderBy('id', 'desc')
                        ->first();

        $sequence = 1;
        if ($lastOrder) {
            $lastSequence = (int) substr($lastOrder->order_number, -4);
            $sequence = $lastSequence + 1;
        }

        return $date . sprintf('%04d', $sequence);
    }
}
