<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Enum;
use Laravel\Sanctum\HasApiTokens;
use App\Helpers\Realtime;
use App\Http\Controllers\NotificationController;

class AuthController extends Controller
{
    /**
     * Register a new user
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'password_confirmation' => 'nullable|string|same:password',
            // Allow user to choose desired role; actual account starts as customer
            'role' => ['required', 'string', new Enum(\App\Enums\UserRole::class)],
            'branch_id' => 'nullable|exists:branches,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check for existing staff per branch if role is staff
        if ($request->role === \App\Enums\UserRole::STAFF->value) {
            if (!$request->branch_id) {
                return response()->json([
                    'message' => 'Branch selection is required for staff registration',
                    'errors' => ['branch_id' => ['Branch selection is required for staff registration']]
                ], 422);
            }

            // Check if there's already a staff member for this branch
            $existingStaff = User::where('role', \App\Enums\UserRole::STAFF->value)
                ->where('branch_id', $request->branch_id)
                ->where('is_approved', true)
                ->first();

            if ($existingStaff) {
                return response()->json([
                    'message' => 'This branch already has a staff account.',
                    'errors' => ['branch_id' => ['This branch already has a staff account.']]
                ], 422);
            }
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            // Always start as customer; admin can approve requested role
            'role' => \App\Enums\UserRole::CUSTOMER->value,
            'is_approved' => $request->role === \App\Enums\UserRole::CUSTOMER->value,
        ]);

        // Create notification for user signup
        NotificationController::createUserSignupNotification($user);

        // If requested role is not customer, create a pending role request for admin approval
        if ($request->role !== \App\Enums\UserRole::CUSTOMER->value) {
            $roleRequest = \App\Models\RoleRequest::create([
                'user_id' => $user->id,
                'requested_role' => $request->role,
                'branch_id' => $request->branch_id,
                'status' => 'pending',
            ]);

            // Emit realtime event for admins
            Realtime::emit('role_request.created', [
                'id' => $roleRequest->id,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ],
                'requested_role' => $roleRequest->requested_role,
                'status' => $roleRequest->status,
            ]);
        }

        // Only issue token immediately for auto-approved users (customers)
        $token = $user->is_approved ? $user->createToken('auth_token')->plainTextToken : null;

        return response()->json([
            'message' => $request->role !== \App\Enums\UserRole::CUSTOMER->value
                ? 'Registration successful. Role upgrade pending admin approval.'
                : 'User registered successfully',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'token' => $token
        ], 201);
    }

    /**
     * Login user
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'password' => 'required|string',
            'role' => ['required', 'string', new Enum(\App\Enums\UserRole::class)],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'message' => 'Invalid credentials'
            ], 401);
        }

        // Verify password
        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials'
            ], 401);
        }

        if (!$user->is_approved) {
            return response()->json([
                'message' => 'Account pending admin approval'
            ], 403);
        }

        // Ensure the requested role matches the user's actual role
        $userRoleValue = $user->role->value ?? (string)$user->role;
        if ($request->role !== $userRoleValue) {
            return response()->json([
                'message' => 'Role mismatch for this account'
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'branch' => $user->branch ? [
                    'id' => $user->branch->id,
                    'name' => $user->branch->name,
                    'address' => $user->branch->address
                ] : null
            ],
            'token' => $token
        ], 200);
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully'
        ], 200);
    }

    /**
     * Get user profile (name and email only)
     */
    public function profile(Request $request)
    {
        $user = $request->user();
        
        return response()->json([
            'name' => $user->name,
            'email' => $user->email,
            'branch' => $user->branch ? [
                'id' => $user->branch->id,
                'name' => $user->branch->name,
                'address' => $user->branch->address
            ] : null
        ], 200);
    }

    /**
     * Get users by role
     */
    public function getUsersByRole(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'role' => ['required', 'string', new Enum(\App\Enums\UserRole::class)],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $users = User::where('role', $request->role)
                    ->select('id', 'name', 'email', 'role')
                    ->get();

        return response()->json([
            'data' => $users
        ], 200);
    }

    /**
     * Get all users (Admin only)
     */
    public function getAllUsers(Request $request)
    {
        $user = $request->user();

        if (($user->role->value ?? (string)$user->role) !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $users = User::select('id', 'name', 'email', 'role', 'created_at', 'updated_at')
                    ->orderBy('created_at', 'desc')
                    ->get();

        return response()->json([
            'data' => $users
        ], 200);
    }

    /**
     * Create a new user (Admin only)
     */
    public function createUser(Request $request)
    {
        $user = $request->user();

        if (($user->role->value ?? (string)$user->role) !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'password_confirmation' => 'required|string|same:password',
            'role' => ['required', 'string', new Enum(\App\Enums\UserRole::class)],
            'branch_id' => 'nullable|exists:branches,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $newUser = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'branch_id' => $request->branch_id,
            'is_approved' => true, // Admin-created users are automatically approved
            'email_verified_at' => now(), // Admin-created users are email verified
        ]);

        return response()->json([
            'message' => 'User created successfully',
            'user' => [
                'id' => $newUser->id,
                'name' => $newUser->name,
                'email' => $newUser->email,
                'role' => $newUser->role,
                'branch' => $newUser->branch ? [
                    'id' => $newUser->branch->id,
                    'name' => $newUser->branch->name,
                    'address' => $newUser->branch->address
                ] : null,
                'is_approved' => $newUser->is_approved,
                'created_at' => $newUser->created_at,
            ]
        ], 201);
    }

    /**
     * Update a user (Admin only)
     */
    public function updateUser(Request $request, User $targetUser)
    {
        $user = $request->user();

        if (($user->role->value ?? (string)$user->role) !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $targetUser->id,
            'password' => 'sometimes|required|string|min:8',
            'role' => ['sometimes', 'required', 'string', new Enum(\App\Enums\UserRole::class)],
            'branch_id' => 'sometimes|nullable|exists:branches,id',
            'is_approved' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $validator->validated();

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        $targetUser->update($data);

        return response()->json([
            'message' => 'User updated successfully',
            'user' => [
                'id' => $targetUser->id,
                'name' => $targetUser->name,
                'email' => $targetUser->email,
                'role' => $targetUser->role,
                'branch' => $targetUser->branch ? [
                    'id' => $targetUser->branch->id,
                    'name' => $targetUser->branch->name,
                    'address' => $targetUser->branch->address
                ] : null,
                'is_approved' => $targetUser->is_approved,
                'updated_at' => $targetUser->updated_at,
            ]
        ], 200);
    }

    /**
     * Delete a user (Admin only)
     */
    public function deleteUser(Request $request, User $targetUser)
    {
        $user = $request->user();

        if (($user->role->value ?? (string)$user->role) !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Prevent admin from deleting themselves
        if ($targetUser->id === $user->id) {
            return response()->json(['message' => 'Cannot delete your own account'], 400);
        }

        $targetUser->delete();

        return response()->json([
            'message' => 'User deleted successfully'
        ], 200);
    }
}
