<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class HandleCors
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Handle preflight requests
        if ($request->isMethod('OPTIONS')) {
            return response('', 200)
                ->header('Access-Control-Allow-Origin', $this->getAllowedOrigin($request))
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin')
                ->header('Access-Control-Allow-Credentials', 'true')
                ->header('Access-Control-Max-Age', '86400');
        }

        $response = $next($request);

        // Add CORS headers to the response
        $response->headers->set('Access-Control-Allow-Origin', $this->getAllowedOrigin($request));
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
        $response->headers->set('Access-Control-Allow-Credentials', 'true');

        return $response;
    }

    /**
     * Get the allowed origin for the request
     */
    private function getAllowedOrigin(Request $request): string
    {
        $allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:5173',
            'http://localhost:8080',
            'http://localhost:8081',
            'http://localhost:8082',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:8080',
            'http://127.0.0.1:8081',
            'http://127.0.0.1:8082',
            'http://192.168.56.1:3000',
            'http://192.168.56.1:5173',
            'http://192.168.56.1:8080',
            'http://192.168.56.1:8081',
            'http://192.168.56.1:8082',
            'http://192.168.100.6:3000',
            'http://192.168.100.6:5173',
            'http://192.168.100.6:8080',
            'http://192.168.100.6:8081',
            'http://192.168.100.6:8082',
            'http://10.173.7.92:3000',
            'http://10.173.7.92:5173',
            'http://10.173.7.92:8080',
            'http://10.173.7.92:8081',
            'http://10.173.7.92:8082',
        ];

        $origin = $request->headers->get('Origin');
        
        if (in_array($origin, $allowedOrigins)) {
            return $origin;
        }

        // Default to the first allowed origin if no match
        return $allowedOrigins[0];
    }
}
