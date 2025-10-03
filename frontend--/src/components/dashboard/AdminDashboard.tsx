import React, { useState, useEffect } from 'react';
import { BarChart3, Users, Package, TrendingUp, Calendar, Banknote, Store, Award, RefreshCw, Clock } from 'lucide-react';
import { DashboardCard } from './DashboardCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import BranchFilter from '@/components/common/BranchFilter';
import { useBranch } from '@/contexts/BranchContext';
import { useQuery } from '@tanstack/react-query';
import { getBranchPerformance, BranchPerformance, BranchAnalyticsSummary } from '@/services/branchAnalyticsApi';
import EmployeeScheduleManagement from '@/components/admin/EmployeeScheduleManagement';


const AdminDashboard = () => {
  const navigate = useNavigate();
  const { selectedBranchId, setSelectedBranchId, isMultiBranch } = useBranch();

  // Fetch real branch performance data
  const { data: branchAnalytics, isLoading: branchLoading, refetch: refetchBranchData } = useQuery({
    queryKey: ['branch-performance'],
    queryFn: getBranchPerformance,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const allBranchData: BranchPerformance[] = branchAnalytics?.branches || [];
  const summary: BranchAnalyticsSummary | null = branchAnalytics?.summary || null;
  
  // Filter branch data based on selected branch
  const branchData = selectedBranchId === 'all' 
    ? allBranchData 
    : allBranchData.filter(branch => branch.id.toString() === selectedBranchId);

  // Get branch-specific or all data based on filter
  const getTopProducts = () => {
    if (selectedBranchId === 'all') {
      return [
        { name: 'Progressive Lenses', sales: 156, revenue: 31200, trend: 8.2 },
        { name: 'Designer Frames', sales: 89, revenue: 22250, trend: 15.3 },
        { name: 'Contact Lenses', sales: 234, revenue: 9360, trend: -3.2 },
        { name: 'Blue Light Glasses', sales: 67, revenue: 8040, trend: 22.1 }
      ];
    } else {
      // Branch-specific product data (you can replace this with real API calls)
      const branch = branchData[0];
      return [
        { name: 'Progressive Lenses', sales: Math.floor(156 / allBranchData.length), revenue: Math.floor(31200 / allBranchData.length), trend: 8.2 },
        { name: 'Designer Frames', sales: Math.floor(89 / allBranchData.length), revenue: Math.floor(22250 / allBranchData.length), trend: 15.3 },
        { name: 'Contact Lenses', sales: Math.floor(234 / allBranchData.length), revenue: Math.floor(9360 / allBranchData.length), trend: -3.2 },
        { name: 'Blue Light Glasses', sales: Math.floor(67 / allBranchData.length), revenue: Math.floor(8040 / allBranchData.length), trend: 22.1 }
      ];
    }
  };

  const getUserStats = () => {
    if (selectedBranchId === 'all') {
      return [
        { role: 'Customers', count: 1247, change: 12 },
        { role: 'Optometrists', count: 8, change: 1 },
        { role: 'Staff', count: 24, change: 3 },
        { role: 'Admins', count: 3, change: 0 }
      ];
    } else {
      // Branch-specific user data
      const branch = branchData[0];
      return [
        { role: 'Customers', count: Math.floor(1247 / allBranchData.length), change: 12 },
        { role: 'Optometrists', count: Math.floor(8 / allBranchData.length), change: 1 },
        { role: 'Staff', count: Math.floor(24 / allBranchData.length), change: 3 },
        { role: 'Admins', count: 1, change: 0 }
      ];
    }
  };

  const getInventoryStatus = () => {
    if (selectedBranchId === 'all') {
      return allBranchData.map(branch => ({
        branch: branch.name,
        items: Math.floor(Math.random() * 200) + 100, // Simulated data
        alerts: Math.floor(Math.random() * 5)
      }));
    } else {
      // Single branch inventory data
      const branch = branchData[0];
      return [{
        branch: branch.name,
        items: Math.floor(Math.random() * 200) + 100,
        alerts: Math.floor(Math.random() * 5)
      }];
    }
  };

  const topProducts = getTopProducts();
  const userStats = getUserStats();
  const inventoryStatus = getInventoryStatus();

  // Calculate metrics based on filtered data
  const monthlyRevenue = selectedBranchId === 'all' 
    ? (summary?.total_revenue || 0)
    : branchData.reduce((sum, branch) => sum + branch.revenue, 0);
    
  const totalPatients = selectedBranchId === 'all' 
    ? (summary?.total_patients || 0)
    : branchData.reduce((sum, branch) => sum + branch.patients, 0);
    
  const avgGrowth = selectedBranchId === 'all' 
    ? (summary?.average_growth || 0)
    : branchData.length > 0 
      ? branchData.reduce((sum, branch) => sum + branch.growth, 0) / branchData.length
      : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-admin rounded-lg p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-2">Administrative Dashboard</h1>
            <p className="text-admin-foreground/90">
              Complete overview of all clinic operations, performance metrics, and system management.
            </p>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <BranchFilter
                selectedBranchId={selectedBranchId}
                onBranchChange={setSelectedBranchId}
                showAllOption={true}
                label="Filter by Branch"
                placeholder="All branches"
                useAdminData={true}
                className="min-w-[200px]"
              />
              {selectedBranchId !== 'all' && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Showing: {branchData[0]?.name || 'Selected Branch'}
                </Badge>
              )}
              {selectedBranchId === 'all' && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Showing: All Branches
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => refetchBranchData()}
              variant="outline"
              size="sm"
              className="min-w-[120px] disabled:opacity-50 transition-all duration-200 hover:bg-blue-50 hover:border-blue-300"
              disabled={branchLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${branchLoading ? 'animate-spin' : ''}`} />
              {branchLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <DashboardCard
          title="Monthly Revenue"
          value={`₱${monthlyRevenue.toLocaleString()}`}
          description={selectedBranchId === 'all' ? "Across all branches" : `For ${branchData[0]?.name || 'selected branch'}`}
          icon={Banknote}
          trend={{ value: avgGrowth, label: 'vs last month', isPositive: true }}
          action={{
            label: 'View Analytics',
            onClick: () => navigate('/admin/analytics'),
            variant: 'admin'
          }}
          gradient
        />
        
        <DashboardCard
          title="Active Patients"
          value={totalPatients}
          description={selectedBranchId === 'all' ? "Total registered" : `Registered at ${branchData[0]?.name || 'selected branch'}`}
          icon={Users}
          trend={{ value: 5.2, label: 'growth rate', isPositive: true }}
          action={{
            label: 'User Management',
            onClick: () => navigate('/admin/users'),
            variant: 'admin'
          }}
          gradient
        />
        
        <DashboardCard
          title="Total Inventory"
          value={selectedBranchId === 'all' ? "753" : inventoryStatus[0]?.items || "0"}
          description={selectedBranchId === 'all' ? "Items across branches" : `Items at ${branchData[0]?.name || 'selected branch'}`}
          icon={Package}
          action={{
            label: 'Manage Inventory',
            onClick: () => navigate('/admin/inventory'),
            variant: 'admin'
          }}
          gradient
        />
        
        <DashboardCard
          title="Active Branches"
          value={selectedBranchId === 'all' ? allBranchData.length : branchData.length}
          description={selectedBranchId === 'all' ? "All locations" : "Selected location"}
          icon={Store}
          action={{
            label: 'Branch Analytics',
            onClick: () => navigate('/admin/analytics'),
            variant: 'admin'
          }}
          gradient
        />
        
        <DashboardCard
          title="Product Gallery"
          value="Manage"
          description="Add, edit, delete products"
          icon={Package}
          action={{
            label: 'Manage Products',
            onClick: () => navigate('/admin/products'),
            variant: 'admin'
          }}
          gradient
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branch Performance */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-admin" />
              <span>Branch Performance</span>
            </CardTitle>
            <CardDescription>
              {selectedBranchId === 'all' 
                ? 'Revenue and patient metrics by location' 
                : `Performance for ${branchData[0]?.name || 'selected branch'}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {branchLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                <span>Loading branch performance...</span>
              </div>
            ) : branchData.length > 0 ? (
              <>
                {branchData.map((branch) => (
                  <div key={branch.id} className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-slate-900">{branch.name}</h4>
                      <div className="flex items-center space-x-2">
                        <Badge className={branch.growth > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {branch.growth > 0 ? '+' : ''}{branch.growth}%
                        </Badge>
                        <Badge variant={branch.is_active ? "default" : "secondary"}>
                          {branch.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-600">Revenue</p>
                        <p className="font-semibold">₱{branch.revenue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Patients</p>
                        <p className="font-semibold">{branch.patients}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Appointments</p>
                        <p className="font-semibold">{branch.appointments}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Low Stock Alerts</p>
                        <p className="font-semibold text-red-600">{branch.low_stock_alerts}</p>
                      </div>
                    </div>
                    <Progress value={Math.min((branch.revenue / 50000) * 100, 100)} className="mt-2 h-2" />
                  </div>
                ))}
                <Button 
                  variant="admin" 
                  size="sm" 
                  className="w-full mt-3"
                  onClick={() => navigate('/admin/analytics')}
                >
                  Detailed Branch Report
                </Button>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No branch performance data available.</p>
                <Button 
                  variant="admin" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => refetchBranchData()}
                >
                  Retry
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-admin" />
              <span>Top Selling Products</span>
            </CardTitle>
            <CardDescription>
              {selectedBranchId === 'all' 
                ? 'Best performing products this month' 
                : `Best performing products at ${branchData[0]?.name || 'selected branch'}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900">{product.name}</h4>
                  <p className="text-sm text-slate-600">{product.sales} units sold</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">₱{product.revenue.toLocaleString()}</p>
                  <p className={`text-sm ${product.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {product.trend > 0 ? '+' : ''}{product.trend}%
                  </p>
                </div>
              </div>
            ))}
            <Button 
              variant="admin" 
              size="sm" 
              className="w-full mt-3"
              onClick={() => navigate('/admin/products')}
            >
              Manage Products
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Statistics */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-admin" />
              <span>User Statistics</span>
            </CardTitle>
            <CardDescription>
              {selectedBranchId === 'all' 
                ? 'System users by role' 
                : `Users at ${branchData[0]?.name || 'selected branch'}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {userStats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-slate-900">{stat.role}</h4>
                  <p className="text-sm text-slate-600">Active users</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900">{stat.count}</p>
                  {stat.change > 0 && (
                    <p className="text-sm text-green-600">+{stat.change} this month</p>
                  )}
                  {stat.change === 0 && (
                    <p className="text-sm text-slate-500">No change</p>
                  )}
                </div>
              </div>
            ))}
            <Button 
              variant="admin" 
              size="sm" 
              className="w-full mt-3"
              onClick={() => navigate('/admin/users')}
            >
              Manage Users
            </Button>
          </CardContent>
        </Card>

        {/* Inventory Overview */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-admin" />
              <span>Inventory Overview</span>
            </CardTitle>
            <CardDescription>
              {selectedBranchId === 'all' 
                ? 'Stock status across all branches' 
                : `Stock status at ${branchData[0]?.name || 'selected branch'}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {inventoryStatus.map((inventory, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-slate-900">{inventory.branch}</h4>
                  <p className="text-sm text-slate-600">{inventory.items} total items</p>
                </div>
                <div className="text-right">
                  {inventory.alerts > 0 ? (
                    <Badge variant="destructive">
                      {inventory.alerts} alerts
                    </Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-800">
                      All good
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            <Button 
              variant="admin" 
              size="sm" 
              className="w-full mt-3"
              onClick={() => navigate('/admin/inventory')}
            >
              Inventory Management
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Employee Schedule Management Section */}
      <div className="bg-white rounded-lg shadow-sm border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-admin" />
            <span>Employee Schedule Management</span>
          </CardTitle>
          <CardDescription>
            Manage schedules for all employees (optometrists and staff) across all branches
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmployeeScheduleManagement />
        </CardContent>
      </div>

    </div>
  );
};

export default AdminDashboard;
