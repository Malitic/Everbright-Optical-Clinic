import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Upload, Save, X, Building2, Package, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { getProducts, createProduct, updateProduct, deleteProduct } from '@/services/productApi';
import { useBranch } from '@/contexts/BranchContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BranchFilter from '@/components/common/BranchFilter';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  image_paths: string[];
  is_active: boolean;
}

interface BranchStock {
  id?: number;
  product_id: number;
  branch_id: number;
  stock_quantity: number;
  reserved_quantity?: number;
  branch: {
    id: number;
    name: string;
    code?: string;
  };
}

const AdminProductManagement: React.FC = () => {
  const { selectedBranchId } = useBranch();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    is_active: true
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [branchStock, setBranchStock] = useState<BranchStock[]>([]);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [branches, setBranches] = useState<Array<{ id: number; name: string; code: string }>>([]);
  const [isLoadingStock, setIsLoadingStock] = useState<boolean>(false);
  const [editQuantities, setEditQuantities] = useState<Record<number, number>>({}); // key: branch_id
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProductsList();
  }, [selectedBranchId]);

  const fetchProductsList = async () => {
    try {
      setLoading(true);
      // Get products without search filter for now
      const data = await getProducts('');
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    
    if (!formData.price || parseFloat(formData.price) < 0) {
      toast.error('Valid price is required');
      return;
    }
    
    if (!formData.stock_quantity || parseInt(formData.stock_quantity) < 0) {
      toast.error('Valid stock quantity is required');
      return;
    }
    
    try {
      const fd = new FormData();
      fd.append('name', formData.name.trim());
      fd.append('description', formData.description.trim());
      fd.append('price', parseFloat(formData.price).toString());
      fd.append('stock_quantity', parseInt(formData.stock_quantity).toString());
      fd.append('is_active', formData.is_active ? '1' : '0');
      
      // Add images if any
      selectedFiles.forEach((file, index) => {
        fd.append(`images[${index}]`, file);
      });

      if (editingProduct) {
        await updateProduct(String(editingProduct.id), fd);
        toast.success('Product updated successfully');
      } else {
        await createProduct(fd);
        toast.success('Product created successfully');
      }
      await fetchProductsList();
      resetForm();
    } catch (error: any) {
      console.error('Product creation error:', error);
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.errors ? 
                          Object.values(error.response.data.errors).flat().join(', ') : 
                          'Failed to save product';
      toast.error(errorMessage);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock_quantity: product.stock_quantity.toString(),
      is_active: product.is_active
    });
    setSelectedFiles([]);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteProduct(String(id));
      toast.success('Product deleted successfully');
      fetchProductsList();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete product');
    }
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      const fd = new FormData();
      fd.append('is_active', !product.is_active ? '1' : '0');
      await updateProduct(String(product.id), fd);
      toast.success(`Product ${!product.is_active ? 'activated' : 'deactivated'} successfully`);
      fetchProductsList();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update product status');
    }
  };

  const handleManageStock = async (product: Product) => {
    setSelectedProduct(product);
    setIsLoadingStock(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
      const token = sessionStorage.getItem('auth_token');
      // Load branches
      const [branchesRes, stockRes] = await Promise.all([
        fetch(`${apiBaseUrl}/branches`, { headers: { Authorization: token ? `Bearer ${token}` : '' } }),
        fetch(`${apiBaseUrl}/branch-stock`, { headers: { Authorization: token ? `Bearer ${token}` : '' } })
      ]);
      if (!branchesRes.ok) throw new Error('Failed to load branches');
      if (!stockRes.ok) throw new Error('Failed to load branch stock');
      const branchesJson = await branchesRes.json();
      const stockJson = await stockRes.json();
      const allBranches: Array<{ id: number; name: string; code: string }> = (branchesJson.branches || branchesJson || []).map((b: any) => ({ id: b.id, name: b.name, code: b.code }));
      const allStock: BranchStock[] = (stockJson.stock || stockJson || []).filter((s: any) => s.product_id === product.id);
      setBranches(allBranches);
      // Build rows for all branches ensuring each has an entry
      const rows: BranchStock[] = allBranches.map((b) => {
        const existing = allStock.find((s: any) => s.branch_id === b.id);
        return {
          id: existing?.id,
          product_id: product.id,
          branch_id: b.id,
          stock_quantity: existing?.stock_quantity ?? 0,
          reserved_quantity: existing?.reserved_quantity ?? 0,
          branch: { id: b.id, name: b.name, code: b.code }
        };
      });
      setBranchStock(rows);
      // Initialize editable quantities
      const eq: Record<number, number> = {};
      rows.forEach(r => { eq[r.branch_id] = r.stock_quantity; });
      setEditQuantities(eq);
      setShowStockModal(true);
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch branch stock');
    } finally {
      setIsLoadingStock(false);
    }
  };

  const handleImageAdd = (file: File) => {
    setSelectedFiles(prev => [...prev, file]);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Validate each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`File ${file.name} is not an image`);
          continue;
        }
        
        // Validate file size (2MB max)
        if (file.size > 2 * 1024 * 1024) {
          toast.error(`Image ${file.name} size must be less than 2MB`);
          continue;
        }
        
        // Validate max count (4 images max)
        if (selectedFiles.length >= 4) {
          toast.error('Maximum 4 images allowed');
          break;
        }
        
        handleImageAdd(file);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      stock_quantity: '',
      is_active: true
    });
    setSelectedFiles([]);
    setEditingProduct(null);
    setShowModal(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStorageUrl = (path: string) => {
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    const baseUrl = apiBaseUrl.replace('/api', '');
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${baseUrl}/storage/${cleanPath}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
          {selectedBranchId !== 'all' && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Branch Filtered
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4">
          <BranchFilter 
            selectedBranchId={selectedBranchId} 
            onBranchChange={(branchId) => {
              // This will be handled by the BranchContext
            }}
            useAdminData={true}
          />
          <Button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Multi-Branch Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">
              Across all branches
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.filter(p => p.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently available
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Branches</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{branches.length}</div>
            <p className="text-xs text-muted-foreground">
              Branch locations
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {branchStock.filter(stock => stock.stock_quantity < 5).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Need restocking
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Branch Availability
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {product.image_paths && product.image_paths.length > 0 ? (
                          <img
                            className="h-10 w-10 rounded-lg object-cover"
                            src={getStorageUrl(product.image_paths[0])}
                            alt={product.name}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">No Image</span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">Product</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₱{product.price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    Product
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {product.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-1">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span className="text-xs">
                        {product.branch_availability && product.branch_availability.length > 0 
                          ? `${product.branch_availability.filter(ba => ba.is_available).length}/${product.branch_availability.length} branches`
                          : 'No stock data'
                        }
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(product)}
                      className="text-yellow-600 hover:text-yellow-900"
                    >
                      {product.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleManageStock(product)}
                      className="text-green-600 hover:text-green-900"
                      title="Manage Branch Stock"
                    >
                      <Building2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Product Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Stock Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Product Images</label>
                  {selectedFiles.length > 0 && (
                    <div className="mt-2 mb-3">
                      <div className="flex gap-2 flex-wrap">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Preview ${index + 1}`}
                              className="h-32 w-32 object-cover rounded-lg border border-gray-300"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadingImage ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      Select Images
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
                  >
                    {editingProduct ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Stock Management Modal */}
      {showStockModal && selectedProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-2/3 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    Branch Stock Management
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Manage product availability across all branches: <strong>{selectedProduct.name}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setShowStockModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              {isLoadingStock ? (
                <div className="py-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading branch stock...</p>
                </div>
              ) : (
                <div>
                  {/* Bulk Update Section */}
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Quick Actions</h4>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => {
                          const newQuantities: Record<number, number> = {};
                          branchStock.forEach(stock => {
                            newQuantities[stock.branch_id] = 10; // Set all to 10
                          });
                          setEditQuantities(newQuantities);
                        }}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Set All to 10
                      </button>
                      <button
                        onClick={() => {
                          const newQuantities: Record<number, number> = {};
                          branchStock.forEach(stock => {
                            newQuantities[stock.branch_id] = 0; // Set all to 0
                          });
                          setEditQuantities(newQuantities);
                        }}
                        className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Set All to 0
                      </button>
                      <span className="text-xs text-blue-700">
                        Click individual "Save" buttons to update each branch
                      </span>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Quantity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {branchStock.map((stock) => (
                        <tr key={stock.branch_id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {stock.branch.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <input
                              type="number"
                              value={editQuantities[stock.branch_id] ?? stock.stock_quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value || '0');
                                setEditQuantities(prev => ({ ...prev, [stock.branch_id]: isNaN(val) ? 0 : val }));
                              }}
                              className="w-24 px-2 py-1 border rounded"
                              min={0}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              (editQuantities[stock.branch_id] ?? stock.stock_quantity) - (stock.reserved_quantity ?? 0) > 0
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {(editQuantities[stock.branch_id] ?? stock.stock_quantity) - (stock.reserved_quantity ?? 0)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              className="text-blue-600 hover:text-blue-900"
                              onClick={async () => {
                                try {
                                  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
                                  const token = sessionStorage.getItem('auth_token');
                                  const quantity = editQuantities[stock.branch_id] ?? stock.stock_quantity;
                                  const res = await fetch(`${apiBaseUrl}/products/${selectedProduct.id}/branches/${stock.branch_id}/stock`, {
                                    method: 'PUT',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      Authorization: token ? `Bearer ${token}` : ''
                                    },
                                    body: JSON.stringify({ stock_quantity: quantity })
                                  });
                                  if (!res.ok) throw new Error('Update failed');
                                  toast.success('Stock updated');
                                  // Refresh just this row locally
                                  setBranchStock(prev => prev.map(r => r.branch_id === stock.branch_id ? { ...r, stock_quantity: quantity } : r));
                                } catch (e) {
                                  toast.error('Failed to update stock');
                                }
                              }}
                            >
                              Save
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductManagement;
