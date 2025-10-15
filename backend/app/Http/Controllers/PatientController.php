<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Appointment;
use App\Models\Prescription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Enums\UserRole;

class PatientController extends Controller
{
    /**
     * Get all patients (customers) for staff/admin
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $userRole = $user->role->value ?? (string)$user->role;

        // Only staff and admin can access patient data
        if (!in_array($userRole, ['staff', 'admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = User::where('role', UserRole::CUSTOMER->value)
            ->with(['appointments', 'prescriptions']);

        // If staff, only show patients assigned to their branch
        if ($userRole === 'staff') {
            if (!$user->branch_id) {
                return response()->json([
                    'message' => 'Staff member is not assigned to any branch',
                    'data' => [],
                    'pagination' => [
                        'current_page' => 1,
                        'last_page' => 1,
                        'per_page' => 15,
                        'total' => 0,
                    ]
                ], 200);
            }
            $query->where('branch_id', $user->branch_id);
        }

        // Search functionality
        if ($request->has('search') && $request->search) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%")
                  ->orWhere('email', 'like', "%{$searchTerm}%");
            });
        }

        $patients = $query->orderBy('name')->paginate(15);

        // Transform the data to include patient-specific information
        $transformedPatients = $patients->getCollection()->map(function ($patient) {
            return [
                'id' => $patient->id,
                'name' => $patient->name,
                'email' => $patient->email,
                'phone' => $patient->phone ?? 'Not provided',
                'date_of_birth' => $patient->date_of_birth ?? null,
                'address' => $patient->address ?? 'Not provided',
                'emergency_contact' => $patient->emergency_contact ?? 'Not provided',
                'emergency_phone' => $patient->emergency_phone ?? 'Not provided',
                'last_visit' => $patient->appointments()->latest()->first()?->appointment_date?->format('Y-m-d') ?? 'No visits',
                'next_appointment' => $patient->appointments()
                    ->where('status', 'scheduled')
                    ->where('appointment_date', '>=', now())
                    ->orderBy('appointment_date')
                    ->first()?->appointment_date?->format('Y-m-d') ?? null,
                'total_visits' => $patient->appointments()->count(),
                'prescriptions_count' => $patient->prescriptions()->count(),
                'created_at' => $patient->created_at,
                'branch' => $patient->branch ? [
                    'id' => $patient->branch->id,
                    'name' => $patient->branch->name,
                    'address' => $patient->branch->address
                ] : null,
            ];
        });

        return response()->json([
            'data' => $transformedPatients,
            'pagination' => [
                'current_page' => $patients->currentPage(),
                'last_page' => $patients->lastPage(),
                'per_page' => $patients->perPage(),
                'total' => $patients->total(),
            ]
        ]);
    }

    /**
     * Get a specific patient with detailed information
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();
        $userRole = $user->role->value ?? (string)$user->role;

        // Only staff and admin can access patient data
        if (!in_array($userRole, ['staff', 'admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $patient = User::where('id', $id)
            ->where('role', UserRole::CUSTOMER->value)
            ->with(['appointments.optometrist', 'prescriptions.optometrist', 'branch'])
            ->first();

        if (!$patient) {
            return response()->json(['message' => 'Patient not found'], 404);
        }

        // If staff, only show patients from their branch
        if ($userRole === 'staff') {
            if (!$user->branch_id) {
                return response()->json(['message' => 'Staff member is not assigned to any branch'], 403);
            }
            if ($patient->branch_id !== $user->branch_id) {
                return response()->json(['message' => 'Unauthorized. Patient belongs to a different branch.'], 403);
            }
        }

        // Get recent appointments
        $recentAppointments = $patient->appointments()
            ->with('optometrist')
            ->orderBy('appointment_date', 'desc')
            ->limit(10)
            ->get();

        // Get recent prescriptions
        $recentPrescriptions = $patient->prescriptions()
            ->with('optometrist')
            ->orderBy('issue_date', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'patient' => [
                'id' => $patient->id,
                'name' => $patient->name,
                'email' => $patient->email,
                'phone' => $patient->phone ?? 'Not provided',
                'date_of_birth' => $patient->date_of_birth ?? null,
                'address' => $patient->address ?? 'Not provided',
                'emergency_contact' => $patient->emergency_contact ?? 'Not provided',
                'emergency_phone' => $patient->emergency_phone ?? 'Not provided',
                'insurance_provider' => $patient->insurance_provider ?? 'Not provided',
                'insurance_policy' => $patient->insurance_policy ?? 'Not provided',
                'medical_history' => $patient->medical_history ? json_decode($patient->medical_history, true) : [],
                'allergies' => $patient->allergies ? json_decode($patient->allergies, true) : [],
                'created_at' => $patient->created_at,
                'branch' => $patient->branch ? [
                    'id' => $patient->branch->id,
                    'name' => $patient->branch->name,
                    'address' => $patient->branch->address
                ] : null,
            ],
            'appointments' => $recentAppointments->map(function ($appointment) {
                return [
                    'id' => $appointment->id,
                    'date' => $appointment->appointment_date?->format('Y-m-d'),
                    'time' => $appointment->appointment_time,
                    'type' => $appointment->appointment_type,
                    'status' => $appointment->status,
                    'optometrist' => $appointment->optometrist ? [
                        'name' => $appointment->optometrist->name,
                        'email' => $appointment->optometrist->email
                    ] : null,
                    'notes' => $appointment->notes,
                ];
            }),
            'prescriptions' => $recentPrescriptions->map(function ($prescription) {
                return [
                    'id' => $prescription->id,
                    'prescription_number' => $prescription->prescription_number,
                    'issue_date' => $prescription->issue_date?->format('Y-m-d'),
                    'expiry_date' => $prescription->expiry_date?->format('Y-m-d'),
                    'status' => $prescription->status,
                    'optometrist' => $prescription->optometrist ? [
                        'name' => $prescription->optometrist->name,
                        'email' => $prescription->optometrist->email
                    ] : null,
                    'right_eye' => $prescription->right_eye,
                    'left_eye' => $prescription->left_eye,
                    'vision_acuity' => $prescription->vision_acuity,
                    'recommendations' => $prescription->recommendations,
                ];
            }),
            'statistics' => [
                'total_appointments' => $patient->appointments()->count(),
                'total_prescriptions' => $patient->prescriptions()->count(),
                'last_visit' => $patient->appointments()->latest()->first()?->appointment_date?->format('Y-m-d') ?? null,
                'next_appointment' => $patient->appointments()
                    ->where('status', 'scheduled')
                    ->where('appointment_date', '>=', now())
                    ->orderBy('appointment_date')
                    ->first()?->appointment_date?->format('Y-m-d') ?? null,
            ]
        ]);
    }

    /**
     * Update patient information
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $userRole = $user->role->value ?? (string)$user->role;

        // Only staff and admin can update patient data
        if (!in_array($userRole, ['staff', 'admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $patient = User::where('id', $id)
            ->where('role', UserRole::CUSTOMER->value)
            ->first();

        if (!$patient) {
            return response()->json(['message' => 'Patient not found'], 404);
        }

        // If staff, only update patients from their branch
        if ($userRole === 'staff') {
            if (!$user->branch_id) {
                return response()->json(['message' => 'Staff member is not assigned to any branch'], 403);
            }
            if ($patient->branch_id !== $user->branch_id) {
                return response()->json(['message' => 'Unauthorized. Patient belongs to a different branch.'], 403);
            }
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $patient->id,
            'phone' => 'sometimes|nullable|string|max:20',
            'date_of_birth' => 'sometimes|nullable|date',
            'address' => 'sometimes|nullable|string|max:500',
            'emergency_contact' => 'sometimes|nullable|string|max:255',
            'emergency_phone' => 'sometimes|nullable|string|max:20',
            'insurance_provider' => 'sometimes|nullable|string|max:255',
            'insurance_policy' => 'sometimes|nullable|string|max:255',
            'medical_history' => 'sometimes|nullable|array',
            'allergies' => 'sometimes|nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $validator->validated();

        // Convert arrays to JSON for storage
        if (isset($data['medical_history'])) {
            $data['medical_history'] = json_encode($data['medical_history']);
        }
        if (isset($data['allergies'])) {
            $data['allergies'] = json_encode($data['allergies']);
        }

        $patient->update($data);

        return response()->json([
            'message' => 'Patient updated successfully',
            'patient' => [
                'id' => $patient->id,
                'name' => $patient->name,
                'email' => $patient->email,
                'phone' => $patient->phone,
                'date_of_birth' => $patient->date_of_birth,
                'address' => $patient->address,
                'emergency_contact' => $patient->emergency_contact,
                'emergency_phone' => $patient->emergency_phone,
                'insurance_provider' => $patient->insurance_provider,
                'insurance_policy' => $patient->insurance_policy,
                'medical_history' => $patient->medical_history ? json_decode($patient->medical_history, true) : [],
                'allergies' => $patient->allergies ? json_decode($patient->allergies, true) : [],
            ]
        ]);
    }
}

