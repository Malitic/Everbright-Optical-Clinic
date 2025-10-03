<?php

namespace App\Http\Controllers;

use App\Models\Schedule;
use App\Models\Appointment;
use App\Models\User;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class AppointmentAvailabilityController extends Controller
{
    /**
     * Get available appointment slots for a specific date.
     */
    public function getAvailability(Request $request): JsonResponse
    {
        $request->validate([
            'date' => 'required|date|after_or_equal:today',
        ]);

        $date = Carbon::parse($request->date);
        $dayOfWeek = $date->dayOfWeekIso; // 1 = Monday, 7 = Sunday

        // Find all schedules for this day
        $schedules = Schedule::with(['optometrist', 'branch'])
            ->where('is_active', true)
            ->where('day_of_week', $dayOfWeek)
            ->get();

        if ($schedules->isEmpty()) {
            return response()->json([
                'date' => $date->format('Y-m-d'),
                'available' => false,
                'message' => 'No optometrists available on this date'
            ]);
        }

        // For now, we'll return the first available schedule (single optometrist rotation)
        $schedule = $schedules->first();
        
        // Get already booked appointments for this optometrist on this date
        $bookedAppointments = Appointment::where('optometrist_id', $schedule->optometrist_id)
            ->where('appointment_date', $date->toDateString())
            ->whereIn('status', ['scheduled', 'confirmed'])
            ->get(['start_time', 'end_time']);

        $availableTimeSlots = $this->generateTimeSlots(
            $schedule->start_time,
            $schedule->end_time,
            $bookedAppointments
        );

        return response()->json([
            'date' => $date->format('Y-m-d'),
            'branch' => $schedule->branch->name,
            'branch_id' => $schedule->branch->id,
            'optometrist' => $schedule->optometrist->name,
            'optometrist_id' => $schedule->optometrist->id,
            'available_times' => $availableTimeSlots,
        ]);
    }

    /**
     * Get optometrist schedule for the week.
     */
    public function getWeeklySchedule(): JsonResponse
    {
        $schedules = Schedule::with(['optometrist', 'branch'])
            ->where('is_active', true)
            ->orderBy('day_of_week')
            ->get()
            ->groupBy('optometrist_id');

        $weeklySchedule = [];
        $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        foreach ($schedules as $optometristId => $optometristSchedules) {
            $optometrist = $optometristSchedules->first()->optometrist;
            $scheduleByDay = $optometristSchedules->keyBy('day_of_week');

            $weeklySchedule[] = [
                'optometrist' => [
                    'id' => $optometrist->id,
                    'name' => $optometrist->name,
                ],
                'schedule' => collect($days)->map(function ($day, $index) use ($scheduleByDay) {
                    $dayNumber = $index + 1;
                    $schedule = $scheduleByDay->get($dayNumber);
                    
                    return [
                        'day' => $day,
                        'day_number' => $dayNumber,
                        'available' => $schedule ? true : false,
                        'branch' => $schedule ? [
                            'id' => $schedule->branch->id,
                            'name' => $schedule->branch->name,
                            'code' => $schedule->branch->code,
                        ] : null,
                        'schedule' => $schedule ? [
                            'start_time' => $schedule->formatted_start_time,
                            'end_time' => $schedule->formatted_end_time,
                        ] : null,
                    ];
                })
            ];
        }

        return response()->json(['weekly_schedule' => $weeklySchedule]);
    }

    /**
     * Generate available time slots based on schedule and existing appointments.
     */
    private function generateTimeSlots($startTime, $endTime, $existingAppointments): array
    {
        $slots = [];
        $current = Carbon::parse($startTime);
        $end = Carbon::parse($endTime);
        $slotDuration = 60; // 60 minutes per slot

        // Reset current to start time
        $current = Carbon::parse($startTime);

        while ($current->lt($end)) {
            $timeString = $current->format('H:i');
            $timeDisplay = $current->format('g:i A');
            
            // Check if this time slot is already booked
            $isBooked = $existingAppointments->contains(function ($appointment) use ($timeString) {
                return $appointment->start_time === $timeString;
            });

            if (!$isBooked) {
                $slots[] = $timeDisplay; // Return just the display format as required
            }
            
            $current->addMinutes($slotDuration);
        }

        return $slots;
    }
}