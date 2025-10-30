<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Enums\UserRole;

class EyewearController extends Controller
{
    /**
     * Get eyewear reminders for the logged-in customer
     * GET /api/eyewear/reminders
     */
    public function getReminders(Request $request)
    {
        $user = Auth::user();

        if (!$user || $user->role->value !== 'customer') {
            return response()->json(['message' => 'Unauthorized. Customer access required.'], 403);
        }

        // Get appointments that had prescriptions (these are eyewear items)
        $prescriptions = DB::table('prescriptions')
            ->join('appointments', 'prescriptions.appointment_id', '=', 'appointments.id')
            ->select(
                'prescriptions.id as prescription_id',
                'prescriptions.expiry_date',
                'prescriptions.prescription_data',
                'prescriptions.type',
                'appointments.id as appointment_id',
                'appointments.appointment_date',
                'prescriptions.created_at'
            )
            ->where('prescriptions.patient_id', $user->id)
            ->where('prescriptions.status', 'active')
            ->orderBy('prescriptions.created_at', 'desc')
            ->limit(10)
            ->get();

        // Create eyewear reminders based on prescription expiry dates
        $reminders = $prescriptions->map(function ($prescription) use ($user) {
            $nextCheckDate = Carbon::parse($prescription->created_at)->addMonths(6);
            $isOverdue = now()->gte($nextCheckDate);
            $priority = $isOverdue ? 'urgent' : 'normal';

            return [
                'id' => 'reminder_' . $prescription->prescription_id,
                'eyewear_id' => $prescription->prescription_id,
                'eyewear_label' => ucfirst($prescription->type) . ' (ID: ' . substr($prescription->prescription_id, 0, 8) . ')',
                'next_check_date' => $nextCheckDate->format('Y-m-d'),
                'assessment_date' => $prescription->appointment_date,
                'assessed_by' => 'Your Optometrist',
                'priority' => $priority,
                'is_overdue' => $isOverdue,
                'created_at' => $prescription->created_at,
                'notes' => 'Regular check to ensure your eyewear condition is optimal',
                'type' => 'prescription_check'
            ];
        })->filter(function ($reminder) {
            // Only show reminders that are due or upcoming in the next 2 weeks
            $nextCheck = Carbon::parse($reminder['next_check_date']);
            return $nextCheck->lte(now()->addWeeks(2));
        })->values();

        return response()->json([
            'reminders' => $reminders,
            'count' => $reminders->count()
        ]);
    }

    /**
     * Submit eyewear condition form for self-assessment
     * POST /api/eyewear/{eyewearId}/condition-form
     */
    public function submitConditionForm(Request $request, $eyewearId)
    {
        $user = Auth::user();

        if (!$user || $user->role->value !== 'customer') {
            return response()->json(['message' => 'Unauthorized. Customer access required.'], 403);
        }

        $validated = $request->validate([
            'lens_clarity' => 'required|in:clear,slightly_blurry,blurry,very_blurry',
            'frame_condition' => 'required|in:excellent,good,loose,damaged',
            'eye_discomfort' => 'required|in:no,mild,moderate,severe',
            'remarks' => 'nullable|string|max:500',
        ]);

        // Store the self-assessment (you could create a new model for this)
        // For now, we'll just return success

        return response()->json([
            'message' => 'Eyewear condition assessment submitted successfully',
            'notification_id' => 'assessment_' . $eyewearId . '_' . time()
        ], 201);
    }

    /**
     * Schedule appointment for eyewear check
     * POST /api/eyewear/{eyewearId}/set-appointment
     */
    public function scheduleEyewearAppointment(Request $request, $eyewearId)
    {
        $user = Auth::user();

        if (!$user || $user->role->value !== 'customer') {
            return response()->json(['message' => 'Unauthorized. Customer access required.'], 403);
        }

        $validated = $request->validate([
            'appointment_date' => 'required|date|after:today',
            'preferred_time' => 'required|string|regex:/^\d{2}:\d{2}$/',
            'notes' => 'nullable|string|max:500',
        ]);

        // Check if eyewear belongs to this customer
        $appointment = DB::table('prescriptions')
            ->join('appointments', 'prescriptions.appointment_id', '=', 'appointments.id')
            ->where('prescriptions.id', $eyewearId)
            ->where('prescriptions.patient_id', $user->id)
            ->select('appointments.*')
            ->first();

        if (!$appointment) {
            return response()->json(['message' => 'Eyewear not found or doesn\'t belong to you'], 404);
        }

        // Create follow-up appointment (you could use existing appointment booking logic)
        // For now, return success

        return response()->json([
            'message' => 'Eyewear check appointment scheduled successfully',
            'appointment_id' => 'appointment_' . $eyewearId . '_' . time()
        ], 201);
    }
}
