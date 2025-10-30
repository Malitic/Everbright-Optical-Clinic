<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Appointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'optometrist_id',
        'branch_id',
        'appointment_date',
        'start_time',
        'end_time',
        'type',
        'status',
        'notes',
    ];

    protected $casts = [
        'appointment_date' => 'date',
        // Columns are stored as TIME in DB; cast to string to avoid datetime parsing errors
        'start_time' => 'string',
        'end_time' => 'string',
    ];

    // Relationships
    public function patient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    public function optometrist(): BelongsTo
    {
        return $this->belongsTo(User::class, 'optometrist_id');
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function feedback()
    {
        return $this->hasOne(Feedback::class);
    }

    // Scopes
    public function scopeForPatient($query, $patientId)
    {
        return $query->where('patient_id', $patientId);
    }

    public function scopeForOptometrist($query, $optometristId)
    {
        return $query->where('optometrist_id', $optometristId);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeUpcoming($query)
    {
        return $query->where('appointment_date', '>=', now()->toDateString())
                    ->where('start_time', '>=', now());
    }

    public function scopeToday($query)
    {
        return $query->where('appointment_date', now()->toDateString());
    }
}
