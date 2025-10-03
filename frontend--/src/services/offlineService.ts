// Offline service for Everbright Optical Clinic
// Manages offline data storage and synchronization

interface OfflineData {
  id: string;
  data: any;
  timestamp: number;
  type: string;
  synced: boolean;
}

interface OfflineAction {
  id: string;
  action: string;
  endpoint: string;
  data: any;
  timestamp: number;
  retries: number;
}

class OfflineService {
  private dbName = 'EverbrightOpticalOffline';
  private version = 1;
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
  }

  /**
   * Initialize IndexedDB for offline storage
   */
  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('appointments')) {
          db.createObjectStore('appointments', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('prescriptions')) {
          db.createObjectStore('prescriptions', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('feedback')) {
          db.createObjectStore('feedback', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('products')) {
          db.createObjectStore('products', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('actions')) {
          db.createObjectStore('actions', { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Check if the app is online
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Store data offline
   */
  async storeOfflineData(storeName: string, data: any): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const offlineData: OfflineData = {
        id: data.id || Date.now().toString(),
        data,
        timestamp: Date.now(),
        type: storeName,
        synced: false
      };

      const request = store.put(offlineData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Retrieve offline data
   */
  async getOfflineData(storeName: string): Promise<OfflineData[]> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Remove offline data
   */
  async removeOfflineData(storeName: string, id: string): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Queue an action for when online
   */
  async queueAction(action: string, endpoint: string, data: any): Promise<void> {
    if (!this.db) await this.initDB();

    const offlineAction: OfflineAction = {
      id: Date.now().toString(),
      action,
      endpoint,
      data,
      timestamp: Date.now(),
      retries: 0
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['actions'], 'readwrite');
      const store = transaction.objectStore('actions');
      const request = store.put(offlineAction);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Process queued actions when online
   */
  async processQueuedActions(): Promise<void> {
    if (!this.isOnline()) return;

    const actions = await this.getOfflineData('actions');
    
    for (const action of actions) {
      try {
        await this.executeAction(action);
        await this.removeOfflineData('actions', action.id);
      } catch (error) {
        console.error('Failed to execute queued action:', error);
        
        // Increment retry count
        action.retries++;
        if (action.retries < 3) {
          await this.storeOfflineData('actions', action);
        } else {
          // Remove after 3 failed attempts
          await this.removeOfflineData('actions', action.id);
        }
      }
    }
  }

  /**
   * Execute a queued action
   */
  private async executeAction(action: OfflineAction): Promise<void> {
    const token = localStorage.getItem('token');
    
    const response = await fetch(action.endpoint, {
      method: action.action,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify(action.data)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  /**
   * Cache API response
   */
  async cacheApiResponse(endpoint: string, data: any): Promise<void> {
    const cacheKey = `api_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
    await this.storeOfflineData('products', { id: cacheKey, data });
  }

  /**
   * Get cached API response
   */
  async getCachedApiResponse(endpoint: string): Promise<any> {
    const cacheKey = `api_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const cached = await this.getOfflineData('products');
    const item = cached.find(c => c.id === cacheKey);
    return item ? item.data : null;
  }

  /**
   * Store appointment offline
   */
  async storeAppointmentOffline(appointmentData: any): Promise<void> {
    await this.storeOfflineData('appointments', appointmentData);
    
    if (!this.isOnline()) {
      await this.queueAction('POST', '/api/appointments', appointmentData);
    }
  }

  /**
   * Store prescription offline
   */
  async storePrescriptionOffline(prescriptionData: any): Promise<void> {
    await this.storeOfflineData('prescriptions', prescriptionData);
    
    if (!this.isOnline()) {
      await this.queueAction('POST', '/api/prescriptions', prescriptionData);
    }
  }

  /**
   * Store feedback offline
   */
  async storeFeedbackOffline(feedbackData: any): Promise<void> {
    await this.storeOfflineData('feedback', feedbackData);
    
    if (!this.isOnline()) {
      await this.queueAction('POST', '/api/feedback', feedbackData);
    }
  }

  /**
   * Get offline appointments
   */
  async getOfflineAppointments(): Promise<any[]> {
    const data = await this.getOfflineData('appointments');
    return data.map(item => item.data);
  }

  /**
   * Get offline prescriptions
   */
  async getOfflinePrescriptions(): Promise<any[]> {
    const data = await this.getOfflineData('prescriptions');
    return data.map(item => item.data);
  }

  /**
   * Get offline feedback
   */
  async getOfflineFeedback(): Promise<any[]> {
    const data = await this.getOfflineData('feedback');
    return data.map(item => item.data);
  }

  /**
   * Clear all offline data
   */
  async clearAllOfflineData(): Promise<void> {
    if (!this.db) await this.initDB();

    const storeNames = ['appointments', 'prescriptions', 'feedback', 'products', 'actions'];
    
    for (const storeName of storeNames) {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      await new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }

  /**
   * Get offline data summary
   */
  async getOfflineSummary(): Promise<{
    appointments: number;
    prescriptions: number;
    feedback: number;
    actions: number;
  }> {
    const [appointments, prescriptions, feedback, actions] = await Promise.all([
      this.getOfflineData('appointments'),
      this.getOfflineData('prescriptions'),
      this.getOfflineData('feedback'),
      this.getOfflineData('actions')
    ]);

    return {
      appointments: appointments.length,
      prescriptions: prescriptions.length,
      feedback: feedback.length,
      actions: actions.length
    };
  }

  /**
   * Register service worker
   */
  async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available, notify user
                this.notifyUpdateAvailable();
              }
            });
          }
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  /**
   * Notify user about available update
   */
  private notifyUpdateAvailable(): void {
    if (confirm('A new version of the app is available. Would you like to update?')) {
      window.location.reload();
    }
  }

  /**
   * Setup online/offline event listeners
   */
  setupEventListeners(): void {
    window.addEventListener('online', () => {
      console.log('App is back online');
      this.processQueuedActions();
    });

    window.addEventListener('offline', () => {
      console.log('App is offline');
    });
  }
}

export const offlineService = new OfflineService();


