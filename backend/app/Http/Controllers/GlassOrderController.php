<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use App\Models\GlassOrder;
use App\Models\User;
use App\Models\Appointment;

class GlassOrderController extends Controller
{
    /**
     * Store a newly created glass order.
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user || !in_array($user->role->value, ['staff', 'optometrist', 'admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'patient_id' => 'required|exists:users,id',
            'appointment_id' => 'nullable|exists:appointments,id',
            'prescription_data' => 'required|array',
            'frame_details' => 'nullable|array',
            'special_instructions' => 'nullable|string|max:1000',
            'estimated_completion_date' => 'nullable|date',
            'total_cost' => 'nullable|numeric|min:0',
            'advance_payment' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $appointment = null;
        if ($request->appointment_id) {
            $appointment = Appointment::find($request->appointment_id);
            if ($appointment && $user->role->value === 'staff' && $appointment->branch_id !== $user->branch_id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        $glassOrder = GlassOrder::create([
            'patient_id' => $request->patient_id,
            'appointment_id' => $request->appointment_id,
            'branch_id' => $user->branch_id ?? ($appointment->branch_id ?? 1),
            'created_by' => $user->id,
            'order_number' => GlassOrder::generateOrderNumber(),
            'prescription_data' => $request->prescription_data,
            'frame_details' => $request->frame_details,
            'special_instructions' => $request->special_instructions,
            'estimated_completion_date' => $request->estimated_completion_date,
            'total_cost' => $request->total_cost,
            'advance_payment' => $request->advance_payment,
        ]);

        return response()->json([
            'message' => 'Glass order created successfully',
            'order' => $glassOrder->load(['patient', 'appointment', 'branch', 'creator'])
        ], 201);
    }

    /**
     * Display the specified glass order.
     */
    public function show(string $id): JsonResponse
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $glassOrder = GlassOrder::with(['patient', 'appointment', 'branch', 'creator'])->findOrFail($id);

        // Check permissions
        if ($user->role->value === 'customer' && $glassOrder->patient_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (in_array($user->role->value, ['staff', 'optometrist']) && $glassOrder->branch_id !== $user->branch_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json(['order' => $glassOrder]);
    }

    /**
     * Update the specified glass order.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $user = Auth::user();

        if (!$user || !in_array($user->role->value, ['staff', 'optometrist', 'admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $glassOrder = GlassOrder::findOrFail($id);

        // Check branch access for staff/optometrists
        if (in_array($user->role->value, ['staff', 'optometrist']) && $glassOrder->branch_id !== $user->branch_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'sometimes|in:pending,in_production,sent_to_manufacturer,completed,cancelled',
            'frame_details' => 'nullable|array',
            'special_instructions' => 'nullable|string|max:1000',
            'estimated_completion_date' => 'nullable|date',
            'manufacturer_name' => 'nullable|string|max:255',
            'manufacturer_contact' => 'nullable|string|max:255',
            'manufacturer_notes' => 'nullable|string',
            'tracking_number' => 'nullable|string|max:255',
            'total_cost' => 'nullable|numeric|min:0',
            'advance_payment' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $glassOrder->update($request->validated());

        return response()->json([
            'message' => 'Glass order updated successfully',
            'order' => $glassOrder->load(['patient', 'appointment', 'branch', 'creator'])
        ]);
    }

    /**
     * Get glass orders for a specific patient.
     */
    public function getPatientOrders(Request $request, string $patientId): JsonResponse
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Customers can only view their own orders
        if ($user->role->value === 'customer' && $user->id != $patientId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = GlassOrder::where('patient_id', $patientId)
            ->with(['patient', 'appointment', 'branch', 'creator'])
            ->orderBy('created_at', 'desc');

        // Staff/optometrists can only see orders from their branch
        if (in_array($user->role->value, ['staff', 'optometrist'])) {
            $query->where('branch_id', $user->branch_id);
        }

        $glassOrders = $query->paginate(15);

        return response()->json([
            'orders' => $glassOrders->items(),
            'pagination' => [
                'current_page' => $glassOrders->currentPage(),
                'last_page' => $glassOrders->lastPage(),
                'per_page' => $glassOrders->perPage(),
                'total' => $glassOrders->total(),
            ]
        ]);
    }

    /**
     * Mark glass order as sent to manufacturer.
     */
    public function sendToManufacturer(Request $request, string $id): JsonResponse
    {
        $user = Auth::user();

        if (!$user || !in_array($user->role->value, ['staff', 'optometrist', 'admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $glassOrder = GlassOrder::findOrFail($id);

        // Check branch access for staff/optometrists
        if (in_array($user->role->value, ['staff', 'optometrist']) && $glassOrder->branch_id !== $user->branch_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'manufacturer_name' => 'required|string|max:255',
            'manufacturer_contact' => 'nullable|string|max:255',
            'manufacturer_notes' => 'nullable|string',
            'tracking_number' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $glassOrder->update([
            'status' => 'sent_to_manufacturer',
            'sent_to_manufacturer_at' => now(),
            'manufacturer_name' => $request->manufacturer_name,
            'manufacturer_contact' => $request->manufacturer_contact,
            'manufacturer_notes' => $request->manufacturer_notes,
            'tracking_number' => $request->tracking_number,
        ]);

        return response()->json([
            'message' => 'Glass order sent to manufacturer successfully',
            'order' => $glassOrder->load(['patient', 'appointment', 'branch', 'creator'])
        ]);
    }
}
