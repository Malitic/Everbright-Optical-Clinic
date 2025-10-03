<?php

namespace App\Http\Controllers;

use App\Models\RealtimeEvent;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RealtimeController extends Controller
{
    // Simple Server-Sent Events stream; clients can pass optional since_id to receive only new events
    public function stream(Request $request): StreamedResponse
    {
        $sinceId = (int) $request->query('since_id', 0);
        $branchId = $request->query('branch_id');
        // Support EventSource by accepting token in query (cannot set headers)
        $token = $request->query('token');
        $user = null;
        if ($token) {
            // Decode URL-encoded token and handle special characters
            $decodedToken = urldecode($token);
            // Handle pipe character that might be encoded as %7C
            $decodedToken = str_replace('%7C', '|', $decodedToken);
            $accessToken = PersonalAccessToken::findToken($decodedToken);
            if ($accessToken) {
                $user = $accessToken->tokenable;
            }
        } else {
            $user = $request->user();
        }

        $response = new StreamedResponse(function () use ($sinceId, $branchId, $user) {
            try {
                // Set execution time limit to prevent infinite loops
                set_time_limit(30);
                
                echo ":ok\n\n"; // comment to establish stream
                ob_flush(); flush();

                // Disable real-time streaming for performance
                echo "data: {\"message\": \"Real-time updates disabled for performance\"}\n\n";
                ob_flush(); flush();
                return; // Exit immediately
            } catch (\Exception $e) {
                // Log error and close stream gracefully
                error_log("Realtime stream fatal error: " . $e->getMessage());
                echo ":fatal_error\n\n";
                ob_flush(); flush();
            }
        });

        $response->headers->set('Content-Type', 'text/event-stream');
        $response->headers->set('Cache-Control', 'no-cache');
        $response->headers->set('X-Accel-Buffering', 'no');

        return $response;
    }
}



