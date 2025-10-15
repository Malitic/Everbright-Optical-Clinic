<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Models\Appointment;
use App\Models\User;

class AppointmentNotification implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $appointment;
    public $type;
    public $message;
    public $recipients;

    /**
     * Create a new event instance.
     */
    public function __construct(Appointment $appointment, string $type, string $message, array $recipients = [])
    {
        $this->appointment = $appointment;
        $this->type = $type;
        $this->message = $message;
        $this->recipients = $recipients;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        $channels = [
            new Channel('appointments'),
            new Channel('notifications')
        ];

        // Add private channels for specific users
        foreach ($this->recipients as $userId) {
            $channels[] = new PrivateChannel('user.' . $userId);
        }

        // Add branch-specific channel if appointment has a branch
        if ($this->appointment->branch_id) {
            $channels[] = new Channel('branch.' . $this->appointment->branch_id);
        }

        return $channels;
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->appointment->id,
            'type' => $this->type,
            'message' => $this->message,
            'appointment' => [
                'id' => $this->appointment->id,
                'date' => $this->appointment->appointment_date,
                'time' => $this->appointment->start_time,
                'status' => $this->appointment->status,
                'patient' => $this->appointment->patient ? [
                    'id' => $this->appointment->patient->id,
                    'name' => $this->appointment->patient->name,
                    'email' => $this->appointment->patient->email,
                ] : null,
                'optometrist' => $this->appointment->optometrist ? [
                    'id' => $this->appointment->optometrist->id,
                    'name' => $this->appointment->optometrist->name,
                ] : null,
                'branch' => $this->appointment->branch ? [
                    'id' => $this->appointment->branch->id,
                    'name' => $this->appointment->branch->name,
                ] : null,
            ],
            'timestamp' => now()->toISOString(),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'appointment.' . $this->type;
    }
}
