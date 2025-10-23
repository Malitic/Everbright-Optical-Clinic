<?php

namespace App\Http\Controllers;

use App\Models\Schedule;
use App\Models\User;
use App\Models\Branch;
use App\Models\ScheduleChangeRequest;
use App\Enums\UserRole;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class StaffScheduleController extends Controller
{
    /**
     * Get all staff schedules across all branches
     * GET /api/staff-schedules/all
     */
    public function getAllStaffSchedules(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        // Check authorization - only admins can see all schedules
        $userRole = null;
        if (is_object($user->role)) {
            $userRole = $user->role->value ?? (string)$user->role;
        } else {
            $userRole = (string)$user->role;
        }
        
        if (!$user || $userRole !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Get all staff schedules across all branches
        $schedules = Schedule::where('is_active', true)
            ->with(['staff', 'branch', 'creator', 'updater'])
            ->orderBy('branch_id')
            ->orderBy('staff_role')
            ->orderBy('staff_id')
            ->orderBy('day_of_week')
            ->get();

        return response()->json([
            'staff_schedules' => $schedules,
            'total' => $schedules->count()
        ]);
    }

    /**
     * Get all staff schedules for a specific branch
     * GET /api/staff-schedules/branch/{branchId}
     */
    public function getBranchStaffSchedules(Request $request, $branchId): JsonResponse
    {
        $user = Auth::user();
        
        // Check authorization
        $userRole = null;
        if (is_object($user->role)) {
            $userRole = $user->role->value ?? (string)$user->role;
        } else {
            $userRole = (string)$user->role;
        }
        
        if (!$user || 
            ($userRole !== 'admin' && 
             $userRole !== 'staff' && 
             $userRole !== 'optometrist' && 
             $user->branch_id != $branchId)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $branch = Branch::find($branchId);
        if (!$branch) {
            return response()->json(['message' => 'Branch not found'], 404);
        }

        // Get all staff schedules for the branch
        $schedules = Schedule::where('branch_id', $branchId)
            ->where('is_active', true)
            ->with(['staff', 'creator', 'updater'])
            ->orderBy('staff_role')
            ->orderBy('staff_id')
            ->orderBy('day_of_week')
            ->get();

        // Group schedules by staff member
        $staffSchedules = $schedules->groupBy('staff_id')->map(function ($staffSchedules) {
            $staff = $staffSchedules->first()->staff;
            return [
                'staff_id' => $staff->id,
                'staff_name' => $staff->name,
                'staff_role' => $staffSchedules->first()->staff_role,
                'email' => $staff->email,
                'schedules' => $staffSchedules->map(function ($schedule) {
                    return [
                        'id' => $schedule->id,
                        'day_of_week' => $schedule->day_of_week,
                        'day_name' => $schedule->day_name,
                        'start_time' => $schedule->start_time,
                        'end_time' => $schedule->end_time,
                        'formatted_time' => $schedule->formatted_start_time . ' - ' . $schedule->formatted_end_time,
                        'is_active' => $schedule->is_active,
                        'created_by' => $schedule->creator ? $schedule->creator->name : null,
                        'updated_by' => $schedule->updater ? $schedule->updater->name : null,
                        'created_at' => $schedule->created_at,
                        'updated_at' => $schedule->updated_at,
                    ];
                })->values()
            ];
        })->values();

        return response()->json([
            'branch' => [
                'id' => $branch->id,
                'name' => $branch->name,
                'address' => $branch->address,
            ],
            'staff_schedules' => $staffSchedules,
            'summary' => [
                'total_staff' => $staffSchedules->count(),
                'optometrists' => $staffSchedules->where('staff_role', 'optometrist')->count(),
                'staff' => $staffSchedules->where('staff_role', 'staff')->count(),
            ]
        ]);
    }

    /**
     * Get schedule for a specific staff member
     * GET /api/staff-schedules/staff/{staffId}
     */
    public function getStaffSchedule(Request $request, $staffId): JsonResponse
    {
        $user = Auth::user();
        
        // Check authorization
        $userRole = null;
        if (is_object($user->role)) {
            $userRole = $user->role->value ?? (string)$user->role;
        } else {
            $userRole = (string)$user->role;
        }
        
        if (!$user || 
            ($userRole !== 'admin' && 
             $userRole !== 'staff' && 
             $userRole !== 'optometrist' && 
             $user->id != $staffId)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $staff = User::find($staffId);
        $staffRole = null;
        if (is_object($staff->role)) {
            $staffRole = $staff->role->value ?? (string)$staff->role;
        } else {
            $staffRole = (string)$staff->role;
        }
        
        if (!$staff || !in_array($staffRole, ['optometrist', 'staff'])) {
            return response()->json(['message' => 'Staff member not found'], 404);
        }

        $schedules = Schedule::where('staff_id', $staffId)
            ->where('is_active', true)
            ->with(['branch', 'creator', 'updater'])
            ->orderBy('day_of_week')
            ->get();

        return response()->json([
            'staff' => [
                'id' => $staff->id,
                'name' => $staff->name,
                'email' => $staff->email,
                'role' => $staffRole,
                'branch' => $staff->branch ? [
                    'id' => $staff->branch->id,
                    'name' => $staff->branch->name,
                    'address' => $staff->branch->address,
                ] : null,
            ],
            'schedules' => $schedules->map(function ($schedule) {
                return [
                    'id' => $schedule->id,
                    'day_of_week' => $schedule->day_of_week,
                    'day_name' => $schedule->day_name,
                    'start_time' => $schedule->start_time,
                    'end_time' => $schedule->end_time,
                    'formatted_time' => $schedule->formatted_start_time . ' - ' . $schedule->formatted_end_time,
                    'branch' => [
                        'id' => $schedule->branch->id,
                        'name' => $schedule->branch->name,
                        'address' => $schedule->branch->address,
                    ],
                    'is_active' => $schedule->is_active,
                    'created_by' => $schedule->creator ? $schedule->creator->name : null,
                    'updated_by' => $schedule->updater ? $schedule->updater->name : null,
                    'created_at' => $schedule->created_at,
                    'updated_at' => $schedule->updated_at,
                ];
            })
        ]);
    }

    /**
     * Create or update staff schedule (Admin only)
     * POST /api/staff-schedules
     */
    public function createOrUpdateSchedule(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        $userRole = null;
        if (is_object($user->role)) {
            $userRole = $user->role->value ?? (string)$user->role;
        } else {
            $userRole = (string)$user->role;
        }
        
        if (!$user || $userRole !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'staff_id' => 'required|exists:users,id',
            'staff_role' => 'required|in:optometrist,staff',
            'branch_id' => 'required|exists:branches,id',
            'day_of_week' => 'required|integer|between:1,7',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Verify staff member exists and has correct role
        $staff = User::find($request->staff_id);
        $staffRole = null;
        if (is_object($staff->role)) {
            $staffRole = $staff->role->value ?? (string)$staff->role;
        } else {
            $staffRole = (string)$staff->role;
        }
        
        if (!$staff || $staffRole !== $request->staff_role) {
            return response()->json(['message' => 'Invalid staff member or role mismatch'], 422);
        }

        try {
            // Check if schedule already exists for this staff member on this day
            $existingSchedule = Schedule::where('staff_id', $request->staff_id)
                ->where('day_of_week', $request->day_of_week)
                ->first();

            if ($existingSchedule) {
                // Update existing schedule
                $existingSchedule->update([
                    'branch_id' => $request->branch_id,
                    'start_time' => $request->start_time,
                    'end_time' => $request->end_time,
                    'is_active' => $request->get('is_active', true),
                    'updated_by' => $user->id,
                ]);

                $schedule = $existingSchedule;
            } else {
                // Create new schedule
                $schedule = Schedule::create([
                    'staff_id' => $request->staff_id,
                    'staff_role' => $request->staff_role,
                    'branch_id' => $request->branch_id,
                    'day_of_week' => $request->day_of_week,
                    'start_time' => $request->start_time,
                    'end_time' => $request->end_time,
                    'is_active' => $request->get('is_active', true),
                    'created_by' => $user->id,
                    'updated_by' => $user->id,
                ]);
            }

            $schedule->load(['staff', 'branch', 'creator', 'updater']);

            return response()->json([
                'message' => 'Schedule updated successfully',
                'schedule' => [
                    'id' => $schedule->id,
                    'staff' => [
                        'id' => $schedule->staff->id,
                        'name' => $schedule->staff->name,
                        'role' => $schedule->staff_role,
                    ],
                    'branch' => [
                        'id' => $schedule->branch->id,
                        'name' => $schedule->branch->name,
                    ],
                    'day_of_week' => $schedule->day_of_week,
                    'day_name' => $schedule->day_name,
                    'start_time' => $schedule->start_time,
                    'end_time' => $schedule->end_time,
                    'formatted_time' => $schedule->formatted_start_time . ' - ' . $schedule->formatted_end_time,
                    'is_active' => $schedule->is_active,
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update schedule',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete staff schedule (Admin only)
     * DELETE /api/staff-schedules/{scheduleId}
     */
    public function deleteSchedule(Request $request, $scheduleId): JsonResponse
    {
        $user = Auth::user();
        
        $userRole = null;
        if (is_object($user->role)) {
            $userRole = $user->role->value ?? (string)$user->role;
        } else {
            $userRole = (string)$user->role;
        }
        
        if (!$user || $userRole !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $schedule = Schedule::find($scheduleId);
        if (!$schedule) {
            return response()->json(['message' => 'Schedule not found'], 404);
        }

        try {
            $schedule->delete();

            return response()->json([
                'message' => 'Schedule deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete schedule',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all staff members for scheduling
     * GET /api/staff-schedules/staff-members
     */
    public function getStaffMembers(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        $userRole = null;
        if (is_object($user->role)) {
            $userRole = $user->role->value ?? (string)$user->role;
        } else {
            $userRole = (string)$user->role;
        }
        
        if (!$user || !in_array($userRole, ['admin', 'staff', 'optometrist'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $role = $request->get('role'); // optional filter by role
        $branchId = $request->get('branch_id'); // optional filter by branch

        $query = User::whereIn('role', ['optometrist', 'staff'])
            ->where('is_approved', true)
            ->with('branch');

        if ($role) {
            $query->where('role', $role);
        }

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $staffMembers = $query->get()->map(function ($staff) {
            $staffRole = null;
            if (is_object($staff->role)) {
                $staffRole = $staff->role->value ?? (string)$staff->role;
            } else {
                $staffRole = (string)$staff->role;
            }
            
            return [
                'id' => $staff->id,
                'name' => $staff->name,
                'email' => $staff->email,
                'role' => $staffRole,
                'branch' => $staff->branch ? [
                    'id' => $staff->branch->id,
                    'name' => $staff->branch->name,
                    'address' => $staff->branch->address,
                ] : null,
            ];
        });

        return response()->json([
            'staff_members' => $staffMembers,
            'summary' => [
                'total' => $staffMembers->count(),
                'optometrists' => $staffMembers->where('role', 'optometrist')->count(),
                'staff' => $staffMembers->where('role', 'staff')->count(),
            ]
        ]);
    }

    /**
     * Get all branches for scheduling
     * GET /api/staff-schedules/branches
     */
    public function getBranches(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        $userRole = null;
        if (is_object($user->role)) {
            $userRole = $user->role->value ?? (string)$user->role;
        } else {
            $userRole = (string)$user->role;
        }
        
        if (!$user || !in_array($userRole, ['admin', 'staff', 'optometrist'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $branches = Branch::where('is_active', true)
            ->select('id', 'name', 'address', 'phone', 'email')
            ->get();

        return response()->json([
            'branches' => $branches
        ]);
    }

    /**
     * Get schedule change requests for staff
     * GET /api/staff-schedules/change-requests
     */
    public function getChangeRequests(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $query = ScheduleChangeRequest::with(['staff', 'branch', 'requester', 'reviewer']);

        // Filter based on user role
        $userRole = null;
        if (is_object($user->role)) {
            $userRole = $user->role->value ?? (string)$user->role;
        } else {
            $userRole = (string)$user->role;
        }
        
        if ($userRole === 'admin') {
            // Admin can see all requests
        } elseif (in_array($userRole, ['optometrist', 'staff'])) {
            // Staff can only see their own requests
            $query->where('staff_id', $user->id);
        } else {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Filter by status if provided
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by staff role if provided
        if ($request->has('staff_role')) {
            $query->where('staff_role', $request->staff_role);
        }

        $requests = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'change_requests' => $requests->map(function ($request) {
                return [
                    'id' => $request->id,
                    'staff' => [
                        'id' => $request->staff->id,
                        'name' => $request->staff->name,
                        'role' => $request->staff_role,
                    ],
                    'branch' => [
                        'id' => $request->branch->id,
                        'name' => $request->branch->name,
                    ],
                    'day_of_week' => $request->day_of_week,
                    'day_name' => $request->day_name,
                    'start_time' => $request->start_time,
                    'end_time' => $request->end_time,
                    'reason' => $request->reason,
                    'status' => $request->status,
                    'admin_notes' => $request->admin_notes,
                    'requester' => $request->requester ? $request->requester->name : null,
                    'reviewer' => $request->reviewer ? $request->reviewer->name : null,
                    'reviewed_at' => $request->reviewed_at,
                    'created_at' => $request->created_at,
                    'updated_at' => $request->updated_at,
                ];
            })
        ]);
    }

    /**
     * Create schedule change request
     * POST /api/staff-schedules/change-requests
     */
    public function createChangeRequest(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        $userRole = null;
        if (is_object($user->role)) {
            $userRole = $user->role->value ?? (string)$user->role;
        } else {
            $userRole = (string)$user->role;
        }
        
        if (!$user || !in_array($userRole, ['optometrist', 'staff'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'day_of_week' => 'required|integer|between:1,7',
            'branch_id' => 'required|exists:branches,id',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'reason' => 'required|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check if there's already a pending request for this day
        $existingRequest = ScheduleChangeRequest::where('staff_id', $user->id)
            ->where('day_of_week', $request->day_of_week)
            ->where('status', 'pending')
            ->first();

        if ($existingRequest) {
            return response()->json([
                'message' => 'You already have a pending request for this day'
            ], 422);
        }

        try {
            $changeRequest = ScheduleChangeRequest::create([
                'staff_id' => $user->id,
                'staff_role' => $userRole,
                'day_of_week' => $request->day_of_week,
                'branch_id' => $request->branch_id,
                'start_time' => $request->start_time,
                'end_time' => $request->end_time,
                'reason' => $request->reason,
                'status' => 'pending',
                'requested_by' => $user->id,
            ]);

            $changeRequest->load(['staff', 'branch', 'requester']);

            return response()->json([
                'message' => 'Schedule change request submitted successfully',
                'request' => [
                    'id' => $changeRequest->id,
                    'day_name' => $changeRequest->day_name,
                    'start_time' => $changeRequest->start_time,
                    'end_time' => $changeRequest->end_time,
                    'reason' => $changeRequest->reason,
                    'status' => $changeRequest->status,
                    'created_at' => $changeRequest->created_at,
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create change request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve schedule change request (Admin only)
     * PUT /api/staff-schedules/change-requests/{requestId}/approve
     */
    public function approveChangeRequest(Request $request, $requestId): JsonResponse
    {
        $user = Auth::user();
        
        $userRole = null;
        if (is_object($user->role)) {
            $userRole = $user->role->value ?? (string)$user->role;
        } else {
            $userRole = (string)$user->role;
        }
        
        if (!$user || $userRole !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $changeRequest = ScheduleChangeRequest::find($requestId);
        if (!$changeRequest) {
            return response()->json(['message' => 'Change request not found'], 404);
        }

        if ($changeRequest->status !== 'pending') {
            return response()->json(['message' => 'Request has already been processed'], 422);
        }

        try {
            DB::beginTransaction();

            // Update the change request
            $changeRequest->update([
                'status' => 'approved',
                'admin_notes' => $request->get('admin_notes'),
                'reviewed_by' => $user->id,
                'reviewed_at' => now(),
            ]);

            // Update or create the actual schedule
            $schedule = Schedule::where('staff_id', $changeRequest->staff_id)
                ->where('day_of_week', $changeRequest->day_of_week)
                ->first();

            if ($schedule) {
                $schedule->update([
                    'branch_id' => $changeRequest->branch_id,
                    'start_time' => $changeRequest->start_time,
                    'end_time' => $changeRequest->end_time,
                    'updated_by' => $user->id,
                ]);
            } else {
                Schedule::create([
                    'staff_id' => $changeRequest->staff_id,
                    'staff_role' => $changeRequest->staff_role,
                    'branch_id' => $changeRequest->branch_id,
                    'day_of_week' => $changeRequest->day_of_week,
                    'start_time' => $changeRequest->start_time,
                    'end_time' => $changeRequest->end_time,
                    'is_active' => true,
                    'created_by' => $user->id,
                    'updated_by' => $user->id,
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Schedule change request approved successfully'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to approve change request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject schedule change request (Admin only)
     * PUT /api/staff-schedules/change-requests/{requestId}/reject
     */
    public function rejectChangeRequest(Request $request, $requestId): JsonResponse
    {
        $user = Auth::user();
        
        $userRole = null;
        if (is_object($user->role)) {
            $userRole = $user->role->value ?? (string)$user->role;
        } else {
            $userRole = (string)$user->role;
        }
        
        if (!$user || $userRole !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $changeRequest = ScheduleChangeRequest::find($requestId);
        if (!$changeRequest) {
            return response()->json(['message' => 'Change request not found'], 404);
        }

        if ($changeRequest->status !== 'pending') {
            return response()->json(['message' => 'Request has already been processed'], 422);
        }

        $validator = Validator::make($request->all(), [
            'admin_notes' => 'required|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $changeRequest->update([
                'status' => 'rejected',
                'admin_notes' => $request->admin_notes,
                'reviewed_by' => $user->id,
                'reviewed_at' => now(),
            ]);

            return response()->json([
                'message' => 'Schedule change request rejected'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to reject change request',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
