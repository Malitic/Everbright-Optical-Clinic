<?php

namespace App\Http\Controllers;

use App\Models\RoleRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use App\Helpers\Realtime;

class RoleRequestController extends Controller
{
    public function store(Request $request)
    {
        $user = Auth::user();
        $validator = Validator::make($request->all(), [
            'requested_role' => 'required|in:staff,optometrist',
            'branch_id' => 'nullable|exists:branches,id',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if (($user->role->value ?? (string)$user->role) !== 'customer') {
            return response()->json(['message' => 'Only customers can request role upgrades'], 403);
        }

        $existing = RoleRequest::where('user_id', $user->id)->where('status', 'pending')->first();
        if ($existing) {
            return response()->json(['message' => 'You already have a pending request'], 400);
        }

        $roleRequest = RoleRequest::create([
            'user_id' => $user->id,
            'requested_role' => $request->requested_role,
            'branch_id' => $request->branch_id,
            'status' => 'pending',
        ]);

        return response()->json(['message' => 'Request submitted', 'data' => $roleRequest], 201);
    }

    public function index(Request $request)
    {
        $user = Auth::user();
        
        // Debug logging
        \Log::info('RoleRequestController::index called', [
            'user_id' => $user ? $user->id : null,
            'user_role' => $user && $user->role ? $user->role->value : null,
            'is_admin' => $user && $user->role && $user->role->value === 'admin'
        ]);
        
        if (!$user || !$user->role || $user->role->value !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $query = RoleRequest::with(['user:id,name,email,role', 'branch:id,name,address'])->orderBy('created_at', 'desc');
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        return response()->json(['data' => $query->get()]);
    }

    public function approve(RoleRequest $roleRequest)
    {
        $user = Auth::user();
        if (!$user || !$user->role || $user->role->value !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        if ($roleRequest->status !== 'pending') {
            return response()->json(['message' => 'Request already processed'], 400);
        }
        $target = $roleRequest->user;
        $target->role = $roleRequest->requested_role;
        $target->branch_id = $roleRequest->branch_id; // assign designated branch
        $target->is_approved = true;
        $target->save();

        $roleRequest->status = 'approved';
        $roleRequest->save();

        // Realtime notify
        Realtime::emit('role_request.approved', [
            'id' => $roleRequest->id,
            'user_id' => $target->id,
            'requested_role' => $roleRequest->requested_role,
            'status' => $roleRequest->status,
        ], null, $target->id);
        return response()->json(['message' => 'Request approved', 'data' => $roleRequest]);
    }

    public function reject(RoleRequest $roleRequest)
    {
        $user = Auth::user();
        if (!$user || !$user->role || $user->role->value !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        if ($roleRequest->status !== 'pending') {
            return response()->json(['message' => 'Request already processed'], 400);
        }
        $roleRequest->status = 'rejected';
        $roleRequest->save();
        // Realtime notify
        Realtime::emit('role_request.rejected', [
            'id' => $roleRequest->id,
            'user_id' => $roleRequest->user_id,
            'requested_role' => $roleRequest->requested_role,
            'status' => $roleRequest->status,
        ], null, $roleRequest->user_id);
        return response()->json(['message' => 'Request rejected', 'data' => $roleRequest]);
    }

    public function checkStatus($email)
    {
        $user = \App\Models\User::where('email', $email)->first();
        
        if (!$user) {
            return response()->json(['status' => 'none', 'message' => 'User not found'], 404);
        }

        $roleRequest = RoleRequest::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$roleRequest) {
            return response()->json(['status' => 'none', 'message' => 'No role request found']);
        }

        return response()->json([
            'status' => $roleRequest->status,
            'requested_role' => $roleRequest->requested_role,
            'created_at' => $roleRequest->created_at,
            'message' => $roleRequest->status === 'pending' ? 'Request is pending approval' :
                        ($roleRequest->status === 'approved' ? 'Request has been approved' :
                        'Request has been rejected')
        ]);
    }
}



