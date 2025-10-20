import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, User, Phone, Mail, Eye, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useAppointments, useUpdateAppointment, useDeleteAppointment } from '@/features/appointments/hooks/useAppointments';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Appointment } from '@/features/appointments/types/appointment.types';
import AppointmentBooking from '@/components/appoinments/AppointmentBooking';
import ContactModal from '@/components/contact/ContactModal';

const CustomerAppointments: React.FC = () => {
  const [selectedAppointment, setSelectedAppointment] = useState<number | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { appointments, loading, error, refetch } = useAppointments();
  const { update: updateAppointment, loading: updateLoading } = useUpdateAppointment();
  const { remove: deleteAppointment, loading: deleteLoading } = useDeleteAppointment();

  // Debug authentication state
  console.log('CustomerAppointments - Auth state:', {
    user: user,
    hasToken: !!sessionStorage.getItem('auth_token'),
    token: sessionStorage.getItem('auth_token')?.substring(0, 10) + '...'
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no_show': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCancelAppointment = async (appointmentId: number) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await updateAppointment(appointmentId.toString(), { status: 'cancelled' });
        refetch();
      } catch (error) {
        console.error('Failed to cancel appointment:', error);
        alert('Failed to cancel appointment. Please try again.');
      }
    }
  };

  const handleRescheduleAppointment = (appointmentId: number) => {
    // For now, just show the booking form
    // In a real implementation, you might want to pre-populate the form
    setShowBookingForm(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
        <p className="text-gray-600 mt-2">View and manage your upcoming and past appointments</p>
      </div>


      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading appointments</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <div className="mt-3">
                <Button size="sm" variant="outline" onClick={refetch}>
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : appointments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Appointments Found</h3>
                <p className="text-gray-600 mb-4">You don't have any appointments scheduled yet.</p>
                <Button onClick={() => setShowBookingForm(true)}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Your First Appointment
                </Button>
              </CardContent>
            </Card>
          ) : (
            appointments.map(appointment => (
              <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-lg">
                          {appointment.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                      <Badge className={getStatusColor(appointment.status)}>
                        {appointment.status}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedAppointment(selectedAppointment === appointment.id ? null : appointment.id)}
                    >
                      {selectedAppointment === appointment.id ? 'Hide' : 'View'} Details
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {format(new Date(appointment.appointment_date), 'MMMM d, yyyy')} at {appointment.start_time} - {appointment.end_time}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{appointment.optometrist?.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Patient: {appointment.patient?.name}</span>
                    </div>

                    {selectedAppointment === appointment.id && appointment.notes && (
                      <div className="mt-4 space-y-3 pt-3 border-t">
                        <h4 className="font-medium text-sm mb-2">Notes:</h4>
                        <p className="text-sm text-gray-600">{appointment.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    {appointment.status === 'scheduled' && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleRescheduleAppointment(appointment.id)}
                          disabled={updateLoading}
                        >
                          Reschedule
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-red-600"
                          onClick={() => handleCancelAppointment(appointment.id)}
                          disabled={updateLoading}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="outline">
                      Contact Clinic
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your appointments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" size="sm" onClick={() => navigate('/customer/book-appointment')}>
                <Calendar className="w-4 h-4 mr-2" />
                Book New Appointment
              </Button>
              <Button variant="outline" className="w-full" size="sm" onClick={() => setShowContactModal(true)}>
                <Phone className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Appointment Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Total Appointments</span>
                  <span className="text-sm font-medium">{appointments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Upcoming</span>
                  <span className="text-sm font-medium">
                    {appointments.filter(apt => apt.status === 'scheduled' || apt.status === 'confirmed').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Completed</span>
                  <span className="text-sm font-medium">
                    {appointments.filter(apt => apt.status === 'completed').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Appointment Booking Form */}
      {showBookingForm && (
        <div className="mt-6">
          <AppointmentBooking />
        </div>
      )}

      {/* Contact Modal */}
      <ContactModal 
        isOpen={showContactModal} 
        onClose={() => setShowContactModal(false)} 
      />
    </div>
  );
};

export default CustomerAppointments;
