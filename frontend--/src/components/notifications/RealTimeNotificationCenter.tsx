import React, { useState, useEffect } from 'react';
import { Bell, X, AlertTriangle, CheckCircle, Info, AlertCircle, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  data?: any;
  read?: boolean;
}

const RealTimeNotificationCenter: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const { isConnected, lastNotification } = useWebSocket({
    onAppointmentCreated: (data) => {
      addNotification({
        id: `appointment-${data.id}-${Date.now()}`,
        type: 'appointment-created',
        message: data.message,
        timestamp: data.timestamp,
        data,
        read: false
      });
    },
    onAppointmentUpdated: (data) => {
      addNotification({
        id: `appointment-${data.id}-${Date.now()}`,
        type: 'appointment-updated',
        message: data.message,
        timestamp: data.timestamp,
        data,
        read: false
      });
    },
    onAppointmentCancelled: (data) => {
      addNotification({
        id: `appointment-${data.id}-${Date.now()}`,
        type: 'appointment-cancelled',
        message: data.message,
        timestamp: data.timestamp,
        data,
        read: false
      });
    },
    onInventoryLowStock: (data) => {
      addNotification({
        id: `inventory-${data.product.id}-${Date.now()}`,
        type: 'inventory-low-stock',
        message: data.message,
        timestamp: data.timestamp,
        data,
        read: false
      });
    },
    onGeneralNotification: (data) => {
      addNotification({
        id: data.id,
        type: 'general',
        message: data.message,
        timestamp: data.timestamp,
        data,
        read: false
      });
    },
    onAlertNotification: (data) => {
      addNotification({
        id: data.id,
        type: 'alert',
        message: data.message,
        timestamp: data.timestamp,
        data,
        read: false
      });
    },
    onUrgentNotification: (data) => {
      addNotification({
        id: data.id,
        type: 'urgent',
        message: data.message,
        timestamp: data.timestamp,
        data,
        read: false
      });
    }
  });

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep only last 50 notifications
    setUnreadCount(prev => prev + 1);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  };

  const removeNotification = (notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment-created':
      case 'appointment-completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'appointment-cancelled':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'inventory-low-stock':
      case 'urgent':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'alert':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'appointment-created':
      case 'appointment-completed':
        return 'border-l-green-500';
      case 'appointment-cancelled':
        return 'border-l-yellow-500';
      case 'inventory-low-stock':
      case 'urgent':
        return 'border-l-red-500';
      case 'alert':
        return 'border-l-orange-500';
      default:
        return 'border-l-blue-500';
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
        {!isConnected && (
          <div className="absolute -bottom-1 -right-1">
            <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
          </div>
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-10 w-80 z-50">
          <Card className="shadow-lg border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Notifications</CardTitle>
                <div className="flex items-center gap-2">
                  {!isConnected && (
                    <Badge variant="destructive" className="text-xs">
                      <Activity className="h-3 w-3 mr-1" />
                      Offline
                    </Badge>
                  )}
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-6 px-2"
                      onClick={markAllAsRead}
                    >
                      Mark all read
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-96">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No notifications yet
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`relative border-l-4 ${getNotificationColor(notification.type)} ${
                          !notification.read ? 'bg-muted/50' : ''
                        } rounded-r-lg p-3 transition-colors hover:bg-muted/30`}
                      >
                        <div className="flex items-start gap-3">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground leading-relaxed">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {!notification.read && (
                              <div className="h-2 w-2 bg-primary rounded-full" />
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => removeNotification(notification.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default RealTimeNotificationCenter;
