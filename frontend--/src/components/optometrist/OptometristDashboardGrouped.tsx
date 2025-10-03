import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, MapPin, Play, CheckCircle, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useAppointments, useUpdateAppointment } from '@/features/appointments/hooks/useAppointments';
import { getDoctorSchedule } from '@/services/scheduleApi';

interface TodaySchedule {
  day: string;
  branch: string;
  branch_id: number;
  time: string;
  start_time: string;
  end_time: string;
}

const OptometristDashboardGrouped: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [todaySchedule, setTodaySchedule] = useState<TodaySchedule | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { appointments, loading: appointmentsLoading, refetch } = useAppointments();
  const { update: updateAppointment, loading: updating } = useUpdateAppointment();

  // Get today's schedule for the optometrist
  useEffect(() => {
    const fetchTodaySchedule = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        const scheduleData = await getDoctorSchedule(user.id);
        const today = new Date();
        const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay(); // Convert Sunday (0) to 7
        
        // Find today's schedule
        const todayScheduleData = scheduleData.schedule.find(s => s.day_of_week === dayOfWeek);
        
        if (todayScheduleData && todayScheduleData.branch_id) {
          setTodaySchedule({
            day: todayScheduleData.day,
            branch: todayScheduleData.branch,
            branch_id: todayScheduleData.branch_id,
            time: todayScheduleData.time,
            start_time: todayScheduleData.start_time || '',
            end_time: todayScheduleData.end_time || ''
          });
        }
      } catch (error) {
        console.error('Error fetching today\'s schedule:', error);
        toast({
          title: "Error",
          description: "Failed to load today's schedule",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTodaySchedule();
  }, [user?.id, toast]);

  // Filter appointments for today across all scheduled branches (all statuses)
  const todaysAppointments = appointments?.filter(appointment => {
    const appointmentDate = new Date(appointment.appointment_date);
    const today = new Date();
    
    return (
      ['confirmed', 'scheduled', 'in_progress'].includes(appointment.status) &&
      appointmentDate.toDateString() === today.toDateString()
    );
  }) || [];

  // Group appointments by branch
  const appointmentsByBranch = todaysAppointments.reduce((acc, appointment) => {
    const branchName = appointment.branch?.name || 'Unknown Branch';
    if (!acc[branchName]) {
      acc[branchName] = [];
    }
    acc[branchName].push(appointment);
    return acc;
  }, {} as Record<string, typeof todaysAppointments>);

  const handleStartConsultation = async (appointmentId: string) => {
    try {
      await updateAppointment(appointmentId, { status: 'in_progress' });
      toast({
        title: "Consultation Started",
        description: "The consultation has been marked as in progress",
      });
      refetch();
    } catch (error) {
      console.error('Error starting consultation:', error);
      toast({
        title: "Error",
        description: "Failed to start consultation",
        variant: "destructive"
      });
    }
  };

  const handleCompleteConsultation = async (appointmentId: string) => {
    try {
      await updateAppointment(appointmentId, { status: 'completed' });
      toast({
        title: "Consultation Completed",
        description: "The consultation has been marked as completed",
      });
      refetch();
    } catch (error) {
      console.error('Error completing consultation:', error);
      toast({
        title: "Error",
        description: "Failed to complete consultation",
        variant: "destructive"
      });
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      confirmed: { variant: 'default' as const, label: 'Confirmed' },
      in_progress: { variant: 'secondary' as const, label: 'In Progress' },
      completed: { variant: 'outline' as const, label: 'Completed' },
      cancelled: { variant: 'destructive' as const, label: 'Cancelled' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'outline' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Loading today's schedule...</span>
      </div>
    );
  }

  if (!todaySchedule) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Schedule for Today</h3>
            <p className="text-muted-foreground">
              You don't have any scheduled work at any branch today, but you can still view appointments from all your scheduled branches.
            </p>
          </CardContent>
        </Card>
        
        {/* Show appointments even if no schedule for today */}
        <div className="mt-6">
          <div className="space-y-6">
            {appointmentsLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading appointments...</span>
                </CardContent>
              </Card>
            ) : todaysAppointments.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Appointments Today</h3>
                  <p className="text-muted-foreground">
                    You don't have any confirmed appointments across your scheduled branches today.
                  </p>
                </CardContent>
              </Card>
            ) : (
              Object.entries(appointmentsByBranch).map(([branchName, branchAppointments]) => (
                <Card key={branchName}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      {branchName} Branch
                    </CardTitle>
                    <CardDescription>
                      {branchAppointments.length} confirmed appointment{branchAppointments.length !== 1 ? 's' : ''} for today
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Patient</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {branchAppointments.map((appointment) => (
                          <TableRow key={appointment.id}>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>{appointment.patient?.name || 'Unknown Patient'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{formatTime(appointment.start_time)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {appointment.type?.replace('_', ' ').toUpperCase() || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(appointment.status)}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                {appointment.status === 'confirmed' && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleStartConsultation(appointment.id.toString())}
                                    disabled={updating}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <Play className="h-3 w-3 mr-1" />
                                    Start
                                  </Button>
                                )}
                                {appointment.status === 'in_progress' && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleCompleteConsultation(appointment.id.toString())}
                                    disabled={updating}
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Complete
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">

      {/* Today's Schedule Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Schedule
          </CardTitle>
          <CardDescription>
            Your work schedule for {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Branch</p>
                <p className="text-sm text-muted-foreground">{todaySchedule.branch}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Working Hours</p>
                <p className="text-sm text-muted-foreground">{todaySchedule.time}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Appointments</p>
                <p className="text-sm text-muted-foreground">{todaysAppointments.length} confirmed</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Today's Appointments by Branch */}
      <div className="space-y-6">
        {appointmentsLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading appointments...</span>
            </CardContent>
          </Card>
        ) : todaysAppointments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Appointments Today</h3>
              <p className="text-muted-foreground">
                You don't have any confirmed appointments across your scheduled branches today.
              </p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(appointmentsByBranch).map(([branchName, branchAppointments]) => (
            <Card key={branchName}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  {branchName} Branch
                </CardTitle>
                <CardDescription>
                  {branchAppointments.length} confirmed appointment{branchAppointments.length !== 1 ? 's' : ''} for today
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {branchAppointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{appointment.patient?.name || 'Unknown Patient'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{formatTime(appointment.start_time)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {appointment.type?.replace('_', ' ').toUpperCase() || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(appointment.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {appointment.status === 'confirmed' && (
                              <Button
                                size="sm"
                                onClick={() => handleStartConsultation(appointment.id.toString())}
                                disabled={updating}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Start
                              </Button>
                            )}
                            {appointment.status === 'in_progress' && (
                              <Button
                                size="sm"
                                onClick={() => handleCompleteConsultation(appointment.id.toString())}
                                disabled={updating}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Complete
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default OptometristDashboardGrouped;
