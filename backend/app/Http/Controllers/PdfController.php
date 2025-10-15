<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\Appointment;
use App\Models\Prescription;
use App\Models\Reservation;
use App\Models\Product;
use App\Models\Branch;

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

            // Load stored receipt data if available
            $receipt = \App\Models\Receipt::with('items')->where('appointment_id', $appointment->id)->first();

            // Generate invoice number in format like 0601
            $invoiceNumber = str_pad($appointment->id, 4, '0', STR_PAD_LEFT);

            if ($receipt) {
                $data = [
                    'invoice_no' => $invoiceNumber,
                    'date' => $receipt->date->format('Y-m-d'),
                    'sales_type' => $receipt->sales_type,
                    'customer_name' => $receipt->customer_name,
                    'tin' => $receipt->tin ?? 'N/A',
                    'address' => $receipt->address ?? ($appointment->patient->address ?? 'N/A'),
                    'items' => $receipt->items->map(function ($item) {
                        return [
                            'description' => $item->description,
                            'qty' => $item->qty,
                            'unit_price' => (float) $item->unit_price,
                            'amount' => (float) $item->amount,
                        ];
                    })->toArray(),
                    'vatable_sales' => (float) $receipt->vatable_sales,
                    'less_vat' => (float) $receipt->less_vat,
                    'add_vat' => (float) $receipt->add_vat,
                    'zero_rated_sales' => (float) $receipt->zero_rated_sales,
                    'net_of_vat' => (float) $receipt->net_of_vat,
                    'vat_exempt_sales' => (float) $receipt->vat_exempt_sales,
                    'discount' => (float) $receipt->discount,
                    'withholding_tax' => (float) $receipt->withholding_tax,
                    'total_due' => (float) $receipt->total_due,
                ];
            } else {
                // Fallback minimal document
                $baseAmount = 500.00;
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
            
            // Generate filename
            $filename = 'receipt_' . $invoiceNumber . '_' . time() . '.pdf';
            
            // Set proper headers for PDF download
            return response($pdf->output(), 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                'Cache-Control' => 'no-cache, no-store, must-revalidate',
                'Pragma' => 'no-cache',
                'Expires' => '0',
            ]);
            
        } catch (\Exception $e) {
            \Log::error('PDF generation error: ' . $e->getMessage());
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
