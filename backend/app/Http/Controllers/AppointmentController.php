<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use App\Enums\UserRole;

class AppointmentController extends Controller
{
    /**
     * Display a listing of appointments based on user role.
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $query = Appointment::with(['patient', 'optometrist']);

        // Filter based on user role
        if (!$user->role) {
            return response()->json(['error' => 'User role not found'], 400);
        }
        
        switch ($user->role->value) {
            case UserRole::CUSTOMER->value:
                // Customers can only see their own appointments
                $query->where('patient_id', $user->id);
                break;

            case UserRole::OPTOMETRIST->value:
                // Optometrists can see all appointments (their own and others)
                // They can filter by their own appointments if needed
                if ($request->has('my_appointments') && $request->boolean('my_appointments')) {
                    $query->where('optometrist_id', $user->id);
                }
                break;

            case UserRole::STAFF->value:
                // Staff can see all appointments
                break;

            case UserRole::ADMIN->value:
                // Admins can see all appointments
                break;

            default:
                return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Apply filters
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('date')) {
            $query->where('appointment_date', $request->date);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('patient_name')) {
            $query->whereHas('patient', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->patient_name . '%');
            });
        }

        $appointments = $query->orderBy('appointment_date', 'desc')
                             ->orderBy('start_time', 'desc')
                             ->paginate($request->get('per_page', 15));

        return response()->json($appointments);
    }

    /**
     * Store a newly created appointment.
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();

        $validator = Validator::make($request->all(), [
            'patient_id' => 'required|exists:users,id',
            'optometrist_id' => 'required|exists:users,id',
            'appointment_date' => 'required|date|after_or_equal:today',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'type' => 'required|in:eye_exam,contact_fitting,follow_up,consultation,emergency',
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Check if user has permission to create appointments
        if (!in_array($user->role->value, [UserRole::OPTOMETRIST->value, UserRole::STAFF->value, UserRole::ADMIN->value])) {
            return response()->json(['error' => 'Unauthorized to create appointments'], 403);
        }

        // If customer is creating appointment, ensure it's for themselves
        if ($user->role->value === UserRole::CUSTOMER->value && $request->patient_id != $user->id) {
            return response()->json(['error' => 'You can only create appointments for yourself'], 403);
        }

        // Check if optometrist exists and has the correct role
        $optometrist = User::find($request->optometrist_id);
        if (!$optometrist || $optometrist->role->value !== UserRole::OPTOMETRIST->value) {
            return response()->json(['error' => 'Invalid optometrist selected'], 422);
        }

        // Check for scheduling conflicts
        $conflict = Appointment::where('optometrist_id', $request->optometrist_id)
            ->where('appointment_date', $request->appointment_date)
            ->where(function ($query) use ($request) {
                $query->whereBetween('start_time', [$request->start_time, $request->end_time])
                      ->orWhereBetween('end_time', [$request->start_time, $request->end_time])
                      ->orWhere(function ($q) use ($request) {
                          $q->where('start_time', '<=', $request->start_time)
                            ->where('end_time', '>=', $request->end_time);
                      });
            })
            ->where('status', '!=', 'cancelled')
            ->exists();

        if ($conflict) {
            return response()->json(['error' => 'Time slot is not available'], 422);
        }

        $appointment = Appointment::create($request->all());

        return response()->json($appointment->load(['patient', 'optometrist']), 201);
    }

    /**
     * Display the specified appointment.
     */
    public function show(Appointment $appointment): JsonResponse
    {
        $user = Auth::user();

        // Check if user has permission to view this appointment
        if (!$this->canViewAppointment($user, $appointment)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        return response()->json($appointment->load(['patient', 'optometrist']));
    }

    /**
     * Update the specified appointment.
     */
    public function update(Request $request, Appointment $appointment): JsonResponse
    {
        $user = Auth::user();

        // Check if user has permission to update this appointment
        if (!$this->canUpdateAppointment($user, $appointment)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'appointment_date' => 'sometimes|date|after_or_equal:today',
            'start_time' => 'sometimes|date_format:H:i',
            'end_time' => 'sometimes|date_format:H:i|after:start_time',
            'type' => 'sometimes|in:eye_exam,contact_fitting,follow_up,consultation,emergency',
            'status' => 'sometimes|in:scheduled,confirmed,in_progress,completed,cancelled,no_show',
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $appointment->update($request->all());

        return response()->json($appointment->load(['patient', 'optometrist']));
    }

    /**
     * Remove the specified appointment.
     */
    public function destroy(Appointment $appointment): JsonResponse
    {
        $user = Auth::user();

        // Check if user has permission to delete this appointment
        if (!$this->canDeleteAppointment($user, $appointment)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $appointment->delete();

        return response()->json(['message' => 'Appointment deleted successfully']);
    }

    /**
     * Get today's appointments for staff/optometrist dashboard.
     */
    public function getTodayAppointments(): JsonResponse
    {
        $user = Auth::user();

        if (!in_array($user->role->value, [UserRole::OPTOMETRIST->value, UserRole::STAFF->value, UserRole::ADMIN->value])) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $appointments = Appointment::with(['patient', 'optometrist'])
            ->where('appointment_date', today())
            ->orderBy('start_time')
            ->get();

        return response()->json($appointments);
    }

    /**
     * Get available time slots for a specific optometrist and date.
     */
    public function getAvailableTimeSlots(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'optometrist_id' => 'required|exists:users,id',
            'date' => 'required|date|after_or_equal:today',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $optometristId = $request->optometrist_id;
        $date = $request->date;

        // Define available time slots (9 AM to 5 PM, 30-minute intervals)
        $allTimeSlots = [
            '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
            '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
            '15:00', '15:30', '16:00', '16:30', '17:00'
        ];

        // Get booked time slots for the optometrist on the specified date
        $bookedSlots = Appointment::where('optometrist_id', $optometristId)
            ->where('appointment_date', $date)
            ->where('status', '!=', 'cancelled')
            ->pluck('start_time')
            ->toArray();

        // Filter out booked slots
        $availableSlots = array_diff($allTimeSlots, $bookedSlots);

        return response()->json([
            'available_slots' => array_values($availableSlots)
        ]);
    }

    /**
     * Check if user can view the appointment.
     */
    private function canViewAppointment(User $user, Appointment $appointment): bool
    {
        switch ($user->role->value) {
            case UserRole::CUSTOMER->value:
                return $appointment->patient_id === $user->id;

            case UserRole::OPTOMETRIST->value:
            case UserRole::STAFF->value:
            case UserRole::ADMIN->value:
                return true;

            default:
                return false;
        }
    }

    /**
     * Check if user can update the appointment.
     */
    private function canUpdateAppointment(User $user, Appointment $appointment): bool
    {
        switch ($user->role->value) {
            case UserRole::CUSTOMER->value:
                return $appointment->patient_id === $user->id;

            case UserRole::OPTOMETRIST->value:
                return $appointment->optometrist_id === $user->id ||
                       $appointment->patient_id === $user->id;

            case UserRole::STAFF->value:
            case UserRole::ADMIN->value:
                return true;

            default:
                return false;
        }
    }

    /**
     * Check if user can delete the appointment.
     */
    private function canDeleteAppointment(User $user, Appointment $appointment): bool
    {
        switch ($user->role->value) {
            case UserRole::CUSTOMER->value:
                return $appointment->patient_id === $user->id;

            case UserRole::OPTOMETRIST->value:
            case UserRole::STAFF->value:
            case UserRole::ADMIN->value:
                return true;

            default:
                return false;
        }
    }
}
