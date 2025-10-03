<?php

namespace App\Http\Controllers;

use App\Models\StockTransfer;
use App\Models\BranchStock;
use App\Models\Product;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class StockTransferController extends Controller
{
    /**
     * Display a listing of stock transfers.
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $query = StockTransfer::with(['product', 'fromBranch', 'toBranch', 'requestedBy', 'approvedBy']);

        // Filter based on user role
        if ($user->role === 'staff') {
            // Staff can only see transfers involving their branch
            $query->where(function($q) use ($user) {
                $q->where('from_branch_id', $user->branch_id)
                  ->orWhere('to_branch_id', $user->branch_id);
            });
        } elseif ($user->role === 'admin') {
            // Admin can see all transfers
        } else {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Filter by status if provided
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by branch if provided
        if ($request->has('branch_id')) {
            $query->where(function($q) use ($request) {
                $q->where('from_branch_id', $request->branch_id)
                  ->orWhere('to_branch_id', $request->branch_id);
            });
        }

        $transfers = $query->orderBy('created_at', 'desc')->get();

        return response()->json($transfers);
    }

    /**
     * Store a newly created stock transfer request.
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();

        // Only staff and admin can create transfer requests
        if (!in_array($user->role, ['staff', 'admin'])) {
            return response()->json([
                'message' => 'Only staff and admin can create transfer requests'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'product_id' => 'required|exists:products,id',
            'from_branch_id' => 'required|exists:branches,id',
            'to_branch_id' => 'required|exists:branches,id|different:from_branch_id',
            'quantity' => 'required|integer|min:1',
            'reason' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check if source branch has enough stock
        $sourceStock = BranchStock::where('product_id', $request->product_id)
            ->where('branch_id', $request->from_branch_id)
            ->first();

        if (!$sourceStock) {
            return response()->json([
                'message' => 'Product not found in source branch inventory'
            ], 400);
        }

        if ($sourceStock->available_quantity < $request->quantity) {
            return response()->json([
                'message' => 'Insufficient stock in source branch',
                'available_quantity' => $sourceStock->available_quantity
            ], 400);
        }

        // Check if there's already a pending transfer for this product between these branches
        $existingTransfer = StockTransfer::where('product_id', $request->product_id)
            ->where('from_branch_id', $request->from_branch_id)
            ->where('to_branch_id', $request->to_branch_id)
            ->whereIn('status', ['pending', 'approved', 'in_transit'])
            ->first();

        if ($existingTransfer) {
            return response()->json([
                'message' => 'There is already a pending or active transfer for this product between these branches'
            ], 400);
        }

        $transfer = StockTransfer::create([
            'product_id' => $request->product_id,
            'from_branch_id' => $request->from_branch_id,
            'to_branch_id' => $request->to_branch_id,
            'quantity' => $request->quantity,
            'reason' => $request->reason,
            'requested_by' => $user->id,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Transfer request created successfully',
            'transfer' => $transfer->load(['product', 'fromBranch', 'toBranch', 'requestedBy'])
        ], 201);
    }

    /**
     * Display the specified stock transfer.
     */
    public function show(StockTransfer $stockTransfer): JsonResponse
    {
        $user = Auth::user();

        // Check if user can view this transfer
        if ($user->role === 'staff' && 
            $stockTransfer->from_branch_id !== $user->branch_id && 
            $stockTransfer->to_branch_id !== $user->branch_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($stockTransfer->load(['product', 'fromBranch', 'toBranch', 'requestedBy', 'approvedBy']));
    }

    /**
     * Approve a stock transfer.
     */
    public function approve(Request $request, StockTransfer $stockTransfer): JsonResponse
    {
        $user = Auth::user();

        // Only admin can approve transfers
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Only admin can approve transfers'], 403);
        }

        if ($stockTransfer->status !== 'pending') {
            return response()->json(['message' => 'Transfer is not pending'], 400);
        }

        // Check if source branch still has enough stock
        $sourceStock = BranchStock::where('product_id', $stockTransfer->product_id)
            ->where('branch_id', $stockTransfer->from_branch_id)
            ->first();

        if (!$sourceStock || $sourceStock->available_quantity < $stockTransfer->quantity) {
            return response()->json([
                'message' => 'Insufficient stock in source branch',
                'available_quantity' => $sourceStock ? $sourceStock->available_quantity : 0
            ], 400);
        }

        $stockTransfer->update([
            'status' => 'approved',
            'approved_by' => $user->id,
            'approved_at' => now(),
        ]);

        return response()->json([
            'message' => 'Transfer approved successfully',
            'transfer' => $stockTransfer->load(['product', 'fromBranch', 'toBranch', 'requestedBy', 'approvedBy'])
        ]);
    }

    /**
     * Reject a stock transfer.
     */
    public function reject(Request $request, StockTransfer $stockTransfer): JsonResponse
    {
        $user = Auth::user();

        // Only admin can reject transfers
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Only admin can reject transfers'], 403);
        }

        if ($stockTransfer->status !== 'pending') {
            return response()->json(['message' => 'Transfer is not pending'], 400);
        }

        $stockTransfer->update([
            'status' => 'cancelled',
            'approved_by' => $user->id,
            'approved_at' => now(),
        ]);

        return response()->json([
            'message' => 'Transfer rejected successfully',
            'transfer' => $stockTransfer->load(['product', 'fromBranch', 'toBranch', 'requestedBy', 'approvedBy'])
        ]);
    }

    /**
     * Complete a stock transfer.
     */
    public function complete(Request $request, StockTransfer $stockTransfer): JsonResponse
    {
        $user = Auth::user();

        // Only admin can complete transfers
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Only admin can complete transfers'], 403);
        }

        if ($stockTransfer->status !== 'approved') {
            return response()->json(['message' => 'Transfer must be approved first'], 400);
        }

        DB::beginTransaction();
        try {
            // Reduce stock from source branch
            $sourceStock = BranchStock::where('product_id', $stockTransfer->product_id)
                ->where('branch_id', $stockTransfer->from_branch_id)
                ->first();

            if (!$sourceStock || $sourceStock->available_quantity < $stockTransfer->quantity) {
                throw new \Exception('Insufficient stock in source branch');
            }

            $sourceStock->decrement('stock_quantity', $stockTransfer->quantity);

            // Add stock to destination branch
            $destStock = BranchStock::where('product_id', $stockTransfer->product_id)
                ->where('branch_id', $stockTransfer->to_branch_id)
                ->first();

            if ($destStock) {
                $destStock->increment('stock_quantity', $stockTransfer->quantity);
            } else {
                // Create new stock record for destination branch
                BranchStock::create([
                    'product_id' => $stockTransfer->product_id,
                    'branch_id' => $stockTransfer->to_branch_id,
                    'stock_quantity' => $stockTransfer->quantity,
                    'reserved_quantity' => 0,
                ]);
            }

            // Update transfer status
            $stockTransfer->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Transfer completed successfully',
                'transfer' => $stockTransfer->load(['product', 'fromBranch', 'toBranch', 'requestedBy', 'approvedBy'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to complete transfer: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel a stock transfer.
     */
    public function cancel(Request $request, StockTransfer $stockTransfer): JsonResponse
    {
        $user = Auth::user();

        // Check if user can cancel this transfer
        if ($user->role === 'staff' && 
            $stockTransfer->from_branch_id !== $user->branch_id && 
            $stockTransfer->to_branch_id !== $user->branch_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (!in_array($stockTransfer->status, ['pending', 'approved'])) {
            return response()->json(['message' => 'Transfer cannot be cancelled'], 400);
        }

        $stockTransfer->update([
            'status' => 'cancelled',
        ]);

        return response()->json([
            'message' => 'Transfer cancelled successfully',
            'transfer' => $stockTransfer->load(['product', 'fromBranch', 'toBranch', 'requestedBy', 'approvedBy'])
        ]);
    }
}
