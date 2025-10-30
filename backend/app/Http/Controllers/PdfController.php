<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use App\Models\Appointment;
use App\Models\Prescription;
use App\Models\Reservation;
use App\Models\Product;
use App\Models\Branch;
use App\Models\Receipt;

class PdfController extends Controller
{
    /**
     * Generate and download receipt PDF for an appointment
     */
    public function downloadReceipt($appointmentId)
    {
        try {
            $user = Auth::user();
            $appointment = Appointment::with(['patient', 'optometrist', 'branch'])->findOrFail($appointmentId);
            
            // Check if user can access this appointment
            if ($user->role->value === 'customer' && $appointment->patient_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
            
            if (in_array($user->role->value, ['staff', 'optometrist']) && $appointment->branch_id !== $user->branch_id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Try to find a saved receipt for this appointment
            $receipt = Receipt::where('appointment_id', $appointment->id)->latest()->first();

            if ($receipt) {
                $data = [
                    'invoice_no' => $receipt->invoice_no,
                    'date' => $receipt->date->format('Y-m-d'),
                    'sales_type' => $receipt->sales_type,
                    'customer_name' => $receipt->customer_name,
                    'tin' => $receipt->tin ?? 'N/A',
                    'address' => $receipt->address ?? 'N/A',
                    'items' => $receipt->items ?? [],
                    'total_sales' => (float)$receipt->total_sales,
                    'vatable_sales' => (float)$receipt->vatable_sales,
                    'less_vat' => (float)$receipt->less_vat,
                    'add_vat' => (float)$receipt->add_vat,
                    'zero_rated_sales' => (float)$receipt->zero_rated_sales,
                    'net_of_vat' => (float)$receipt->net_of_vat,
                    'vat_exempt_sales' => (float)$receipt->vat_exempt_sales,
                    'discount' => (float)$receipt->discount,
                    'withholding_tax' => (float)$receipt->withholding_tax,
                    'total_due' => (float)$receipt->total_due,
                ];
            } else {
                // Fallback to basic template if no saved receipt exists
                $invoiceNumber = str_pad($appointment->id, 4, '0', STR_PAD_LEFT);
                $baseAmount = 500.00; // default
                $vatRate = 0.12;
                $vatableAmount = $baseAmount / (1 + $vatRate);
                $vatAmount = $baseAmount - $vatableAmount;
                $data = [
                    'invoice_no' => $invoiceNumber,
                    'date' => $appointment->appointment_date->format('Y-m-d'),
                    'sales_type' => 'cash',
                    'customer_name' => $appointment->patient->name,
                    'tin' => 'N/A',
                    'address' => $appointment->patient->address ?? 'N/A',
                    'items' => [[
                        'description' => 'Eye Examination',
                        'qty' => 1,
                        'unit_price' => $baseAmount,
                        'amount' => $baseAmount,
                    ]],
                    'total_sales' => $baseAmount,
                    'vatable_sales' => $vatableAmount,
                    'less_vat' => $vatAmount,
                    'add_vat' => $vatAmount,
                    'zero_rated_sales' => 0.00,
                    'net_of_vat' => $vatableAmount,
                    'vat_exempt_sales' => 0.00,
                    'discount' => 0.00,
                    'withholding_tax' => 0.00,
                    'total_due' => $baseAmount,
                ];
            }

            $pdf = Pdf::loadView('pdf.receipt', $data);

            // Prepare save path; ensure directory exists
            $filename = 'receipt_' . $data['invoice_no'] . '_' . time() . '.pdf';
            $dir = storage_path('app/receipts');
            if (!is_dir($dir)) {
                @mkdir($dir, 0777, true);
            }
            
            // Try saving but don't fail the download if save has issues
            try {
                $pdf->save($dir . DIRECTORY_SEPARATOR . $filename);
            } catch (\Throwable $e) {
                \Log::warning('Failed to save receipt PDF: ' . $e->getMessage());
            }

            // Always return the download stream
            return $pdf->download($filename);
            
        } catch (ModelNotFoundException $e) {
            return response()->json(['error' => 'Appointment not found'], 404);
        } catch (\Exception $e) {
            \Log::error('PDF generation error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to generate PDF: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Generate and download receipt PDF by receipt id (uses saved data only)
     */
    public function downloadReceiptById($receiptId)
    {
        try {
            $user = Auth::user();
            $receipt = Receipt::findOrFail($receiptId);

            // Basic authorization: customers can only access their own; staff/optometrists limited to branch; admins allowed
            if ($user->role->value === 'customer' && $receipt->patient_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            if (in_array($user->role->value, ['staff', 'optometrist']) && $receipt->branch_id !== $user->branch_id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $data = [
                'invoice_no' => $receipt->invoice_no,
                'date' => optional($receipt->date)->format('Y-m-d') ?? date('Y-m-d'),
                'sales_type' => $receipt->sales_type,
                'customer_name' => $receipt->customer_name,
                'tin' => $receipt->tin ?? 'N/A',
                'address' => $receipt->address ?? 'N/A',
                'items' => $receipt->items ?? [],
                'total_sales' => (float)$receipt->total_sales,
                'vatable_sales' => (float)$receipt->vatable_sales,
                'less_vat' => (float)$receipt->less_vat,
                'add_vat' => (float)$receipt->add_vat,
                'zero_rated_sales' => (float)$receipt->zero_rated_sales,
                'net_of_vat' => (float)$receipt->net_of_vat,
                'vat_exempt_sales' => (float)$receipt->vat_exempt_sales,
                'discount' => (float)$receipt->discount,
                'withholding_tax' => (float)$receipt->withholding_tax,
                'total_due' => (float)$receipt->total_due,
            ];

            $pdf = Pdf::loadView('pdf.receipt', $data);
            $filename = 'receipt_' . $data['invoice_no'] . '_' . time() . '.pdf';
            return $pdf->download($filename);
        } catch (ModelNotFoundException $e) {
            return response()->json(['error' => 'Receipt not found'], 404);
        } catch (\Throwable $e) {
            \Log::error('PDF generation error (by id): ' . $e->getMessage());
            return response()->json(['error' => 'Failed to generate PDF: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Generate and download prescription PDF
     */
    public function downloadPrescription($prescriptionId)
    {
        $user = Auth::user();
        $prescription = Prescription::with(['patient', 'optometrist', 'branch'])->findOrFail($prescriptionId);
        
        // Check if user can access this prescription
        if ($user->role->value === 'customer' && $prescription->patient_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        if (in_array($user->role->value, ['staff', 'optometrist']) && $prescription->branch_id !== $user->branch_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $data = [
            'patient_name' => $prescription->patient->name,
            'patient_dob' => $prescription->patient->date_of_birth ?? 'N/A',
            'patient_address' => $prescription->patient->address ?? 'N/A',
            'patient_contact' => $prescription->patient->phone ?? 'N/A',
            'prescription_date' => $prescription->created_at->format('Y-m-d'),
            'optometrist_name' => $prescription->optometrist->name,
            'branch_name' => $prescription->branch->name,
            'medications' => json_decode($prescription->medications, true) ?? [],
            'eye_exam_results' => json_decode($prescription->eye_exam_results, true) ?? null,
            'optometrist_license' => $prescription->optometrist->license_number ?? 'N/A'
        ];

        $pdf = Pdf::loadView('pdf.prescription', $data);
        
        // Save to storage
        $filename = 'prescription_' . $prescriptionId . '_' . time() . '.pdf';
        $pdf->save(storage_path('app/prescriptions/' . $filename));
        
        return $pdf->download($filename);
    }

    /**
     * Get list of receipts for a customer
     */
    public function getCustomerReceipts()
    {
        $user = Auth::user();
        
        if ($user->role->value !== 'customer') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $appointments = Appointment::with(['optometrist', 'branch'])
            ->where('patient_id', $user->id)
            ->where('status', 'completed')
            ->orderBy('appointment_date', 'desc')
            ->get();

        return response()->json([
            'appointments' => $appointments->map(function ($appointment) {
                return [
                    'id' => $appointment->id,
                    'date' => $appointment->appointment_date,
                    'optometrist' => $appointment->optometrist->name,
                    'branch' => $appointment->branch->name,
                    'status' => $appointment->status
                ];
            })
        ]);
    }

    /**
     * Get list of prescriptions for a customer
     */
    public function getCustomerPrescriptions()
    {
        $user = Auth::user();
        
        if ($user->role->value !== 'customer') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $prescriptions = Prescription::with(['optometrist', 'branch'])
            ->where('patient_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'prescriptions' => $prescriptions->map(function ($prescription) {
                return [
                    'id' => $prescription->id,
                    'date' => $prescription->created_at->format('Y-m-d'),
                    'optometrist' => $prescription->optometrist->name,
                    'branch' => $prescription->branch->name,
                    'medications_count' => count(json_decode($prescription->medications, true) ?? [])
                ];
            })
        ]);
    }
}
