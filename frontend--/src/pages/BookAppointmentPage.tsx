import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import AppointmentBooking from '@/components/appoinments/AppointmentBooking';

const BookAppointmentPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBookingSuccess = () => {
    // Navigate back to appointments page after successful booking
    navigate('/customer/appointments');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => navigate('/customer/appointments')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Appointments
        </Button>
        
        <h1 className="text-3xl font-bold text-customer">Book New Appointment</h1>
        <p className="text-muted-foreground mt-2">
          Schedule your eye examination with our qualified optometrists
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appointment Booking</CardTitle>
          <CardDescription>
            Select your preferred date, time, and appointment type to schedule your visit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AppointmentBooking onSuccess={handleBookingSuccess} />
        </CardContent>
      </Card>
    </div>
  );
};

export default BookAppointmentPage;

