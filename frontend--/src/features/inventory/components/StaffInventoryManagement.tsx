import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Bell,
  Building,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

interface InventoryItem {
  id: string;
  branch_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  min_threshold: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  manufacturer_id?: string;
  unit_price?: number;
  description?: string;
  image_path?: string;
  last_restock_date?: string;
  expiry_date?: string;
  is_active: boolean;
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  product?: {
    id: string;
    name: string;
    sku: string;
    description?: string;
    image_path?: string;
    price: number;
    is_active: boolean;
  };
}

interface InventorySummary {
  total_items: number;
  in_stock: number;
  low_stock: number;
  out_of_stock: number;
  total_value: number;
}

interface InventoryData {
  inventories: InventoryItem[];
  summary: InventorySummary;
}

const StaffInventoryManagement: React.FC = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    product_name: '',
    sku: '',
    description: '',
    quantity: '',
    min_threshold: '',
    unit_price: '',
    manufacturer_id: '',
    expiry_date: '',
    image_path: ''
  });

  const loadInventory = useCallback(async () => {
    if (!user?.branch_id) return;
    
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_BASE_URL}/inventory/enhanced?branch_id=${user.branch_id}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`,
        },
        timeout: 10000, // 10 second timeout
      });

      setInventory(response.data.inventories || []);
    } catch (err: any) {
      console.error('Error loading inventory:', err);
      setError(err.response?.data?.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [user?.branch_id]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleAddItem = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let imagePath = formData.image_path;
      
      // Upload image if a new file is selected
      if (imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('image', imageFile);
        uploadFormData.append('folder', 'products');

        const uploadResponse = await axios.post(`${API_BASE_URL}/upload/image`, uploadFormData, {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`,
            'Content-Type': 'multipart/form-data',
          },
        });

        imagePath = uploadResponse.data.image_path;
      }

      const payload = {
        ...formData,
        branch_id: user?.branch_id,
        image_path: imagePath,
        quantity: parseInt(formData.quantity),
        min_threshold: parseInt(formData.min_threshold),
        unit_price: parseFloat(formData.unit_price) || 0,
        manufacturer_id: formData.manufacturer_id || null,
        expiry_date: formData.expiry_date || null,
      };

      await axios.post(`${API_BASE_URL}/enhanced-inventory`, payload, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      setShowAddModal(false);
      resetForm();
      loadInventory();
    } catch (err: any) {
      console.error('Error adding item:', err);
      setError(err.response?.data?.message || 'Failed to add item');
    }
  }, [formData, imageFile, user?.branch_id, loadInventory]);

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    
    try {
      let imagePath = formData.image_path;
      
      // Upload image if a new file is selected
      if (imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('image', imageFile);
        uploadFormData.append('folder', 'products');

        const uploadResponse = await axios.post(`${API_BASE_URL}/upload/image`, uploadFormData, {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`,
            'Content-Type': 'multipart/form-data',
          },
        });

        imagePath = uploadResponse.data.image_path;
      }

      const payload = {
        ...formData,
        image_path: imagePath,
        quantity: parseInt(formData.quantity),
        min_threshold: parseInt(formData.min_threshold),
        unit_price: parseFloat(formData.unit_price) || 0,
        manufacturer_id: formData.manufacturer_id || null,
        expiry_date: formData.expiry_date || null,
      };

      await axios.put(`${API_BASE_URL}/enhanced-inventory/${selectedItem.id}`, payload, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      setShowEditModal(false);
      setSelectedItem(null);
      resetForm();
      loadInventory();
    } catch (err: any) {
      console.error('Error updating item:', err);
      setError(err.response?.data?.message || 'Failed to update item');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await axios.delete(`${API_BASE_URL}/enhanced-inventory/${id}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`,
        },
      });

      loadInventory();
    } catch (err: any) {
      console.error('Error deleting item:', err);
      setError(err.response?.data?.message || 'Failed to delete item');
    }
  };

  const handleSendAlert = async (item: InventoryItem) => {
    try {
      await axios.post(`${API_BASE_URL}/enhanced-inventory/${item.id}/alert`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      alert('Low stock alert sent to admin!');
    } catch (err: any) {
      console.error('Error sending alert:', err);
      setError(err.response?.data?.message || 'Failed to send alert');
    }
  };

  const resetForm = () => {
    setFormData({
      product_name: '',
      sku: '',
      description: '',
      quantity: '',
      min_threshold: '',
      unit_price: '',
      manufacturer_id: '',
      expiry_date: '',
      image_path: ''
    });
    setImageFile(null);
    setImagePreview(null);
  };

  const openEditModal = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormData({
      product_name: item.product_name,
      sku: item.sku,
      description: item.description || '',
      quantity: item.quantity.toString(),
      min_threshold: item.min_threshold.toString(),
      unit_price: item.unit_price?.toString() || '',
      manufacturer_id: item.manufacturer_id || '',
      expiry_date: item.expiry_date || '',
      image_path: item.image_path || ''
    });
    setImagePreview(item.image_path || null);
    setShowEditModal(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'bg-green-100 text-green-800';
      case 'low_stock': return 'bg-yellow-100 text-yellow-800';
      case 'out_of_stock': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = item.product_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                           item.sku.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [inventory, debouncedSearchTerm, statusFilter]);

  const inventoryStats = useMemo(() => {
    return {
      inStock: filteredInventory.filter(item => item.status === 'in_stock').length,
      lowStock: filteredInventory.filter(item => item.status === 'low_stock').length,
      outOfStock: filteredInventory.filter(item => item.status === 'out_of_stock').length,
    };
  }, [filteredInventory]);

  const LoadingSkeleton = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="p-6 space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
            <div>
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-12 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search Skeleton */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-48 h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Items Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Branch Inventory</h1>
              <p className="text-gray-600">Manage inventory for {user?.branch?.name || 'your branch'}</p>
            </div>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredInventory.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Stock</CardTitle>
              <div className="w-2 h-2 bg-green-500 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{inventoryStats.inStock}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{inventoryStats.lowStock}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
              <div className="w-2 h-2 bg-red-500 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{inventoryStats.outOfStock}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by product name or SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="in_stock">In Stock</SelectItem>
                    <SelectItem value="low_stock">Low Stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Inventory List */}
        <div className="space-y-4">
          {filteredInventory.map((item) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    {item.image_path ? (
                      <img
                        src={item.image_path.startsWith('http') ? item.image_path : `http://127.0.0.1:8000/storage/${item.image_path}`}
                        alt={item.product_name}
                        className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-product.png';
                        }}
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-lg truncate">{item.product_name}</h3>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <span className="font-medium">SKU:</span> {item.sku}
                      </div>
                      <div>
                        <span className="font-medium">Quantity:</span> {item.quantity}
                      </div>
                      <div>
                        <span className="font-medium">Min Threshold:</span> {item.min_threshold}
                      </div>
                      <div>
                        <span className="font-medium">Unit Price:</span> ₱{item.unit_price?.toFixed(2) || '0.00'}
                      </div>
                    </div>

                    {item.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.description}</p>
                    )}

                    {item.expiry_date && (
                      <p className="text-sm text-gray-500">
                        Expires: {new Date(item.expiry_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    {(item.status === 'low_stock' || item.status === 'out_of_stock') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendAlert(item)}
                        className="text-yellow-600 border-yellow-600 hover:bg-yellow-50 hover:text-yellow-700"
                      >
                        <Bell className="h-3 w-3 mr-1" />
                        Alert Admin
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(item)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredInventory.length === 0 && !loading && (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory items found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria.' 
                    : 'Get started by adding your first inventory item.'}
                </p>
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Add Item Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Inventory Item</DialogTitle>
              <DialogDescription>
                Add a new product to your branch inventory.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product_name">Product Name *</Label>
                  <Input
                    id="product_name"
                    value={formData.product_name}
                    onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({...formData, sku: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_threshold">Min Threshold *</Label>
                  <Input
                    id="min_threshold"
                    type="number"
                    value={formData.min_threshold}
                    onChange={(e) => setFormData({...formData, min_threshold: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manufacturer_id">Manufacturer ID</Label>
                <Input
                  id="manufacturer_id"
                  type="text"
                  value={formData.manufacturer_id}
                  onChange={(e) => setFormData({...formData, manufacturer_id: e.target.value})}
                  placeholder="Enter manufacturer ID (optional)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit_price">Unit Price</Label>
                  <Input
                    id="unit_price"
                    type="number"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({...formData, unit_price: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiry_date">Expiry Date</Label>
                  <Input
                    id="expiry_date"
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Product Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Item</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Item Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Inventory Item</DialogTitle>
              <DialogDescription>
                Update the inventory item details.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateItem} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_product_name">Product Name *</Label>
                  <Input
                    id="edit_product_name"
                    value={formData.product_name}
                    onChange={(e) => setFormData({...formData, product_name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_sku">SKU *</Label>
                  <Input
                    id="edit_sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({...formData, sku: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_description">Description</Label>
                <Textarea
                  id="edit_description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_quantity">Quantity *</Label>
                  <Input
                    id="edit_quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_min_threshold">Min Threshold *</Label>
                  <Input
                    id="edit_min_threshold"
                    type="number"
                    value={formData.min_threshold}
                    onChange={(e) => setFormData({...formData, min_threshold: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_manufacturer_id">Manufacturer ID</Label>
                <Input
                  id="edit_manufacturer_id"
                  type="text"
                  value={formData.manufacturer_id}
                  onChange={(e) => setFormData({...formData, manufacturer_id: e.target.value})}
                  placeholder="Enter manufacturer ID (optional)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_unit_price">Unit Price</Label>
                  <Input
                    id="edit_unit_price"
                    type="number"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({...formData, unit_price: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_expiry_date">Expiry Date</Label>
                  <Input
                    id="edit_expiry_date"
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_image">Product Image</Label>
                <Input
                  id="edit_image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Item</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default StaffInventoryManagement;
