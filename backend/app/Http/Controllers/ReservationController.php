<?php

namespace App\Http\Controllers;

use App\Models\Reservation;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class ReservationController extends Controller
{
    /**
     * Display a listing of reservations for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $query = Reservation::with(['product', 'user']);

        // Filter based on user role
        $userRole = $user->role->value ?? (string)$user->role;
        if ($userRole === 'customer') {
            $query->where('user_id', $user->id);
        } elseif ($userRole === 'staff') {
            // Staff can only see reservations for their branch
            $query->where('branch_id', $user->branch_id);
        } elseif ($userRole === 'admin') {
            // Admin can see all reservations
        } elseif ($userRole === 'optometrist') {
            // Optometrists can see reservations for their patients
            // This would need additional logic based on patient relationships
            $query->where('user_id', $user->id); // Placeholder
        }

        // Filter by status if provided
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $reservations = $query->with('branch')->orderBy('created_at', 'desc')->get();

        return response()->json($reservations);
    }

    /**
     * Store a newly created reservation in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();

        // Only customers can create reservations
        $userRole = $user->role->value ?? (string)$user->role;
        if ($userRole !== 'customer') {
            return response()->json([
                'message' => 'Only customers can create reservations'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'product_id' => 'required|exists:products,id',
            'branch_id' => 'required|exists:branches,id',
            'quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $product = Product::findOrFail($request->product_id);

        // Check if product is active
        if (!$product->is_active) {
            return response()->json([
                'message' => 'Product is not available for reservation'
            ], 400);
        }

        // Check branch stock availability
        $branchStock = \App\Models\BranchStock::where('product_id', $request->product_id)
            ->where('branch_id', $request->branch_id)
            ->first();

        if (!$branchStock || $branchStock->available_quantity < $request->quantity) {
            return response()->json([
                'message' => 'Insufficient stock available at selected branch'
            ], 400);
        }

        // Check if user already has a pending reservation for this product
        $existingReservation = Reservation::where('user_id', $user->id)
            ->where('product_id', $request->product_id)
            ->where('status', 'pending')
            ->first();

        if ($existingReservation) {
            return response()->json([
                'message' => 'You already have a pending reservation for this product'
            ], 400);
        }

        // Auto-assign customer to branch if they don't have one
        if (!$user->branch_id) {
            $user->update(['branch_id' => $request->branch_id]);
        }

        $reservation = Reservation::create([
            'user_id' => $user->id,
            'product_id' => $request->product_id,
            'branch_id' => $request->branch_id,
            'quantity' => $request->quantity,
            'notes' => $request->notes,
            'status' => 'pending',
            'reserved_at' => now(),
        ]);

        // Update reserved quantity in branch stock
        $branchStock->increment('reserved_quantity', $request->quantity);

        return response()->json([
            'message' => 'Reservation created successfully',
            'reservation' => $reservation->load(['product', 'user', 'branch'])
        ], 201);
    }

    /**
     * Display the specified reservation.
     */
    public function show(Reservation $reservation): JsonResponse
    {
        $user = Auth::user();

        // Check if user can view this reservation
        $userRole = $user->role->value ?? (string)$user->role;
        if ($userRole === 'customer' && $reservation->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($reservation->load(['product', 'user']));
    }

    /**
     * Update the specified reservation in storage.
     */
    public function update(Request $request, Reservation $reservation): JsonResponse
    {
        $user = Auth::user();

        // Only allow updates by the reservation owner or staff/admin
        $userRole = $user->role->value ?? (string)$user->role;
        if ($userRole === 'customer' && $reservation->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($userRole === 'customer' && $reservation->status !== 'pending') {
            return response()->json([
                'message' => 'Cannot update reservation that is not pending'
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'quantity' => 'sometimes|required|integer|min:1',
            'notes' => 'nullable|string|max:500',
            'status' => 'sometimes|required|in:pending,approved,rejected',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $validator->validated();

        // Handle status changes
        if (isset($data['status'])) {
            if (!in_array($userRole, ['staff', 'admin'])) {
                return response()->json([
                    'message' => 'Only staff can change reservation status'
                ], 403);
            }

            if ($data['status'] === 'approved') {
                $data['approved_at'] = now();
            } elseif ($data['status'] === 'rejected') {
                $data['rejected_at'] = now();
            }
        }

        // Check stock availability for quantity updates
        if (isset($data['quantity'])) {
            $product = $reservation->product;
            if ($product->stock_quantity < $data['quantity']) {
                return response()->json([
                    'message' => 'Insufficient stock available'
                ], 400);
            }
        }

        $reservation->update($data);

        return response()->json([
            'message' => 'Reservation updated successfully',
            'reservation' => $reservation->load(['product', 'user'])
        ]);
    }

    /**
     * Remove the specified reservation from storage.
     */
    public function destroy(Reservation $reservation): JsonResponse
    {
        $user = Auth::user();

        // Only allow deletion by the reservation owner or staff/admin
        $userRole = $user->role->value ?? (string)$user->role;
        if ($userRole === 'customer' && $reservation->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($userRole === 'customer' && $reservation->status !== 'pending') {
            return response()->json([
                'message' => 'Cannot delete reservation that is not pending'
            ], 400);
        }

        $reservation->delete();

        return response()->json([
            'message' => 'Reservation deleted successfully'
        ]);
    }

    /**
     * Get reservations for a specific user (for staff/optometrist view).
     */
    public function getUserReservations(int $userId): JsonResponse
    {
        $user = Auth::user();

        // Only staff, admin, and optometrists can view other users' reservations
        $userRole = $user->role->value ?? (string)$user->role;
        if (!in_array($userRole, ['staff', 'admin', 'optometrist'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $reservations = Reservation::with(['product', 'user'])
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($reservations);
    }

    /**
     * Get total bill for user's reservations.
     */
    public function getTotalBill(): JsonResponse
    {
        $user = Auth::user();

        $reservations = Reservation::with('product')
            ->where('user_id', $user->id)
            ->where('status', 'approved')
            ->get();

        $total = $reservations->sum(function ($reservation) {
            return $reservation->quantity * $reservation->product->price;
        });

        return response()->json([
            'total' => $total,
            'reservations_count' => $reservations->count(),
            'reservations' => $reservations
        ]);
    }

    /**
     * Confirm a reservation (approve).
     */
    public function confirmReservation(Reservation $reservation): JsonResponse
    {
        $user = Auth::user();

        $userRole = $user->role->value ?? (string)$user->role;
        if (!in_array($userRole, ['staff', 'admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($reservation->status !== 'pending') {
            return response()->json(['message' => 'Only pending reservations can be confirmed'], 400);
        }

        $reservation->status = 'approved';
        $reservation->approved_at = now();
        $reservation->save();

        return response()->json([
            'message' => 'Reservation confirmed successfully',
            'reservation' => $reservation->load(['product', 'user'])
        ]);
    }

    /**
     * Reject a reservation.
     */
    public function rejectReservation(Reservation $reservation): JsonResponse
    {
        $user = Auth::user();

        $userRole = $user->role->value ?? (string)$user->role;
        if (!in_array($userRole, ['staff', 'admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($reservation->status !== 'pending') {
            return response()->json(['message' => 'Only pending reservations can be rejected'], 400);
        }

        $reservation->status = 'rejected';
        $reservation->rejected_at = now();
        $reservation->save();

        return response()->json([
            'message' => 'Reservation rejected successfully',
            'reservation' => $reservation->load(['product', 'user'])
        ]);
    }

    /**
     * Complete a reservation (mark as completed and update stock).
     */
    public function completeReservation(Reservation $reservation): JsonResponse
    {
        $user = Auth::user();

        $userRole = $user->role->value ?? (string)$user->role;
        if (!in_array($userRole, ['staff', 'admin'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Staff can only complete reservations for their branch
        if ($userRole === 'staff' && $reservation->branch_id !== $user->branch_id) {
            return response()->json([
                'message' => 'Unauthorized. Staff can only complete reservations for their branch.'
            ], 403);
        }

        if ($reservation->status !== 'approved') {
            return response()->json(['message' => 'Only approved reservations can be completed'], 400);
        }

        // Update reservation status
        $reservation->status = 'completed';
        $reservation->completed_at = now();
        $reservation->save();

        // Update branch stock (decrease stock and reserved quantities)
        $branchStock = \App\Models\BranchStock::where('product_id', $reservation->product_id)
            ->where('branch_id', $reservation->branch_id)
            ->first();

        if ($branchStock) {
            $branchStock->decrement('stock_quantity', $reservation->quantity);
            $branchStock->decrement('reserved_quantity', $reservation->quantity);
        }

        return response()->json([
            'message' => 'Reservation completed successfully',
            'reservation' => $reservation->load(['product', 'user', 'branch'])
        ]);
    }
}
