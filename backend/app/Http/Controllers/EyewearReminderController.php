<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Appointment;
use App\Models\Notification;
use App\Services\WebSocketService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class EyewearReminderController extends Controller
{
    /**
     * Get pending eyewear reminders for the logged-in customer
     * GET /api/eyewear/reminders
     */
    public function getReminders(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user || $user->role->value !== 'customer') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            // Get notifications that are eyewear condition reminders
            $reminders = Notification::where('user_id', $user->id)
                ->where('type', 'eyewear_condition')
                ->where('data->reminder_type', 'scheduled_check')
                ->where('data->next_check_date', '<=', now()->toDateString())
                ->where('status', 'unread')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($notification) {
                    $data = $notification->data;
                    return [
                        'id' => $notification->id,
                        'eyewear_id' => $data['eyewear_id'] ?? null,
                        'eyewear_label' => $data['eyewear_label'] ?? 'Unknown Eyewear',
                        'next_check_date' => $data['next_check_date'] ?? null,
                        'assessment_date' => $data['assessment_date'] ?? null,
                        'assessed_by' => $data['assessed_by'] ?? 'Staff',
                        'notes' => $data['notes'] ?? null,
                        'priority' => $data['priority'] ?? 'medium',
                        'created_at' => $notification->created_at,
                        'is_overdue' => $data['next_check_date'] ? 
                            Carbon::parse($data['next_check_date'])->isPast() : false
                    ];
                });

            return response()->json([
                'reminders' => $reminders,
                'count' => $reminders->count()
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch eyewear reminders: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch reminders'], 500);
        }
    }

    /**
     * Save customer's eyewear self-check feedback
     * POST /api/eyewear/{id}/condition-form
     */
    public function submitConditionForm(Request $request, $eyewearId): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user || $user->role->value !== 'customer') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'lens_clarity' => 'required|in:clear,slightly_blurry,blurry,very_blurry',
            'frame_condition' => 'required|in:excellent,good,loose,damaged',
            'eye_discomfort' => 'required|in:no,mild,moderate,severe',
            'remarks' => 'nullable|string|max:500'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $data = $validator->validated();
            
            // Create a new notification record for the self-check
            $notification = Notification::create([
                'user_id' => $user->id,
                'role' => 'customer',
                'title' => 'Eyewear Self-Check Completed',
                'message' => 'You have completed a self-check for your eyewear.',
                'type' => 'eyewear_self_check',
                'data' => [
                    'eyewear_id' => $eyewearId,
                    'lens_clarity' => $data['lens_clarity'],
                    'frame_condition' => $data['frame_condition'],
                    'eye_discomfort' => $data['eye_discomfort'],
                    'remarks' => $data['remarks'],
                    'submitted_at' => now()->toISOString(),
                    'customer_id' => $user->id
                ]
            ]);

            // Mark the original reminder as read
            Notification::where('user_id', $user->id)
                ->where('type', 'eyewear_condition')
                ->where('data->eyewear_id', $eyewearId)
                ->where('data->reminder_type', 'scheduled_check')
                ->update(['status' => 'read']);

            // Notify staff about the self-check
            $this->notifyStaffAboutSelfCheck($user, $eyewearId, $data);

            // Send real-time notification
            WebSocketService::notifyUsers(
                'Eyewear Self-Check Completed',
                "Customer {$user->name} has completed a self-check for their eyewear.",
                'eyewear_self_check',
                [], // Will be sent to staff/admins
                $notification->data
            );

            Log::info('Eyewear self-check submitted', [
                'customer_id' => $user->id,
                'eyewear_id' => $eyewearId,
                'notification_id' => $notification->id
            ]);

            return response()->json([
                'message' => 'Self-check submitted successfully',
                'notification_id' => $notification->id
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to submit eyewear condition form: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to submit form'], 500);
        }
    }

    /**
     * Create new appointment linked to eyewear check
     * POST /api/eyewear/{id}/set-appointment
     */
    public function setAppointment(Request $request, $eyewearId): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user || $user->role->value !== 'customer') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'appointment_date' => 'required|date|after:today',
            'preferred_time' => 'required|string',
            'notes' => 'nullable|string|max:500'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $data = $validator->validated();
            
            // Create appointment
            $appointment = Appointment::create([
                'patient_id' => $user->id,
                'optometrist_id' => null, // Will be assigned by staff
                'branch_id' => $user->branch_id ?? 1, // Default branch
                'appointment_date' => $data['appointment_date'],
                'start_time' => $data['preferred_time'],
                'end_time' => Carbon::parse($data['preferred_time'])->addHour()->format('H:i:s'),
                'type' => 'follow_up',
                'status' => 'scheduled',
                'notes' => "Eyewear condition check - {$data['notes']}"
            ]);

            // Mark the original reminder as read
            Notification::where('user_id', $user->id)
                ->where('type', 'eyewear_condition')
                ->where('data->eyewear_id', $eyewearId)
                ->where('data->reminder_type', 'scheduled_check')
                ->update(['status' => 'read']);

            // Create notification for appointment
            Notification::create([
                'user_id' => $user->id,
                'role' => 'customer',
                'title' => 'Eyewear Check Appointment Scheduled',
                'message' => "Your eyewear check appointment has been scheduled for {$data['appointment_date']} at {$data['preferred_time']}.",
                'type' => 'appointment',
                'data' => [
                    'appointment_id' => $appointment->id,
                    'eyewear_id' => $eyewearId,
                    'appointment_date' => $data['appointment_date'],
                    'appointment_time' => $data['preferred_time'],
                    'type' => 'eyewear_check'
                ]
            ]);

            // Notify staff about the appointment request
            $this->notifyStaffAboutAppointmentRequest($user, $appointment, $eyewearId);

            Log::info('Eyewear check appointment scheduled', [
                'customer_id' => $user->id,
                'eyewear_id' => $eyewearId,
                'appointment_id' => $appointment->id
            ]);

            return response()->json([
                'message' => 'Appointment scheduled successfully',
                'appointment_id' => $appointment->id
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to schedule eyewear check appointment: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to schedule appointment'], 500);
        }
    }

    /**
     * Notify staff about customer self-check
     */
    private function notifyStaffAboutSelfCheck(User $customer, $eyewearId, array $formData): void
    {
        $staff = User::where('role', 'staff')->get();
        
        foreach ($staff as $staffMember) {
            Notification::create([
                'user_id' => $staffMember->id,
                'role' => 'staff',
                'title' => 'Customer Eyewear Self-Check',
                'message' => "Customer {$customer->name} has completed a self-check for their eyewear.",
                'type' => 'eyewear_self_check',
                'data' => [
                    'customer_id' => $customer->id,
                    'customer_name' => $customer->name,
                    'eyewear_id' => $eyewearId,
                    'lens_clarity' => $formData['lens_clarity'],
                    'frame_condition' => $formData['frame_condition'],
                    'eye_discomfort' => $formData['eye_discomfort'],
                    'remarks' => $formData['remarks'],
                    'submitted_at' => now()->toISOString()
                ]
            ]);
        }
    }

    /**
     * Notify staff about appointment request
     */
    private function notifyStaffAboutAppointmentRequest(User $customer, Appointment $appointment, $eyewearId): void
    {
        $staff = User::where('role', 'staff')->get();
        
        foreach ($staff as $staffMember) {
            Notification::create([
                'user_id' => $staffMember->id,
                'role' => 'staff',
                'title' => 'Eyewear Check Appointment Request',
                'message' => "Customer {$customer->name} has requested an eyewear check appointment.",
                'type' => 'appointment_request',
                'data' => [
                    'customer_id' => $customer->id,
                    'customer_name' => $customer->name,
                    'appointment_id' => $appointment->id,
                    'eyewear_id' => $eyewearId,
                    'appointment_date' => $appointment->appointment_date,
                    'appointment_time' => $appointment->start_time
                ]
            ]);
        }
    }
}
