import React, { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, AlertCircle, CheckCircle, X, Send, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';

interface Notification {
  id: number;
  type: string;
  subject: string;
  message: string;
  sent_at: string;
  read: boolean;
}

const EnhancedNotificationCenter = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [sendNotificationOpen, setSendNotificationOpen] = useState(false);
  const [customNotification, setCustomNotification] = useState({
    user_id: '',
    subject: '',
    message: '',
    type: 'general'
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications/history', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendAppointmentReminders = async () => {
    try {
      const response = await fetch('/api/notifications/send-appointment-reminders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
      } else {
        toast.error('Failed to send appointment reminders');
      }
    } catch (error) {
      toast.error('Failed to send appointment reminders');
    }
  };

  const sendPrescriptionExpiryNotifications = async () => {
    try {
      const response = await fetch('/api/notifications/send-prescription-expiry', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
      } else {
        toast.error('Failed to send prescription expiry notifications');
      }
    } catch (error) {
      toast.error('Failed to send prescription expiry notifications');
    }
  };

  const sendLowStockNotifications = async () => {
    try {
      const response = await fetch('/api/notifications/send-low-stock', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
      } else {
        toast.error('Failed to send low stock notifications');
      }
    } catch (error) {
      toast.error('Failed to send low stock notifications');
    }
  };

  const sendCustomNotification = async () => {
    try {
      const response = await fetch('/api/notifications/send-custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(customNotification)
      });
      
      if (response.ok) {
        toast.success('Custom notification sent successfully');
        setSendNotificationOpen(false);
        setCustomNotification({ user_id: '', subject: '', message: '', type: 'general' });
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to send custom notification');
      }
    } catch (error) {
      toast.error('Failed to send custom notification');
    }
  };

  const markAsRead = async (id: number) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        setNotifications(notifications.map(notification =>
          notification.id === id ? { ...notification, read: true } : notification
        ));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Bell className="h-4 w-4" />;
      case 'prescription':
        return <CheckCircle className="h-4 w-4" />;
      case 'inventory':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notification.read;
    return notification.type === activeTab;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const isAdminOrStaff = user?.role === 'admin' || user?.role === 'staff';

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Bell className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Notification Center</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={fetchNotifications} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {isAdminOrStaff && (
            <Dialog open={sendNotificationOpen} onOpenChange={setSendNotificationOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Send className="h-4 w-4 mr-2" />
                  Send Notification
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Send Custom Notification</DialogTitle>
                  <DialogDescription>
                    Send a custom notification to a specific user.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="user_id" className="text-right">
                      User ID
                    </Label>
                    <Input
                      id="user_id"
                      value={customNotification.user_id}
                      onChange={(e) => setCustomNotification({...customNotification, user_id: e.target.value})}
                      className="col-span-3"
                      placeholder="Enter user ID"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right">
                      Type
                    </Label>
                    <Select value={customNotification.type} onValueChange={(value) => setCustomNotification({...customNotification, type: value})}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="appointment">Appointment</SelectItem>
                        <SelectItem value="prescription">Prescription</SelectItem>
                        <SelectItem value="inventory">Inventory</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="subject" className="text-right">
                      Subject
                    </Label>
                    <Input
                      id="subject"
                      value={customNotification.subject}
                      onChange={(e) => setCustomNotification({...customNotification, subject: e.target.value})}
                      className="col-span-3"
                      placeholder="Notification subject"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="message" className="text-right">
                      Message
                    </Label>
                    <Textarea
                      id="message"
                      value={customNotification.message}
                      onChange={(e) => setCustomNotification({...customNotification, message: e.target.value})}
                      className="col-span-3"
                      placeholder="Notification message"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={sendCustomNotification}>Send Notification</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Admin/Staff Controls */}
      {isAdminOrStaff && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Automated Notifications</CardTitle>
            <CardDescription>
              Send automated notifications to users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button onClick={sendAppointmentReminders} variant="outline" className="h-auto p-4">
                <div className="text-center">
                  <Bell className="h-6 w-6 mx-auto mb-2" />
                  <div className="font-medium">Appointment Reminders</div>
                  <div className="text-sm text-gray-500">Send reminders for tomorrow's appointments</div>
                </div>
              </Button>
              <Button onClick={sendPrescriptionExpiryNotifications} variant="outline" className="h-auto p-4">
                <div className="text-center">
                  <CheckCircle className="h-6 w-6 mx-auto mb-2" />
                  <div className="font-medium">Prescription Expiry</div>
                  <div className="text-sm text-gray-500">Notify about expiring prescriptions</div>
                </div>
              </Button>
              <Button onClick={sendLowStockNotifications} variant="outline" className="h-auto p-4">
                <div className="text-center">
                  <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                  <div className="font-medium">Low Stock Alerts</div>
                  <div className="text-sm text-gray-500">Alert staff about low inventory</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="appointment">Appointments</TabsTrigger>
          <TabsTrigger value="prescription">Prescriptions</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </CardContent>
              </Card>
            ) : filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Bell className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                  <p className="text-gray-500 text-center">
                    {activeTab === 'unread' 
                      ? "You're all caught up! No unread notifications."
                      : "No notifications to show for this category."
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map((notification) => (
                <Card key={notification.id} className={`transition-all duration-200 ${
                  !notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={`p-2 rounded-full ${
                          !notification.read ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className={`font-medium ${
                              !notification.read ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.subject}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {notification.type}
                            </Badge>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(notification.sent_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {!notification.read && (
                          <Button
                            onClick={() => markAsRead(notification.id)}
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            Mark as Read
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedNotificationCenter;

