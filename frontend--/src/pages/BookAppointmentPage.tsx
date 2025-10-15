import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, User, MapPin, Loader2, Eye, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateAppointment, useAppointments } from '@/features/appointments/hooks/useAppointments';
import { useQuery } from '@tanstack/react-query';
import { getAvailability } from '@/services/availabilityApi';
import { getAllOptometrists } from '@/services/scheduleApi';
import { useToast } from '@/hooks/use-toast';
import { DoctorScheduleModal } from '@/components/schedule/DoctorScheduleModal';
import { CompactSchedule } from '@/components/schedule/CompactSchedule';

interface AppointmentFormData {
  date: string;
  time: string;
  appointmentType: string;
  notes: string;
  optometrist?: string;
  branch?: string;
}

const BookAppointmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<AppointmentFormData>({
    date: '',
    time: '',
    appointmentType: '',
    notes: '',
  });

  const [availability, setAvailability] = useState<any>(null);
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
        { value: 'consultation', label: 'General Consultation' },
        { value: 'eye_exam', label: 'Comprehensive Eye Exam' },
        { value: 'contact_fitting', label: 'Contact Lens Fitting' },
        { value: 'follow_up', label: 'Follow-up Visit' },
        { value: 'emergency', label: 'Emergency Visit' },
      ];

  const calculateEndTime = (startTime: string, type: string): string => {
    // Convert 12-hour format to 24-hour format
    const convertTo24Hour = (time12h: string): { hours: number; minutes: number } => {
      const [time, modifier] = time12h.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      
      if (modifier === 'PM' && hours !== 12) {
        hours += 12;
      } else if (modifier === 'AM' && hours === 12) {
        hours = 0;
      }
      
      return { hours, minutes };
    };

    const { hours, minutes } = convertTo24Hour(startTime);
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

  const handleBookingSuccess = () => {
    // Navigate back to appointments page after successful booking
    navigate('/customer/appointments');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!user || !availability) {
      toast({
        title: "Booking Failed",
        description: "User or availability data is missing.",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Use the IDs directly from the availability API response
      if (!availability.optometrist_id || !availability.branch_id) {
        throw new Error('Optometrist or branch information is missing from availability data');
      }

      // Convert 12-hour format to 24-hour format for start_time
      const convertTo24Hour = (time12h: string): string => {
        const [time, modifier] = time12h.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        
        if (modifier === 'PM' && hours !== 12) {
          hours += 12;
        } else if (modifier === 'AM' && hours === 12) {
          hours = 0;
        }
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      };

      const appointmentData = {
        patient_id: typeof user.id === 'string' ? parseInt(user.id) : user.id,
        optometrist_id: typeof availability.optometrist_id === 'string' ? parseInt(availability.optometrist_id) : availability.optometrist_id,
        branch_id: typeof availability.branch_id === 'string' ? parseInt(availability.branch_id) : availability.branch_id,
        appointment_date: formData.date,
        start_time: convertTo24Hour(formData.time),
        end_time: calculateEndTime(formData.time, formData.appointmentType),
        type: formData.appointmentType,
        notes: formData.notes || undefined
      };

      console.log('Debug - Form time (12h):', formData.time);
      console.log('Debug - Start time (24h):', convertTo24Hour(formData.time));
      console.log('Debug - End time (24h):', calculateEndTime(formData.time, formData.appointmentType));
      console.log('Debug - Full appointment data:', appointmentData);

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

      // Navigate back to appointments
      handleBookingSuccess();
        } catch (error: any) {
          console.error('Error booking appointment:', error);
          console.error('Error response:', error.response?.data);

          let errorMessage = "There was an error booking your appointment. Please try again.";
          if (error.response?.data?.errors) {
            const validationErrors = error.response.data.errors;
            const errorMessages = Object.values(validationErrors).flat();
            errorMessage = `Validation errors: ${errorMessages.join(', ')}`;
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/customer/appointments')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Appointments
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Book New Appointment</h1>
              <p className="text-gray-600">Schedule your eye examination or consultation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
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
                  {/* Appointment Date */}
                  <div className="space-y-2">
                    <Label htmlFor="date">Appointment Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      required
                      className="w-full"
                    />
                  </div>

                  {/* Preferred Time */}
                  <div className="space-y-2">
                    <Label htmlFor="time">Preferred Time</Label>
                    <Select
                      value={formData.time}
                      onValueChange={(value) => handleInputChange('time', value)}
                      disabled={!availability?.available_times?.length}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={availability?.available_times?.length ? "Select time" : "Select a date first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availability?.available_times?.filter((time: string) => time && String(time).trim() !== '').map((time: string) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {availabilityError && (
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>No available times for this date</span>
                      </div>
                    )}
                  </div>

                  {/* Branch (Auto-filled) */}
                  <div className="space-y-2">
                    <Label htmlFor="branch">Branch</Label>
                    <Input
                      id="branch"
                      value={formData.branch || ''}
                      placeholder="Select a date to see assigned branch"
                      disabled
                      className="bg-gray-50"
                    />
                  </div>

                  {/* Optometrist (Auto-filled) */}
                  <div className="space-y-2">
                    <Label htmlFor="optometrist">Optometrist</Label>
                    <Input
                      id="optometrist"
                      value={formData.optometrist || ''}
                      placeholder="Select a date to see assigned optometrist"
                      disabled
                      className="bg-gray-50"
                    />
                  </div>

                  {/* Service Type */}
                  <div className="space-y-2">
                    <Label htmlFor="appointmentType">Service Type</Label>
                    <Select
                      value={formData.appointmentType}
                      onValueChange={(value) => handleInputChange('appointmentType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                      <SelectContent>
                        {appointmentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Additional Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Any special requirements or symptoms you'd like to discuss..."
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
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Book New Appointment
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => navigate('/customer/appointments')}
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
    </div>
  );
};

export default BookAppointmentPage;
