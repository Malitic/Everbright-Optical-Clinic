import React, { useState, useEffect } from 'react';
import { Bell, Calendar, Eye, Package, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const NotificationCenter = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markNotificationAsRead, 
    markAllNotificationsAsRead,
    refreshNotifications 
  } = useNotifications();

  // Refresh notifications when component mounts
  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  // Filter notifications based on user role
  const filteredNotifications = user?.role === 'customer'
    ? notifications.filter(n => ['appointment', 'prescription', 'reminder'].includes(n.type || ''))
    : notifications;

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'appointment': return Calendar;
      case 'prescription': return Eye;
      case 'inventory': return Package;
      case 'system': return Bell;
      case 'reminder': return Bell;
      default: return Bell;
    }
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'appointment': return 'bg-blue-100 text-blue-800';
      case 'prescription': return 'bg-purple-100 text-purple-800';
      case 'inventory': return 'bg-orange-100 text-orange-800';
      case 'system': return 'bg-slate-100 text-slate-800';
      case 'reminder': return 'bg-green-100 text-green-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await markNotificationAsRead(id);
      toast({
        title: "Notification marked as read",
        description: "The notification has been updated."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark notification as read.",
        variant: "destructive"
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      toast({
        title: "All notifications marked as read",
        description: "Your notification list has been updated."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read.",
        variant: "destructive"
      });
    }
  };

  const urgentCount = filteredNotifications.filter(n => n.status === 'unread').length;

  const NotificationCard = ({ notification }: { notification: any }) => {
    const Icon = getTypeIcon(notification.type);
    
    return (
      <Card className={`transition-all duration-200 hover:shadow-md ${notification.status === 'unread' ? 'border-l-4 border-l-primary bg-primary/5' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className={`p-2 rounded-full ${getTypeColor(notification.type)}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center space-x-2">
                  <h3 className={`font-medium ${notification.status === 'unread' ? 'font-semibold' : ''}`}>
                    {notification.title}
                  </h3>
                  <Badge variant={notification.status === 'unread' ? 'default' : 'secondary'}>
                    {notification.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{notification.message}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {notification.status === 'unread' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              )}
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
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead}>
              Mark All as Read
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading notifications...</span>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
            <p className="text-gray-600">You'll see notifications here when they arrive.</p>
          </CardContent>
        </Card>
      ) : (
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
            {filteredNotifications.filter(n => n.status === 'unread').map(notification => (
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
      )}
    </div>
  );
};

export default NotificationCenter;
