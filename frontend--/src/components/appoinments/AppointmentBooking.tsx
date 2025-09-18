import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useCreateAppointment, useAppointments, useOptometrists, useAvailableTimeSlots } from '@/features/appointments/hooks/useAppointments';
import { CreateAppointmentRequest, AppointmentType } from '@/features/appointments/types/appointment.types';
import { useAuth } from '@/contexts/AuthContext';

interface AppointmentFormData {
  date: string;
  time: string;
  optometrist: string;
  appointmentType: string;
  notes: string;
}

const AppointmentBooking = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<AppointmentFormData>({
    date: '',
    time: '',
    optometrist: '',
    appointmentType: '',
    notes: ''
  });

  const { create, loading: creating } = useCreateAppointment();
  const { optometrists, loading: optometristsLoading } = useOptometrists();
  const { appointments, loading: appointmentsLoading, refetch } = useAppointments();
  
  const { timeSlots, loading: timeSlotsLoading } = useAvailableTimeSlots(
    formData.optometrist ? parseInt(formData.optometrist) : null,
    formData.date
  );

  // Default time slots if API doesn't return any
  const defaultTimeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ];

  const availableTimeSlots = timeSlots.length > 0 ? timeSlots : defaultTimeSlots;

  const appointmentTypes = [
    { value: 'eye_exam', label: 'Eye Examination' },
    { value: 'contact_fitting', label: 'Contact Lens Fitting' },
    { value: 'follow_up', label: 'Follow-up Visit' },
    { value: 'consultation', label: 'Prescription Update' },
    { value: 'emergency', label: 'Emergency Consultation' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.date || !formData.time || !formData.optometrist || !formData.appointmentType) {
      toast({
        title: "Incomplete Form",
        description: "Please fill in all required fields.",
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
      const selectedOptometrist = optometrists.find(opt => opt.id.toString() === formData.optometrist);
      
      const appointmentData: CreateAppointmentRequest = {
        patient_id: parseInt(user.id),
        optometrist_id: parseInt(formData.optometrist),
        appointment_date: formData.date,
        start_time: formData.time,
        end_time: calculateEndTime(formData.time, formData.appointmentType),
        type: formData.appointmentType as AppointmentType,
        notes: formData.notes || undefined
      };

      await create(appointmentData);

      toast({
        title: "Appointment Booked Successfully",
        description: `Your appointment with ${selectedOptometrist?.name || 'the optometrist'} has been scheduled for ${formData.date} at ${formData.time}.`
      });

      // Reset form
      setFormData({
        date: '',
        time: '',
        optometrist: '',
        appointmentType: '',
        notes: ''
      });

      // Refresh appointments list
      refetch();
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast({
        title: "Booking Failed",
        description: "There was an error booking your appointment. Please try again.",
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
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Calendar className="h-6 w-6 text-customer" />
            <CardTitle>Book New Appointment</CardTitle>
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
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlotsLoading ? (
                      <SelectItem value="" disabled>
                        <div className="flex items-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading time slots...
                        </div>
                      </SelectItem>
                    ) : (
                      availableTimeSlots.map(time => (
                        <SelectItem key={time} value={time}>
                          <div className="flex items-center">
                            <Clock className="mr-2 h-4 w-4" />
                            {time}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="optometrist">Preferred Optometrist</Label>
              <Select value={formData.optometrist} onValueChange={(value) => handleInputChange('optometrist', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select optometrist" />
                </SelectTrigger>
                <SelectContent>
                  {optometristsLoading ? (
                    <SelectItem value="" disabled>
                      <div className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading optometrists...
                      </div>
                    </SelectItem>
                  ) : (
                    optometrists.map(doctor => (
                      <SelectItem key={doctor.id} value={doctor.id.toString()}>
                        <div className="flex items-center">
                          <User className="mr-2 h-4 w-4" />
                          {doctor.name}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointmentType">Appointment Type</Label>
              <Select value={formData.appointmentType} onValueChange={(value) => handleInputChange('appointmentType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select appointment type" />
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
      <Card className="mt-6">
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
  );
};

export default AppointmentBooking;