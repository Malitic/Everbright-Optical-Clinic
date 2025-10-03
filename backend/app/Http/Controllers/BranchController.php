<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class BranchController extends Controller
{
    /**
     * Get all branches (Admin only)
     */
    public function index(): JsonResponse
    {
        $user = Auth::user();

        // Only admin can view all branches
        if (!$user || $user->role->value !== 'admin') {
            return response()->json([
                'message' => 'Unauthorized. Only Admin can view branches.'
            ], 403);
        }

        $branches = Branch::with(['users', 'stock.product'])->get();

        return response()->json([
            'branches' => $branches,
            'total_count' => $branches->count()
        ]);
    }

    /**
     * Create a new branch (Admin only)
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();

        // Only admin can create branches
        if (!$user || $user->role->value !== 'admin') {
            return response()->json([
                'message' => 'Unauthorized. Only Admin can create branches.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:10|unique:branches,code',
            'address' => 'required|string|max:500',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $branch = Branch::create($request->all());

        return response()->json([
            'message' => 'Branch created successfully',
            'branch' => $branch
        ], 201);
    }

    /**
     * Update a branch (Admin only)
     */
    public function update(Request $request, Branch $branch): JsonResponse
    {
        $user = Auth::user();

        // Only admin can update branches
        if (!$user || $user->role->value !== 'admin') {
            return response()->json([
                'message' => 'Unauthorized. Only Admin can update branches.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'code' => 'sometimes|required|string|max:10|unique:branches,code,' . $branch->id,
            'address' => 'sometimes|required|string|max:500',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $branch->update($request->all());

        return response()->json([
            'message' => 'Branch updated successfully',
            'branch' => $branch
        ]);
    }

    /**
     * Get branch details with stock summary
     */
    public function show(Branch $branch): JsonResponse
    {
        $user = Auth::user();

        // Admin can view any branch, staff can only view their own branch
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        if ($user->role->value === 'staff' && $user->branch_id !== $branch->id) {
            return response()->json([
                'message' => 'Unauthorized. Staff can only view their own branch.'
            ], 403);
        }

        $branch->load(['users', 'stock.product', 'reservations.product']);

        return response()->json([
            'branch' => $branch,
            'stock_summary' => [
                'total_products' => $branch->stock()->count(),
                'in_stock' => $branch->stock()->inStock()->count(),
                'low_stock' => $branch->stock()->lowStock()->count(),
                'out_of_stock' => $branch->stock()->whereRaw('stock_quantity <= reserved_quantity')->count(),
            ]
        ]);
    }

    /**
     * Get active branches for customer view
     */
    public function getActiveBranches(): JsonResponse
    {
        $branches = Branch::active()->select('id', 'name', 'code', 'address', 'phone')->get();

        return response()->json($branches);
    }

    /**
     * Remove the specified branch from storage (Admin only)
     */
    public function destroy(Branch $branch): JsonResponse
    {
        $user = Auth::user();

        // Only admin can delete branches
        if (!$user || $user->role->value !== 'admin') {
            return response()->json([
                'message' => 'Unauthorized. Only Admin can delete branches.'
            ], 403);
        }

        // Check if branch has associated users
        if ($branch->users()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete branch. It has associated users. Please reassign users first.'
            ], 422);
        }

        // Check if branch has associated stock
        if ($branch->stock()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete branch. It has associated stock records. Please clear stock first.'
            ], 422);
        }

        // Check if branch has associated reservations
        if ($branch->reservations()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete branch. It has associated reservations. Please handle reservations first.'
            ], 422);
        }

        // Check if branch has associated appointments
        if ($branch->appointments()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete branch. It has associated appointments. Please handle appointments first.'
            ], 422);
        }

        $branch->delete();

        return response()->json([
            'message' => 'Branch deleted successfully'
        ]);
    }
}
