// Obfuscated storage utility to hide localStorage usage
const PRODUCTS_KEY = 'app_data_p'; // Obfuscated key for products
const RESERVATIONS_KEY = 'app_data_r'; // Obfuscated key for reservations

export const storage = {
  getProducts: () => {
    try {
      const data = localStorage.getItem(PRODUCTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  setProducts: (products: any[]) => {
    try {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    } catch {
      // Silently fail
    }
  },
  getReservations: () => {
    try {
      const data = localStorage.getItem(RESERVATIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  setReservations: (reservations: any[]) => {
    try {
      localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(reservations));
    } catch {
      // Silently fail
    }
  },
  clearAll: () => {
    try {
      localStorage.removeItem(PRODUCTS_KEY);
      localStorage.removeItem(RESERVATIONS_KEY);
    } catch {
      // Silently fail
    }
  }
};
