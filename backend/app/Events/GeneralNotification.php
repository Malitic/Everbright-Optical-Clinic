<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Models\User;

class GeneralNotification implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $title;
    public $message;
    public $type;
    public $recipients;
    public $data;

    /**
     * Create a new event instance.
     */
    public function __construct(
        string $title,
        string $message,
        string $type = 'general',
        array $recipients = [],
        array $data = []
    ) {
        $this->title = $title;
        $this->message = $message;
        $this->type = $type;
        $this->recipients = $recipients;
        $this->data = $data;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        $channels = [
            new Channel('notifications')
        ];

        // Add private channels for specific users
        foreach ($this->recipients as $userId) {
            $channels[] = new PrivateChannel('user.' . $userId);
        }

        return $channels;
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'title' => $this->title,
            'message' => $this->message,
            'type' => $this->type,
            'data' => $this->data,
            'timestamp' => now()->toISOString(),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'notification.' . $this->type;
    }
}
