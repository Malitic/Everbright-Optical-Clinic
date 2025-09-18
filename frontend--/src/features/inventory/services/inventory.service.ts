import { InventoryItem, CreateInventoryItemRequest, UpdateInventoryItemRequest, InventoryFilters, LowStockAlert } from '../types/inventory.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export class InventoryService {
  private static async handleResponse(response: Response) {
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'An error occurred');
    }
    return response.json();
  }

  static async getInventory(filters?: InventoryFilters): Promise<InventoryItem[]> {
    const params = new URLSearchParams();
    
    if (filters?.category) params.append('category', filters.category);
    if (filters?.brand) params.append('brand', filters.brand);
    if (filters?.supplier) params.append('supplier', filters.supplier);
    if (filters?.lowStock) params.append('lowStock', 'true');
    if (filters?.search) params.append('search', filters.search);

    const queryString = params.toString();
    const url = `${API_BASE_URL}/inventory${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url);
    return this.handleResponse(response);
  }

  static async getInventoryItem(id: string): Promise<InventoryItem> {
    const response = await fetch(`${API_BASE_URL}/inventory/${id}`);
    return this.handleResponse(response);
  }

  static async createInventoryItem(data: CreateInventoryItemRequest): Promise<InventoryItem> {
    const response = await fetch(`${API_BASE_URL}/inventory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  static async updateInventoryItem(id: string, data: UpdateInventoryItemRequest): Promise<InventoryItem> {
    const response = await fetch(`${API_BASE_URL}/inventory/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  static async deleteInventoryItem(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/inventory/${id}`, {
      method: 'DELETE',
    });
    return this.handleResponse(response);
  }

  static async getLowStockItems(): Promise<LowStockAlert[]> {
    const response = await fetch(`${API_BASE_URL}/inventory/low-stock`);
    return this.handleResponse(response);
  }

  static async updateQuantity(id: string, quantity: number): Promise<InventoryItem> {
    const response = await fetch(`${API_BASE_URL}/inventory/${id}/quantity`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ quantity }),
    });
    return this.handleResponse(response);
  }
}
