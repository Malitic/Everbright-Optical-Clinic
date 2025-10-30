<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Appointment;
use App\Models\Prescription;
use Illuminate\Http\Request;
use App\Enums\UserRole;
use Carbon\Carbon;

class OptometristController extends Controller
{
    /**
     * Get patients that have been seen by the logged-in optometrist
     * GET /api/optometrist/patients
     */
    public function getPatients(Request $request)
    {
        $user = $request->user();

        if (!$user || $user->role->value !== 'optometrist') {
            return response()->json(['message' => 'Unauthorized. Optometrist access required.'], 403);
        }

        // Get unique patients this optometrist has seen
        $patientIds = Appointment::where('optometrist_id', $user->id)
            ->where('status', 'completed')
            ->pluck('patient_id')
            ->unique();

        $patients = User::whereIn('id', $patientIds)
            ->where('role', UserRole::CUSTOMER->value)
            ->with(['appointments' => function ($query) use ($user) {
                $query->where('optometrist_id', $user->id)
                    ->orderBy('appointment_date', 'desc');
            }, 'prescriptions' => function ($query) use ($user) {
                $query->where('optometrist_id', $user->id)
                    ->orderBy('issue_date', 'desc');
            }])
            ->get()
            ->map(function ($patient) {
                $lastAppointment = $patient->appointments->first();
                $allAppointments = $patient->appointments;

                return [
                    'id' => $patient->id,
                    'name' => $patient->name,
                    'email' => $patient->email,
                    'phone' => $patient->phone,
                    'last_visit' => $lastAppointment ? $lastAppointment->appointment_date : null,
                    'total_appointments' => $allAppointments->count(),
                    'total_prescriptions' => $patient->prescriptions->count(),
                    'status' => 'active', // All patients this optometrist has seen are active for their purposes
                ];
            })
            ->sortByDesc('last_visit')
            ->values();

        return response()->json([
            'data' => $patients,
            'total' => $patients->count()
        ]);
    }

    /**
     * Get detailed patient information for optometrist
     * GET /api/optometrist/patients/{id}
     */
    public function getPatient(Request $request, $patientId)
    {
        $user = $request->user();

        if (!$user || $user->role->value !== 'optometrist') {
            return response()->json(['message' => 'Unauthorized. Optometrist access required.'], 403);
        }

        $patient = User::where('id', $patientId)
            ->where('role', UserRole::CUSTOMER->value)
            ->first();

        if (!$patient) {
            return response()->json(['message' => 'Patient not found'], 404);
        }

        // Check if this optometrist has been involved with this patient
        $hasHistory = Appointment::where('patient_id', $patientId)
            ->where('optometrist_id', $user->id)
            ->exists();

        if (!$hasHistory) {
            return response()->json(['message' => 'You have not treated this patient'], 403);
        }

        // Get all appointments with this optometrist
        $appointments = Appointment::where('patient_id', $patientId)
            ->where('optometrist_id', $user->id)
            ->with('branch')
            ->orderBy('appointment_date', 'desc')
            ->get()
            ->map(function ($appointment) {
                return [
                    'id' => $appointment->id,
                    'date' => $appointment->appointment_date,
                    'time' => $appointment->start_time,
                    'type' => $appointment->type,
                    'status' => $appointment->status,
                    'branch' => $appointment->branch ? [
                        'name' => $appointment->branch->name,
                        'address' => $appointment->branch->address,
                    ] : null,
                    'notes' => $appointment->notes,
                ];
            });

        // Get all prescriptions created by this optometrist for this patient
        $prescriptions = Prescription::where('patient_id', $patientId)
            ->where('optometrist_id', $user->id)
            ->orderBy('issue_date', 'desc')
            ->get()
            ->map(function ($prescription) {
                return [
                    'id' => $prescription->id,
                    'prescription_number' => $prescription->prescription_number,
                    'issue_date' => $prescription->issue_date,
                    'expiry_date' => $prescription->expiry_date,
                    'status' => $prescription->status,
                    'type' => $prescription->type,
                    'right_eye' => json_decode($prescription->right_eye, true),
                    'left_eye' => json_decode($prescription->left_eye, true),
                    'vision_acuity' => $prescription->vision_acuity,
                    'recommendations' => $prescription->recommendations,
                    'additional_notes' => $prescription->additional_notes,
                ];
            });

        // Statistics
        $lastAppointment = $appointments->first();
        $nextAppointment = Appointment::where('patient_id', $patientId)
            ->where('optometrist_id', $user->id)
            ->where('status', 'scheduled')
            ->where('appointment_date', '>=', Carbon::today())
            ->orderBy('appointment_date')
            ->first();

        return response()->json([
            'patient' => [
                'id' => $patient->id,
                'name' => $patient->name,
                'email' => $patient->email,
                'phone' => $patient->phone,
                'date_of_birth' => $patient->date_of_birth,
            ],
            'appointments' => $appointments,
            'prescriptions' => $prescriptions,
            'statistics' => [
                'total_appointments' => $appointments->count(),
                'total_prescriptions' => $prescriptions->count(),
                'last_visit' => $lastAppointment ? $lastAppointment['date'] : null,
                'next_appointment' => $nextAppointment ? $nextAppointment->appointment_date : null,
            ]
        ]);
    }

