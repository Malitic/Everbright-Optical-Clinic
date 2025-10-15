<?php

namespace App\Services;

use App\Events\AppointmentNotification;
use App\Events\InventoryNotification;
use App\Events\GeneralNotification;
use App\Models\Appointment;
use App\Models\Product;
use App\Models\Branch;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class WebSocketService
{
    /**
     * Send appointment-related notifications
     */
    public static function notifyAppointmentUpdate(Appointment $appointment, string $type, string $message): void
    {
        try {
            // Determine recipients based on appointment details
            $recipients = [];
            
            // Add patient
            if ($appointment->patient_id) {
                $recipients[] = $appointment->patient_id;
            }
            
            // Add optometrist
            if ($appointment->optometrist_id) {
                $recipients[] = $appointment->optometrist_id;
            }
            
            // Add staff from the same branch
            if ($appointment->branch_id) {
                $staffMembers = User::where('role', 'staff')
                    ->where('branch_id', $appointment->branch_id)
                    ->pluck('id')
                    ->toArray();
                $recipients = array_merge($recipients, $staffMembers);
            }
            
            // Add admins
            $admins = User::where('role', 'admin')->pluck('id')->toArray();
            $recipients = array_merge($recipients, $admins);
            
            // Remove duplicates
            $recipients = array_unique($recipients);
            
            // Broadcast the event
            event(new AppointmentNotification($appointment, $type, $message, $recipients));
            
            Log::info('Appointment notification sent', [
                'appointment_id' => $appointment->id,
                'type' => $type,
                'recipients_count' => count($recipients)
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to send appointment notification: ' . $e->getMessage());
        }
    }

    /**
     * Send inventory-related notifications
     */
    public static function notifyInventoryUpdate(
        Product $product,
        Branch $branch,
        string $type,
        string $message,
        int $stockLevel,
        int $threshold
    ): void {
        try {
            // Determine recipients
            $recipients = [];
            
            // Add staff from the branch
            $staffMembers = User::where('role', 'staff')
                ->where('branch_id', $branch->id)
                ->pluck('id')
                ->toArray();
            $recipients = array_merge($recipients, $staffMembers);
            
            // Add admins
            $admins = User::where('role', 'admin')->pluck('id')->toArray();
            $recipients = array_merge($recipients, $admins);
            
            // Remove duplicates
            $recipients = array_unique($recipients);
            
            // Broadcast the event
            event(new InventoryNotification($product, $branch, $type, $message, $stockLevel, $threshold, $recipients));
            
            Log::info('Inventory notification sent', [
                'product_id' => $product->id,
                'branch_id' => $branch->id,
                'type' => $type,
                'stock_level' => $stockLevel,
                'recipients_count' => count($recipients)
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to send inventory notification: ' . $e->getMessage());
        }
    }

    /**
     * Send general notifications
     */
    public static function notifyUsers(
        string $title,
        string $message,
        string $type = 'general',
        array $userIds = [],
        array $data = []
    ): void {
        try {
            event(new GeneralNotification($title, $message, $type, $userIds, $data));
            
            Log::info('General notification sent', [
                'title' => $title,
                'type' => $type,
                'recipients_count' => count($userIds)
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to send general notification: ' . $e->getMessage());
        }
    }

    /**
     * Send notification to specific role
     */
    public static function notifyRole(
        string $title,
        string $message,
        string $role,
        string $type = 'general',
        array $data = []
    ): void {
        try {
            $userIds = User::where('role', $role)->pluck('id')->toArray();
            self::notifyUsers($title, $message, $type, $userIds, $data);
            
        } catch (\Exception $e) {
            Log::error('Failed to send role notification: ' . $e->getMessage());
        }
    }

    /**
     * Send notification to branch staff
     */
    public static function notifyBranch(
        string $title,
        string $message,
        int $branchId,
        string $type = 'general',
        array $data = []
    ): void {
        try {
            $userIds = User::where('role', 'staff')
                ->where('branch_id', $branchId)
                ->pluck('id')
                ->toArray();
            self::notifyUsers($title, $message, $type, $userIds, $data);
            
        } catch (\Exception $e) {
            Log::error('Failed to send branch notification: ' . $e->getMessage());
        }
    }
}
