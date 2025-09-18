<?php

namespace App\Http\Controllers;

use App\Models\Prescription;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use App\Enums\UserRole;

class PrescriptionController extends Controller
{
    /**
     * Display a listing of prescriptions based on user role.
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $query = Prescription::with(['patient', 'optometrist', 'appointment']);

        // Filter based on user role
        if (!$user->role) {
            return response()->json(['error' => 'User role not found'], 400);
        }
        
        switch ($user->role->value) {
            case UserRole::CUSTOMER->value:
                // Customers can only see their own prescriptions
                $query->where('patient_id', $user->id);
                break;

            case UserRole::OPTOMETRIST->value:
                // Optometrists can see prescriptions they created
                if ($request->has('my_prescriptions') && $request->boolean('my_prescriptions')) {
                    $query->where('optometrist_id', $user->id);
                }
                break;

            case UserRole::STAFF->value:
            case UserRole::ADMIN->value:
                // Staff and admins can see all prescriptions
                break;

            default:
                return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Apply filters
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('patient_name')) {
            $query->whereHas('patient', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->patient_name . '%');
            });
        }

        $prescriptions = $query->orderBy('issue_date', 'desc')
                              ->paginate($request->get('per_page', 15));

        return response()->json($prescriptions);
    }

    /**
     * Store a newly created prescription.
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();

        // Check if user has permission to create prescriptions
        if (!in_array($user->role->value, [UserRole::OPTOMETRIST->value, UserRole::STAFF->value, UserRole::ADMIN->value])) {
            return response()->json(['error' => 'Unauthorized to create prescriptions'], 403);
        }

        $validator = Validator::make($request->all(), [
            'patient_id' => 'required|exists:users,id',
            'appointment_id' => 'nullable|exists:appointments,id',
            'type' => 'required|in:glasses,contact_lenses,sunglasses,progressive,bifocal',
            'prescription_data' => 'required|array',
            'prescription_data.sphere_od' => 'nullable|string',
            'prescription_data.cylinder_od' => 'nullable|string',
            'prescription_data.axis_od' => 'nullable|string',
            'prescription_data.add_od' => 'nullable|string',
            'prescription_data.sphere_os' => 'nullable|string',
            'prescription_data.cylinder_os' => 'nullable|string',
            'prescription_data.axis_os' => 'nullable|string',
            'prescription_data.add_os' => 'nullable|string',
            'prescription_data.pd' => 'nullable|string',
            'issue_date' => 'required|date',
            'expiry_date' => 'required|date|after:issue_date',
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $prescriptionData = $validator->validated();
        $prescriptionData['optometrist_id'] = $user->id;

        $prescription = Prescription::create($prescriptionData);

        return response()->json($prescription->load(['patient', 'optometrist', 'appointment']), 201);
    }

    /**
     * Display the specified prescription.
     */
    public function show(Prescription $prescription): JsonResponse
    {
        $user = Auth::user();

        // Check if user has permission to view this prescription
        if (!$this->canViewPrescription($user, $prescription)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        return response()->json($prescription->load(['patient', 'optometrist', 'appointment']));
    }

    /**
     * Update the specified prescription.
     */
    public function update(Request $request, Prescription $prescription): JsonResponse
    {
        $user = Auth::user();

        // Check if user has permission to update this prescription
        if (!$this->canUpdatePrescription($user, $prescription)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'type' => 'sometimes|in:glasses,contact_lenses,sunglasses,progressive,bifocal',
            'prescription_data' => 'sometimes|array',
            'issue_date' => 'sometimes|date',
            'expiry_date' => 'sometimes|date|after:issue_date',
            'notes' => 'nullable|string|max:1000',
            'status' => 'sometimes|in:active,expired,cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $prescription->update($validator->validated());

        return response()->json($prescription->load(['patient', 'optometrist', 'appointment']));
    }

    /**
     * Remove the specified prescription.
     */
    public function destroy(Prescription $prescription): JsonResponse
    {
        $user = Auth::user();

        // Check if user has permission to delete this prescription
        if (!$this->canDeletePrescription($user, $prescription)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $prescription->delete();

        return response()->json(['message' => 'Prescription deleted successfully']);
    }

    /**
     * Get prescriptions for a specific patient.
     */
    public function getPatientPrescriptions(Request $request, $patientId): JsonResponse
    {
        $user = Auth::user();

        // Check if user has permission to view patient prescriptions
        if (!$this->canViewPatientPrescriptions($user, $patientId)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $prescriptions = Prescription::with(['patient', 'optometrist', 'appointment'])
            ->where('patient_id', $patientId)
            ->orderBy('issue_date', 'desc')
            ->get();

        return response()->json($prescriptions);
    }

    /**
     * Check if user can view the prescription.
     */
    private function canViewPrescription(User $user, Prescription $prescription): bool
    {
        switch ($user->role->value) {
            case UserRole::CUSTOMER->value:
                return $prescription->patient_id === $user->id;

            case UserRole::OPTOMETRIST->value:
                return $prescription->optometrist_id === $user->id || 
                       $prescription->patient_id === $user->id;

            case UserRole::STAFF->value:
            case UserRole::ADMIN->value:
                return true;

            default:
                return false;
        }
    }

    /**
     * Check if user can update the prescription.
     */
    private function canUpdatePrescription(User $user, Prescription $prescription): bool
    {
        switch ($user->role->value) {
            case UserRole::CUSTOMER->value:
                return false; // Customers cannot update prescriptions

            case UserRole::OPTOMETRIST->value:
                return $prescription->optometrist_id === $user->id;

            case UserRole::STAFF->value:
            case UserRole::ADMIN->value:
                return true;

            default:
                return false;
        }
    }

    /**
     * Check if user can delete the prescription.
     */
    private function canDeletePrescription(User $user, Prescription $prescription): bool
    {
        switch ($user->role->value) {
            case UserRole::CUSTOMER->value:
                return false; // Customers cannot delete prescriptions

            case UserRole::OPTOMETRIST->value:
            case UserRole::STAFF->value:
            case UserRole::ADMIN->value:
                return true;

            default:
                return false;
        }
    }

    /**
     * Check if user can view patient prescriptions.
     */
    private function canViewPatientPrescriptions(User $user, $patientId): bool
    {
        switch ($user->role->value) {
            case UserRole::CUSTOMER->value:
                return $patientId == $user->id;

            case UserRole::OPTOMETRIST->value:
            case UserRole::STAFF->value:
            case UserRole::ADMIN->value:
                return true;

            default:
                return false;
        }
    }
}