    /**
     * Get today's appointments for the optometrist
     * GET /api/optometrist/appointments/today
     */
    public function getTodayAppointments(Request $request)
    {
        $user = $request->user();

        if (!$user || $user->role->value !== 'optometrist') {
            return response()->json(['message' => 'Unauthorized. Optometrist access required.'], 403);
        }

        $appointments = Appointment::where('optometrist_id', $user->id)
            ->where('appointment_date', Carbon::today())
            ->with(['patient', 'branch'])
            ->orderBy('start_time')
            ->get()
            ->map(function ($appointment) {
                return [
                    'id' => $appointment->id,
                    'patient' => $appointment->patient ? [
                        'id' => $appointment->patient->id,
                        'name' => $appointment->patient->name,
                        'email' => $appointment->patient->email,
                        'phone' => $appointment->patient->phone,
                    ] : null,
                    'date' => $appointment->appointment_date,
                    'start_time' => $appointment->start_time,
                    'end_time' => $appointment->end_time,
                    'type' => $appointment->type,
                    'status' => $appointment->status,
                    'branch' => $appointment->branch ? [
                        'name' => $appointment->branch->name,
                        'address' => $appointment->branch->address,
                    ] : null,
                    'notes' => $appointment->notes,
                ];
            });

        return response()->json([
            'data' => $appointments,
            'total' => $appointments->count()
        ]);
    }

    /**
     * Get all appointments for the optometrist
     * GET /api/optometrist/appointments
     */
    public function getAllAppointments(Request $request)
    {
        $user = $request->user();

        if (!$user || $user->role->value !== 'optometrist') {
            return response()->json(['message' => 'Unauthorized. Optometrist access required.'], 403);
        }

        $query = Appointment::where('optometrist_id', $user->id)
            ->with(['patient', 'branch']);

        // Filter by status if provided
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by date range if provided
        if ($request->has('start_date')) {
            $query->where('appointment_date', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->where('appointment_date', '<=', $request->end_date);
        }

        $appointments = $query->orderBy('appointment_date', 'desc')
            ->orderBy('start_time', 'desc')
            ->paginate(15);

        $transformedAppointments = $appointments->getCollection()->map(function ($appointment) {
            return [
                'id' => $appointment->id,
                'patient' => $appointment->patient ? [
                    'id' => $appointment->patient->id,
                    'name' => $appointment->patient->name,
                    'email' => $appointment->patient->email,
                    'phone' => $appointment->patient->phone,
                ] : null,
                'date' => $appointment->appointment_date,
                'start_time' => $appointment->start_time,
                'end_time' => $appointment->end_time,
                'type' => $appointment->type,
                'status' => $appointment->status,
                'branch' => $appointment->branch ? [
                    'name' => $appointment->branch->name,
                    'address' => $appointment->branch->address,
                ] : null,
                'notes' => $appointment->notes,
            ];
        });

        return response()->json([
            'data' => $transformedAppointments,
            'pagination' => [
                'current_page' => $appointments->currentPage(),
                'last_page' => $appointments->lastPage(),
                'per_page' => $appointments->perPage(),
                'total' => $appointments->total(),
            ]
        ]);
    }

    /**
     * Get prescriptions created by the optometrist
     * GET /api/optometrist/prescriptions
     */
    public function getPrescriptions(Request $request)
    {
        $user = $request->user();

        if (!$user || $user->role->value !== 'optometrist') {
            return response()->json(['message' => 'Unauthorized. Optometrist access required.'], 403);
        }

        $query = Prescription::where('optometrist_id', $user->id)
            ->with(['patient']);

        // Filter by status if provided
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by date range if provided
        if ($request->has('start_date')) {
            $query->where('issue_date', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->where('issue_date', '<=', $request->end_date);
        }

        $prescriptions = $query->orderBy('issue_date', 'desc')
            ->paginate(15);

        $transformedPrescriptions = $prescriptions->getCollection()->map(function ($prescription) {
            return [
                'id' => $prescription->id,
                'prescription_number' => $prescription->prescription_number,
                'issue_date' => $prescription->issue_date,
                'expiry_date' => $prescription->expiry_date,
                'status' => $prescription->status,
                'type' => $prescription->type,
                'patient' => $prescription->patient ? [
                    'id' => $prescription->patient->id,
                    'name' => $prescription->patient->name,
                    'email' => $prescription->patient->email,
                ] : null,
                'appointment' => $prescription->appointment ? [
                    'id' => $prescription->appointment->id,
                    'date' => $prescription->appointment->appointment_date,
                    'type' => $prescription->appointment->type,
                ] : null,
                'right_eye' => json_decode($prescription->right_eye, true),
                'left_eye' => json_decode($prescription->left_eye, true),
                'vision_acuity' => $prescription->vision_acuity,
                'recommendations' => $prescription->recommendations,
                'additional_notes' => $prescription->additional_notes,
            ];
        });

        return response()->json([
            'data' => $transformedPrescriptions,
            'pagination' => [
                'current_page' => $prescriptions->currentPage(),
                'last_page' => $prescriptions->lastPage(),
                'per_page' => $prescriptions->perPage(),
                'total' => $prescriptions->total(),
            ]
        ]);
    }
}
