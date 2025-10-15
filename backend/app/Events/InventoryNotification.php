<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Models\Product;
use App\Models\Branch;

class InventoryNotification implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $type;
    public $message;
    public $product;
    public $branch;
    public $stockLevel;
    public $threshold;
    public $recipients;

    /**
     * Create a new event instance.
     */
    public function __construct(
        string $type,
        string $message,
        Product $product,
        Branch $branch,
        int $stockLevel,
        int $threshold,
        array $recipients = []
    ) {
        $this->type = $type;
        $this->message = $message;
        $this->product = $product;
        $this->branch = $branch;
        $this->stockLevel = $stockLevel;
        $this->threshold = $threshold;
        $this->recipients = $recipients;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        $channels = [
            new Channel('inventory'),
            new Channel('notifications')
        ];

        // Add private channels for specific users
        foreach ($this->recipients as $userId) {
            $channels[] = new PrivateChannel('user.' . $userId);
        }

        // Add branch-specific channel
        $channels[] = new Channel('branch.' . $this->branch->id);

        return $channels;
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'type' => $this->type,
            'message' => $this->message,
            'product' => [
                'id' => $this->product->id,
                'name' => $this->product->name,
                'sku' => $this->product->sku,
                'image' => $this->product->primary_image,
            ],
            'branch' => [
                'id' => $this->branch->id,
                'name' => $this->branch->name,
                'address' => $this->branch->address,
            ],
            'stock' => [
                'current_level' => $this->stockLevel,
                'threshold' => $this->threshold,
                'status' => $this->stockLevel <= $this->threshold ? 'low' : 'normal',
            ],
            'timestamp' => now()->toISOString(),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'inventory.' . $this->type;
    }
}
