<?php

namespace App\Helpers;

use App\Models\RealtimeEvent;

class Realtime
{
    public static function emit(string $type, array $payload, ?int $branchId = null, ?int $userId = null): void
    {
        try {
            RealtimeEvent::create([
                'type' => $type,
                'payload' => $payload,
                'branch_id' => $branchId,
                'user_id' => $userId,
            ]);
        } catch (\Throwable $e) {
            // Fail silently; realtime is best-effort
        }
    }
}



