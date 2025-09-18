import React, { useState } from 'react';
import { Bell, Calendar, Eye, Package, Users, CheckCircle, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface Notification {
  id: string;
  type: 'appointment' | 'prescription' | 'inventory' | 'system' | 'reminder';
  title: string;
  message: string;
  date: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  actionRequired?: boolean;
}

const NotificationCenter = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'appointment',
      title: 'Upcoming Appointment',
      message: 'You have an appointment with Dr. Sarah Johnson tomorrow at 10:00 AM',
      date: '2024-02-14',
      read: false,
      priority: 'high',
      actionRequired: true
    },
    {
      id: '2',
      type: 'prescription',
      title: 'Prescription Renewal Due',
      message: 'Your prescription RX-2024-001 expires in 30 days. Schedule a renewal appointment.',
      date: '2024-02-13',
      read: false,
      priority: 'medium',
      actionRequired: true
    },
    {
      id: '3',
      type: 'inventory',
      title: 'Low Stock Alert',
      message: 'Crizal Prevencia Lenses are running low (3 units remaining)',
      date: '2024-02-12',
      read: true,
      priority: 'medium',
      actionRequired: false
    },
    {
      id: '4',
      type: 'reminder',
      title: 'Annual Eye Exam Due',
      message: 'It\'s been 11 months since your last comprehensive eye exam',
      date: '2024-02-10',
      read: false,
      priority: 'low',
      actionRequired: false
    },
    {
      id: '5',
      type: 'system',
      title: 'System Maintenance',
      message: 'Scheduled system maintenance on Sunday, February 18th from 2:00-4:00 AM',
      date: '2024-02-09',
      read: true,
      priority: 'low',
      actionRequired: false
    }
  ]);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Filter notifications based on user role
  const filteredNotifications = user?.role === 'customer'
    ? notifications.filter(n => ['appointment', 'prescription', 'reminder'].includes(n.type))
    : notifications;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'appointment': return Calendar;
      case 'prescription': return Eye;
      case 'inventory': return Package;
      case 'system': return Bell;
      case 'reminder': return Bell;
      default: return Bell;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'appointment': return 'bg-blue-100 text-blue-800';
      case 'prescription': return 'bg-purple-100 text-purple-800';
      case 'inventory': return 'bg-orange-100 text-orange-800';
      case 'system': return 'bg-slate-100 text-slate-800';
      case 'reminder': return 'bg-green-100 text-green-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    toast({
      title: "All notifications marked as read",
      description: "Your notification list has been updated."
    });
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
    toast({
      title: "Notification deleted",
      description: "The notification has been removed."
    });
  };

  const unreadCount = filteredNotifications.filter(n => !n.read).length;
  const urgentCount = filteredNotifications.filter(n => n.priority === 'high' && !n.read).length;

  const NotificationCard = ({ notification }: { notification: Notification }) => {
    const Icon = getTypeIcon(notification.type);
    
    return (
      <Card className={`transition-all duration-200 hover:shadow-md ${!notification.read ? 'border-l-4 border-l-primary bg-primary/5' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className={`p-2 rounded-full ${getTypeColor(notification.type)}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center space-x-2">
                  <h3 className={`font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                    {notification.title}
                  </h3>
                  <Badge className={getPriorityColor(notification.priority)}>
                    {notification.priority}
                  </Badge>
                  {notification.actionRequired && (
                    <Badge variant="outline" className="text-red-600 border-red-200">
                      Action Required
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{notification.message}</p>
                <p className="text-xs text-muted-foreground">{notification.date}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {!notification.read && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAsRead(notification.id)}
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteNotification(notification.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Bell className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Notification Center</h1>
          {unreadCount > 0 && (
            <Badge className="bg-red-500 text-white">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        <div className="flex space-x-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Create Notification
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Notification</DialogTitle>
                <DialogDescription>
                  Send a notification to users or set a reminder.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select notification type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="appointment">Appointment</SelectItem>
                      <SelectItem value="prescription">Prescription</SelectItem>
                      <SelectItem value="inventory">Inventory</SelectItem>
                      <SelectItem value="reminder">Reminder</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" placeholder="Notification title" />
                </div>
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" placeholder="Notification message" rows={3} />
                </div>
                <Button className="w-full">Send Notification</Button>
              </div>
            </DialogContent>
          </Dialog>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead}>
              Mark All as Read
            </Button>
          )}
        </div>
      </div>

      {urgentCount > 0 && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Urgent Notifications ({urgentCount})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredNotifications
                .filter(n => n.priority === 'high' && !n.read)
                .map(notification => (
                  <NotificationCard key={notification.id} notification={notification} />
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="all" className="w-full">
        <TabsList className={`grid w-full ${user?.role === 'customer' ? 'grid-cols-4' : 'grid-cols-6'}`}>
          <TabsTrigger value="all">All ({filteredNotifications.length})</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
          <TabsTrigger value="appointment">Appointments ({filteredNotifications.filter(n => n.type === 'appointment').length})</TabsTrigger>
          <TabsTrigger value="prescription">Prescriptions ({filteredNotifications.filter(n => n.type === 'prescription').length})</TabsTrigger>
          {user?.role !== 'customer' && (
            <>
              <TabsTrigger value="inventory">Inventory ({filteredNotifications.filter(n => n.type === 'inventory').length})</TabsTrigger>
              <TabsTrigger value="system">System ({filteredNotifications.filter(n => n.type === 'system').length})</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredNotifications.map(notification => (
            <NotificationCard key={notification.id} notification={notification} />
          ))}
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          {filteredNotifications.filter(n => !n.read).map(notification => (
            <NotificationCard key={notification.id} notification={notification} />
          ))}
        </TabsContent>

        <TabsContent value="appointment" className="space-y-4">
          {filteredNotifications.filter(n => n.type === 'appointment').map(notification => (
            <NotificationCard key={notification.id} notification={notification} />
          ))}
        </TabsContent>

        <TabsContent value="prescription" className="space-y-4">
          {filteredNotifications.filter(n => n.type === 'prescription').map(notification => (
            <NotificationCard key={notification.id} notification={notification} />
          ))}
        </TabsContent>

        {user?.role !== 'customer' && (
          <>
            <TabsContent value="inventory" className="space-y-4">
              {filteredNotifications.filter(n => n.type === 'inventory').map(notification => (
                <NotificationCard key={notification.id} notification={notification} />
              ))}
            </TabsContent>

            <TabsContent value="system" className="space-y-4">
              {filteredNotifications.filter(n => n.type === 'system').map(notification => (
                <NotificationCard key={notification.id} notification={notification} />
              ))}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

export default NotificationCenter;
