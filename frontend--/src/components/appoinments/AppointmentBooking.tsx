import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, MapPin, Loader2, Eye, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useCreateAppointment, useAppointments } from '@/features/appointments/hooks/useAppointments';
import { CreateAppointmentRequest, AppointmentType } from '@/features/appointments/types/appointment.types';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getActiveBranches } from '@/services/branchApi';
import { getAvailability, AvailabilityResponse } from '@/services/availabilityApi';
import { DoctorScheduleModal } from '@/components/schedule/DoctorScheduleModal';
import { CompactSchedule } from '@/components/schedule/CompactSchedule';
import { getAllOptometrists } from '@/services/scheduleApi';

interface AppointmentFormData {
  date: string;
  time: string;
  appointmentType: string;
  notes: string;
  // These will be auto-filled from availability API
  optometrist?: string;
  branch?: string;
}

interface AppointmentBookingProps {
  onSuccess?: () => void;
}

const AppointmentBooking: React.FC<AppointmentBookingProps> = ({ onSuccess }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<AppointmentFormData>({
    date: '',
    time: '',
    appointmentType: '',
    notes: '',
  });

  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<{ id: number; name: string } | null>(null);

  const { create, loading: creating } = useCreateAppointment();
  const { appointments, loading: appointmentsLoading, refetch } = useAppointments();
  
  // Fetch optometrists
  const { data: optometristsData } = useQuery({
    queryKey: ['optometrists'],
    queryFn: getAllOptometrists,
  });

  // Fetch availability when date changes
  const { data: availabilityData, isLoading: availabilityLoading, error: availabilityError } = useQuery({
    queryKey: ['availability', formData.date],
    queryFn: () => getAvailability(formData.date),
    enabled: !!formData.date,
  });

  // Update availability when data changes
  useEffect(() => {
    if (availabilityData?.data) {
      setAvailability(availabilityData.data);
      // Auto-fill optometrist and branch
      setFormData(prev => ({
        ...prev,
        optometrist: availabilityData.data.optometrist,
        branch: availabilityData.data.branch,
      }));
    }
  }, [availabilityData]);

  // Set selected doctor when optometrists data is available
  // API now only returns optometrists with active schedules (Dr. Samuel)
  useEffect(() => {
    if (optometristsData?.optometrists && optometristsData.optometrists.length > 0) {
      // Use the first (and only) optometrist with active schedules
      const doctor = optometristsData.optometrists[0];
      setSelectedDoctor({ id: doctor.id, name: doctor.name });
    }
  }, [optometristsData]);

  const appointmentTypes = [
    { value: 'eye_exam', label: 'Eye Exam' },
    { value: 'contact_fitting', label: 'Contact Lens Fitting' },
    { value: 'consultation', label: 'Consultation' },
    { value: 'follow_up', label: 'Follow-up' },
    { value: 'emergency', label: 'Emergency' }
  ];

  // Convert 12-hour format to 24-hour format
  const convertTo24Hour = (time12: string): string => {
    const [time, period] = time12.split(' ');
    const [hours, minutes] = time.split(':');
    let hour24 = parseInt(hours);
    
    if (period === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minutes}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.date || !formData.time || !formData.appointmentType || !availability) {
      toast({
        title: "Incomplete Form",
        description: "Please fill in all required fields and select a date with available times.",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to book an appointment.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Use the IDs directly from the availability API response
      if (!availability.optometrist_id || !availability.branch_id) {
        throw new Error('Optometrist or branch information is missing from availability data');
      }
      
      const appointmentData: CreateAppointmentRequest = {
        patient_id: typeof user.id === 'string' ? parseInt(user.id) : user.id,
        optometrist_id: typeof availability.optometrist_id === 'string' ? parseInt(availability.optometrist_id) : availability.optometrist_id,
        branch_id: typeof availability.branch_id === 'string' ? parseInt(availability.branch_id) : availability.branch_id,
        appointment_date: formData.date,
        start_time: formData.time,
        end_time: calculateEndTime(formData.time, formData.appointmentType),
        type: formData.appointmentType as AppointmentType,
        notes: formData.notes || undefined
      };

      console.log('Appointment data being sent:', appointmentData);
      console.log('User ID:', user.id, 'Type:', typeof user.id);
      console.log('Optometrist ID:', availability.optometrist_id, 'Type:', typeof availability.optometrist_id);
      console.log('Branch ID:', availability.branch_id, 'Type:', typeof availability.branch_id);

      await create(appointmentData);

      toast({
        title: "Appointment Booked Successfully",
        description: `Your appointment with ${availability.optometrist || 'the optometrist'} at ${availability.branch || 'the branch'} has been scheduled for ${formData.date} at ${formData.time}.`
      });

      // Reset form
      setFormData({
        date: '',
        time: '',
        appointmentType: '',
        notes: '',
      });
      setAvailability(null);

      // Refresh appointments list
      refetch();

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error booking appointment:', error);
      
      // Extract validation errors from response
      let errorMessage = "There was an error booking your appointment. Please try again.";
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        const errorMessages = Object.values(validationErrors).flat();
        errorMessage = `Validation errors: ${errorMessages.join(', ')}`;
        console.error('Validation errors:', validationErrors);
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast({
        title: "Booking Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateEndTime = (startTime: string, type: string): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    let duration = 30; // Default 30 minutes

    switch (type) {
      case 'eye_exam':
        duration = 60;
        break;
      case 'contact_fitting':
        duration = 45;
        break;
      case 'emergency':
        duration = 30;
        break;
      default:
        duration = 30;
    }

    const endMinutes = minutes + duration;
    const endHours = hours + Math.floor(endMinutes / 60);
    const finalMinutes = endMinutes % 60;

    return `${endHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (field: keyof AppointmentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Booking Form */}
        <div className="lg:col-span-2">
          <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-6 w-6 text-customer" />
              <CardTitle>Book New Appointment</CardTitle>
            </div>
            {selectedDoctor && (
              <DoctorScheduleModal doctorId={selectedDoctor.id} doctorName={selectedDoctor.name}>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  View Doctor's Schedule
                </Button>
              </DoctorScheduleModal>
            )}
          </div>
          <CardDescription>
            Schedule your next eye examination or consultation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Appointment Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Preferred Time</Label>
                <Select value={formData.time} onValueChange={(value) => handleInputChange('time', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={availabilityLoading ? "Loading available times..." : "Select time"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availabilityLoading ? (
                      <SelectItem value="loading" disabled>
                        <div className="flex items-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading available times...
                        </div>
                      </SelectItem>
                    ) : availability?.available_times ? (
                      availability.available_times.filter(time => time && String(time).trim() !== '').map(time => {
                        // Convert 12-hour format to 24-hour format for backend
                        const time24 = convertTo24Hour(time);
                        return (
                          <SelectItem key={time} value={time24}>
                            <div className="flex items-center">
                              <Clock className="mr-2 h-4 w-4" />
                              {time}
                            </div>
                          </SelectItem>
                        );
                      })
                    ) : (
                      <SelectItem value="no-times" disabled>
                        No available times for this date
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Error display for availability */}
            {availabilityError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error Loading Availability</h3>
                    <p className="mt-1 text-sm text-red-700">
                      {availabilityError.message || 'Failed to load available times for this date.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Auto-filled fields - disabled */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="branch">Branch</Label>
                <Input
                  id="branch"
                  value={availability?.branch || ''}
                  disabled
                  placeholder="Select a date to see assigned branch"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="optometrist">Optometrist</Label>
                <Input
                  id="optometrist"
                  value={availability?.optometrist || ''}
                  disabled
                  placeholder="Select a date to see assigned optometrist"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointmentType">Service Type</Label>
              <Select value={formData.appointmentType} onValueChange={(value) => handleInputChange('appointmentType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  {appointmentTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any special requirements or symptoms you'd like to discuss..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full" variant="customer" disabled={creating || isSubmitting}>
              {creating || isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Booking...
                </>
              ) : (
                'Book Appointment'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Upcoming Appointments */}
      <Card className="mt-6" data-section="appointments">
        <CardHeader>
          <CardTitle>Your Upcoming Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {appointmentsLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading appointments...
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              No upcoming appointments found.
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-customer" />
                      <span className="font-medium">{appointment.appointment_date}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{appointment.start_time}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{appointment.optometrist?.name || 'Unknown Optometrist'}</span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {appointmentTypes.find(type => type.value === appointment.type)?.label || appointment.type}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
        </div>

        {/* Schedule Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            {/* Doctor Schedule */}
            {selectedDoctor && (
              <CompactSchedule 
                doctorId={selectedDoctor.id} 
                doctorName={selectedDoctor.name} 
              />
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => navigate('/customer/book-appointment')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Book New Appointment
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => window.scrollTo({ 
                    top: document.querySelector('[data-section="appointments"]')?.offsetTop || 0, 
                    behavior: 'smooth' 
                  })}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  View My Appointments
                </Button>
              </CardContent>
            </Card>

            {/* Help Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Need Help?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">
                  Select a date to see which branch and doctor will be available for your appointment.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span>Not Available</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentBooking;