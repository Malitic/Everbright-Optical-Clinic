<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use App\Traits\Auditable;

class Transaction extends Model
{
    use HasFactory, SoftDeletes, Auditable;

    protected $fillable = [
        'transaction_code',
        'customer_id',
        'branch_id',
        'appointment_id',
        'reservation_id',
        'total_amount',
        'status',
        'payment_method',
        'notes',
        'completed_at',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'completed_at' => 'datetime',
    ];

    /**
     * Boot method to generate transaction code
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($transaction) {
            if (empty($transaction->transaction_code)) {
                $transaction->transaction_code = static::generateTransactionCode();
            }
        });
    }

    /**
     * Generate unique transaction code
     */
    public static function generateTransactionCode(): string
    {
        $date = now()->format('Ymd');
        $prefix = "TXN-{$date}-";
        
        // Get the last transaction for today
        $lastTransaction = static::where('transaction_code', 'like', $prefix . '%')
            ->orderBy('transaction_code', 'desc')
            ->first();
        
        if ($lastTransaction) {
            $lastNumber = (int) substr($lastTransaction->transaction_code, -4);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }
        
        return $prefix . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Get the customer for this transaction
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    /**
     * Get the branch for this transaction
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Get the appointment for this transaction
     */
    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    /**
     * Get the reservation for this transaction
     */
    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }

    /**
     * Get the receipt for this transaction
     */
    public function receipt(): HasOne
    {
        return $this->hasOne(Receipt::class);
    }

    /**
     * Check if transaction is pending
     */
    public function isPending(): bool
    {
        return $this->status === 'Pending';
    }

    /**
     * Check if transaction is completed
     */
    public function isCompleted(): bool
    {
        return $this->status === 'Completed';
    }

    /**
     * Check if transaction is cancelled
     */
    public function isCancelled(): bool
    {
        return $this->status === 'Cancelled';
    }

    /**
     * Mark transaction as completed
     */
    public function markAsCompleted(): void
    {
        $this->update([
            'status' => 'Completed',
            'completed_at' => now(),
        ]);
    }

    /**
     * Mark transaction as cancelled
     */
    public function markAsCancelled(): void
    {
        $this->update([
            'status' => 'Cancelled',
        ]);
    }

    /**
     * Get transaction summary
     */
    public function getSummaryAttribute(): array
    {
        return [
            'transaction_code' => $this->transaction_code,
            'customer_name' => $this->customer->name,
            'branch_name' => $this->branch->name,
            'total_amount' => $this->total_amount,
            'status' => $this->status,
            'payment_method' => $this->payment_method,
            'created_at' => $this->created_at,
            'completed_at' => $this->completed_at,
        ];
    }

    /**
     * Scope for pending transactions
     */
    public function scopePending($query)
    {
        return $query->where('status', 'Pending');
    }

    /**
     * Scope for completed transactions
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'Completed');
    }

    /**
     * Scope for cancelled transactions
     */
    public function scopeCancelled($query)
    {
        return $query->where('status', 'Cancelled');
    }

    /**
     * Scope for transactions by branch
     */
    public function scopeForBranch($query, $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    /**
     * Scope for transactions by customer
     */
    public function scopeForCustomer($query, $customerId)
    {
        return $query->where('customer_id', $customerId);
    }

    /**
     * Scope for transactions by date range
     */
    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }
}
