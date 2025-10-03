import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppointmentBookingForm from '@/components/appointments/AppointmentBookingForm';
import WeeklySchedule from '@/components/appointments/WeeklySchedule';

const AppointmentsPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Book an Appointment</h1>
          <p className="text-gray-600">
            Schedule an appointment with Dr. Samuel Loreto Prieto at our various branch locations.
          </p>
        </div>

        <Tabs defaultValue="book" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="book">Book Appointment</TabsTrigger>
            <TabsTrigger value="schedule">Weekly Schedule</TabsTrigger>
          </TabsList>
          
          <TabsContent value="book" className="space-y-6">
            <AppointmentBookingForm />
          </TabsContent>
          
          <TabsContent value="schedule" className="space-y-6">
            <WeeklySchedule />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AppointmentsPage;
