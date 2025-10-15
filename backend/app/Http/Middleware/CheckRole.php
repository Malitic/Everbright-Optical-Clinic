<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Enums\UserRole;

/**
 * Middleware to check if user has required role(s)
 * Protects endpoints from unauthorized access
 */
class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (!$request->user()) {
            return response()->json([
                'message' => 'Unauthenticated'
            ], 401);
        }

        $userRole = $request->user()->role->value ?? $request->user()->role;

        // Check if user has any of the allowed roles
        if (!in_array($userRole, $roles)) {
            \Log::warning('Unauthorized role access attempt', [
                'user_id' => $request->user()->id,
                'user_role' => $userRole,
                'required_roles' => $roles,
                'endpoint' => $request->path()
            ]);

            return response()->json([
                'message' => 'Unauthorized. Insufficient permissions.'
            ], 403);
        }

        return $next($request);
    }
}


