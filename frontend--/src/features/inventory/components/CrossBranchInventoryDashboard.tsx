import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface InventoryItem {
  id: string;
  product: {
    id: string;
    name: string;
    sku: string;
    category: string;
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

const CrossBranchInventoryDashboard: React.FC = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    loadInventoryData();
    loadAlerts();
    loadTransfers();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadInventoryData(false);
      loadAlerts(false);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadInventoryData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      const response = await fetch('/api/inventory/realtime', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load inventory data');
      }

      const data = await response.json();
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
      const response = await fetch('/api/inventory/alerts', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load alerts');
      }

      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (err: any) {
      console.error('Error loading alerts:', err);
    }
  };

  const loadTransfers = async () => {
    try {
      const response = await fetch('/api/inventory/stock-transfers', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load transfers');
      }

      const data = await response.json();
      setTransfers(data.transfers || []);
    } catch (err: any) {
      console.error('Error loading transfers:', err);
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

  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
  const warningAlerts = alerts.filter(alert => alert.severity === 'warning');
  const infoAlerts = alerts.filter(alert => alert.severity === 'info');

  const inStockItems = inventory.filter(item => item.stock.is_available);
  const lowStockItems = inventory.filter(item => item.stock.is_low_stock);
  const outOfStockItems = inventory.filter(item => !item.stock.is_available);

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
              <h1 className="text-3xl font-bold text-gray-900">Cross-Branch Inventory</h1>
              <p className="text-gray-600">Real-time inventory management across all branches</p>
            </div>
          </div>
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventory.length}</div>
              <p className="text-xs text-muted-foreground">Across all branches</p>
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
            <TabsTrigger value="transfers">Transfers ({transfers.length})</TabsTrigger>
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

              {/* Recent Transfers */}
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

          <TabsContent value="inventory" className="space-y-4">
            <div className="space-y-4">
              {inventory.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium">{item.product.name}</h3>
                          <Badge className={getStatusColor(item.stock.status)}>
                            {item.stock.status.replace('_', ' ')}
                          </Badge>
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
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {inventory.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Inventory</h3>
                    <p className="text-gray-600">No inventory items found.</p>
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

export default CrossBranchInventoryDashboard;



