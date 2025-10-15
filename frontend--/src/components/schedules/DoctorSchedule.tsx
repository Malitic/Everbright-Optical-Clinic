import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, User, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Doctor {
  id: number;
  name: string;
}

interface Branch {
  id: number;
  name: string;
  code: string;
}

interface ScheduleItem {
  day_of_week: number;
  day_name: string;
  branch: Branch;
  start_time: string;
  end_time: string;
  time_range: string;
}

interface DoctorScheduleData {
  doctor: Doctor;
  schedule: ScheduleItem[];
}

interface DoctorScheduleProps {
  doctorId?: number;
  showTitle?: boolean;
  compact?: boolean;
}

const DoctorSchedule: React.FC<DoctorScheduleProps> = ({ 
  doctorId, 
  showTitle = true, 
  compact = false 
}) => {
  const [scheduleData, setScheduleData] = useState<DoctorScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedule = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let url = 'http://127.0.0.1:8000/api/schedules';
      if (doctorId) {
        url = `http://127.0.0.1:8000/api/schedules/doctor/${doctorId}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        if (doctorId) {
          // Single doctor response
          setScheduleData(data);
        } else {
          // Multiple doctors response - find doctor with actual schedule
          const doctorsWithSchedules = Object.values(data.schedules).filter((doctor: any) => 
            doctor.schedule && doctor.schedule.length > 0
          ) as DoctorScheduleData[];
          
          if (doctorsWithSchedules.length > 0) {
            setScheduleData(doctorsWithSchedules[0]);
          } else {
            setScheduleData(null);
          }
        }
      } else {
        setError(data.error || 'Failed to fetch schedule');
      }
    } catch (err) {
      setError('Network error while fetching schedule');
      console.error('Error fetching schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [doctorId]);

  const formatTime = (timeString: string): string => {
    // Convert 24-hour format to 12-hour AM/PM format
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getDayOrder = (dayName: string): number => {
    const dayOrder = {
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6,
      'Sunday': 7,
    };
    return dayOrder[dayName as keyof typeof dayOrder] || 8;
  };

  if (loading) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Doctor's Schedule
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-3">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Doctor's Schedule
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Schedule</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchSchedule} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!scheduleData || scheduleData.schedule.length === 0) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Doctor's Schedule
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Schedule Available</h3>
            <p className="text-gray-600">No schedule found for this doctor.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort schedule by day order
  const sortedSchedule = [...scheduleData.schedule].sort((a, b) => 
    getDayOrder(a.day_name) - getDayOrder(b.day_name)
  );

  if (compact) {
    return (
      <div className="space-y-2">
        {sortedSchedule.map((item) => (
          <div key={item.day_of_week} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Badge variant="outline">{item.day_name}</Badge>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <MapPin className="h-3 w-3" />
                {item.branch.name}
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Clock className="h-3 w-3" />
              {item.time_range}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {scheduleData.doctor.name}'s Weekly Schedule
          </CardTitle>
          <CardDescription>
            Weekly rotation schedule across different branches
          </CardDescription>
        </CardHeader>
      )}
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Day</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead className="w-[180px]">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSchedule.map((item) => (
                <TableRow key={item.day_of_week}>
                  <TableCell>
                    <Badge variant="outline" className="font-medium">
                      {item.day_name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium">{item.branch.name}</div>
                        <div className="text-sm text-gray-500">{item.branch.code}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="font-mono text-sm">{item.time_range}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <User className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Schedule Information</h4>
              <p className="text-sm text-blue-700 mt-1">
                {scheduleData.doctor.name} rotates between different branches throughout the week. 
                Select a date when booking to see which branch he'll be at.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DoctorSchedule;
