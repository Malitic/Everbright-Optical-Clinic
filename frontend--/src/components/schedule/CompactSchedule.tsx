import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getDoctorSchedule, DoctorScheduleResponse } from '@/services/scheduleApi';
import { useToast } from '@/hooks/use-toast';

interface CompactScheduleProps {
  doctorId: number;
  doctorName: string;
}

export const CompactSchedule: React.FC<CompactScheduleProps> = ({
  doctorId,
  doctorName
}) => {
  const [schedule, setSchedule] = useState<DoctorScheduleResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const data = await getDoctorSchedule(doctorId);
      setSchedule(data);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      toast({
        title: "Error",
        description: "Failed to fetch doctor schedule",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [doctorId]);

  const getTodaySchedule = () => {
    if (!schedule) return null;
    
    const today = new Date();
    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
    return schedule.schedule.find(s => s.day_of_week === dayOfWeek);
  };

  const getStatusColor = (scheduleItem: any) => {
    if (scheduleItem.branch === 'Not Available') {
      return 'text-muted-foreground';
    }
    return 'text-green-600';
  };

  const getStatusBadge = (scheduleItem: any) => {
    if (scheduleItem.branch === 'Not Available') {
      return <Badge variant="secondary" className="text-xs">Not Available</Badge>;
    }
    return <Badge variant="default" className="text-xs">Available</Badge>;
  };

  const todaySchedule = getTodaySchedule();

  if (loading) {
    return (
      <Card className="h-fit">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Doctor's Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Dr. {doctorName}'s Schedule
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </div>
        <CardDescription className="text-xs">
          Weekly rotation across branches
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Today's Schedule Highlight */}
        {todaySchedule && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">Today</span>
              {getStatusBadge(todaySchedule)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-3 w-3 text-blue-600" />
                <span className={getStatusColor(todaySchedule)}>{todaySchedule.branch}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-3 w-3 text-blue-600" />
                <span className={getStatusColor(todaySchedule)}>{todaySchedule.time}</span>
              </div>
            </div>
          </div>
        )}

        {/* Weekly Schedule */}
        {isExpanded && schedule && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground mb-2">Weekly Schedule</div>
            {schedule.schedule.map((scheduleItem, index) => (
              <div key={index} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="text-xs font-medium w-16 text-muted-foreground">
                    {scheduleItem.day.slice(0, 3)}
                  </div>
                  <div className="flex items-center gap-1 min-w-0 flex-1">
                    <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs truncate">{scheduleItem.branch}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{scheduleItem.time}</span>
                  {getStatusBadge(scheduleItem)}
                </div>
              </div>
            ))}
          </div>
        )}

        {!isExpanded && (
          <div className="text-xs text-muted-foreground text-center py-2">
            Click to view full schedule
          </div>
        )}
      </CardContent>
    </Card>
  );
};

