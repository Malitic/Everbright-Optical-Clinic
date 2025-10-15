import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Package, 
  AlertTriangle, 
  Building, 
  Search, 
  Filter,
  TrendingUp,
  TrendingDown,
  Users,
  Phone,
  Mail,
  Globe,
  MapPin,
  Eye,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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
  last_restock_date?: string;
  expiry_date?: string;
  is_active: boolean;
  branch: {
    id: string;
    name: string;
    code: string;
  };
  manufacturer?: {
    id: string;
    name: string;
    contact_person: string;
    phone: string;
    email: string;
    product_line: string;
  };
}

interface Manufacturer {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  product_line: string;
  address?: string;
  website?: string;
}

interface Branch {
  id: string;
  name: string;
  code: string;
}

const AdminCentralInventory: React.FC = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [manufacturerFilter, setManufacturerFilter] = useState('all');
  const [selectedTab, setSelectedTab] = useState('inventory');

  useEffect(() => {
    loadInventory();
    loadManufacturers();
    loadBranches();
    
    // Auto-refresh every 30 seconds to show latest inventory updates from staff
    const interval = setInterval(() => {
      loadInventory();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [searchTerm, statusFilter, branchFilter, manufacturerFilter]); // Reload when filters change

  const loadInventory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Convert frontend status format to database format
      const convertStatusToDbFormat = (status: string): string => {
        const statusMap: Record<string, string> = {
          'in_stock': 'In Stock',
          'low_stock': 'Low Stock',
          'out_of_stock': 'Out of Stock'
        };
        return statusMap[status] || status;
      };

      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') {
        const dbStatus = convertStatusToDbFormat(statusFilter);
        params.append('status', dbStatus);
      }
      if (branchFilter !== 'all') params.append('branch_id', branchFilter);
      if (manufacturerFilter !== 'all') params.append('manufacturer_id', manufacturerFilter);

      console.log('AdminCentralInventory: Loading with filters:', {
        searchTerm,
        statusFilter,
        statusFilterConverted: statusFilter !== 'all' ? convertStatusToDbFormat(statusFilter) : 'all',
        branchFilter,
        manufacturerFilter
      });

      const response = await axios.get(`${API_BASE_URL}/inventory/enhanced?${params}`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`,
        },
      });

      console.log('AdminCentralInventory: Loaded', response.data.inventories?.length, 'items');
      console.log('AdminCentralInventory: Unitop items:', response.data.inventories?.filter((i: any) => i.branch_id === '2' || i.branch_id === 2)?.length);

      setInventory(response.data.inventories || []);
    } catch (err: any) {
      console.error('Error loading inventory:', err);
      setError(err.response?.data?.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const loadManufacturers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/manufacturers-directory`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`,
        },
      });

      setManufacturers(response.data.manufacturers || []);
    } catch (err: any) {
      console.error('Error loading manufacturers:', err);
    }
  };

  const loadBranches = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/branches`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`,
        },
      });

      setBranches(response.data.branches || []);
    } catch (err: any) {
      console.error('Error loading branches:', err);
    }
  };

  const getStatusColor = (status: string) => {
    const normalized = status?.toLowerCase().replace(/\s+/g, '_');
    switch (normalized) {
      case 'in_stock':
      case 'in stock':
        return 'bg-green-100 text-green-800';
      case 'low_stock':
      case 'low stock':
        return 'bg-yellow-100 text-yellow-800';
      case 'out_of_stock':
      case 'out of stock':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredInventory = inventory.filter(item => {
    const productName = item.product?.name || '';
    const sku = item.product?.sku || '';
    const matchesSearch = productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Normalize status for comparison (handle both "Low Stock" and "low_stock" formats)
    const normalizedItemStatus = item.status?.toLowerCase().replace(/\s+/g, '_');
    const normalizedFilterStatus = statusFilter.toLowerCase().replace(/\s+/g, '_');
    const matchesStatus = statusFilter === 'all' || normalizedItemStatus === normalizedFilterStatus;
    
    // Ensure branch_id is compared as string
    const itemBranchId = String(item.branch_id);
    const filterBranchId = String(branchFilter);
    const matchesBranch = branchFilter === 'all' || itemBranchId === filterBranchId;
    
    const matchesManufacturer = manufacturerFilter === 'all' || item.manufacturer_id === manufacturerFilter;
    
    return matchesSearch && matchesStatus && matchesBranch && matchesManufacturer;
  });
  
  console.log('AdminCentralInventory - Filter Results:', {
    totalItems: inventory.length,
    filteredItems: filteredInventory.length,
    statusFilter,
    branchFilter,
    searchTerm,
    uniqueStatuses: [...new Set(inventory.map(i => i.status))]
  });

  // Normalize status for summary counts
  const normalizeStatus = (status: string) => status?.toLowerCase().replace(/\s+/g, '_');
  
  const inStockItems = filteredInventory.filter(item => normalizeStatus(item.status) === 'in_stock');
  const lowStockItems = filteredInventory.filter(item => normalizeStatus(item.status) === 'low_stock');
  const outOfStockItems = filteredInventory.filter(item => normalizeStatus(item.status) === 'out_of_stock');

  // Group manufacturers by product line
  const manufacturersByProductLine = manufacturers.reduce((acc, manufacturer) => {
    if (!acc[manufacturer.product_line]) {
      acc[manufacturer.product_line] = [];
    }
    acc[manufacturer.product_line].push(manufacturer);
    return acc;
  }, {} as Record<string, Manufacturer[]>);

  // Calculate branch statistics
  const branchStats = branches.map(branch => {
    const branchItems = inventory.filter(item => item.branch_id === branch.id);
    return {
      ...branch,
      total_items: branchItems.length,
      in_stock: branchItems.filter(item => normalizeStatus(item.status) === 'in_stock').length,
      low_stock: branchItems.filter(item => normalizeStatus(item.status) === 'low_stock').length,
      out_of_stock: branchItems.filter(item => normalizeStatus(item.status) === 'out_of_stock').length,
    };
  });

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
              <h1 className="text-3xl font-bold text-gray-900">Central Inventory</h1>
              <p className="text-gray-600">Monitor inventory across all branches</p>
            </div>
          </div>
          <Button
            onClick={loadInventory}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            Refresh
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
              <p className="text-xs text-muted-foreground">Across all branches</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Stock</CardTitle>
              <div className="w-2 h-2 bg-green-500 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{inStockItems.length}</div>
              <p className="text-xs text-muted-foreground">Available items</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{lowStockItems.length}</div>
              <p className="text-xs text-muted-foreground">Need restocking</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
              <div className="w-2 h-2 bg-red-500 rounded-full" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{outOfStockItems.length}</div>
              <p className="text-xs text-muted-foreground">Immediate attention needed</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="inventory">Inventory Overview</TabsTrigger>
            <TabsTrigger value="manufacturers">Manufacturer Directory</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex-1 min-w-[200px]">
                    <Label htmlFor="search">Search Items</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="search"
                        placeholder="Search by name or SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="min-w-[150px]">
                    <Label htmlFor="status">Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
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
                  <div className="min-w-[150px]">
                    <Label htmlFor="branch">Branch</Label>
                    <Select value={branchFilter} onValueChange={setBranchFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Branches</SelectItem>
                        {branches.filter(b => b.id && String(b.id).trim() !== '').map((branch) => (
                          <SelectItem key={branch.id} value={String(branch.id)}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="min-w-[150px]">
                    <Label htmlFor="manufacturer">Manufacturer</Label>
                    <Select value={manufacturerFilter} onValueChange={setManufacturerFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by manufacturer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Manufacturers</SelectItem>
                        {manufacturers.filter(m => m.id && String(m.id).trim() !== '').map((manufacturer) => (
                          <SelectItem key={manufacturer.id} value={String(manufacturer.id)}>
                            {manufacturer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={loadInventory}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Filter className="h-4 w-4" />
                    Apply Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Branch Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {branchStats.map((branch) => (
                <Card key={branch.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      {branch.name}
                    </CardTitle>
                    <CardDescription>{branch.code}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Items</span>
                        <span className="font-medium">{branch.total_items}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">In Stock</span>
                        <span className="font-medium text-green-600">{branch.in_stock}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Low Stock</span>
                        <span className="font-medium text-yellow-600">{branch.low_stock}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Out of Stock</span>
                        <span className="font-medium text-red-600">{branch.out_of_stock}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Inventory List */}
            <div className="space-y-4">
              {filteredInventory.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium">{item.product?.name || 'Unknown Product'}</h3>
                          <Badge className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                          <Badge variant="outline">{item.product?.sku || 'N/A'}</Badge>
                          <Badge variant="secondary">{item.branch?.name || 'Unknown Branch'}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Package className="h-4 w-4" />
                            <span className="font-semibold">{item.stock_quantity || 0} units</span>
                          </div>
                          {(item.reserved_quantity || 0) > 0 && (
                            <div className="flex items-center gap-1 text-orange-600">
                              <span>Reserved: {item.reserved_quantity}</span>
                            </div>
                          )}
                          {(item.available_quantity !== undefined) && (
                            <div className="flex items-center gap-1 text-green-600">
                              <span>Available: {item.available_quantity}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4" />
                            <span>Min: {item.min_stock_threshold || 0}</span>
                          </div>
                          {item.price_override && (
                            <div className="flex items-center gap-1">
                              <span>₱{item.price_override}</span>
                            </div>
                          )}
                          {item.expiry_date && (
                            <div className="flex items-center gap-1">
                              <span>Expires: {new Date(item.expiry_date).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                        {item.manufacturer && (
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs">
                              <Building className="h-3 w-3 mr-1" />
                              {item.manufacturer.name} - {item.manufacturer.product_line || 'N/A'}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredInventory.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Inventory Items</h3>
                    <p className="text-gray-600">No inventory items found matching your criteria.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="manufacturers" className="space-y-4">
            <div className="space-y-6">
              {Object.entries(manufacturersByProductLine).map(([productLine, manufacturers]) => (
                <Card key={productLine}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      {productLine}
                    </CardTitle>
                    <CardDescription>
                      {manufacturers.length} manufacturer{manufacturers.length !== 1 ? 's' : ''} in this product line
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {manufacturers.map((manufacturer) => (
                        <Card key={manufacturer.id} className="border border-gray-200">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div>
                                <h4 className="font-medium text-lg">{manufacturer.name}</h4>
                                <p className="text-sm text-gray-600">{manufacturer.product_line}</p>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                  <Users className="h-4 w-4 text-gray-400" />
                                  <span>{manufacturer.contact_person}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="h-4 w-4 text-gray-400" />
                                  <span>{manufacturer.phone}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Mail className="h-4 w-4 text-gray-400" />
                                  <span>{manufacturer.email}</span>
                                </div>
                                {manufacturer.address && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="h-4 w-4 text-gray-400" />
                                    <span className="text-xs">{manufacturer.address}</span>
                                  </div>
                                )}
                                {manufacturer.website && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Globe className="h-4 w-4 text-gray-400" />
                                    <a 
                                      href={manufacturer.website} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline text-xs"
                                    >
                                      {manufacturer.website}
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {manufacturers.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Manufacturers</h3>
                    <p className="text-gray-600">No manufacturers have been added yet.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminCentralInventory;
