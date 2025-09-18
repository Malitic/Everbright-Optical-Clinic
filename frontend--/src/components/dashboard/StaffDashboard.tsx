import React from 'react';
import { Calendar, Package, Users, Bell, Clock, AlertTriangle, ShoppingBag } from 'lucide-react';
import { DashboardCard } from './DashboardCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { ProductGalleryLocalStorage } from '@/features/products/components/ProductGalleryLocalStorage';

const StaffDashboard = () => {
  const navigate = useNavigate();

  const inventoryData = [
    { category: 'Contact Lenses', current: 75, max: 100, status: 'good' },
    { category: 'Frames', current: 45, max: 80, status: 'low' },
    { category: 'Eye Drops', current: 20, max: 50, status: 'critical' },
    { category: 'Cleaning Solutions', current: 60, max: 70, status: 'good' }
  ];

  const todayAppointments = [
    { time: '9:00 AM', patient: 'Alice Johnson', type: 'Checkup', status: 'completed' },
    { time: '10:30 AM', patient: 'Bob Smith', type: 'Fitting', status: 'in-progress' },
    { time: '2:00 PM', patient: 'Carol Davis', type: 'Follow-up', status: 'pending' },
    { time: '3:30 PM', patient: 'David Wilson', type: 'Emergency', status: 'urgent' }
  ];

  const pendingNotifications = [
    { type: 'reminder', message: 'Follow-up reminder for John Doe', priority: 'medium' },
    { type: 'stock', message: 'Contact lenses running low', priority: 'high' },
    { type: 'appointment', message: '3 appointment confirmations needed', priority: 'low' }
  ];

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
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
          value="156"
          description="Items in stock"
          icon={Package}
          trend={{ value: -5, label: 'items low', isPositive: false }}
          action={{
            label: 'Update Stock',
            onClick: () => navigate('/staff/inventory'),
            variant: 'staff'
          }}
          gradient
        />
        
        <DashboardCard
          title="Active Patients"
          value="89"
          description="Currently registered"
          icon={Users}
          action={{
            label: 'View All',
            onClick: () => navigate('/staff/patients'),
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
            {inventoryData.map((item, index) => {
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
            })}
            <Button variant="outline" size="sm" className="w-full">
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
            <Button variant="outline" size="sm" className="w-full mt-4">
              Manage All Appointments
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Notifications */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-staff" />
              <span>Pending Notifications</span>
            </CardTitle>
            <CardDescription>Actions requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingNotifications.map((notification, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {notification.priority === 'high' && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    {notification.priority === 'medium' && (
                      <Clock className="h-4 w-4 text-yellow-500" />
                    )}
                    {notification.priority === 'low' && (
                      <Bell className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm text-slate-900">{notification.message}</p>
                      <Badge className={getPriorityColor(notification.priority)}>
                        {notification.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="staff" size="sm" className="w-full mt-4">
              Send Notifications
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
