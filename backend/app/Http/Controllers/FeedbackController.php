<?php

namespace App\Http\Controllers;

use App\Models\Feedback;
use App\Models\Appointment;
use App\Models\User;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class FeedbackController extends Controller
{
    /**
     * Submit feedback for a completed appointment
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $userRole = $user->role->value ?? (string)$user->role;

        // Only customers can submit feedback
        if ($userRole !== 'customer') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'appointment_id' => 'required|exists:appointments,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check if appointment belongs to the customer and is completed
        $appointment = Appointment::where('id', $request->appointment_id)
            ->where('patient_id', $user->id)
            ->where('status', 'completed')
            ->first();

        if (!$appointment) {
            return response()->json([
                'message' => 'Appointment not found or not completed'
            ], 404);
        }

        // Check if feedback already exists for this appointment
        $existingFeedback = Feedback::where('customer_id', $user->id)
            ->where('appointment_id', $request->appointment_id)
            ->first();

        if ($existingFeedback) {
            return response()->json([
                'message' => 'Feedback already submitted for this appointment'
            ], 409);
        }

        // Create feedback
        $feedback = Feedback::create([
            'customer_id' => $user->id,
            'branch_id' => $appointment->branch_id,
            'appointment_id' => $request->appointment_id,
            'rating' => $request->rating,
            'comment' => $request->comment,
        ]);

        return response()->json([
            'message' => 'Feedback submitted successfully',
            'feedback' => $feedback->load(['branch', 'appointment'])
        ], 201);
    }

    /**
     * Get customer's feedback history
     */
    public function getCustomerFeedback(Request $request, $customerId)
    {
        $user = $request->user();
        $userRole = $user->role->value ?? (string)$user->role;

        // Only customers can view their own feedback, or staff/admin can view any
        if ($userRole === 'customer' && $user->id != $customerId) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (!in_array($userRole, ['customer', 'staff', 'admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $feedback = Feedback::where('customer_id', $customerId)
            ->with(['branch', 'appointment.optometrist'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json([
            'data' => $feedback->items(),
            'pagination' => [
                'current_page' => $feedback->currentPage(),
                'last_page' => $feedback->lastPage(),
                'per_page' => $feedback->perPage(),
                'total' => $feedback->total(),
            ]
        ]);
    }

    /**
     * Get feedback analytics for admin
     */
    public function getAnalytics(Request $request)
    {
        try {
            $user = $request->user();
            $userRole = $user->role->value ?? (string)$user->role;

            // Only admin can access analytics
            if ($userRole !== 'admin') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $branchId = $request->get('branch_id');
            $startDate = $request->get('start_date', Carbon::now()->subMonths(6)->format('Y-m-d'));
            $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));

            // Base query with safer relationships
            $query = Feedback::select('id', 'customer_id', 'branch_id', 'appointment_id', 'rating', 'comment', 'created_at')
                ->whereBetween('created_at', [$startDate, $endDate]);

            if ($branchId) {
                $query->where('branch_id', $branchId);
            }

            $feedbackRecords = $query->get();

            // Get average rating per branch safely
            $branchRatings = collect();
            if ($feedbackRecords->count() > 0) {
                $branchGrouped = $feedbackRecords->groupBy('branch_id');
                $branchRatings = $branchGrouped->map(function ($feedbacks, $branchId) {
                    $avgRating = $feedbacks->avg('rating');
                    $branch = \App\Models\Branch::select('id', 'name')->find($branchId);

                    return [
                        'branch_id' => $branchId,
                        'branch_name' => $branch ? $branch->name : 'Unknown Branch',
                        'avg_rating' => round($avgRating, 2),
                        'feedback_count' => $feedbacks->count(),
                    ];
                })->values();
            }

            // Get overall statistics safely
            $overallStats = [];
            if ($feedbackRecords->count() > 0) {
                $overallStats = [
                    'avg_rating' => round($feedbackRecords->avg('rating'), 2),
                    'total_feedback' => $feedbackRecords->count(),
                    'unique_customers' => $feedbackRecords->pluck('customer_id')->filter()->unique()->count(),
                ];
            } else {
                $overallStats = [
                    'avg_rating' => 0,
                    'total_feedback' => 0,
                    'unique_customers' => 0,
                ];
            }

            // Get trend over time (monthly) safely
            $trendData = collect();
            if ($feedbackRecords->count() > 0) {
                $monthlyGroups = $feedbackRecords->groupBy(function ($feedback) {
                    return Carbon::parse($feedback->created_at)->format('Y-m');
                });

                $trendData = $monthlyGroups->map(function ($feedbacks, $month) {
                    return [
                        'month' => $month,
                        'avg_rating' => round($feedbacks->avg('rating'), 2),
                        'feedback_count' => $feedbacks->count(),
                    ];
                })->sortBy('month')->values();
            }

            // Get latest feedback with comments safely
            $latestFeedbackIds = $query->orderBy('created_at', 'desc')
                ->limit(20)
                ->pluck('id');

            $latestFeedback = collect();
            if ($latestFeedbackIds->count() > 0) {
                $feedbackWithRelations = Feedback::whereIn('id', $latestFeedbackIds)
                    ->with([
                        'customer:user,id,name',
                        'branch:branches,id,name',
                        'appointment:appointments,id,appointment_date'
                    ])
                    ->get()
                    ->sortBy(function ($item) {
                        return $item->created_at;
                    }, SORT_UNDER_MAINTAINING_INDEX, true); // Sort desc

                $latestFeedback = $feedbackWithRelations->map(function ($feedback) {
                    return [
                        'id' => $feedback->id,
                        'customer_name' => $feedback->customer ? $feedback->customer->name : 'Unknown Customer',
                        'branch_name' => $feedback->branch ? $feedback->branch->name : 'Unknown Branch',
                        'rating' => $feedback->rating,
                        'comment' => $feedback->comment ?: '',
                        'appointment_date' => $feedback->appointment ? $feedback->appointment->appointment_date : null,
                        'created_at' => $feedback->created_at,
                    ];
                })->values();
            }

            // Get rating distribution safely
            $ratingDistribution = collect();
            if ($feedbackRecords->count() > 0) {
                $ratingsGrouped = $feedbackRecords->groupBy('rating');
                $totalCount = $feedbackRecords->count();

                $ratingDistribution = $ratingsGrouped->map(function ($feedbacks, $rating) use ($totalCount) {
                    return [
                        'rating' => (int)$rating,
                        'count' => $feedbacks->count(),
                        'percentage' => round(($feedbacks->count() / $totalCount) * 100, 1),
                    ];
                })->sortBy('rating')->values();
            } else {
                // Return empty ratings distribution
                for ($i = 1; $i <= 5; $i++) {
                    $ratingDistribution->push([
                        'rating' => $i,
                        'count' => 0,
                        'percentage' => 0,
                    ]);
                }
            }

            return response()->json([
                'branch_ratings' => $branchRatings,
                'overall_stats' => $overallStats,
                'trend_data' => $trendData,
                'latest_feedback' => $latestFeedback,
                'rating_distribution' => $ratingDistribution,
                'filters' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'branch_id' => $branchId,
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Feedback analytics error: ' . $e->getMessage() . ' at ' . $e->getFile() . ':' . $e->getLine());
            return response()->json([
                'message' => 'Failed to generate feedback analytics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get appointments available for feedback (completed appointments without feedback)
     */
    public function getAvailableAppointments(Request $request)
    {
        $user = $request->user();
        $userRole = $user->role->value ?? (string)$user->role;

        // Only customers can view their available appointments
        if ($userRole !== 'customer') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $appointments = Appointment::where('patient_id', $user->id)
            ->where('status', 'completed')
            ->whereDoesntHave('feedback')
            ->with(['optometrist', 'branch'])
            ->orderBy('appointment_date', 'desc')
            ->get()
            ->map(function ($appointment) {
                return [
                    'id' => $appointment->id,
                    'date' => $appointment->appointment_date,
                    'time' => $appointment->appointment_time,
                    'type' => $appointment->appointment_type,
                    'optometrist_name' => $appointment->optometrist?->name,
                    'branch_name' => $appointment->branch?->name,
                ];
            });

        return response()->json([
            'appointments' => $appointments
        ]);
    }
}
