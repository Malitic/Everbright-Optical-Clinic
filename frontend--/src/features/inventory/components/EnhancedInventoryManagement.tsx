import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, Clock, CheckCircle, RefreshCw, Settings, TrendingUp, Calendar, ArrowRightLeft, Truck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '../../../contexts/AuthContext';
import BranchFilter from '@/components/common/BranchFilter';
import { useBranch } from '@/contexts/BranchContext';
import { InventoryService } from '../services/inventory.service';

interface InventoryItem {
  id: number;
  product_id: number;
  branch_id: number;
  stock_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  expiry_date?: string;
  min_stock_threshold: number;
  auto_restock_enabled: boolean;
  status: string;
  days_until_expiry?: number;
  product: {
    id: number;
    name: string;
    price: number;
    image_paths?: string[];
  };
  branch: {
    id: number;
    name: string;
    code: string;
  };
}

interface InventorySummary {
  total_items: number;
  in_stock: number;
  low_stock: number;
  out_of_stock: number;
  expiring_soon: number;
  expired: number;
}

const EnhancedInventoryManagement: React.FC = () => {
  const { user } = useAuth();
  const { selectedBranchId, isMultiBranch } = useBranch();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  
  // Stock transfer state
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferData, setTransferData] = useState({
    productId: 0,
    fromBranchId: 0,
    toBranchId: 0,
    quantity: 0,
    reason: ''
  });
  const [branches, setBranches] = useState<Array<{ id: number; name: string; code: string }>>([]);

  useEffect(() => {
    fetchInventory();
    fetchBranches();
  }, [selectedBranchId]);

  const fetchBranches = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/branches/active`);
      const data = await response.json();
      setBranches(data);
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    }
  };

  const handleTransfer = async () => {
    try {
      await InventoryService.createStockTransfer({
        product_id: transferData.productId,
        from_branch_id: transferData.fromBranchId,
        to_branch_id: transferData.toBranchId,
        quantity: transferData.quantity,
        reason: transferData.reason
      });
      
      toast.success('Stock transfer initiated successfully!');
      setTransferModalOpen(false);
      setTransferData({
        productId: 0,
        fromBranchId: 0,
        toBranchId: 0,
        quantity: 0,
        reason: ''
      });
      // Refresh inventory after transfer
      fetchInventory();
    } catch (error) {
      toast.error('Failed to initiate transfer');
      console.error('Transfer error:', error);
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const filters = {
        branch_id: selectedBranchId && selectedBranchId !== 'all' ? selectedBranchId : undefined
      };
      
      const data = await InventoryService.getInventory(filters);
      setInventory(data.inventory);
      setSummary(data.summary);
    } catch (error) {
      toast.error('Failed to fetch inventory data');
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAutoRestock = async () => {
    try {
      const data = await InventoryService.processAutoRestock();
      toast.success(data.message);
      fetchInventory();
    } catch (error) {
      toast.error('Failed to process auto-restock');
      console.error('Error processing auto-restock:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'bg-green-100 text-green-800';
      case 'low_stock':
        return 'bg-yellow-100 text-yellow-800';
      case 'out_of_stock':
        return 'bg-red-100 text-red-800';
      case 'expiring_soon':
        return 'bg-orange-100 text-orange-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <CheckCircle className="h-4 w-4" />;
      case 'low_stock':
        return <AlertTriangle className="h-4 w-4" />;
      case 'out_of_stock':
        return <AlertTriangle className="h-4 w-4" />;
      case 'expiring_soon':
        return <Clock className="h-4 w-4" />;
      case 'expired':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const filteredInventory = inventory.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const isAdmin = user?.role === 'admin';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Package className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Enhanced Inventory Management</h1>
        </div>
        <div className="flex items-center space-x-4">
          {isMultiBranch && (
            <BranchFilter
              selectedBranchId={selectedBranchId}
              onBranchChange={(branchId) => {
                // This will trigger the useEffect to refetch inventory
                window.location.reload(); // Simple approach for now
              }}
              showAllOption={true}
              label=""
              placeholder="All branches"
              className="min-w-[200px]"
            />
          )}
          <div className="flex items-center space-x-2">
            <Button onClick={fetchInventory} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            {isAdmin && (
              <Button onClick={processAutoRestock} variant="outline" size="sm">
                <TrendingUp className="h-4 w-4 mr-2" />
                Process Auto-Restock
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold">{summary.total_items}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">In Stock</p>
                  <p className="text-2xl font-bold text-green-600">{summary.in_stock}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Low Stock</p>
                  <p className="text-2xl font-bold text-yellow-600">{summary.low_stock}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-600">{summary.out_of_stock}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Expiring Soon</p>
                  <p className="text-2xl font-bold text-orange-600">{summary.expiring_soon}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Expired</p>
                  <p className="text-2xl font-bold text-red-600">{summary.expired}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={setFilter} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="in_stock">In Stock</TabsTrigger>
          <TabsTrigger value="low_stock">Low Stock</TabsTrigger>
          <TabsTrigger value="out_of_stock">Out of Stock</TabsTrigger>
          <TabsTrigger value="expiring_soon">Expiring Soon</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
          <TabsTrigger value="transfers">Stock Transfers</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Items</CardTitle>
              <CardDescription>
                Manage your inventory with expiry tracking and auto-restock features
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredInventory.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            {item.product.image_paths && item.product.image_paths.length > 0 ? (
                              <img
                                src={`http://127.0.0.1:8000/storage/${item.product.image_paths[0]}`}
                                alt={item.product.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <Package className="h-6 w-6 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium">{item.product.name}</h3>
                            <p className="text-sm text-gray-600">{item.branch.name}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-sm">Stock: {item.available_quantity}</span>
                              <span className="text-sm">Threshold: {item.min_stock_threshold}</span>
                              {item.expiry_date && (
                                <span className="text-sm flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {item.days_until_expiry !== undefined && item.days_until_expiry < 0
                                    ? `Expired ${Math.abs(item.days_until_expiry)} days ago`
                                    : item.days_until_expiry !== undefined && item.days_until_expiry <= 30
                                    ? `Expires in ${item.days_until_expiry} days`
                                    : 'No expiry'
                                  }
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge className={getStatusColor(item.status)}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(item.status)}
                              <span className="capitalize">{item.status.replace('_', ' ')}</span>
                            </div>
                          </Badge>
                          {item.auto_restock_enabled && (
                            <Badge variant="outline" className="text-green-600 border-green-200">
                              Auto-Restock
                            </Badge>
                          )}
                          {isAdmin && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedItem(item)}
                                >
                                  <Settings className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Inventory Settings</DialogTitle>
                                  <DialogDescription>
                                    Configure expiry tracking and auto-restock for {item.product.name}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="min-threshold">Minimum Stock Threshold</Label>
                                      <Input
                                        id="min-threshold"
                                        type="number"
                                        defaultValue={item.min_stock_threshold}
                                        min="1"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="expiry-date">Expiry Date</Label>
                                      <Input
                                        id="expiry-date"
                                        type="date"
                                        defaultValue={item.expiry_date || ''}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      id="auto-restock"
                                      defaultChecked={item.auto_restock_enabled}
                                    />
                                    <Label htmlFor="auto-restock">Enable Auto-Restock</Label>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button onClick={async () => {
                                    try {
                                      const minThreshold = document.getElementById('min-threshold') as HTMLInputElement;
                                      const expiryDate = document.getElementById('expiry-date') as HTMLInputElement;
                                      const autoRestock = document.getElementById('auto-restock') as HTMLInputElement;
                                      
                                      await InventoryService.updateProductSettings(selectedItem!.product_id, {
                                        min_stock_threshold: parseInt(minThreshold.value),
                                        expiry_date: expiryDate.value || null,
                                        auto_restock_enabled: autoRestock.checked,
                                        branch_stock_settings: {
                                          [selectedItem!.branch_id]: {
                                            min_stock_threshold: parseInt(minThreshold.value),
                                            expiry_date: expiryDate.value || null,
                                            auto_restock_enabled: autoRestock.checked
                                          }
                                        }
                                      });
                                      
                                      toast.success('Settings updated successfully');
                                      fetchInventory();
                                    } catch (error) {
                                      toast.error('Failed to update settings');
                                      console.error('Error updating settings:', error);
                                    }
                                  }}>Save Settings</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {filteredInventory.length === 0 && (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
                      <p className="text-gray-500">
                        {filter === 'all' 
                          ? 'No inventory items available.'
                          : `No items with status "${filter.replace('_', ' ')}" found.`
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Transfer Tab */}
        <TabsContent value="transfers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5" />
                Stock Transfers
              </CardTitle>
              <CardDescription>
                Transfer inventory between branches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Transfer Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Initiate Transfer</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="product-select">Select Product</Label>
                        <select
                          id="product-select"
                          className="w-full p-2 border rounded-md"
                          onChange={(e) => setTransferData({...transferData, productId: parseInt(e.target.value)})}
                        >
                          <option value="">Choose a product</option>
                          {inventory.map(item => (
                            <option key={item.product_id} value={item.product_id}>
                              {item.product.name} - {item.branch.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <Label htmlFor="from-branch">From Branch</Label>
                        <select
                          id="from-branch"
                          className="w-full p-2 border rounded-md"
                          onChange={(e) => setTransferData({...transferData, fromBranchId: parseInt(e.target.value)})}
                        >
                          <option value="">Select source branch</option>
                          {branches.map(branch => (
                            <option key={branch.id} value={branch.id}>
                              {branch.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <Label htmlFor="to-branch">To Branch</Label>
                        <select
                          id="to-branch"
                          className="w-full p-2 border rounded-md"
                          onChange={(e) => setTransferData({...transferData, toBranchId: parseInt(e.target.value)})}
                        >
                          <option value="">Select destination branch</option>
                          {branches.map(branch => (
                            <option key={branch.id} value={branch.id}>
                              {branch.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          onChange={(e) => setTransferData({...transferData, quantity: parseInt(e.target.value)})}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="reason">Reason</Label>
                        <Input
                          id="reason"
                          placeholder="e.g., High demand, Low stock"
                          onChange={(e) => setTransferData({...transferData, reason: e.target.value})}
                        />
                      </div>
                      
                      <Button 
                        onClick={() => setTransferModalOpen(true)}
                        className="w-full"
                        disabled={!transferData.productId || !transferData.fromBranchId || !transferData.toBranchId || !transferData.quantity}
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        Initiate Transfer
                      </Button>
                    </div>
                  </div>
                  
                  {/* Transfer History */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Recent Transfers</h3>
                    <div className="space-y-2">
                      <div className="border rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">Ray-Ban Aviator Classic</p>
                            <p className="text-sm text-gray-600">Emerald → Unitop</p>
                            <p className="text-xs text-gray-500">2 days ago</p>
                          </div>
                          <Badge variant="outline">Completed</Badge>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">Oakley Holbrook</p>
                            <p className="text-sm text-gray-600">Newstar → Garnet</p>
                            <p className="text-xs text-gray-500">5 days ago</p>
                          </div>
                          <Badge variant="outline">In Transit</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Transfer Confirmation Modal */}
      <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Stock Transfer</DialogTitle>
            <DialogDescription>
              Please review the transfer details before confirming.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Product</Label>
                <p className="text-sm font-medium">
                  {inventory.find(item => item.product_id === transferData.productId)?.product.name}
                </p>
              </div>
              <div>
                <Label>Quantity</Label>
                <p className="text-sm font-medium">{transferData.quantity}</p>
              </div>
              <div>
                <Label>From</Label>
                <p className="text-sm font-medium">
                  {branches.find(b => b.id === transferData.fromBranchId)?.name}
                </p>
              </div>
              <div>
                <Label>To</Label>
                <p className="text-sm font-medium">
                  {branches.find(b => b.id === transferData.toBranchId)?.name}
                </p>
              </div>
            </div>
            <div>
              <Label>Reason</Label>
              <p className="text-sm">{transferData.reason || 'No reason provided'}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleTransfer}>
              Confirm Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedInventoryManagement;
