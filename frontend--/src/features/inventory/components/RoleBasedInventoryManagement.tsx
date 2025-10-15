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
  TrendingUp, 
  RefreshCw, 
  ArrowRightLeft,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Phone,
  ExternalLink,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  Settings
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { inventoryApiService } from '@/services/inventoryApi';
import StockTransferModal from './StockTransferModal';
import StockUpdateModal from './StockUpdateModal';

interface InventoryItem {
  id: string;
  product: {
    id: string;
    name: string;
    sku: string;
    category: string;
    price: number;
  };
  branch: {
    id: string;
    name: string;
    code: string;
    address: string;
    phone: string;
  };
  stock: {
    available_quantity: number;
    stock_quantity: number;
    reserved_quantity: number;
    is_available: boolean;
    is_low_stock: boolean;
    status: 'in_stock' | 'low_stock' | 'out_of_stock';
  };
  metadata: {
    last_updated: string;
    expiry_date?: string;
    auto_restock_enabled: boolean;
    min_stock_threshold: number;
  };
}

interface StockAlert {
  type: 'out_of_stock' | 'low_stock' | 'expiring';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  product_id: string;
  branch_id: string;
  timestamp: string;
  action_required: boolean;
  available_quantity?: number;
  expiry_date?: string;
  days_until_expiry?: number;
}

interface StockTransfer {
  id: string;
  product: {
    id: string;
    name: string;
  };
  fromBranch: {
    id: string;
    name: string;
  };
  toBranch: {
    id: string;
    name: string;
  };
  quantity: number;
  status: 'pending' | 'completed' | 'rejected';
  requested_by: string;
  processed_by?: string;
  reason?: string;
  notes?: string;
  created_at: string;
  processed_at?: string;
}

