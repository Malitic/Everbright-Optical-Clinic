 import React from 'react';
import { Clock } from 'lucide-react';
import { useTodayAppointments } from '@/services/optometristApi';
import { DashboardCard } from '../DashboardCard';
import { useNavigate } from 'react-router-dom';

export const TodayAppointmentsCard: React.FC = () => {
  const navigate = useNavigate();
  const { data: appointments, isLoading, error } = useTodayAppointments();

  if (isLoading) {
    return (
      <DashboardCard
        title="Today's Appointments"
        value="Loading..."
        description="Loading..."
        icon={Clock}
      />
    );
  }

  if (error) {
    return (
      <DashboardCard
        title="Today's Appointments"
        value="Error"
        description="Failed to load appointments"
        icon={Clock}
      />
    );
  }

  const todayCount = appointments?.length || 0;

  return (
    <DashboardCard
      title="Today's Appointments"
      value={todayCount}
      description={`${todayCount} scheduled for today`}
      icon={Clock}
      action={{
        label: 'View All',
        onClick: () => navigate('/optometrist/appointments'),
        variant: 'optometrist'
      }}
    />
  );
};
