<?php

namespace App\Http\Controllers;

use App\Models\GlassOrder;
use App\Models\Appointment;
use App\Models\Prescription;
use App\Models\Receipt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class GlassOrderController extends Controller
{
    /**
     * Display a listing of glass orders.
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }
            
            $query = GlassOrder::with(['patient', 'appointment', 'prescription', 'receipt', 'branch']);

            // Handle role format
            $userRole = null;
            if (is_object($user->role)) {
                $userRole = $user->role->value ?? (string)$user->role;
            } else {
                $userRole = (string)$user->role;
            }

            // Filter by branch for staff
            if ($userRole === 'staff') {
                if (!$user->branch_id) {
                    return response()->json(['message' => 'Staff user has no branch assigned'], 400);
                }
                $query->where('branch_id', $user->branch_id);
            }

            // Filter by status if provided
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            // Filter by priority if provided
            if ($request->has('priority')) {
                $query->where('priority', $request->priority);
            }

            $glassOrders = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'data' => $glassOrders->map(function ($order) {
                    return [
                        'id' => $order->id,
                        'formatted_number' => $order->formatted_number,
                        'patient' => $order->patient ? [
                            'id' => $order->patient->id,
                            'name' => $order->patient->name,
                            'email' => $order->patient->email,
                            'phone' => $order->patient->phone,
                        ] : null,
                        'appointment' => $order->appointment ? [
                            'id' => $order->appointment->id,
                            'date' => $order->appointment->appointment_date,
                            'type' => $order->appointment->type,
                        ] : null,
                        'prescription' => $order->prescription ? [
                            'id' => $order->prescription->id,
                            'issue_date' => $order->prescription->issue_date,
                            'expiry_date' => $order->prescription->expiry_date,
                            'prescription_data' => $order->prescription_data, // Use stored data
                        ] : null,
                        'receipt' => $order->receipt ? [
                            'id' => $order->receipt->id,
                            'receipt_number' => $order->receipt->receipt_number,
                            'total_due' => $order->receipt->total_due,
                        ] : null,
                        'branch' => $order->branch ? [
                            'id' => $order->branch->id,
                            'name' => $order->branch->name,
                        ] : null,
                        'reserved_products' => $order->reserved_products,
                        'glass_specifications' => [
                            'frame_type' => $order->frame_type,
                            'lens_type' => $order->lens_type,
                            'lens_coating' => $order->lens_coating,
                            'blue_light_filter' => $order->blue_light_filter,
                            'progressive_lens' => $order->progressive_lens,
                            'bifocal_lens' => $order->bifocal_lens,
                            'lens_material' => $order->lens_material,
                            'frame_material' => $order->frame_material,
                            'frame_color' => $order->frame_color,
                            'lens_color' => $order->lens_color,
                        ],
                        'manufacturer_info' => [
                            'special_instructions' => $order->special_instructions,
                            'manufacturer_notes' => $order->manufacturer_notes,
                            'priority' => $order->priority,
                        ],
                        'status' => $order->status,
                        'sent_to_manufacturer_at' => $order->sent_to_manufacturer_at,
                        'expected_delivery_date' => $order->expected_delivery_date,
                        'manufacturer_feedback' => $order->manufacturer_feedback,
                        'created_at' => $order->created_at->toISOString(),
                        'updated_at' => $order->updated_at->toISOString(),
                    ];
                })
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in GlassOrderController@index: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'message' => 'An error occurred while fetching glass orders',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created glass order.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'appointment_id' => 'required|exists:appointments,id',
            'patient_id' => 'required|exists:users,id',
            'prescription_id' => 'nullable|exists:prescriptions,id',
            'receipt_id' => 'nullable|exists:receipts,id',
            'reserved_products' => 'required|array',
            'prescription_data' => 'nullable|array',
            'frame_type' => 'nullable|string',
            'lens_type' => 'nullable|string',
            'lens_coating' => 'nullable|string',
            'blue_light_filter' => 'boolean',
            'progressive_lens' => 'boolean',
            'bifocal_lens' => 'boolean',
            'lens_material' => 'nullable|string',
            'frame_material' => 'nullable|string',
            'frame_color' => 'nullable|string',
            'lens_color' => 'nullable|string',
            'special_instructions' => 'nullable|string',
            'manufacturer_notes' => 'nullable|string',
            'priority' => 'in:low,normal,high,urgent',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();
        
        // Get appointment to determine branch
        $appointment = Appointment::findOrFail($request->appointment_id);
        
        $glassOrder = GlassOrder::create([
            'appointment_id' => $request->appointment_id,
            'patient_id' => $request->patient_id,
            'prescription_id' => $request->prescription_id,
            'receipt_id' => $request->receipt_id,
            'branch_id' => $appointment->branch_id,
            'reserved_products' => $request->reserved_products,
            'prescription_data' => $request->prescription_data,
            'frame_type' => $request->frame_type,
            'lens_type' => $request->lens_type,
            'lens_coating' => $request->lens_coating,
            'blue_light_filter' => $request->blue_light_filter ?? false,
            'progressive_lens' => $request->progressive_lens ?? false,
            'bifocal_lens' => $request->bifocal_lens ?? false,
            'lens_material' => $request->lens_material,
            'frame_material' => $request->frame_material,
            'frame_color' => $request->frame_color,
            'lens_color' => $request->lens_color,
            'special_instructions' => $request->special_instructions,
            'manufacturer_notes' => $request->manufacturer_notes,
            'priority' => $request->priority ?? 'normal',
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Glass order created successfully',
            'data' => [
                'id' => $glassOrder->id,
                'formatted_number' => $glassOrder->formatted_number,
                'status' => $glassOrder->status,
            ]
        ], 201);
    }

    /**
     * Display the specified glass order.
     */
    public function show($id)
    {
        $user = Auth::user();
        $glassOrder = GlassOrder::with(['patient', 'appointment', 'prescription', 'receipt', 'branch'])->findOrFail($id);

        // Check if user has access to this order
        if ($user->role->value === 'staff' && $glassOrder->branch_id !== $user->branch_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'data' => [
                'id' => $glassOrder->id,
                'formatted_number' => $glassOrder->formatted_number,
                'patient' => [
                    'id' => $glassOrder->patient->id,
                    'name' => $glassOrder->patient->name,
                    'email' => $glassOrder->patient->email,
                    'phone' => $glassOrder->patient->phone,
                    'address' => $glassOrder->patient->address,
                ],
                'appointment' => [
                    'id' => $glassOrder->appointment->id,
                    'date' => $glassOrder->appointment->appointment_date,
                    'type' => $glassOrder->appointment->type,
                ],
                'prescription' => $glassOrder->prescription ? [
                    'id' => $glassOrder->prescription->id,
                    'right_eye' => $glassOrder->prescription->right_eye,
                    'left_eye' => $glassOrder->prescription->left_eye,
                    'lens_type' => $glassOrder->prescription->lens_type,
                    'coating' => $glassOrder->prescription->coating,
                    'recommendations' => $glassOrder->prescription->recommendations,
                    'additional_notes' => $glassOrder->prescription->additional_notes,
                ] : null,
                'reserved_products' => $glassOrder->reserved_products,
                'prescription_data' => $glassOrder->prescription_data,
                'glass_specifications' => [
                    'frame_type' => $glassOrder->frame_type,
                    'lens_type' => $glassOrder->lens_type,
                    'lens_coating' => $glassOrder->lens_coating,
                    'blue_light_filter' => $glassOrder->blue_light_filter,
                    'progressive_lens' => $glassOrder->progressive_lens,
                    'bifocal_lens' => $glassOrder->bifocal_lens,
                    'lens_material' => $glassOrder->lens_material,
                    'frame_material' => $glassOrder->frame_material,
                    'frame_color' => $glassOrder->frame_color,
                    'lens_color' => $glassOrder->lens_color,
                ],
                'manufacturer_info' => [
                    'special_instructions' => $glassOrder->special_instructions,
                    'manufacturer_notes' => $glassOrder->manufacturer_notes,
                    'priority' => $glassOrder->priority,
                ],
                'status' => $glassOrder->status,
                'sent_to_manufacturer_at' => $glassOrder->sent_to_manufacturer_at,
                'expected_delivery_date' => $glassOrder->expected_delivery_date,
                'manufacturer_feedback' => $glassOrder->manufacturer_feedback,
                'created_at' => $glassOrder->created_at->toISOString(),
                'updated_at' => $glassOrder->updated_at->toISOString(),
            ]
        ]);
    }

    /**
     * Update the specified glass order.
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $glassOrder = GlassOrder::findOrFail($id);

        // Check if user has access to this order
        if ($user->role->value === 'staff' && $glassOrder->branch_id !== $user->branch_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'in:pending,sent_to_manufacturer,in_production,ready_for_pickup,delivered,cancelled',
            'priority' => 'in:low,normal,high,urgent',
            'expected_delivery_date' => 'nullable|date',
            'manufacturer_feedback' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $updateData = $request->only([
            'status', 'priority', 'expected_delivery_date', 'manufacturer_feedback'
        ]);

        // If status is being updated to 'sent_to_manufacturer', set the timestamp
        if ($request->has('status') && $request->status === 'sent_to_manufacturer') {
            $updateData['sent_to_manufacturer_at'] = now();
        }

        $glassOrder->update($updateData);

        return response()->json([
            'message' => 'Glass order updated successfully',
            'data' => [
                'id' => $glassOrder->id,
                'status' => $glassOrder->status,
                'updated_at' => $glassOrder->updated_at->toISOString(),
            ]
        ]);
    }

    /**
     * Get glass orders for a specific patient.
     */
    public function getByPatient($patientId)
    {
        $user = Auth::user();
        
        // Handle role format
        $userRole = null;
        if (is_object($user->role)) {
            $userRole = $user->role->value ?? (string)$user->role;
        } else {
            $userRole = (string)$user->role;
        }

        $query = GlassOrder::with(['patient', 'appointment', 'prescription', 'receipt', 'branch'])
            ->where('patient_id', $patientId);

        // Filter by branch for staff
        if ($userRole === 'staff') {
            $query->where('branch_id', $user->branch_id);
        }

        $glassOrders = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'data' => $glassOrders->map(function ($order) {
                return [
                    'id' => $order->id,
                    'formatted_number' => $order->formatted_number,
                    'patient' => $order->patient ? [
                        'id' => $order->patient->id,
                        'name' => $order->patient->name,
                        'email' => $order->patient->email,
                        'phone' => $order->patient->phone,
                    ] : null,
                    'appointment' => $order->appointment ? [
                        'id' => $order->appointment->id,
                        'date' => $order->appointment->appointment_date,
                        'type' => $order->appointment->type,
                    ] : null,
                    'prescription' => $order->prescription ? [
                        'id' => $order->prescription->id,
                        'lens_type' => $order->prescription->lens_type,
                        'coating' => $order->prescription->coating,
                        'prescription_data' => $order->prescription_data,
                    ] : null,
                    'receipt' => $order->receipt ? [
                        'id' => $order->receipt->id,
                        'receipt_number' => $order->receipt->receipt_number,
                        'total_due' => $order->receipt->total_due,
                    ] : null,
                    'branch' => $order->branch ? [
                        'id' => $order->branch->id,
                        'name' => $order->branch->name,
                    ] : null,
                    'reserved_products' => $order->reserved_products,
                    'glass_specifications' => [
                        'frame_type' => $order->frame_type,
                        'lens_type' => $order->lens_type,
                        'lens_coating' => $order->lens_coating,
                        'blue_light_filter' => $order->blue_light_filter,
                        'progressive_lens' => $order->progressive_lens,
                        'bifocal_lens' => $order->bifocal_lens,
                        'lens_material' => $order->lens_material,
                        'frame_material' => $order->frame_material,
                        'frame_color' => $order->frame_color,
                        'lens_color' => $order->lens_color,
                    ],
                    'manufacturer_info' => [
                        'special_instructions' => $order->special_instructions,
                        'manufacturer_notes' => $order->manufacturer_notes,
                        'priority' => $order->priority,
                    ],
                    'status' => $order->status,
                    'sent_to_manufacturer_at' => $order->sent_to_manufacturer_at,
                    'expected_delivery_date' => $order->expected_delivery_date,
                    'manufacturer_feedback' => $order->manufacturer_feedback,
                    'created_at' => $order->created_at->toISOString(),
                    'updated_at' => $order->updated_at->toISOString(),
                ];
            })
        ]);
    }

    /**
     * Mark glass order as sent to manufacturer.
     */
    public function markAsSentToManufacturer($id)
    {
        $user = Auth::user();
        $glassOrder = GlassOrder::findOrFail($id);

        // Check if user has access to this order
        if ($user->role->value === 'staff' && $glassOrder->branch_id !== $user->branch_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $glassOrder->markAsSentToManufacturer();

        return response()->json([
            'message' => 'Glass order marked as sent to manufacturer',
            'data' => [
                'id' => $glassOrder->id,
                'status' => $glassOrder->status,
                'sent_to_manufacturer_at' => $glassOrder->sent_to_manufacturer_at->toISOString(),
            ]
        ]);
    }
}