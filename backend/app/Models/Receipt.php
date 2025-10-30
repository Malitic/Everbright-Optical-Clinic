<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Receipt extends Model
{
    use HasFactory;

    protected $fillable = [
        'appointment_id',
        'patient_id',
        'branch_id',
        'staff_id',
        'invoice_no',
        'date',
        'sales_type',
        'customer_name',
        'tin',
        'address',
        'items',
        'total_sales',
        'vatable_sales',
        'less_vat',
        'add_vat',
        'zero_rated_sales',
        'net_of_vat',
        'vat_exempt_sales',
        'discount',
        'withholding_tax',
        'total_due',
    ];

    protected $casts = [
        'date' => 'date',
        'items' => 'array',
        'total_sales' => 'decimal:2',
        'vatable_sales' => 'decimal:2',
        'less_vat' => 'decimal:2',
        'add_vat' => 'decimal:2',
        'zero_rated_sales' => 'decimal:2',
        'net_of_vat' => 'decimal:2',
        'vat_exempt_sales' => 'decimal:2',
        'discount' => 'decimal:2',
        'withholding_tax' => 'decimal:2',
        'total_due' => 'decimal:2',
    ];

    /**
     * Get the branch that generated this receipt
     */
    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Get the patient this receipt belongs to
     */
    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    /**
     * Get the staff member who created this receipt
     */
    public function staff()
    {
        return $this->belongsTo(User::class, 'staff_id');
    }

    /**
     * Get the appointment this receipt is for (if any)
     */
    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }

    /**
     * Generate a unique receipt number
     */
    public static function generateReceiptNumber()
    {
        $date = now()->format('ymd');
        $lastReceipt = self::where('invoice_no', 'like', $date . '%')
                          ->orderBy('id', 'desc')
                          ->first();

        $sequence = 1;
        if ($lastReceipt) {
            $lastSequence = (int) substr($lastReceipt->invoice_no, -4);
            $sequence = $lastSequence + 1;
        }

        return $date . sprintf('%04d', $sequence);
    }
}