const RoleBasedInventoryManagement: React.FC = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [branches, setBranches] = useState<Array<{id: string; name: string; code: string}>>([]);

  // Role-based permissions
  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';
  const canViewAllBranches = isAdmin;
  const canManageTransfers = isAdmin;
  const canUpdateStock = isAdmin || isStaff;

  useEffect(() => {
    loadInventoryData();
    loadAlerts();
    loadBranches();
    if (canManageTransfers) {
      loadTransfers();
    }
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadInventoryData(false);
      loadAlerts(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [canManageTransfers]);

  const loadInventoryData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      const filters = {
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter as any : undefined,
        branch_id: branchFilter !== 'all' ? branchFilter : undefined,
        force_refresh: true
      };

      const data = await inventoryApiService.getRealTimeInventory(filters);
      setInventory(data.inventory || []);
    } catch (err: any) {
      console.error('Error loading inventory:', err);
      setError(err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const loadAlerts = async (showLoading = true) => {
    try {
      const data = await inventoryApiService.getImmediateAlerts();
      setAlerts(data.alerts || []);
    } catch (err: any) {
      console.error('Error loading alerts:', err);
    }
  };

  const loadTransfers = async () => {
    try {
      const data = await inventoryApiService.getStockTransferHistory();
      setTransfers(data.transfers || []);
    } catch (err: any) {
      console.error('Error loading transfers:', err);
    }
  };

  const loadBranches = async () => {
    try {
      // Load branches for transfer modal
      const response = await fetch('/api/branches', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBranches(data.branches || []);
      }
    } catch (err: any) {
      console.error('Error loading branches:', err);
    }
  };

  const handleUpdateStock = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowUpdateModal(true);
  };

  const handleRequestTransfer = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowTransferModal(true);
  };

  const handleStockUpdated = () => {
    loadInventoryData(false);
    setShowUpdateModal(false);
    setSelectedItem(null);
  };

  const handleTransferRequested = () => {
    loadTransfers();
    setShowTransferModal(false);
    setSelectedItem(null);
  };

  const requestStockTransfer = async (productId: string, fromBranchId: string, toBranchId: string, quantity: number, reason: string) => {
    try {
      const response = await fetch('/api/inventory/stock-transfer-request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId,
          from_branch_id: fromBranchId,
          to_branch_id: toBranchId,
          quantity: quantity,
          reason: reason
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to request stock transfer');
      }

      // Refresh transfers data
      loadTransfers();
    } catch (err: any) {
      console.error('Error requesting transfer:', err);
      setError(err.message);
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'info': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getTransferStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.stock.status === statusFilter;
    const matchesBranch = branchFilter === 'all' || item.branch.id === branchFilter;
    return matchesSearch && matchesStatus && matchesBranch;
  });

  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
  const warningAlerts = alerts.filter(alert => alert.severity === 'warning');
  const infoAlerts = alerts.filter(alert => alert.severity === 'info');

  const inStockItems = filteredInventory.filter(item => item.stock.is_available);
  const lowStockItems = filteredInventory.filter(item => item.stock.is_low_stock);
  const outOfStockItems = filteredInventory.filter(item => !item.stock.is_available);

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
              <h1 className="text-3xl font-bold text-gray-900">
                {isAdmin ? 'Cross-Branch Inventory' : 'Branch Inventory'}
              </h1>
              <p className="text-gray-600">
                {isAdmin ? 'Real-time inventory management across all branches' : 'Manage your branch inventory'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => loadInventoryData()}
              disabled={loading}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {canUpdateStock && (
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Stock
              </Button>
            )}
          </div>
        </div>

        {/* Critical Alerts */}
        {criticalAlerts.length > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>{criticalAlerts.length} Critical Alert(s):</strong> {criticalAlerts.map(alert => alert.message).join(', ')}
            </AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="search">Search Products</Label>
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
              {canViewAllBranches && (
                <div className="min-w-[150px]">
                  <Label htmlFor="branch">Branch</Label>
                  <Select value={branchFilter} onValueChange={setBranchFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Branches</SelectItem>
                      {/* Add branch options here */}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button
                onClick={() => loadInventoryData()}
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredInventory.length}</div>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? 'Across all branches' : 'In your branch'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Stock</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{inStockItems.length}</div>
              <p className="text-xs text-muted-foreground">Available items</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{lowStockItems.length}</div>
              <p className="text-xs text-muted-foreground">Need restocking</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{outOfStockItems.length}</div>
              <p className="text-xs text-muted-foreground">Immediate attention needed</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="alerts">Alerts ({alerts.length})</TabsTrigger>
            {canManageTransfers && (
              <TabsTrigger value="transfers">Transfers ({transfers.length})</TabsTrigger>
            )}
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Recent Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {alerts.slice(0, 5).map((alert, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          alert.severity === 'critical' ? 'bg-red-500' :
                          alert.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`} />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{alert.title}</p>
                          <p className="text-xs text-gray-600">{alert.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {alerts.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No alerts at this time</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Transfers (Admin only) */}
              {canManageTransfers && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ArrowRightLeft className="h-5 w-5" />
                      Recent Transfers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {transfers.slice(0, 5).map((transfer) => (
                        <div key={transfer.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{transfer.product.name}</p>
                            <p className="text-xs text-gray-600">
                              {transfer.quantity} units from {transfer.fromBranch.name} to {transfer.toBranch.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={getTransferStatusColor(transfer.status)}>
                                {transfer.status}
                              </Badge>
                              <span className="text-xs text-gray-400">
                                {new Date(transfer.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {transfers.length === 0 && (
                        <p className="text-gray-500 text-center py-4">No transfers at this time</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <div className="space-y-4">
              {alerts.map((alert, index) => (
                <Card key={index} className="border-l-4 border-l-red-500">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={`h-5 w-5 mt-0.5 ${getSeverityColor(alert.severity)}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{alert.title}</h3>
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Product ID: {alert.product_id}</span>
                          <span>Branch ID: {alert.branch_id}</span>
                          <span>{new Date(alert.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {alerts.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Alerts</h3>
                    <p className="text-gray-600">All inventory levels are within normal ranges.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {canManageTransfers && (
            <TabsContent value="transfers" className="space-y-4">
              <div className="space-y-4">
                {transfers.map((transfer) => (
                  <Card key={transfer.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{transfer.product.name}</h3>
                          <p className="text-sm text-gray-600">
                            {transfer.quantity} units from {transfer.fromBranch.name} to {transfer.toBranch.name}
                          </p>
                          {transfer.reason && (
                            <p className="text-xs text-gray-500 mt-1">Reason: {transfer.reason}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getTransferStatusColor(transfer.status)}>
                            {transfer.status}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(transfer.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {transfers.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <ArrowRightLeft className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Transfers</h3>
                      <p className="text-gray-600">No stock transfers have been requested yet.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          )}

          <TabsContent value="inventory" className="space-y-4">
            <div className="space-y-4">
              {filteredInventory.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium">{item.product.name}</h3>
                          <Badge className={getStatusColor(item.stock.status)}>
                            {item.stock.status.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline">{item.product.sku}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{item.branch.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Package className="h-4 w-4" />
                            <span>{item.stock.available_quantity} available</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{new Date(item.metadata.last_updated).toLocaleDateString()}</span>
                          </div>
                        </div>
                        {item.metadata.expiry_date && (
                          <div className="text-xs text-gray-500 mt-1">
                            Expires: {new Date(item.metadata.expiry_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {canUpdateStock && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleUpdateStock(item)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Update Stock
                          </Button>
                        )}
                        {canManageTransfers && item.stock.is_available && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRequestTransfer(item)}
                          >
                            <ArrowRightLeft className="h-4 w-4 mr-1" />
                            Transfer
                          </Button>
                        )}
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
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Inventory</h3>
                    <p className="text-gray-600">No inventory items found matching your criteria.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Modals */}
        {selectedItem && (
          <>
            <StockUpdateModal
              isOpen={showUpdateModal}
              onClose={() => setShowUpdateModal(false)}
              item={selectedItem}
              onStockUpdated={handleStockUpdated}
            />
            <StockTransferModal
              isOpen={showTransferModal}
              onClose={() => setShowTransferModal(false)}
              product={selectedItem.product}
              branches={branches}
              currentBranchId={user?.branch_id?.toString()}
              onTransferRequested={handleTransferRequested}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default RoleBasedInventoryManagement;
