import { io, Socket } from 'socket.io-client';

interface NotificationData {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  data?: any;
}

interface AppointmentNotification {
  id: number;
  type: string;
  message: string;
  appointment: {
    id: number;
    date: string;
    time: string;
    status: string;
    patient?: {
      id: number;
      name: string;
      email: string;
    };
    optometrist?: {
      id: number;
      name: string;
    };
    branch?: {
      id: number;
      name: string;
    };
  };
  timestamp: string;
}

interface InventoryNotification {
  type: string;
  message: string;
  product: {
    id: number;
    name: string;
    sku: string;
    image: string;
  };
  branch: {
    id: number;
    name: string;
    address: string;
  };
  stock: {
    current_level: number;
    threshold: number;
    status: 'low' | 'normal';
  };
  timestamp: string;
}

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.connect();
  }

  private connect(): void {
    const token = localStorage.getItem('token') || sessionStorage.getItem('auth_token');
    
    if (!token) {
      console.warn('No authentication token found, WebSocket connection delayed');
      return;
    }

    try {
      this.socket = io(import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:6001', {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('Failed to connect to WebSocket server:', error);
      this.handleReconnect();
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.handleReconnect();
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    });

    // Appointment notifications
    this.socket.on('appointment.created', (data: AppointmentNotification) => {
      this.emit('appointment-created', data);
      this.showNotification(data.message, 'success');
    });

    this.socket.on('appointment.updated', (data: AppointmentNotification) => {
      this.emit('appointment-updated', data);
      this.showNotification(data.message, 'info');
    });

    this.socket.on('appointment.cancelled', (data: AppointmentNotification) => {
      this.emit('appointment-cancelled', data);
      this.showNotification(data.message, 'warning');
    });

    this.socket.on('appointment.completed', (data: AppointmentNotification) => {
      this.emit('appointment-completed', data);
      this.showNotification(data.message, 'success');
    });

    // Inventory notifications
    this.socket.on('inventory.low_stock', (data: InventoryNotification) => {
      this.emit('inventory-low-stock', data);
      this.showNotification(data.message, 'error');
    });

    this.socket.on('inventory.restocked', (data: InventoryNotification) => {
      this.emit('inventory-restocked', data);
      this.showNotification(data.message, 'success');
    });

    this.socket.on('inventory.out_of_stock', (data: InventoryNotification) => {
      this.emit('inventory-out-of-stock', data);
      this.showNotification(data.message, 'error');
    });

    // General notifications
    this.socket.on('notification.general', (data: NotificationData) => {
      this.emit('general-notification', data);
      this.showNotification(data.message, 'info');
    });

    this.socket.on('notification.alert', (data: NotificationData) => {
      this.emit('alert-notification', data);
      this.showNotification(data.message, 'warning');
    });

    this.socket.on('notification.urgent', (data: NotificationData) => {
      this.emit('urgent-notification', data);
      this.showNotification(data.message, 'error');
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);

    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // Max 30 seconds
  }

  private showNotification(message: string, type: 'success' | 'info' | 'warning' | 'error'): void {
    // Import toast dynamically to avoid circular dependencies
    import('sonner').then(({ toast }) => {
      switch (type) {
        case 'success':
          toast.success(message);
          break;
        case 'info':
          toast.info(message);
          break;
        case 'warning':
          toast.warning(message);
          break;
        case 'error':
          toast.error(message);
          break;
      }
    }).catch(() => {
      // Fallback to console if toast is not available
      console.log(`[${type.toUpperCase()}] ${message}`);
    });
  }

  // Event emitter functionality
  public on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  public off(event: string, callback: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket event listener for ${event}:`, error);
        }
      });
    }
  }

  // Public methods
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  public reconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;
    this.connect();
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  // Join specific channels
  public joinChannel(channel: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join', channel);
    }
  }

  public leaveChannel(channel: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave', channel);
    }
  }

  // Send custom events
  public emitEvent(event: string, data: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;
export type { NotificationData, AppointmentNotification, InventoryNotification };
