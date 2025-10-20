<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\ConfirmationToken;
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

        // Issue token for all users since role requests are removed
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'User registered successfully',
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
        // Debug logging
        \Log::info('Login attempt', [
            'email' => $request->email,
            'has_password' => !empty($request->password),
            'role' => $request->role,
            'all_data' => $request->all()
        ]);

        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'password' => 'required|string',
            'role' => ['required', 'string', new Enum(\App\Enums\UserRole::class)],
        ]);

        if ($validator->fails()) {
            \Log::warning('Login validation failed', ['errors' => $validator->errors()]);
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            \Log::warning('Login failed: User not found', ['email' => $request->email]);
            return response()->json([
                'message' => 'Invalid credentials'
            ], 401);
        }

        // Verify password
        if (!Hash::check($request->password, $user->password)) {
            \Log::warning('Login failed: Invalid password', ['email' => $request->email]);
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

        // Delete old tokens for this user (security: one active session)
        $user->tokens()->delete();

        // Create new token with expiration
        $expirationMinutes = env('SANCTUM_TOKEN_EXPIRATION', 1440); // 24 hours default
        $expiresAt = now()->addMinutes($expirationMinutes);
        $token = $user->createToken('auth_token', ['*'], $expiresAt)->plainTextToken;

        // Log successful login
        if (env('ENABLE_AUDIT_LOGGING', true)) {
            \App\Models\AuditLog::create([
                'auditable_type' => User::class,
                'auditable_id' => $user->id,
                'event' => 'login',
                'user_id' => $user->id,
                'user_role' => $user->role->value,
                'user_email' => $user->email,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'description' => "{$user->name} logged in successfully as {$user->role->value}",
            ]);
        }

        return response()->json([
            'message' => 'Login successful',
            'token' => $token,
            'token_expires_at' => $expiresAt->toDateTimeString(),
            'token_expires_in_minutes' => $expirationMinutes,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role->value,
                'branch' => $user->branch ? [
                    'id' => $user->branch->id,
                    'name' => $user->branch->name,
                    'address' => $user->branch->address
                ] : null
            ]
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
            'role' => ($user->role->value ?? (string) $user->role),
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
        try {
            $user = $request->user();

            if (($user->role->value ?? (string)$user->role) !== 'admin') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Get users with branch relationship
            $users = User::with('branch')
                        ->select('id', 'name', 'email', 'role', 'branch_id', 'is_approved', 'created_at', 'updated_at')
                        ->orderBy('created_at', 'desc')
                        ->get()
                        ->map(function ($user) {
                            return [
                                'id' => $user->id,
                                'name' => $user->name,
                                'email' => $user->email,
                                'role' => $user->role,
                                'branch' => $user->branch ? [
                                    'id' => $user->branch->id,
                                    'name' => $user->branch->name,
                                    'address' => $user->branch->address
                                ] : null,
                                'is_approved' => $user->is_approved,
                                'created_at' => $user->created_at,
                                'updated_at' => $user->updated_at,
                            ];
                        });

            return response()->json([
                'data' => $users,
                'count' => $users->count()
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Error in getAllUsers: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'error' => 'Internal server error',
                'message' => $e->getMessage()
            ], 500);
        }
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

        // Check if target account is protected - require confirmation token
        if ($targetUser->is_protected && env('ENABLE_PROTECTED_ACCOUNTS', true)) {
            $confirmationToken = $request->input('confirmation_token');
            
            if (!$confirmationToken) {
                // First attempt - generate confirmation token
                $token = ConfirmationToken::generate(
                    'update_protected_user',
                    $user->id,
                    $targetUser->id,
                    User::class,
                    $request->all(),
                    5 // 5 minutes expiry
                );
                
                // Log the request for confirmation
                \App\Models\AuditLog::create([
                    'auditable_type' => User::class,
                    'auditable_id' => $targetUser->id,
                    'event' => 'modification_requested',
                    'user_id' => $user->id,
                    'user_role' => $user->role->value,
                    'user_email' => $user->email,
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'description' => "CONFIRMATION REQUIRED: {$user->name} requested to modify protected account: {$targetUser->email}",
                ]);
                
                return response()->json([
                    'message' => 'This is a protected account. Confirmation required.',
                    'protected_user' => $targetUser->email,
                    'warning' => '⚠️ You are about to modify a PROTECTED account',
                    'confirmation_required' => true,
                    'confirmation_token' => $token->token,
                    'expires_in_minutes' => 5,
                    'instructions' => 'To proceed, send the same request again with this confirmation_token in the request body within 5 minutes.'
                ], 202); // 202 Accepted - Confirmation required
            }
            
            // Second attempt - verify confirmation token
            $verified = ConfirmationToken::verify($confirmationToken, 'update_protected_user', $user->id);
            
            if (!$verified || $verified->target_id !== $targetUser->id) {
                return response()->json([
                    'message' => 'Invalid or expired confirmation token',
                    'error' => 'Token verification failed. Please request a new confirmation token.'
                ], 400);
            }
            
            // Token verified - proceed with modification
            \App\Models\AuditLog::create([
                'auditable_type' => User::class,
                'auditable_id' => $targetUser->id,
                'event' => 'protected_modification_confirmed',
                'user_id' => $user->id,
                'user_role' => $user->role->value,
                'user_email' => $user->email,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'description' => "CONFIRMED: {$user->name} confirmed modification of protected account: {$targetUser->email}",
            ]);
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
    public function deleteUser(Request $request, $id)
    {
        $user = $request->user();
        
        // Find the user manually to debug route model binding issue
        $targetUser = User::find($id);
        
        if (!$targetUser) {
            \Log::warning('User not found for deletion', [
                'user_id' => $id,
                'admin_id' => $user?->id,
                'admin_role' => $user?->role?->value
            ]);
            return response()->json(['message' => 'User not found'], 404);
        }

        if (($user->role->value ?? (string)$user->role) !== 'admin') {
            \Log::warning('User deletion unauthorized', [
                'target_user_id' => $targetUser->id,
                'admin_id' => $user?->id,
                'admin_role' => $user?->role?->value
            ]);
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check if target account is protected - require confirmation token
        if ($targetUser->is_protected && env('ENABLE_PROTECTED_ACCOUNTS', true)) {
            $confirmationToken = $request->input('confirmation_token');
            
            if (!$confirmationToken) {
                // First attempt - generate confirmation token
                $token = ConfirmationToken::generate(
                    'delete_protected_user',
                    $user->id,
                    $targetUser->id,
                    User::class,
                    ['user_name' => $targetUser->name, 'user_email' => $targetUser->email],
                    5 // 5 minutes expiry
                );
                
                // Log the deletion request
                \App\Models\AuditLog::create([
                    'auditable_type' => User::class,
                    'auditable_id' => $targetUser->id,
                    'event' => 'deletion_requested',
                    'user_id' => $user->id,
                    'user_role' => $user->role->value,
                    'user_email' => $user->email,
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'description' => "CONFIRMATION REQUIRED: {$user->name} requested to delete protected account: {$targetUser->email}",
                ]);
                
                return response()->json([
                    'message' => 'This is a protected account. Confirmation required.',
                    'protected_user' => [
                        'name' => $targetUser->name,
                        'email' => $targetUser->email,
                        'id' => $targetUser->id,
                    ],
                    'warning' => '🚨 DANGER: You are about to DELETE a PROTECTED account!',
                    'data_affected' => [
                        'transactions' => $targetUser->transactions()->count(),
                        'reservations' => \App\Models\Reservation::where('user_id', $targetUser->id)->count(),
                    ],
                    'confirmation_required' => true,
                    'confirmation_token' => $token->token,
                    'expires_in_minutes' => 5,
                    'instructions' => 'To proceed with deletion, send DELETE request again with this confirmation_token in the request body within 5 minutes.'
                ], 202); // 202 Accepted - Confirmation required
            }
            
            // Second attempt - verify confirmation token
            $verified = ConfirmationToken::verify($confirmationToken, 'delete_protected_user', $user->id);
            
            if (!$verified || $verified->target_id !== $targetUser->id) {
                return response()->json([
                    'message' => 'Invalid or expired confirmation token',
                    'error' => 'Token verification failed. Please request a new confirmation token.'
                ], 400);
            }
            
            // Token verified - proceed with deletion
            \App\Models\AuditLog::create([
                'auditable_type' => User::class,
                'auditable_id' => $targetUser->id,
                'event' => 'protected_deletion_confirmed',
                'user_id' => $user->id,
                'user_role' => $user->role->value,
                'user_email' => $user->email,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'description' => "CONFIRMED: {$user->name} confirmed deletion of protected account: {$targetUser->email}",
            ]);
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

    /**
     * Get user by ID (Admin only)
     */
    public function getUserById(Request $request, $id)
    {
        $user = $request->user();

        if (($user->role->value ?? (string)$user->role) !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $targetUser = User::with('branch')->find($id);

        if (!$targetUser) {
            return response()->json(['message' => 'User not found'], 404);
        }

        return response()->json([
            'data' => [
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
                'is_protected' => $targetUser->is_protected,
                'created_at' => $targetUser->created_at,
                'updated_at' => $targetUser->updated_at,
            ]
        ], 200);
    }

    /**
     * Reject a user (Admin only)
     */
    public function rejectUser(Request $request, $id)
    {
        $user = $request->user();

        if (($user->role->value ?? (string)$user->role) !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $targetUser = User::find($id);

        if (!$targetUser) {
            return response()->json(['message' => 'User not found'], 404);
        }

        // Prevent self-rejection
        if ($targetUser->id === $user->id) {
            return response()->json(['message' => 'Cannot reject your own account'], 400);
        }

        // Prevent rejection of protected accounts without confirmation
        if ($targetUser->is_protected && env('ENABLE_PROTECTED_ACCOUNTS', true)) {
            $confirmationToken = $request->input('confirmation_token');
            
            if (!$confirmationToken) {
                // First attempt - generate confirmation token
                $token = ConfirmationToken::generate(
                    'reject_protected_user',
                    $user->id,
                    $targetUser->id,
                    User::class,
                    $request->all(),
                    5 // 5 minutes expiry
                );
                
                return response()->json([
                    'message' => 'Protected account - confirmation required',
                    'confirmation_token' => $token->token,
                    'expires_at' => $token->expires_at,
                    'confirmation_url' => route('admin.users.reject.confirm', ['token' => $token->token])
                ], 202);
            }

            // Verify confirmation token
            if (!ConfirmationToken::verify($confirmationToken, 'reject_protected_user', $user->id, $targetUser->id)) {
                return response()->json(['message' => 'Invalid or expired confirmation token'], 400);
            }

            // Clear the token after successful use
            ConfirmationToken::clear($confirmationToken);
        }

        // Update user status
        $targetUser->update([
            'is_approved' => false,
            'rejected_at' => now(),
            'rejected_by' => $user->id,
        ]);

        // Log the action
        \App\Models\AuditLog::create([
            'auditable_type' => User::class,
            'auditable_id' => $targetUser->id,
            'event' => 'rejected',
            'user_id' => $user->id,
            'old_values' => ['is_approved' => true],
            'new_values' => ['is_approved' => false, 'rejected_at' => now(), 'rejected_by' => $user->id],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'message' => 'User rejected successfully'
        ], 200);
    }

    /**
     * Approve a user (Admin only)
     */
    public function approveUser(Request $request, $id)
    {
        $user = $request->user();

        if (($user->role->value ?? (string)$user->role) !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $targetUser = User::find($id);

        if (!$targetUser) {
            return response()->json(['message' => 'User not found'], 404);
        }

        // Prevent self-approval (though this shouldn't be necessary for admins)
        if ($targetUser->id === $user->id) {
            return response()->json(['message' => 'Cannot approve your own account'], 400);
        }

        // Update user status
        $targetUser->update([
            'is_approved' => true,
        ]);

        // Log the action
        if (env('ENABLE_AUDIT_LOGGING', true)) {
            \App\Models\AuditLog::create([
                'auditable_type' => User::class,
                'auditable_id' => $targetUser->id,
                'event' => 'approved',
                'user_id' => $user->id,
                'user_role' => $user->role->value,
                'user_email' => $user->email,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'description' => "{$user->name} approved user: {$targetUser->email}",
                'old_values' => ['is_approved' => false],
                'new_values' => ['is_approved' => true],
            ]);
        }

        return response()->json([
            'message' => 'User approved successfully',
            'user' => [
                'id' => $targetUser->id,
                'name' => $targetUser->name,
                'email' => $targetUser->email,
                'role' => $targetUser->role,
                'is_approved' => $targetUser->is_approved,
            ]
        ], 200);
    }
}
