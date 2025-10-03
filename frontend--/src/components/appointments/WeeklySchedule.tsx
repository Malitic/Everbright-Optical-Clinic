import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface WeeklyScheduleData {
  day: string;
  day_number: number;
  available: boolean;
  branch: {
    id: number;
    name: string;
    code: string;
  } | null;
  optometrist: {
    id: number;
    name: string;
  } | null;
  schedule: {
    start_time: string;
    end_time: string;
  } | null;
}

const WeeklySchedule: React.FC = () => {
  const [schedule, setSchedule] = useState<WeeklyScheduleData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeeklySchedule();
  }, []);

  const fetchWeeklySchedule = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/appointments/weekly-schedule');
      const data = await response.json();
      setSchedule(data.weekly_schedule);
    } catch (error) {
      console.error('Error fetching weekly schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDayStatus = (day: WeeklyScheduleData) => {
    if (!day.available) {
      return { color: 'bg-gray-100', text: 'Not Available', icon: '❌' };
    }
    return { color: 'bg-green-50', text: 'Available', icon: '✅' };
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Loading schedule...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Dr. Samuel Loreto Prieto's Weekly Schedule
        </CardTitle>
        <CardDescription>
          Available days and locations for appointments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {schedule.map((day) => {
            const status = getDayStatus(day);
            return (
              <div
                key={day.day}
                className={`p-4 rounded-lg border ${status.color} ${
                  day.available ? 'border-green-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{status.icon}</span>
                    <div>
                      <h3 className="font-medium text-gray-900">{day.day}</h3>
                      {day.available && day.branch && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                          <MapPin className="h-3 w-3" />
                          {day.branch.name}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Badge variant={day.available ? 'default' : 'secondary'}>
                      {status.text}
                    </Badge>
                    {day.available && day.schedule && (
                      <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(day.schedule.start_time)} - {formatTime(day.schedule.end_time)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <User className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">How to Book</h4>
              <p className="text-sm text-blue-700 mt-1">
                Select a date from the calendar above to see available time slots. 
                Dr. Samuel rotates between different branches throughout the week.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklySchedule;
