<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ConfirmationToken extends Model
{
    protected $fillable = [
        'token',
        'action',
        'user_id',
        'target_id',
        'target_type',
        'action_data',
        'expires_at',
        'used',
    ];

    protected $casts = [
        'action_data' => 'array',
        'expires_at' => 'datetime',
        'used' => 'boolean',
    ];

    /**
     * Generate a new confirmation token
     */
    public static function generate(
        string $action,
        int $userId,
        int $targetId,
        string $targetType,
        ?array $actionData = null,
        int $expiresInMinutes = 5
    ): self {
        // Clean up old expired tokens
        self::where('expires_at', '<', now())->delete();
        self::where('used', true)->where('created_at', '<', now()->subHours(24))->delete();
        
        return self::create([
            'token' => Str::random(64),
            'action' => $action,
            'user_id' => $userId,
            'target_id' => $targetId,
            'target_type' => $targetType,
            'action_data' => $actionData,
            'expires_at' => now()->addMinutes($expiresInMinutes),
            'used' => false,
        ]);
    }

    /**
     * Verify and consume a token
     */
    public static function verify(string $token, string $action, int $userId): ?self
    {
        $confirmationToken = self::where('token', $token)
            ->where('action', $action)
            ->where('user_id', $userId)
            ->where('used', false)
            ->where('expires_at', '>', now())
            ->first();

        if ($confirmationToken) {
            $confirmationToken->update(['used' => true]);
        }

        return $confirmationToken;
    }

    /**
     * Check if token is valid
     */
    public function isValid(): bool
    {
        return !$this->used && $this->expires_at->isFuture();
    }

    /**
     * Get the user who created this token
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}

