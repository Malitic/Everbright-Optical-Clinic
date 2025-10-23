import React from 'react';
import { Calendar, Package, Users, Clock, ShoppingBag, FileText } from 'lucide-react';
import { DashboardCard } from './DashboardCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { ProductGalleryLocalStorage } from '@/features/products/components/ProductGalleryLocalStorage';
import { useAppointments } from '@/features/appointments/hooks/useAppointments';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const StaffDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Fetch appointments data
  const { appointments, loading: appointmentsLoading } = useAppointments();
  
  // Fetch inventory data
  const { data: inventoryData, isLoading: inventoryLoading, error: inventoryError } = useQuery({
    queryKey: ['staff-inventory', user?.branch?.id],
    queryFn: async () => {
      if (!user?.branch?.id) return null;
      const response = await axios.get(`http://127.0.0.1:8000/api/enhanced-inventory/branch/${user.branch.id}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`,
        },
      });
      return response.data;
    },
    enabled: !!user?.branch?.id,
    retry: 3,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch reservations data
  const { data: reservationsData, isLoading: reservationsLoading, error: reservationsError } = useQuery({
    queryKey: ['staff-reservations', user?.branch?.id],
    queryFn: async () => {
      const response = await axios.get('http://127.0.0.1:8000/api/reservations', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`,
        },
      });
      return response.data;
    },
    retry: 3,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Process today's appointments
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments?.filter(apt => 
    apt.appointment_date === today
  ).map(apt => ({
    time: new Date(`1970-01-01T${apt.start_time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }),
    patient: apt.patient?.name || 'Unknown Patient',
    type: apt.type.replace('_', ' '),
    status: apt.status
  })) || [];

  // Process completed appointments that need receipts
  const completedAppointments = appointments?.filter(apt => 
    apt.status === 'completed'
  ) || [];

  // Process inventory data for dashboard
  const processedInventoryData = inventoryData?.inventories?.reduce((acc: any[], item: any) => {
    const category = item.product_name.split(' ')[0]; // Simple category extraction
    const existing = acc.find(cat => cat.category === category);
    
    if (existing) {
      existing.current += item.quantity;
      existing.max += item.quantity + 20; // Estimate max based on current + buffer
    } else {
      acc.push({
        category,
        current: item.quantity,
        max: item.quantity + 20,
        status: item.quantity < item.min_threshold ? 'critical' : 
                item.quantity < item.min_threshold * 1.5 ? 'low' : 'good'
      });
    }
    
    return acc;
  }, []) || [];


  const getInventoryStatus = (status: string) => {
    switch (status) {
      case 'good':
        return { color: 'bg-green-500', textColor: 'text-green-700' };
      case 'low':
        return { color: 'bg-yellow-500', textColor: 'text-yellow-700' };
      case 'critical':
        return { color: 'bg-red-500', textColor: 'text-red-700' };
      default:
        return { color: 'bg-gray-500', textColor: 'text-gray-700' };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };


  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-staff rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Staff Control Center</h1>
        <p className="text-staff-foreground/90">
          Manage clinic operations, inventory, and patient communications efficiently.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Today's Appointments"
          value={todayAppointments.length}
          description="Scheduled appointments"
          icon={Calendar}
          action={{
            label: 'Manage',
            onClick: () => navigate('/staff/appointments'),
            variant: 'staff'
          }}
          gradient
        />
        
        <DashboardCard
          title="Inventory Items"
          value={inventoryError ? 'Error' : (inventoryData?.inventories?.length || 0)}
          description={inventoryError ? 'Failed to load' : "Items in stock"}
          icon={Package}
          trend={inventoryError ? undefined : { 
            value: processedInventoryData.filter(item => item.status === 'low' || item.status === 'critical').length, 
            label: 'items need attention', 
            isPositive: false 
          }}
          action={{
            label: 'Update Stock',
            onClick: () => navigate('/staff/inventory'),
            variant: 'staff'
          }}
          gradient
        />
        
        <DashboardCard
          title="Pending Reservations"
          value={reservationsError ? 'Error' : (reservationsData?.filter((r: any) => r.status === 'pending').length || 0)}
          description={reservationsError ? 'Failed to load' : "Awaiting approval"}
          icon={Users}
          action={{
            label: 'View All',
            onClick: () => navigate('/staff/reservations'),
            variant: 'staff'
          }}
          gradient
        />

        <DashboardCard
          title="Completed Appointments"
          value={completedAppointments.length}
          description="Ready for receipts"
          icon={FileText}
          action={{
            label: 'Create Receipts',
            onClick: () => navigate('/staff/reservations'),
            variant: 'staff'
          }}
          gradient
        />
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Status */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-staff" />
              <span>Inventory Status</span>
            </CardTitle>
            <CardDescription>Current stock levels by category</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {inventoryLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading inventory...</p>
              </div>
            ) : processedInventoryData.length > 0 ? (
              processedInventoryData.map((item, index) => {
                const percentage = (item.current / item.max) * 100;
                const status = getInventoryStatus(item.status);
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900">{item.category}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-slate-600">
                          {item.current}/{item.max}
                        </span>
                        <Badge className={`${status.textColor} bg-opacity-10`}>
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                    <Progress 
                      value={percentage} 
                      className="h-2"
                    />
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4">
                <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No inventory data available</p>
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => navigate('/staff/inventory')}
            >
              View Full Inventory
            </Button>
          </CardContent>
        </Card>

        {/* Today's Appointments */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-staff" />
              <span>Today's Schedule</span>
            </CardTitle>
            <CardDescription>Appointment status overview</CardDescription>
          </CardHeader>
          <CardContent>
            {appointmentsLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Loading appointments...</p>
              </div>
            ) : todayAppointments.length > 0 ? (
              <div className="space-y-3">
                {todayAppointments.map((appointment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-slate-900">{appointment.patient}</h4>
                      <p className="text-sm text-slate-600">{appointment.time} • {appointment.type}</p>
                    </div>
                    <Badge className={getStatusColor(appointment.status)}>
                      {appointment.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No appointments scheduled for today</p>
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-4"
              onClick={() => navigate('/staff/appointments')}
            >
              Manage All Appointments
            </Button>
          </CardContent>
        </Card>

        {/* Completed Appointments - Receipt Ready */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-staff" />
              <span>Receipt Ready</span>
            </CardTitle>
            <CardDescription>Completed appointments that need receipts</CardDescription>
          </CardHeader>
          <CardContent>
            {completedAppointments.length > 0 ? (
              <div className="space-y-3">
                {completedAppointments.slice(0, 3).map((appointment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-slate-900">{appointment.patient?.name || 'Unknown Patient'}</h4>
                      <p className="text-sm text-slate-600">
                        {new Date(appointment.appointment_date).toLocaleDateString()} • 
                        {new Date(`1970-01-01T${appointment.start_time}`).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/staff/create-receipt/${appointment.id}`)}
                      className="text-green-700 border-green-200 hover:bg-green-100"
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Create Receipt
                    </Button>
                  </div>
                ))}
                {completedAppointments.length > 3 && (
                  <p className="text-sm text-gray-600 text-center">
                    +{completedAppointments.length - 3} more completed appointments
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No completed appointments</p>
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-4"
              onClick={() => navigate('/staff/appointments')}
            >
              View All Appointments
            </Button>
          </CardContent>
        </Card>
      </div>


      {/* Product Gallery */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ShoppingBag className="h-5 w-5 text-staff" />
            <span>Product Gallery Management</span>
          </CardTitle>
          <CardDescription>Manage products available for customer reservations</CardDescription>
        </CardHeader>
        <CardContent>
          <ProductGalleryLocalStorage />
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffDashboard;
