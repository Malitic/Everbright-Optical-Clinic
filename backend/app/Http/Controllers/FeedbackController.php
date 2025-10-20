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
    public function getByCustomer($customerId)
    {
        $user = auth()->user();
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
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'appointment_id' => $item->appointment_id,
                    'rating' => $item->rating,
                    'comment' => $item->comment,
                    'created_at' => $item->created_at->toISOString(),
                    'appointment' => [
                        'id' => $item->appointment->id,
                        'date' => $item->appointment->appointment_date,
                        'time' => $item->appointment->start_time,
                        'type' => $item->appointment->type,
                        'optometrist' => $item->appointment->optometrist ? [
                            'id' => $item->appointment->optometrist->id,
                            'name' => $item->appointment->optometrist->name,
                        ] : null,
                    ],
                    'branch' => [
                        'id' => $item->branch->id,
                        'name' => $item->branch->name,
                    ],
                ];
            });

        return response()->json([
            'data' => $feedback,
            'count' => $feedback->count()
        ]);
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
        $user = $request->user();
        $userRole = $user->role->value ?? (string)$user->role;

        // Only admin can access analytics
        if ($userRole !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $branchId = $request->get('branch_id');
        $startDate = $request->get('start_date', Carbon::now()->subMonths(6)->format('Y-m-d'));
        $endDate = $request->get('end_date', Carbon::now()->addDay()->format('Y-m-d')); // Include today

        // Base query conditions
        $baseConditions = function($query) use ($startDate, $endDate, $branchId) {
            $query->whereBetween('created_at', [$startDate, $endDate]);
            if ($branchId) {
                $query->where('branch_id', $branchId);
            }
        };

        // Get average rating per branch
        $branchRatings = Feedback::with('branch')
            ->where($baseConditions)
            ->select('branch_id', DB::raw('AVG(rating) as avg_rating'), DB::raw('COUNT(*) as feedback_count'))
            ->groupBy('branch_id')
            ->get()
            ->map(function ($item) {
                return [
                    'branch_id' => $item->branch_id,
                    'branch_name' => $item->branch->name ?? 'Unknown',
                    'avg_rating' => round($item->avg_rating, 2),
                    'feedback_count' => $item->feedback_count,
                ];
            });

        // Get overall statistics
        $overallStats = Feedback::where($baseConditions)
            ->select(
                DB::raw('AVG(rating) as overall_avg_rating'),
                DB::raw('COUNT(*) as total_feedback'),
                DB::raw('COUNT(DISTINCT customer_id) as unique_customers')
            )->first();

        // Get trend over time (monthly)
        $trendData = Feedback::where($baseConditions)
            ->select(
                DB::raw('strftime("%Y-%m", created_at) as month'),
                DB::raw('AVG(rating) as avg_rating'),
                DB::raw('COUNT(*) as feedback_count')
            )
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        // Get latest feedback with comments
        $latestFeedback = Feedback::with(['customer', 'branch', 'appointment'])
            ->where($baseConditions)
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($feedback) {
                return [
                    'id' => $feedback->id,
                    'customer_name' => $feedback->customer?->name ?? 'Unknown Customer',
                    'branch_name' => $feedback->branch?->name ?? 'Unknown Branch',
                    'rating' => $feedback->rating,
                    'comment' => $feedback->comment,
                    'appointment_date' => $feedback->appointment?->appointment_date,
                    'created_at' => $feedback->created_at,
                ];
            });

        // Get rating distribution
        $ratingDistribution = Feedback::where($baseConditions)
            ->select('rating', DB::raw('COUNT(*) as count'))
            ->groupBy('rating')
            ->orderBy('rating')
            ->get()
            ->map(function ($item) {
                return [
                    'rating' => $item->rating,
                    'count' => $item->count,
                    'percentage' => 0, // Will be calculated on frontend
                ];
            });

        return response()->json([
            'branch_ratings' => $branchRatings,
            'overall_stats' => [
                'avg_rating' => round($overallStats->overall_avg_rating ?? 0, 2),
                'total_feedback' => $overallStats->total_feedback ?? 0,
                'unique_customers' => $overallStats->unique_customers ?? 0,
            ],
            'trend_data' => $trendData,
            'latest_feedback' => $latestFeedback,
            'rating_distribution' => $ratingDistribution,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'branch_id' => $branchId,
            ]
        ]);
    }

    /**
     * Get appointments available for feedback (completed appointments without feedback)
     */
    public function getAvailableAppointments(Request $request)
    {
        try {
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
                        'time' => $appointment->start_time,
                        'type' => $appointment->type,
                        'optometrist_name' => $appointment->optometrist?->name,
                        'branch_name' => $appointment->branch?->name,
                    ];
                });

            return response()->json([
                'appointments' => $appointments
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in getAvailableAppointments: ' . $e->getMessage());
            
            // Return empty array if there's an error
            return response()->json([
                'appointments' => []
            ]);
        }
    }
}