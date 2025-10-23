import axios from 'axios';
import { Product, ProductFormData, ProductCategory } from '@/features/products/types/product.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
const API_BASE = `${API_BASE_URL}`;

// Include auth token if present
axios.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Get all products with optional filters
 */
export const getProducts = async (search = '', categoryId?: number, isActive?: boolean): Promise<Product[]> => {
  const response = await axios.get(`${API_BASE}/products`, {
    params: { 
      search,
      category: categoryId, // Changed from category_id to category to match our API
      active: isActive,
    },
  });
  return response.data.data || response.data; // Handle both response formats
};

/**
 * Get a single product by ID
 */
export const getProduct = async (id: string | number): Promise<Product> => {
  const response = await axios.get(`${API_BASE}/${id}`);
  return response.data;
};

/**
 * Create a new product
 */
export const createProduct = async (productData: ProductFormData | FormData): Promise<Product> => {
  // If already FormData, use it directly; otherwise create FormData from object
  const formData = productData instanceof FormData ? productData : (() => {
    const fd = new FormData();
    
    // Append text fields
    fd.append('name', productData.name);
    fd.append('description', productData.description || '');
    fd.append('price', productData.price.toString());
    fd.append('stock_quantity', productData.stock_quantity.toString());
    
    // Append optional fields
    if (productData.category_id) {
      fd.append('category_id', productData.category_id.toString());
    }
    if (productData.brand) {
      fd.append('brand', productData.brand);
    }
    if (productData.model) {
      fd.append('model', productData.model);
    }
    if (productData.sku) {
      fd.append('sku', productData.sku);
    }
    if (productData.branch_id) {
      fd.append('branch_id', productData.branch_id.toString());
    }
    if (productData.is_active !== undefined) {
      fd.append('is_active', productData.is_active ? '1' : '0');
    }
    
    // Append image files
    if (productData.images && productData.images.length > 0) {
      productData.images.forEach((file, index) => {
        fd.append(`images[${index}]`, file);
      });
    }
    
    return fd;
  })();
  
  const response = await axios.post(`${API_BASE}/products`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

/**
 * Update an existing product
 */
export const updateProduct = async (id: string | number, productData: ProductFormData | FormData): Promise<Product> => {
  // If already FormData, use it directly; otherwise create FormData from object
  const formData = productData instanceof FormData ? productData : (() => {
    const fd = new FormData();
    
    // Append text fields
    fd.append('name', productData.name);
    fd.append('description', productData.description || '');
    fd.append('price', productData.price.toString());
    fd.append('stock_quantity', productData.stock_quantity.toString());
    
    // Append optional fields
    if (productData.category_id) {
      fd.append('category_id', productData.category_id.toString());
    }
    if (productData.brand) {
      fd.append('brand', productData.brand);
    }
    if (productData.model) {
      fd.append('model', productData.model);
    }
    if (productData.sku) {
      fd.append('sku', productData.sku);
    }
    if (productData.branch_id) {
      fd.append('branch_id', productData.branch_id.toString());
    }
    if (productData.is_active !== undefined) {
      fd.append('is_active', productData.is_active ? '1' : '0');
    }
    
    // Append new image files (if any)
    if (productData.images && productData.images.length > 0) {
      productData.images.forEach((file, index) => {
        fd.append(`images[${index}]`, file);
      });
    }
    
    return fd;
  })();
  
  const response = await axios.put(`${API_BASE}/products?id=${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

/**
 * Delete a product (soft delete)
 */
export const deleteProduct = async (id: string | number): Promise<void> => {
  const response = await axios.delete(`${API_BASE}/products?id=${id}`);
  return response.data;
};

/**
 * Get all product categories
 */
export const getProductCategories = async (): Promise<ProductCategory[]> => {
  const response = await axios.get(`${API_BASE}/product-categories`);
  return response.data.data || response.data; // Handle both response formats
};
