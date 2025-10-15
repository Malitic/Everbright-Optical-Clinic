<?php

namespace App\Http\Controllers;

use App\Models\BranchStock;
use App\Models\Product;
use App\Models\Branch;
use App\Models\StockTransfer;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class CrossBranchInventoryController extends Controller
{
    /**
     * Get real-time product availability across all branches
     */
    public function getCrossBranchAvailability(Request $request): JsonResponse
    {
        $productId = $request->get('product_id');
        $branchId = $request->get('branch_id');
        $includeOutOfStock = $request->boolean('include_out_of_stock', false);

        $query = BranchStock::with(['product', 'branch'])
            ->select('*')
            ->selectRaw('(stock_quantity - reserved_quantity) as available_quantity');

        if ($productId) {
            $query->where('product_id', $productId);
        }

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        if (!$includeOutOfStock) {
            $query->whereRaw('stock_quantity > reserved_quantity');
        }

        $stockData = $query->get();

        $availability = $stockData->map(function ($stock) {
            return [
                'branch' => [
                    'id' => $stock->branch_id,
                    'name' => $stock->branch->name,
                    'code' => $stock->branch->code,
                    'address' => $stock->branch->address,
                    'phone' => $stock->branch->phone,
                ],
                'product' => [
                    'id' => $stock->product_id,
                    'name' => $stock->product->name,
                    'sku' => $stock->product->sku,
                ],
                'stock_info' => [
                    'available_quantity' => $stock->available_quantity,
                    'stock_quantity' => $stock->stock_quantity,
                    'reserved_quantity' => $stock->reserved_quantity,
                    'is_available' => $stock->available_quantity > 0,
                    'is_low_stock' => $stock->available_quantity <= ($stock->min_stock_threshold ?? 5),
                    'last_restock_date' => $stock->last_restock_date,
                ],
                'status' => $this->getStockStatus($stock->available_quantity, $stock->min_stock_threshold ?? 5),
            ];
        });

        return response()->json([
            'availability' => $availability,
            'summary' => [
                'total_branches' => $availability->count(),
                'branches_with_stock' => $availability->where('stock_info.is_available', true)->count(),
                'branches_low_stock' => $availability->where('stock_info.is_low_stock', true)->count(),
                'branches_out_of_stock' => $availability->where('stock_info.is_available', false)->count(),
                'total_available_quantity' => $availability->sum('stock_info.available_quantity'),
            ]
        ]);
    }

    /**
     * Get immediate stock alerts for out-of-stock products
     */
    public function getImmediateStockAlerts(): JsonResponse
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Get out of stock items
        $outOfStockItems = BranchStock::with(['product', 'branch'])
            ->whereRaw('stock_quantity <= reserved_quantity')
            ->get();

        // Get low stock items
        $lowStockItems = BranchStock::with(['product', 'branch'])
            ->whereRaw('(stock_quantity - reserved_quantity) <= COALESCE(min_stock_threshold, 5)')
            ->whereRaw('stock_quantity > reserved_quantity')
            ->get();

        // Get expiring items
        $expiringItems = BranchStock::with(['product', 'branch'])
            ->where('expiry_date', '<=', Carbon::now()->addDays(30))
            ->where('expiry_date', '>', Carbon::now())
            ->get();

        $alerts = [
            'out_of_stock' => $outOfStockItems->map(function ($stock) {
                return [
                    'id' => $stock->id,
                    'product' => $stock->product->name,
                    'branch' => $stock->branch->name,
                    'severity' => 'critical',
                    'message' => "Out of stock: {$stock->product->name} at {$stock->branch->name}",
                    'timestamp' => now(),
                ];
            }),
            'low_stock' => $lowStockItems->map(function ($stock) {
                return [
                    'id' => $stock->id,
                    'product' => $stock->product->name,
                    'branch' => $stock->branch->name,
                    'severity' => 'warning',
                    'message' => "Low stock: {$stock->product->name} at {$stock->branch->name} ({$stock->available_quantity} remaining)",
                    'timestamp' => now(),
                ];
            }),
            'expiring' => $expiringItems->map(function ($stock) {
                return [
                    'id' => $stock->id,
                    'product' => $stock->product->name,
                    'branch' => $stock->branch->name,
                    'severity' => 'info',
                    'message' => "Expiring soon: {$stock->product->name} at {$stock->branch->name} (expires {$stock->expiry_date->format('M d, Y')})",
                    'timestamp' => now(),
                ];
            }),
        ];

        return response()->json([
            'alerts' => $alerts,
            'summary' => [
                'total_alerts' => $alerts['out_of_stock']->count() + $alerts['low_stock']->count() + $alerts['expiring']->count(),
                'critical_alerts' => $alerts['out_of_stock']->count(),
                'warning_alerts' => $alerts['low_stock']->count(),
                'info_alerts' => $alerts['expiring']->count(),
            ]
        ]);
    }

    /**
     * Request stock transfer between branches
     */
    public function requestStockTransfer(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'product_id' => 'required|exists:products,id',
            'from_branch_id' => 'required|exists:branches,id',
            'to_branch_id' => 'required|exists:branches,id',
            'quantity' => 'required|integer|min:1',
            'reason' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Check if source branch has enough stock
        $sourceStock = BranchStock::where('product_id', $request->product_id)
            ->where('branch_id', $request->from_branch_id)
            ->first();

        if (!$sourceStock || $sourceStock->available_quantity < $request->quantity) {
            return response()->json([
                'message' => 'Insufficient stock at source branch',
                'available_quantity' => $sourceStock ? $sourceStock->available_quantity : 0
            ], 400);
        }

        // Create stock transfer request
        $transfer = StockTransfer::create([
            'product_id' => $request->product_id,
            'from_branch_id' => $request->from_branch_id,
            'to_branch_id' => $request->to_branch_id,
            'quantity' => $request->quantity,
            'status' => 'pending',
            'requested_by' => $user->id,
            'reason' => $request->reason,
        ]);

        // Send notification to source branch
        $this->sendTransferNotification($transfer, 'requested');

        return response()->json([
            'message' => 'Stock transfer request created successfully',
            'transfer' => $transfer->load(['product', 'fromBranch', 'toBranch', 'requestedBy'])
        ]);
    }

    /**
     * Approve or reject stock transfer
     */
    public function processStockTransfer(Request $request, StockTransfer $transfer): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'action' => 'required|in:approve,reject',
            'notes' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();
        if (!$user || $user->role->value !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        if ($transfer->status !== 'pending') {
            return response()->json([
                'message' => 'Transfer request has already been processed'
            ], 400);
        }

        DB::transaction(function () use ($request, $transfer, $user) {
            if ($request->action === 'approve') {
                // Check if source still has enough stock
                $sourceStock = BranchStock::where('product_id', $transfer->product_id)
                    ->where('branch_id', $transfer->from_branch_id)
                    ->first();

                if (!$sourceStock || $sourceStock->available_quantity < $transfer->quantity) {
                    $transfer->update([
                        'status' => 'rejected',
                        'processed_by' => $user->id,
                        'processed_at' => now(),
                        'notes' => $request->notes . ' (Insufficient stock)',
                    ]);
                    return;
                }

                // Transfer stock
                $sourceStock->decrement('stock_quantity', $transfer->quantity);
                
                $destinationStock = BranchStock::firstOrCreate(
                    ['product_id' => $transfer->product_id, 'branch_id' => $transfer->to_branch_id],
                    ['stock_quantity' => 0, 'reserved_quantity' => 0]
                );
                $destinationStock->increment('stock_quantity', $transfer->quantity);

                $transfer->update([
                    'status' => 'completed',
                    'processed_by' => $user->id,
                    'processed_at' => now(),
                    'notes' => $request->notes,
                ]);

                // Send notification
                $this->sendTransferNotification($transfer, 'completed');
            } else {
                $transfer->update([
                    'status' => 'rejected',
                    'processed_by' => $user->id,
                    'processed_at' => now(),
                    'notes' => $request->notes,
                ]);

                $this->sendTransferNotification($transfer, 'rejected');
            }
        });

        return response()->json([
            'message' => "Stock transfer {$request->action}d successfully",
            'transfer' => $transfer->fresh(['product', 'fromBranch', 'toBranch', 'requestedBy', 'processedBy'])
        ]);
    }

    /**
     * Get stock transfer history
     */
    public function getStockTransferHistory(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $query = StockTransfer::with(['product', 'fromBranch', 'toBranch', 'requestedBy', 'processedBy']);

        // Filter by branch if user is staff
        if ($user->role->value === 'staff' && $user->branch_id) {
            $query->where(function ($q) use ($user) {
                $q->where('from_branch_id', $user->branch_id)
                  ->orWhere('to_branch_id', $user->branch_id);
            });
        }

        $transfers = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'transfers' => $transfers,
            'summary' => [
                'total_transfers' => $transfers->count(),
                'pending_transfers' => $transfers->where('status', 'pending')->count(),
                'completed_transfers' => $transfers->where('status', 'completed')->count(),
                'rejected_transfers' => $transfers->where('status', 'rejected')->count(),
            ]
        ]);
    }

    /**
     * Get stock status based on quantity and threshold
     */
    private function getStockStatus(int $availableQuantity, int $threshold): string
    {
        if ($availableQuantity <= 0) {
            return 'out_of_stock';
        } elseif ($availableQuantity <= $threshold) {
            return 'low_stock';
        } else {
            return 'in_stock';
        }
    }

    /**
     * Send transfer notification
     */
    private function sendTransferNotification(StockTransfer $transfer, string $action): void
    {
        $message = match($action) {
            'requested' => "Stock transfer requested: {$transfer->quantity} units of {$transfer->product->name} from {$transfer->fromBranch->name} to {$transfer->toBranch->name}",
            'completed' => "Stock transfer completed: {$transfer->quantity} units of {$transfer->product->name} transferred to {$transfer->toBranch->name}",
            'rejected' => "Stock transfer rejected: {$transfer->quantity} units of {$transfer->product->name} from {$transfer->fromBranch->name}",
            default => "Stock transfer update: {$transfer->product->name}"
        };

        // Create notification for admin
        Notification::create([
            'user_id' => null, // System notification
            'title' => "Stock Transfer {$action}",
            'message' => $message,
            'type' => 'stock_transfer',
            'data' => [
                'transfer_id' => $transfer->id,
                'action' => $action,
            ],
        ]);
    }
}



