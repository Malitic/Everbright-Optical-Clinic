import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Upload, Save, X, Building2, Package, AlertTriangle, Search, Grid3x3, List, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { getProducts, createProduct, updateProduct, deleteProduct } from '@/services/productApi';
import { useBranch } from '@/contexts/BranchContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BranchFilter from '@/components/common/BranchFilter';
import { getStorageUrl } from '@/utils/imageUtils';
import { shouldSkipRefresh, clearDeletionProtection, setDeletionProtection, notifyProductDeletion } from '@/utils/deletionProtection';

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
    category_id: '',
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
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deletedProductIds, setDeletedProductIds] = useState<Set<number>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'frames' | 'sunglasses' | 'contact_lenses' | 'eye_care' | 'others'>('all');
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([]);

  useEffect(() => {
    fetchProductsList();
    // Load categories for category selector
    (async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
        const token = sessionStorage.getItem('auth_token');
        const res = await fetch(`${apiBaseUrl}/product-categories`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Accept': 'application/json'
          }
        });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.categories || []);
          setCategories(list.map((c: any) => ({ id: c.id, name: c.name })));
        }
      } catch {}
    })();
    
    // Auto-refresh every 30 seconds to show latest inventory updates
    // But only if no products have been deleted recently (to prevent reappearing)
    const interval = setInterval(() => {
      // Only auto-refresh if no products have been deleted recently (to prevent reappearing)
      if (!shouldSkipRefresh()) {
        fetchProductsList();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [selectedBranchId]);

  const fetchProductsList = async () => {
    try {
      setLoading(true);
      // Get products without search filter for now
      const data = await getProducts('');
      const allProducts = Array.isArray(data) ? data : [];
      
      // Filter out deleted products to prevent them from reappearing
      const filteredProducts = allProducts.filter(product => !deletedProductIds.has(product.id));
      setProducts(filteredProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    // Clear deletion timestamp to allow refresh
    clearDeletionProtection();
    await fetchProductsList();
    toast.success('Products refreshed successfully');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.name.trim()) {
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
      fd.append('description', (formData.description || '').trim()); // Safe null handling
      fd.append('price', parseFloat(formData.price).toString());
      fd.append('stock_quantity', parseInt(formData.stock_quantity).toString());
      fd.append('is_active', formData.is_active ? '1' : '0');
      if (formData.category_id) fd.append('category_id', formData.category_id);
      
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
      // Only refresh if no products have been deleted recently
      if (!shouldSkipRefresh()) {
        await fetchProductsList();
      } else {
        // Just add the new product to local state without full refresh
        if (!editingProduct) {
          // For new products, we'd need to get the created product data
          // For now, just show success message
          toast.success('Product created successfully');
        }
      }
      resetForm();
    } catch (error: any) {
      console.error('Product creation error:', error);
      
      let errorMessage = 'Failed to save product';
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.errors) {
        const errors = error.response.data.errors;
        if (typeof errors === 'object' && errors !== null) {
          try {
            errorMessage = Object.values(errors).flat().join(', ');
          } catch (e) {
            errorMessage = 'Validation errors occurred';
          }
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    }
  };

  const handleEdit = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Edit clicked for product:', product.id);
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price?.toString() || '0',
      stock_quantity: product.stock_quantity?.toString() || '0',
      category_id: ((product as any).category_details?.id || '').toString(),
      is_active: product.is_active ?? true
    });
    setSelectedFiles([]);
    setShowModal(true);
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Delete clicked for product:', id);
    
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteProduct(String(id));
      
      // Notify all components about the deletion and clear caches
      notifyProductDeletion(id);
      
      // Add to deleted products set to prevent reappearing
      setDeletedProductIds(prev => new Set([...prev, id]));
      
      // Immediately remove the product from the local state
      setProducts(prevProducts => prevProducts.filter(product => product.id !== id));
      
      toast.success('Product deleted successfully');
      
      // Don't call fetchProductsList() as it might override the immediate update
      // The immediate state update is sufficient for good UX
    } catch (error: any) {
      console.error('Delete error:', error);
      
      let errorMessage = 'Failed to delete product';
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
        
        // Show specific message for active reservations
        if (error.response.data.active_reservations) {
          errorMessage += ` (${error.response.data.active_reservations} active reservations)`;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    }
  };

  const handleToggleStatus = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Toggle status clicked for product:', product.id);
    
    try {
      const fd = new FormData();
      fd.append('is_active', !product.is_active ? '1' : '0');
      await updateProduct(String(product.id), fd);
      toast.success(`Product ${!product.is_active ? 'activated' : 'deactivated'} successfully`);
      
      // Only refresh if no products have been deleted recently
      if (!shouldSkipRefresh()) {
        fetchProductsList();
      } else {
        // Update the product status in local state without full refresh
        setProducts(prevProducts => 
          prevProducts.map(p => 
            p.id === product.id ? { ...p, is_active: !product.is_active } : p
          )
        );
      }
    } catch (error: any) {
      console.error('Toggle status error:', error);
      toast.error(error?.message || 'Failed to update product status');
    }
  };

  const handleManageStock = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Manage stock clicked for product:', product.id);
    
    setSelectedProduct(product);
    setIsLoadingStock(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
      const token = sessionStorage.getItem('auth_token');
      
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      // Use axios for consistent auth handling
      const [branchesRes, stockRes] = await Promise.all([
        fetch(`${apiBaseUrl}/branches`, { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          } 
        }),
        fetch(`${apiBaseUrl}/branch-stock`, { 
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          } 
        })
      ]);

      if (!branchesRes.ok) {
        const errorText = await branchesRes.text();
        console.error('Branches API error:', errorText);
        throw new Error(`Failed to load branches (${branchesRes.status}): ${branchesRes.statusText}`);
      }
      
      if (!stockRes.ok) {
        const errorText = await stockRes.text();
        console.error('Stock API error:', errorText);
        throw new Error(`Failed to load branch stock (${stockRes.status}): ${stockRes.statusText}`);
      }

      const branchesJson = await branchesRes.json();
      const stockJson = await stockRes.json();
      
      console.log('Branches response:', branchesJson);
      console.log('Stock response:', stockJson);

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
    } catch (error: any) {
      console.error('Manage stock error:', error);
      const errorMessage = error?.message || 'Failed to fetch branch stock';
      toast.error(errorMessage);
      
      // If auth error, suggest re-login
      if (error?.message?.includes('403') || error?.message?.includes('authentication')) {
        toast.error('Authentication error. Please try logging in again.');
      }
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
      category_id: '',
      is_active: true
    });
    setSelectedFiles([]);
    setEditingProduct(null);
    setShowModal(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
            onClick={handleManualRefresh}
            variant="outline"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
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

      {/* Search, Category Filter and View Toggle */}
      <div className="mb-6 flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search products by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {/* Category Filter */}
        <div className="flex gap-2">
          <Button
            variant={categoryFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategoryFilter('all')}
          >
            All
          </Button>
          <Button
            variant={categoryFilter === 'frames' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategoryFilter('frames')}
          >
            Frames
          </Button>
          <Button
            variant={categoryFilter === 'sunglasses' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategoryFilter('sunglasses')}
          >
            Sunglasses
          </Button>
          <Button
            variant={categoryFilter === 'contact_lenses' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategoryFilter('contact_lenses')}
          >
            Contact Lenses
          </Button>
          <Button
            variant={categoryFilter === 'eye_care' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategoryFilter('eye_care')}
          >
            Eye Care
          </Button>
          <Button
            variant={categoryFilter === 'others' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategoryFilter('others')}
          >
            Other Products
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Product Gallery - Grid or List View */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
        {products.filter(p => {
          const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
          const categoryName = ((p as any).category || (p as any).category_name || '').toString().toLowerCase();
          const text = `${p.name} ${(p as any).description || ''}`.toLowerCase();
          const isFrame = categoryName.includes('frame') || text.includes('frame');
          const isSunglass = categoryName.includes('sunglass') || text.includes('sunglass') || text.includes('sun glasses');
          const isContact = categoryName.includes('contact') || text.includes('contact lens') || text.includes('contacts');
          const isEyeCare = categoryName.includes('care') || categoryName.includes('solution') || text.includes('solution') || text.includes('drop') || text.includes('cleaner');
          let matchesCategory = true;
          switch (categoryFilter) {
            case 'frames': matchesCategory = isFrame && !isSunglass; break;
            case 'sunglasses': matchesCategory = isSunglass; break;
            case 'contact_lenses': matchesCategory = isContact; break;
            case 'eye_care': matchesCategory = isEyeCare; break;
            case 'others': matchesCategory = !(isFrame || isSunglass || isContact || isEyeCare); break;
            default: matchesCategory = true;
          }
          return matchesSearch && matchesCategory;
        }).map((product) => (
          <Card key={product.id} className={`overflow-hidden hover:shadow-lg transition-shadow ${viewMode === 'list' ? 'flex flex-row' : ''}`}>
            {/* Product Image */}
            <div className={`relative bg-gray-100 ${viewMode === 'list' ? 'w-32 h-32' : 'h-48'}`}>
              {product.image_paths && product.image_paths.length > 0 ? (
                <img
                  className="w-full h-full object-cover"
                  src={getStorageUrl(product.image_paths[0])}
                  alt={product.name}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                  <Package className={`${viewMode === 'list' ? 'h-8 w-8' : 'h-16 w-16'} mb-2`} />
                  <span className="text-xs">No Image</span>
                </div>
              )}
              
              {/* Status Badge Overlay */}
              {viewMode === 'grid' && (
                <div className="absolute top-2 right-2">
                  <span
                    className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                      product.is_active
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    {product.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              )}
            </div>

            {/* Product Info */}
            <CardContent className={`${viewMode === 'list' ? 'flex-1 p-4 flex items-center' : 'p-4'}`}>
              {viewMode === 'list' ? (
                // List View Layout
                <div className="flex items-center justify-between w-full gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-gray-900 truncate mb-1" title={product.name}>
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-2xl font-bold text-blue-600">
                        ₱{product.price.toLocaleString()}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Stock</div>
                      <div className="text-lg font-bold">{(product as any).total_stock || 0}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Available</div>
                      <div className="text-lg font-bold text-green-600">{(product as any).total_available || 0}</div>
                    </div>
                    <div className="text-center min-w-[100px]">
                      <div className="text-xs text-gray-500">Branches</div>
                      <div className="text-sm font-semibold">
                        {product.branch_availability && product.branch_availability.length > 0 
                          ? `${product.branch_availability.filter((ba: any) => ba.is_available).length}/${product.branch_availability.length}`
                          : '0/0'
                        }
                      </div>
                    </div>
                  </div>

                  {/* List View Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={(e) => handleManageStock(e, product)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      <Building2 className="w-4 h-4 mr-2" />
                      Stock
                    </Button>
                    <Button
                      onClick={(e) => handleEdit(e, product)}
                      variant="outline"
                      size="sm"
                      className="text-blue-600"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={(e) => handleToggleStatus(e, product)}
                      variant="outline"
                      size="sm"
                      className="text-yellow-600"
                      title={product.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {product.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      onClick={(e) => handleDelete(e, product.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                // Grid View Layout (Original)
                <>
                  <h3 className="font-semibold text-lg text-gray-900 mb-2 truncate" title={product.name}>
                    {product.name}
                  </h3>
                  
                  {/* Price */}
                  <div className="mb-3">
                    <span className="text-2xl font-bold text-blue-600">
                      ₱{product.price.toLocaleString()}
                    </span>
                  </div>

                  {/* Stock Information */}
                  <div className="space-y-2 mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        Total Stock:
                      </span>
                      <span className="font-bold text-gray-900">
                        {(product as any).total_stock || 0}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Available:</span>
                      <span className="font-semibold text-green-600">
                        {(product as any).total_available || 0}
                      </span>
                    </div>
                    
                    {((product as any).total_reserved || 0) > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Reserved:</span>
                        <span className="font-semibold text-orange-600">
                          {(product as any).total_reserved}
                        </span>
                      </div>
                    )}

                    {/* Branch Availability */}
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Building2 className="h-4 w-4" />
                        <span>
                          {product.branch_availability && product.branch_availability.length > 0 
                            ? `${product.branch_availability.filter((ba: any) => ba.is_available).length}/${product.branch_availability.length} branches`
                            : 'No stock data'
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {/* Primary Action: Manage Stock */}
                    <Button
                      onClick={(e) => handleManageStock(e, product)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      size="sm"
                    >
                      <Building2 className="w-4 h-4 mr-2" />
                      Manage Stock
                    </Button>

                    {/* Secondary Actions */}
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        onClick={(e) => handleEdit(e, product)}
                        variant="outline"
                        size="sm"
                        className="text-blue-600 hover:bg-blue-50"
                        title="Edit Product"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        onClick={(e) => handleToggleStatus(e, product)}
                        variant="outline"
                        size="sm"
                        className="text-yellow-600 hover:bg-yellow-50"
                        title={product.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {product.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      
                      <Button
                        onClick={(e) => handleDelete(e, product.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {products.length === 0 && !loading && (
        <Card className="p-12 text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
          <p className="text-gray-500 mb-6">Get started by adding your first product to the gallery.</p>
          <Button onClick={() => { resetForm(); setShowModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add First Product
          </Button>
        </Card>
      )}

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
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <Select value={formData.category_id} onValueChange={(val) => setFormData({ ...formData, category_id: val })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
