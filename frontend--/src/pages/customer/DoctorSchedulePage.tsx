import React from 'react';
import DoctorSchedule from '@/components/schedules/DoctorSchedule';

const DoctorSchedulePage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Doctor's Schedule</h1>
          <p className="text-gray-600">
            View Dr. Samuel Loreto Prieto's weekly rotation schedule across all branches.
          </p>
        </div>

        <DoctorSchedule />
      </div>
    </div>
  );
};

export default DoctorSchedulePage;
