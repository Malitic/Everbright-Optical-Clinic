// Utility to check if products have been deleted recently
export const shouldSkipRefresh = (): boolean => {
  const now = Date.now();
  const lastDeletionTime = sessionStorage.getItem('lastProductDeletion');
  const twoMinutesAgo = now - (2 * 60 * 1000);
  
  // Skip refresh if there was a deletion in the last 2 minutes
  return lastDeletionTime && parseInt(lastDeletionTime) > twoMinutesAgo;
};

// Utility to clear deletion protection (for manual refresh)
export const clearDeletionProtection = (): void => {
  sessionStorage.removeItem('lastProductDeletion');
};

// Utility to set deletion protection (called after successful deletion)
export const setDeletionProtection = (): void => {
  sessionStorage.setItem('lastProductDeletion', Date.now().toString());
};

// Utility to clear all product caches when products are deleted
export const clearProductCaches = (): void => {
  try {
    // Clear all localStorage product caches
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.includes('products') || key.includes('app_data_p') || key.includes('localStorage_products')) {
        localStorage.removeItem(key);
      }
    });
    
    // Clear sessionStorage product caches
    const sessionKeys = Object.keys(sessionStorage);
    sessionKeys.forEach(key => {
      if (key.includes('products') || key.includes('app_data_p')) {
        sessionStorage.removeItem(key);
      }
    });
    
    console.log('Product caches cleared after deletion');
  } catch (error) {
    console.error('Error clearing product caches:', error);
  }
};

// Utility to notify all components about product deletion
export const notifyProductDeletion = (productId: number): void => {
  // Dispatch custom event to notify all components
  const event = new CustomEvent('productDeleted', { 
    detail: { productId } 
  });
  window.dispatchEvent(event);
  
  // Clear caches
  clearProductCaches();
  
  // Set deletion protection
  setDeletionProtection();
};