<?php

namespace App\Http\Controllers;

use App\Models\EnhancedInventory;
use App\Models\BranchStock;
use App\Models\Manufacturer;
use App\Models\Branch;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class EnhancedInventoryController extends Controller
{
    /**
     * Get all inventories (Admin view - all branches)
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized.'
            ], 401);
        }

        // Admin can view all branches, staff can only view their own branch
        if ($user->role->value === 'staff' && !$request->has('branch_id')) {
            return response()->json([
                'message' => 'Staff must specify branch_id parameter.'
            ], 400);
        }

        if ($user->role->value === 'staff' && $request->get('branch_id') != $user->branch_id) {
            return response()->json([
                'message' => 'Staff can only view their own branch inventory.'
            ], 403);
        }

        $query = BranchStock::with(['branch:id,name,code', 'product:id,name,sku,description,image_path,price,is_active'])
            ->whereHas('product', function($q) {
                $q->where('is_active', true);
            });

        // Filter by branch
        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Search by product name or SKU
        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('product', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        $inventories = $query->orderBy('branch_id')
            ->orderBy('product_id')
            ->get();

        // Calculate summary statistics
        $summary = [
            'total_items' => $inventories->count(),
            'in_stock' => $inventories->where('status', 'In Stock')->count(),
            'low_stock' => $inventories->where('status', 'Low Stock')->count(),
            'out_of_stock' => $inventories->where('status', 'Out of Stock')->count(),
            'total_value' => $inventories->sum(function ($item) {
                $effectivePrice = $item->price_override !== null 
                    ? (float) $item->price_override 
                    : (float) $item->product->price;
                return $item->stock_quantity * $effectivePrice;
            }),
            'branches_count' => $inventories->pluck('branch_id')->unique()->count(),
        ];

        // Transform the data to match frontend expectations
        $transformedInventories = $inventories->map(function ($item) {
            $effectivePrice = $item->price_override ?? $item->product->price ?? 0;
            $reservedQty = $item->reserved_quantity ?? 0;
            $availableQty = $item->stock_quantity - $reservedQty;
            
            return [
                'id' => $item->id,
                'branch_id' => $item->branch_id,
                'product_id' => $item->product->id,
                'product_name' => $item->product->name,
                'sku' => $item->product->sku ?? 'N/A',
                'brand' => $item->product->brand,
                'model' => $item->product->model,
                'description' => $item->product->description,
                'stock_quantity' => $item->stock_quantity,
                'reserved_quantity' => $reservedQty,
                'available_quantity' => $availableQty,
                'min_threshold' => $item->min_stock_threshold,
                'status' => strtolower(str_replace(' ', '_', $item->status)), // Convert "In Stock" to "in_stock"
                'price' => $item->product->price ?? 0,
                'price_override' => $item->price_override,
                'effective_price' => $effectivePrice,
                'last_restock_date' => $item->last_restock_date,
                'expiry_date' => $item->expiry_date,
                'auto_restock_enabled' => $item->auto_restock_enabled ?? false,
                'auto_restock_quantity' => $item->auto_restock_quantity,
                'is_active' => $item->product->is_active,
                'images' => $item->product->image_paths ?? [],
                'primary_image' => $item->product->primary_image,
                'created_at' => $item->created_at,
                'updated_at' => $item->updated_at,
                'branch' => [
                    'id' => $item->branch->id,
                    'name' => $item->branch->name,
                    'code' => $item->branch->code,
                ],
                'product' => [
                    'id' => $item->product->id,
                    'name' => $item->product->name,
                    'sku' => $item->product->sku,
                    'description' => $item->product->description,
                    'image_path' => $item->product->primary_image,
                    'price' => $item->product->price,
                    'is_active' => $item->product->is_active,
                ]
            ];
        });

        return response()->json([
            'inventories' => $transformedInventories,
            'summary' => $summary
        ]);
    }

    /**
     * Get inventory for a specific branch (Staff view)
     */
    public function getBranchInventory(Branch $branch): JsonResponse
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Staff can only view their own branch, Admin can view any branch
        if ($user->role->value === 'staff' && $user->branch_id !== $branch->id) {
            return response()->json([
                'message' => 'Unauthorized. Staff can only view their own branch inventory.'
            ], 403);
        }

        // Get inventory from BranchStock model (the actual inventory data)
        $inventories = BranchStock::with(['product', 'branch'])
            ->where('branch_id', $branch->id)
            ->whereHas('product', function($q) {
                $q->where('is_active', true);
            })
            ->get()
            ->map(function ($item) {
                $effectivePrice = $item->price_override ?? $item->product->price ?? 0;
                $reservedQty = $item->reserved_quantity ?? 0;
                $availableQty = $item->stock_quantity - $reservedQty;
                
                return [
                    'id' => $item->id,
                    'branch_id' => $item->branch_id,
                    'product_id' => $item->product->id,
                    'product_name' => $item->product->name ?? 'Unknown Product',
                    'sku' => $item->product->sku ?? 'N/A',
                    'brand' => $item->product->brand,
                    'model' => $item->product->model,
                    'description' => $item->product->description ?? '',
                    'stock_quantity' => $item->stock_quantity,
                    'reserved_quantity' => $reservedQty,
                    'available_quantity' => $availableQty,
                    'min_threshold' => $item->min_stock_threshold,
                    'status' => strtolower(str_replace(' ', '_', $item->status)),
                    'price' => $item->product->price ?? 0,
                    'price_override' => $item->price_override,
                    'effective_price' => $effectivePrice,
                    'expiry_date' => $item->expiry_date,
                    'last_restock_date' => $item->last_restock_date,
                    'auto_restock_enabled' => $item->auto_restock_enabled ?? false,
                    'auto_restock_quantity' => $item->auto_restock_quantity,
                    'is_active' => $item->product->is_active ?? true,
                    'images' => $item->product->image_paths ?? [],
                    'primary_image' => $item->product->primary_image,
                    'manufacturer_id' => $item->product->manufacturer_id ?? null,
                    'manufacturer' => $item->product->manufacturer ?? null,
                    'created_at' => $item->created_at,
                    'updated_at' => $item->updated_at,
                    'branch' => [
                        'id' => $item->branch->id,
                        'name' => $item->branch->name,
                        'code' => $item->branch->code,
                    ],
                    'product' => [
                        'id' => $item->product->id,
                        'name' => $item->product->name,
                        'sku' => $item->product->sku,
                        'description' => $item->product->description,
                        'image_path' => $item->product->primary_image,
                        'price' => $item->product->price,
                        'is_active' => $item->product->is_active,
                    ]
                ];
            });

        // Calculate summary statistics
        $summary = [
            'total_items' => $inventories->count(),
            'in_stock' => $inventories->where('status', 'in_stock')->count(),
            'low_stock' => $inventories->where('status', 'low_stock')->count(),
            'out_of_stock' => $inventories->where('status', 'out_of_stock')->count(),
            'total_value' => $inventories->sum(function ($item) {
                return ($item['quantity'] ?? 0) * ($item['unit_price'] ?? 0);
            }),
        ];

        return response()->json([
            'branch' => $branch,
            'inventories' => $inventories,
            'summary' => $summary
        ]);
    }

    /**
     * Store a newly created inventory item
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validator = Validator::make($request->all(), [
            'branch_id' => 'required|exists:branches,id',
            'product_name' => 'required|string|max:255',
            'sku' => 'required|string|max:255|unique:products,sku',
            'quantity' => 'required|integer|min:0',
            'min_threshold' => 'required|integer|min:0',
            'manufacturer_id' => 'nullable|exists:manufacturers,id',
            'unit_price' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'expiry_date' => 'nullable|date|after:today',
            'image_path' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Staff can only add items to their own branch
        if ($user->role->value === 'staff' && $user->branch_id != $request->branch_id) {
            return response()->json([
                'message' => 'Unauthorized. Staff can only add items to their own branch.'
            ], 403);
        }

        try {
            DB::beginTransaction();

            // Create or find the product with proper fields for gallery sync
            $product = \App\Models\Product::firstOrCreate(
                ['sku' => $request->sku],
                [
                    'name' => $request->product_name ?? $request->name,
                    'description' => $request->description,
                    'price' => $request->unit_price ?? $request->price ?? 0,
                    'brand' => $request->brand,
                    'model' => $request->model,
                    'manufacturer_id' => $request->manufacturer_id,
                    'image_paths' => $request->image_path ? [$request->image_path] : [],
                    'primary_image' => $request->image_path,
                    'is_active' => true,
                    'approval_status' => 'approved', // Auto-approve staff-added products
                    'created_by' => $user->id,
                    'created_by_role' => $user->role->value,
                ]
            );

            // Update product if it exists but price or other fields changed
            if (!$product->wasRecentlyCreated) {
                $updateData = [];
                if ($request->unit_price && (!$product->price || $product->price == 0)) {
                    $updateData['price'] = $request->unit_price;
                }
                if ($request->brand && !$product->brand) {
                    $updateData['brand'] = $request->brand;
                }
                if ($request->model && !$product->model) {
                    $updateData['model'] = $request->model;
                }
                if ($request->image_path && (!$product->image_paths || count($product->image_paths) == 0)) {
                    $updateData['image_paths'] = [$request->image_path];
                    $updateData['primary_image'] = $request->image_path;
                }
                if (!empty($updateData)) {
                    $product->update($updateData);
                }
            }

            // Create the branch stock entry
            $branchStock = BranchStock::create([
                'branch_id' => $request->branch_id,
                'product_id' => $product->id,
                'stock_quantity' => $request->quantity ?? $request->stock_quantity ?? 0,
                'min_stock_threshold' => $request->min_threshold ?? $request->min_stock_threshold ?? 5,
                'price_override' => $request->unit_price != $product->price ? $request->unit_price : null,
                'expiry_date' => $request->expiry_date,
                'status' => ($request->quantity ?? 0) > ($request->min_threshold ?? 5) ? 'In Stock' : 
                          (($request->quantity ?? 0) > 0 ? 'Low Stock' : 'Out of Stock'),
            ]);

            DB::commit();

            // Load relationships for response
            $branchStock->load(['product', 'branch']);

            // Notify admins about new inventory item added by staff
            if ($user->role->value === 'staff') {
                $this->notifyAdminsInventoryChange(
                    'added',
                    $product->name,
                    $branchStock->stock_quantity,
                    $branchStock->branch,
                    $user
                );
            }

            // Transform the response to match frontend expectations
            $inventory = [
                'id' => $branchStock->id,
                'branch_id' => $branchStock->branch_id,
                'product_name' => $product->name,
                'sku' => $product->sku,
                'description' => $product->description,
                'quantity' => $branchStock->stock_quantity,
                'unit_price' => $branchStock->price_override ?? $product->price,
                'min_threshold' => $branchStock->min_stock_threshold,
                'status' => strtolower(str_replace(' ', '_', $branchStock->status)),
                'image_path' => $product->image_path,
                'manufacturer_id' => $product->manufacturer_id,
                'manufacturer' => $product->manufacturer,
                'expiry_date' => $branchStock->expiry_date,
                'last_restock_date' => $branchStock->last_restock_date,
                'is_active' => $product->is_active,
                'created_at' => $branchStock->created_at,
                'updated_at' => $branchStock->updated_at,
                'branch' => [
                    'id' => $branchStock->branch->id,
                    'name' => $branchStock->branch->name,
                    'code' => $branchStock->branch->code,
                ],
                'product' => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'category' => $product->category ?? null,
                    'price' => $product->price,
                ]
            ];

            return response()->json([
                'message' => 'Inventory item created successfully',
                'inventory' => $inventory
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create inventory item',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified inventory item
     */
    public function update(Request $request, $id): JsonResponse
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $branchStock = BranchStock::findOrFail($id);

        // Staff can only update items in their own branch
        if ($user->role->value === 'staff' && $user->branch_id !== $branchStock->branch_id) {
            return response()->json([
                'message' => 'Unauthorized. Staff can only update items in their own branch.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'product_name' => 'sometimes|required|string|max:255',
            'quantity' => 'sometimes|required|integer|min:0',
            'min_threshold' => 'sometimes|required|integer|min:0',
            'manufacturer_id' => 'nullable|exists:manufacturers,id',
            'unit_price' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'expiry_date' => 'nullable|date|after:today',
            'image_path' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $oldQuantity = $branchStock->stock_quantity;

            // Update the product if fields changed (sync with gallery)
            $product = $branchStock->product;
            $productUpdateData = [];
            
            if ($request->has('product_name')) {
                $productUpdateData['name'] = $request->product_name;
            }
            if ($request->has('description')) {
                $productUpdateData['description'] = $request->description;
            }
            if ($request->has('manufacturer_id')) {
                $productUpdateData['manufacturer_id'] = $request->manufacturer_id;
            }
            if ($request->has('brand')) {
                $productUpdateData['brand'] = $request->brand;
            }
            if ($request->has('model')) {
                $productUpdateData['model'] = $request->model;
            }
            if ($request->has('image_path') && $request->image_path) {
                $productUpdateData['image_paths'] = [$request->image_path];
                $productUpdateData['primary_image'] = $request->image_path;
            }
            // Update base price if provided and different
            if ($request->has('unit_price') && $request->unit_price) {
                $productUpdateData['price'] = $request->unit_price;
            }
            
            if (!empty($productUpdateData)) {
                $product->update($productUpdateData);
            }

            // Update the branch stock
            $branchStock->update([
                'stock_quantity' => $request->quantity ?? $request->stock_quantity ?? $branchStock->stock_quantity,
                'min_stock_threshold' => $request->min_threshold ?? $request->min_stock_threshold ?? $branchStock->min_stock_threshold,
                'price_override' => $request->unit_price != $product->price ? $request->unit_price : $branchStock->price_override,
                'expiry_date' => $request->expiry_date ?? $branchStock->expiry_date,
                'status' => $this->calculateStatus(
                    $request->quantity ?? $request->stock_quantity ?? $branchStock->stock_quantity, 
                    $request->min_threshold ?? $request->min_stock_threshold ?? $branchStock->min_stock_threshold
                ),
            ]);

            // Check if we need to send alerts
            $this->checkAndSendAlerts($branchStock, $oldQuantity);

            // Notify admins about inventory update by staff
            if ($user->role->value === 'staff') {
                $this->notifyAdminsInventoryChange(
                    'updated',
                    $product->name,
                    $branchStock->stock_quantity,
                    $branchStock->branch,
                    $user,
                    $oldQuantity
                );
            }

            DB::commit();

            // Load relationships for response
            $branchStock->load(['product', 'branch']);

            // Transform the response to match frontend expectations
            $inventory = [
                'id' => $branchStock->id,
                'branch_id' => $branchStock->branch_id,
                'product_name' => $branchStock->product->name,
                'sku' => $branchStock->product->sku,
                'description' => $branchStock->product->description,
                'quantity' => $branchStock->stock_quantity,
                'unit_price' => $branchStock->price_override ?? $branchStock->product->price,
                'min_threshold' => $branchStock->min_stock_threshold,
                'status' => strtolower(str_replace(' ', '_', $branchStock->status)),
                'image_path' => $branchStock->product->image_path,
                'manufacturer_id' => $branchStock->product->manufacturer_id,
                'manufacturer' => $branchStock->product->manufacturer,
                'expiry_date' => $branchStock->expiry_date,
                'last_restock_date' => $branchStock->last_restock_date,
                'is_active' => $branchStock->product->is_active,
                'created_at' => $branchStock->created_at,
                'updated_at' => $branchStock->updated_at,
                'branch' => [
                    'id' => $branchStock->branch->id,
                    'name' => $branchStock->branch->name,
                    'code' => $branchStock->branch->code,
                ],
                'product' => [
                    'id' => $branchStock->product->id,
                    'name' => $branchStock->product->name,
                    'sku' => $branchStock->product->sku,
                    'category' => $branchStock->product->category ?? null,
                    'price' => $branchStock->product->price,
                ]
            ];

            return response()->json([
                'message' => 'Inventory item updated successfully',
                'inventory' => $inventory
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update inventory item',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified inventory item
     */
    public function destroy($id): JsonResponse
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $branchStock = BranchStock::findOrFail($id);

        // Staff can only delete items from their own branch
        if ($user->role->value === 'staff' && $user->branch_id !== $branchStock->branch_id) {
            return response()->json([
                'message' => 'Unauthorized. Staff can only delete items from their own branch.'
            ], 403);
        }

        // Load relationships before deletion for notification
        $branchStock->load(['product', 'branch']);
        $productName = $branchStock->product->name;
        $branch = $branchStock->branch;

        $branchStock->delete();

        // Notify admins about inventory deletion by staff
        if ($user->role->value === 'staff') {
            $this->notifyAdminsInventoryChange(
                'deleted',
                $productName,
                0,
                $branch,
                $user
            );
        }

        return response()->json([
            'message' => 'Inventory item deleted successfully'
        ]);
    }

    /**
     * Get low stock alerts
     */
    public function getLowStockAlerts(): JsonResponse
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $query = BranchStock::with(['product', 'branch'])
            ->whereIn('status', ['Low Stock', 'Out of Stock']);

        // Staff can only see alerts for their branch
        if ($user->role->value === 'staff') {
            $query->where('branch_id', $user->branch_id);
        }

        $branchStockItems = $query->orderByRaw("FIELD(status, 'Out of Stock', 'Low Stock')")
            ->orderBy('stock_quantity', 'asc')
            ->get();

        // Transform to match frontend expectations
        $alerts = $branchStockItems->map(function ($item) {
            return [
                'id' => $item->id,
                'branch_id' => $item->branch_id,
                'product_name' => $item->product->name,
                'sku' => $item->product->sku,
                'quantity' => $item->stock_quantity,
                'available_quantity' => $item->available_quantity,
                'min_threshold' => $item->min_stock_threshold,
                'status' => strtolower(str_replace(' ', '_', $item->status)),
                'unit_price' => $item->price_override ?? $item->product->price,
                'branch' => [
                    'id' => $item->branch->id,
                    'name' => $item->branch->name,
                    'code' => $item->branch->code,
                ],
                'product' => [
                    'id' => $item->product->id,
                    'name' => $item->product->name,
                    'sku' => $item->product->sku,
                ]
            ];
        });

        return response()->json([
            'alerts' => $alerts,
            'count' => $alerts->count()
        ]);
    }

    /**
     * Send low stock alert to admin
     */
    public function sendLowStockAlert(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $validator = Validator::make($request->all(), [
            'branch_stock_id' => 'required|exists:branch_stock,id',
            'message' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $branchStock = BranchStock::with(['product', 'branch'])->find($request->branch_stock_id);

        // Staff can only send alerts for their branch
        if ($user->role->value === 'staff' && $user->branch_id !== $branchStock->branch_id) {
            return response()->json([
                'message' => 'Unauthorized. Staff can only send alerts for their own branch.'
            ], 403);
        }

        $message = $request->message ?: "Restock needed: {$branchStock->product->name} @ {$branchStock->branch->name}";

        // Send notification to all admin users
        $admins = \App\Models\User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'role' => 'admin',
                'title' => 'Low Stock Alert',
                'message' => $message,
                'type' => 'low_stock_alert',
                'data' => json_encode([
                    'branch_stock_id' => $branchStock->id,
                    'product_id' => $branchStock->product_id,
                    'branch_id' => $branchStock->branch_id,
                    'product_name' => $branchStock->product->name,
                    'quantity' => $branchStock->stock_quantity,
                    'available_quantity' => $branchStock->available_quantity,
                    'status' => $branchStock->status,
                ]),
            ]);
        }

        return response()->json([
            'message' => 'Low stock alert sent successfully',
            'alert' => [
                'branch_stock' => [
                    'id' => $branchStock->id,
                    'product_name' => $branchStock->product->name,
                    'branch_name' => $branchStock->branch->name,
                    'quantity' => $branchStock->stock_quantity,
                    'available_quantity' => $branchStock->available_quantity,
                    'status' => $branchStock->status,
                ],
                'message' => $message,
            ]
        ]);
    }

    /**
     * Check and send alerts when inventory status changes
     */
    private function checkAndSendAlerts(BranchStock $branchStock, int $oldQuantity): void
    {
        $availableQuantity = $branchStock->available_quantity;
        $minThreshold = $branchStock->min_stock_threshold ?? 5;
        
        // Only send alerts if status changed to low_stock or out_of_stock
        if ($availableQuantity <= $minThreshold && $oldQuantity > $minThreshold) {
            try {
                $message = "Restock needed: {$branchStock->product->name} @ {$branchStock->branch->name}";
                
                // Send notification to all admin users
                $admins = \App\Models\User::where('role', 'admin')->get();
                foreach ($admins as $admin) {
                    Notification::create([
                        'user_id' => $admin->id,
                        'role' => 'admin',
                        'title' => 'Low Stock Alert',
                        'message' => $message,
                        'type' => 'low_stock_alert',
                        'data' => json_encode([
                            'branch_stock_id' => $branchStock->id,
                            'product_id' => $branchStock->product_id,
                            'branch_id' => $branchStock->branch_id,
                            'product_name' => $branchStock->product->name,
                            'quantity' => $branchStock->stock_quantity,
                            'available_quantity' => $availableQuantity,
                            'status' => $branchStock->status,
                        ]),
                    ]);
                }
            } catch (\Exception $e) {
                \Log::warning('Failed to send low stock alert: ' . $e->getMessage());
            }
        }
    }

    /**
     * Calculate status based on quantity and threshold
     */
    private function calculateStatus($quantity, $minThreshold)
    {
        if ($quantity <= 0) {
            return 'Out of Stock';
        } elseif ($quantity <= $minThreshold) {
            return 'Low Stock';
        } else {
            return 'In Stock';
        }
    }

    /**
     * Notify all admins about inventory changes made by staff
     */
    private function notifyAdminsInventoryChange(string $action, string $productName, int $quantity, $branch, $user, ?int $oldQuantity = null): void
    {
        try {
            // Create notification message based on action
            $messages = [
                'added' => "Staff {$user->name} added new inventory item '{$productName}' ({$quantity} units) at {$branch->name}",
                'updated' => "Staff {$user->name} updated inventory for '{$productName}' at {$branch->name}" . 
                            ($oldQuantity !== null ? " (from {$oldQuantity} to {$quantity} units)" : ""),
                'deleted' => "Staff {$user->name} removed '{$productName}' from inventory at {$branch->name}",
            ];

            $message = $messages[$action] ?? "Inventory changed by staff";

            // Get all admin users
            $admins = \App\Models\User::where('role', 'admin')->get();
            
            foreach ($admins as $admin) {
                Notification::create([
                    'user_id' => $admin->id,
                    'role' => 'admin',
                    'title' => 'Staff Inventory Update',
                    'message' => $message,
                    'type' => 'inventory_update',
                    'data' => json_encode([
                        'action' => $action,
                        'product_name' => $productName,
                        'quantity' => $quantity,
                        'old_quantity' => $oldQuantity,
                        'branch_id' => $branch->id,
                        'branch_name' => $branch->name,
                        'staff_id' => $user->id,
                        'staff_name' => $user->name,
                        'timestamp' => now()->toDateTimeString(),
                    ]),
                ]);
            }
        } catch (\Exception $e) {
            \Log::warning('Failed to send inventory change notification: ' . $e->getMessage());
        }
    }
}