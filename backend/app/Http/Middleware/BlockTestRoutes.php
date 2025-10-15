<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class BlockTestRoutes
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only block test routes in production environment
        if (app()->environment('production')) {
            $path = $request->path();
            
            // List of test/debug route patterns to block
            $blockedPatterns = [
                'test-',
                'debug-',
                '/test',
                '/debug',
                'api/test-',
                'api/debug-',
            ];
            
            foreach ($blockedPatterns as $pattern) {
                if (str_contains($path, $pattern)) {
                    // Log the blocked attempt
                    \Log::warning('Blocked test route access in production', [
                        'path' => $path,
                        'ip' => $request->ip(),
                        'user_agent' => $request->userAgent(),
                    ]);
                    
                    abort(404);
                }
            }
        }
        
        return $next($request);
    }
}

