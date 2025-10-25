// Service Worker for Everbright Optical Clinic
// Provides offline functionality and caching

const CACHE_NAME = 'everbright-optical-v1';
const STATIC_CACHE = 'everbright-static-v1';
const DYNAMIC_CACHE = 'everbright-dynamic-v1';

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/offline.html'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/products/,
  /\/api\/branches/,
  /\/api\/appointments/,
  /\/api\/prescriptions/
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker installed');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static file requests
  if (request.method === 'GET') {
    event.respondWith(handleStaticRequest(request));
    return;
  }
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', request.url);
    
    // Fall back to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for API calls
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'This feature is not available offline',
        offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle static file requests with cache-first strategy
async function handleStaticRequest(request) {
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // Try network
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    // Return a generic offline response
    return new Response('Offline', { status: 503 });
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'appointment-sync') {
    event.waitUntil(syncAppointments());
  } else if (event.tag === 'prescription-sync') {
    event.waitUntil(syncPrescriptions());
  } else if (event.tag === 'feedback-sync') {
    event.waitUntil(syncFeedback());
  }
});

// Sync offline appointments
async function syncAppointments() {
  try {
    const offlineAppointments = await getOfflineData('offline-appointments');
    
    for (const appointment of offlineAppointments) {
      try {
        await fetch('/api/appointments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${appointment.token}`
          },
          body: JSON.stringify(appointment.data)
        });
        
        // Remove from offline storage after successful sync
        await removeOfflineData('offline-appointments', appointment.id);
      } catch (error) {
        console.error('Failed to sync appointment:', error);
      }
    }
  } catch (error) {
    console.error('Failed to sync appointments:', error);
  }
}

// Sync offline prescriptions
async function syncPrescriptions() {
  try {
    const offlinePrescriptions = await getOfflineData('offline-prescriptions');
    
    for (const prescription of offlinePrescriptions) {
      try {
        await fetch('/api/prescriptions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${prescription.token}`
          },
          body: JSON.stringify(prescription.data)
        });
        
        // Remove from offline storage after successful sync
        await removeOfflineData('offline-prescriptions', prescription.id);
      } catch (error) {
        console.error('Failed to sync prescription:', error);
      }
    }
  } catch (error) {
    console.error('Failed to sync prescriptions:', error);
  }
}

// Sync offline feedback
async function syncFeedback() {
  try {
    const offlineFeedback = await getOfflineData('offline-feedback');
    
    for (const feedback of offlineFeedback) {
      try {
        await fetch('/api/feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(feedback.data)
        });
        
        // Remove from offline storage after successful sync
        await removeOfflineData('offline-feedback', feedback.id);
      } catch (error) {
        console.error('Failed to sync feedback:', error);
      }
    }
  } catch (error) {
    console.error('Failed to sync feedback:', error);
  }
}

// Helper functions for offline data management
async function getOfflineData(key) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const response = await cache.match(`/offline-data/${key}`);
  
  if (response) {
    return await response.json();
  }
  
  return [];
}

async function saveOfflineData(key, data) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const response = new Response(JSON.stringify(data));
  await cache.put(`/offline-data/${key}`, response);
}

async function removeOfflineData(key, id) {
  const data = await getOfflineData(key);
  const filteredData = data.filter(item => item.id !== id);
  await saveOfflineData(key, filteredData);
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'New notification from Everbright Optical',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-192x192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Everbright Optical', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});


