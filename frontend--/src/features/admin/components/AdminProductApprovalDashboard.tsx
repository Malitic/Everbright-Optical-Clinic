import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Building2, Phone, Mail, Globe, Package, Filter, Search, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminProducts, approveProduct, rejectProduct, getManufacturers, getBranches } from '@/services/adminProductApi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  image_paths: string[];
  is_active: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  created_by: number;
  created_by_role: string;
  branch_id: number;
  created_at: string;
  creator: {
    id: number;
    name: string;
    email: string;
  };
  branch: {
    id: number;
    name: string;
    code: string;
  };
}

interface Manufacturer {
  id: number;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  product_line: string;
  address: string;
  website: string;
}

interface Branch {
  id: number;
  name: string;
  code: string;
}

const AdminProductApprovalDashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0
  });

  useEffect(() => {
    fetchProducts();
    fetchManufacturers();
    fetchBranches();
    
    // Auto-refresh every 30 seconds to show latest updates
    const interval = setInterval(() => {
      fetchProducts();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [selectedBranch, selectedStatus]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getAdminProducts({
        branch_id: selectedBranch !== 'all' ? selectedBranch : undefined,
        approval_status: selectedStatus !== 'all' ? selectedStatus : undefined,
        search: searchTerm || undefined
      });
      
      setProducts(data.products || []);
      setStats({
        total: data.total_count || 0,
        approved: data.approved_count || 0,
        pending: data.pending_count || 0,
        rejected: data.rejected_count || 0
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchManufacturers = async () => {
    try {
      const data = await getManufacturers();
      const manufacturersData = data.manufacturers || data || [];
      // Filter out any manufacturers with invalid data
      const validManufacturers = manufacturersData.filter((manufacturer: any) => 
        manufacturer && manufacturer.id && manufacturer.name
      );
      setManufacturers(validManufacturers);
    } catch (error) {
      console.error('Error fetching manufacturers:', error);
      setManufacturers([]);
    }
  };

  const fetchBranches = async () => {
    try {
      const data = await getBranches();
      const branchesData = data.branches || data || [];
      // Filter out any branches with invalid data
      const validBranches = branchesData.filter((branch: any) => 
        branch && branch.id && branch.name && branch.id.toString().trim() !== ''
      );
      setBranches(validBranches);
    } catch (error) {
      console.error('Error fetching branches:', error);
      setBranches([]);
    }
  };

  const handleApprove = async (productId: number) => {
    try {
      await approveProduct(productId);
      toast.success('Product approved successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error approving product:', error);
      toast.error('Failed to approve product');
    }
  };

  const handleReject = async (productId: number) => {
    try {
      await rejectProduct(productId);
      toast.success('Product rejected successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error rejecting product:', error);
      toast.error('Failed to reject product');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Approval Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage product approvals across all branches</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Search</label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Branch</label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {branches.filter(branch => branch.id && branch.name).map((branch) => (
                      <SelectItem key={branch.id} value={branch.id.toString()}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Manufacturer Contact Panel */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                Manufacturer Contacts
              </CardTitle>
              <CardDescription>Supplier contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {manufacturers.map((manufacturer) => (
                <div key={manufacturer.id} className="border rounded-lg p-3">
                  <h4 className="font-medium text-gray-900">{manufacturer.name}</h4>
                  <p className="text-sm text-gray-600">{manufacturer.product_line}</p>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-3 h-3 mr-2" />
                      {manufacturer.phone}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="w-3 h-3 mr-2" />
                      {manufacturer.email}
                    </div>
                    {manufacturer.website && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Globe className="w-3 h-3 mr-2" />
                        <a href={manufacturer.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Website
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Products List */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Products ({filteredProducts.length})</CardTitle>
              <CardDescription>Review and approve products from all branches</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No products found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{product.name}</h3>
                            {getStatusBadge(product.approval_status)}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <p><span className="font-medium">Branch:</span> {product.branch?.name || 'Unknown'}</p>
                              <p><span className="font-medium">Price:</span> ₱{product.price.toFixed(2)}</p>
                              <p><span className="font-medium">Stock:</span> {product.stock_quantity}</p>
                            </div>
                            <div>
                              <p><span className="font-medium">Created by:</span> {product.creator?.name || 'Unknown'}</p>
                              <p><span className="font-medium">Role:</span> {product.created_by_role}</p>
                              <p><span className="font-medium">Date:</span> {new Date(product.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>

                          {product.description && (
                            <p className="text-sm text-gray-600 mt-2">{product.description}</p>
                          )}

                          {product.image_paths && product.image_paths.length > 0 && (
                            <div className="mt-3">
                              <div className="flex gap-2">
                                {product.image_paths.slice(0, 3).map((image, index) => (
                                  <img
                                    key={index}
                                    src={`http://127.0.0.1:8000/storage/${image}`}
                                    alt={`${product.name} ${index + 1}`}
                                    className="w-16 h-16 object-cover rounded border"
                                  />
                                ))}
                                {product.image_paths.length > 3 && (
                                  <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500">
                                    +{product.image_paths.length - 3} more
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          {product.approval_status === 'pending' && (
                            <>
                              <Button
                                onClick={() => handleApprove(product.id)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                                size="sm"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                onClick={() => handleReject(product.id)}
                                variant="destructive"
                                size="sm"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          
                          {product.approval_status === 'approved' && (
                            <Button
                              onClick={() => handleReject(product.id)}
                              variant="destructive"
                              size="sm"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          )}
                          
                          {product.approval_status === 'rejected' && (
                            <Button
                              onClick={() => handleApprove(product.id)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                              size="sm"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminProductApprovalDashboard;
