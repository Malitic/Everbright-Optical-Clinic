<?php

namespace App\Http\Controllers;

use App\Models\Manufacturer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class ManufacturerController extends Controller
{
    /**
     * Get all manufacturers (Admin only)
     */
    public function index(): JsonResponse
    {
        $user = Auth::user();

        if (!$user || !in_array($user->role->value, ['admin', 'staff'])) {
            return response()->json([
                'message' => 'Unauthorized. Only Admin and Staff can view manufacturers.'
            ], 403);
        }

        $manufacturers = Manufacturer::active()
            ->orderBy('name')
            ->get();

        return response()->json([
            'manufacturers' => $manufacturers,
            'count' => $manufacturers->count()
        ]);
    }

    /**
     * Get manufacturer directory with contact information
     */
    public function getDirectory(): JsonResponse
    {
        $user = Auth::user();

        if (!$user || $user->role->value !== 'admin') {
            return response()->json([
                'message' => 'Unauthorized. Only Admin can view manufacturer directory.'
            ], 403);
        }

        $manufacturers = Manufacturer::active()
            ->select('id', 'name', 'contact_person', 'phone', 'email', 'product_line', 'address', 'website')
            ->orderBy('product_line')
            ->orderBy('name')
            ->get();

        // Group by product line for better organization
        $groupedManufacturers = $manufacturers->groupBy('product_line');

        return response()->json([
            'manufacturers' => $manufacturers,
            'grouped_by_product_line' => $groupedManufacturers,
            'product_lines' => $groupedManufacturers->keys(),
            'count' => $manufacturers->count()
        ]);
    }

    /**
     * Store a newly created manufacturer (Admin only)
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!$user || $user->role->value !== 'admin') {
            return response()->json([
                'message' => 'Unauthorized. Only Admin can create manufacturers.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'contact_person' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'required|email|max:255',
            'product_line' => 'required|string|max:255',
            'address' => 'nullable|string',
            'website' => 'nullable|url|max:255',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $manufacturer = Manufacturer::create($request->all());

        return response()->json([
            'message' => 'Manufacturer created successfully',
            'manufacturer' => $manufacturer
        ], 201);
    }

    /**
     * Display the specified manufacturer (Admin only)
     */
    public function show(Manufacturer $manufacturer): JsonResponse
    {
        $user = Auth::user();

        if (!$user || $user->role->value !== 'admin') {
            return response()->json([
                'message' => 'Unauthorized. Only Admin can view manufacturer details.'
            ], 403);
        }

        $manufacturer->load('inventories.branch');

        return response()->json([
            'manufacturer' => $manufacturer,
            'inventory_count' => $manufacturer->inventories->count(),
            'branches_with_products' => $manufacturer->inventories->pluck('branch.name')->unique()->values()
        ]);
    }

    /**
     * Update the specified manufacturer (Admin only)
     */
    public function update(Request $request, Manufacturer $manufacturer): JsonResponse
    {
        $user = Auth::user();

        if (!$user || $user->role->value !== 'admin') {
            return response()->json([
                'message' => 'Unauthorized. Only Admin can update manufacturers.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'contact_person' => 'sometimes|required|string|max:255',
            'phone' => 'sometimes|required|string|max:20',
            'email' => 'sometimes|required|email|max:255',
            'product_line' => 'sometimes|required|string|max:255',
            'address' => 'nullable|string',
            'website' => 'nullable|url|max:255',
            'notes' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $manufacturer->update($request->all());

        return response()->json([
            'message' => 'Manufacturer updated successfully',
            'manufacturer' => $manufacturer
        ]);
    }

    /**
     * Remove the specified manufacturer (Admin only)
     */
    public function destroy(Manufacturer $manufacturer): JsonResponse
    {
        $user = Auth::user();

        if (!$user || $user->role->value !== 'admin') {
            return response()->json([
                'message' => 'Unauthorized. Only Admin can delete manufacturers.'
            ], 403);
        }

        // Check if manufacturer has associated inventories
        if ($manufacturer->inventories()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete manufacturer with associated inventory items. Please reassign or remove inventory items first.'
            ], 400);
        }

        $manufacturer->delete();

        return response()->json([
            'message' => 'Manufacturer deleted successfully'
        ]);
    }

    /**
     * Get manufacturers by product line
     */
    public function getByProductLine(string $productLine): JsonResponse
    {
        $user = Auth::user();

        if (!$user || !in_array($user->role->value, ['admin', 'staff'])) {
            return response()->json([
                'message' => 'Unauthorized. Only Admin and Staff can view manufacturers.'
            ], 403);
        }

        $manufacturers = Manufacturer::active()
            ->byProductLine($productLine)
            ->orderBy('name')
            ->get();

        return response()->json([
            'product_line' => $productLine,
            'manufacturers' => $manufacturers,
            'count' => $manufacturers->count()
        ]);
    }
}
