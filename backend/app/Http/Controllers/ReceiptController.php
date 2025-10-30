<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use App\Models\Receipt;
use App\Models\Appointment;

class ReceiptController extends Controller
{
    public function store(Request $request)
    {
        $user = Auth::user();

        if (!$user || !in_array($user->role?->value, ['staff', 'optometrist', 'admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $rules = [
            'appointment_id' => 'nullable|exists:appointments,id',
            'patient_id' => 'required|integer',
            'branch_id' => 'nullable|integer',
            'invoice_no' => 'nullable|string',
            'date' => 'required|date',
            'sales_type' => 'required|in:cash,charge',
            'customer_name' => 'required|string',
            'tin' => 'nullable|string',
            'address' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string',
            'items.*.qty' => 'required|numeric|min:0',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.amount' => 'required|numeric|min:0',
            'total_sales' => 'required|numeric',
            'vatable_sales' => 'required|numeric',
            'less_vat' => 'required|numeric',
            'add_vat' => 'required|numeric',
            'zero_rated_sales' => 'required|numeric',
            'net_of_vat' => 'required|numeric',
            'vat_exempt_sales' => 'required|numeric',
            'discount' => 'required|numeric',
            'withholding_tax' => 'required|numeric',
            'total_due' => 'required|numeric',
        ];

        $validator = \Validator::make($request->all(), $rules);
        if ($validator->fails()) {
            return response()->json(['message' => 'Validation failed', 'errors' => $validator->errors()], 422);
        }

        $appointment = null;
        if ($request->appointment_id) {
            $appointment = Appointment::find($request->appointment_id);
            if ($appointment && $user->role->value === 'staff' && $appointment->branch_id !== $user->branch_id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        $invoiceNo = $request->invoice_no ?? str_pad(($request->appointment_id ?? time()) % 10000, 4, '0', STR_PAD_LEFT);

        $receipt = Receipt::create([
            'appointment_id' => $request->appointment_id,
            'patient_id' => $request->patient_id,
            'branch_id' => $request->branch_id ?? ($appointment->branch_id ?? $user->branch_id),
            'staff_id' => $user->id,
            'invoice_no' => $invoiceNo,
            'date' => $request->date,
            'sales_type' => $request->sales_type,
            'customer_name' => $request->customer_name,
            'tin' => $request->tin,
            'address' => $request->address,
            'items' => $request->items,
            'total_sales' => $request->total_sales,
            'vatable_sales' => $request->vatable_sales,
            'less_vat' => $request->less_vat,
            'add_vat' => $request->add_vat,
            'zero_rated_sales' => $request->zero_rated_sales,
            'net_of_vat' => $request->net_of_vat,
            'vat_exempt_sales' => $request->vat_exempt_sales,
            'discount' => $request->discount,
            'withholding_tax' => $request->withholding_tax,
            'total_due' => $request->total_due,
        ]);

        return response()->json(['message' => 'Receipt created', 'data' => $receipt], 201);
    }

    /**
     * Get receipts for a customer
     * GET /api/customers/{customerId}/receipts
     */
    public function getCustomerReceipts(Request $request, $customerId)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Customers can only view their own receipts, staff/admin can view any
        if ($user->role->value === 'customer' && $user->id != $customerId) {
            return response()->json(['message' => 'You can only view your own receipts'], 403);
        }

        $receipts = Receipt::where('patient_id', $customerId)
            ->with(['branch'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        $transformedReceipts = $receipts->getCollection()->map(function ($receipt) {
            $salesType = $receipt->sales_type ?: 'cash'; // Default to 'cash' if null
            return [
                'id' => $receipt->id,
                'invoice_no' => $receipt->invoice_no,
                'date' => $receipt->date,
                'sales_type' => $salesType,
                'payment_method' => strtoupper($salesType), // Always provide uppercase payment method
                'customer_name' => $receipt->customer_name,
                'total_due' => $receipt->total_due,
                'items' => $receipt->items,
                'branch' => $receipt->branch ? [
                    'id' => $receipt->branch->id,
                    'name' => $receipt->branch->name,
                    'address' => $receipt->branch->address,
                ] : null,
                'created_at' => $receipt->created_at,
                'updated_at' => $receipt->updated_at,
            ];
        });

        return response()->json([
            'data' => $transformedReceipts,
            'pagination' => [
                'current_page' => $receipts->currentPage(),
                'last_page' => $receipts->lastPage(),
                'per_page' => $receipts->perPage(),
                'total' => $receipts->total(),
            ]
        ]);
    }

    /**
     * Get a single receipt
     * GET /api/receipts/{receiptId}
     */
    public function show(Request $request, $receiptId)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $receipt = Receipt::with(['branch'])->find($receiptId);

        if (!$receipt) {
            return response()->json(['message' => 'Receipt not found'], 404);
        }

        // Customers can only view their own receipts, staff/admin can view any
        if ($user->role->value === 'customer' && $receipt->patient_id != $user->id) {
            return response()->json(['message' => 'You can only view your own receipts'], 403);
        }

        return response()->json([
            'id' => $receipt->id,
            'invoice_no' => $receipt->invoice_no,
            'date' => $receipt->date,
            'sales_type' => $receipt->sales_type,
            'payment_method' => $receipt->sales_type ? strtoupper($receipt->sales_type) : 'CASH',
            'customer_name' => $receipt->customer_name,
            'total_due' => $receipt->total_due,
            'items' => $receipt->items,
            'branch' => $receipt->branch ? [
                'id' => $receipt->branch->id,
                'name' => $receipt->branch->name,
                'address' => $receipt->branch->address,
            ] : null,
            'created_at' => $receipt->created_at,
            'updated_at' => $receipt->updated_at,
        ]);
    }
}
