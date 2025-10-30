<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CorsHeaders
{
	public function handle(Request $request, Closure $next)
	{
		$allowedOrigins = [
			'http://localhost:5173',
			'http://127.0.0.1:5173',
		];

		$origin = $request->headers->get('Origin');
		// Build the response (handle preflight)
		$response = $request->getMethod() === 'OPTIONS'
			? response('', 204)
			: $next($request);

		// If the origin is explicitly allowed, echo it back and allow credentials.
		// Browsers reject Access-Control-Allow-Credentials: true when Access-Control-Allow-Origin is '*'.
		if ($origin && in_array($origin, $allowedOrigins, true)) {
			$response->headers->set('Access-Control-Allow-Origin', $origin);
			$response->headers->set('Access-Control-Allow-Credentials', 'true');
		} else {
			// Not an allowed origin; do not send credentials with wildcard origin.
			$response->headers->set('Access-Control-Allow-Origin', '*');
			$response->headers->set('Access-Control-Allow-Credentials', 'false');
		}

		$response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
		$response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token');

		return $response;
	}
}


