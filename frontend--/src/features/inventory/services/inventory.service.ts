import { InventoryItem, CreateInventoryItemRequest, UpdateInventoryItemRequest, InventoryFilters, LowStockAlert } from '../types/inventory.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export class InventoryService {
  private static async handleResponse(response: Response) {
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'An error occurred');
    }
    return response.json();
  }

  static async getInventory(filters?: InventoryFilters): Promise<{inventory: InventoryItem[], summary: any}> {
    const params = new URLSearchParams();
    
    if (filters?.branch_id) params.append('branch_id', filters.branch_id);
    if (filters?.lowStock) params.append('low_stock', 'true');
    if (filters?.expiringSoon) params.append('expiring_soon', 'true');
    if (filters?.expired) params.append('expired', 'true');

    const queryString = params.toString();
    const url = `${API_BASE_URL}/inventory/enhanced${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
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
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ quantity }),
    });
    return this.handleResponse(response);
  }

  // Stock Transfer methods
  static async getStockTransfers(filters?: {status?: string, branch_id?: string}): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.branch_id) params.append('branch_id', filters.branch_id);

    const queryString = params.toString();
    const url = `${API_BASE_URL}/stock-transfers${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return this.handleResponse(response);
  }

  static async createStockTransfer(data: {
    product_id: number;
    from_branch_id: number;
    to_branch_id: number;
    quantity: number;
    reason?: string;
  }): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/stock-transfers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  static async approveStockTransfer(transferId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/stock-transfers/${transferId}/approve`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return this.handleResponse(response);
  }

  static async rejectStockTransfer(transferId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/stock-transfers/${transferId}/reject`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return this.handleResponse(response);
  }

  static async completeStockTransfer(transferId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/stock-transfers/${transferId}/complete`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return this.handleResponse(response);
  }

  static async cancelStockTransfer(transferId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/stock-transfers/${transferId}/cancel`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return this.handleResponse(response);
  }

  // Enhanced inventory methods
  static async getExpiringProducts(days: number = 30): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/inventory/expiring?days=${days}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return this.handleResponse(response);
  }

  static async getLowStockAlerts(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/inventory/low-stock-alerts`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return this.handleResponse(response);
  }

  static async processAutoRestock(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/inventory/auto-restock`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return this.handleResponse(response);
  }

  static async updateProductSettings(productId: number, settings: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/inventory/products/${productId}/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(settings),
    });
    return this.handleResponse(response);
  }

  static async getInventoryAnalytics(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/inventory/analytics`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return this.handleResponse(response);
  }
}
