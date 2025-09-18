import React from 'react';
import { BarChart3, Users, Package, TrendingUp, Calendar, Banknote, Store, Award } from 'lucide-react';
import { DashboardCard } from './DashboardCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';


const AdminDashboard = () => {
  const navigate = useNavigate();

  const branchData = [
    { name: 'Downtown', revenue: 45200, patients: 234, growth: 8.5 },
    { name: 'Mall Plaza', revenue: 38900, patients: 198, growth: 12.3 },
    { name: 'Northside', revenue: 33700, patients: 167, growth: -2.1 },
    { name: 'Westfield', revenue: 29800, patients: 145, growth: 15.7 }
  ];

  const topProducts = [
    { name: 'Progressive Lenses', sales: 156, revenue: 31200, trend: 8.2 },
    { name: 'Designer Frames', sales: 89, revenue: 22250, trend: 15.3 },
    { name: 'Contact Lenses', sales: 234, revenue: 9360, trend: -3.2 },
    { name: 'Blue Light Glasses', sales: 67, revenue: 8040, trend: 22.1 }
  ];

  const userStats = [
    { role: 'Customers', count: 1247, change: 12 },
    { role: 'Optometrists', count: 8, change: 1 },
    { role: 'Staff', count: 24, change: 3 },
    { role: 'Admins', count: 3, change: 0 }
  ];

  const inventoryStatus = [
    { branch: 'Downtown', items: 245, alerts: 3 },
    { branch: 'Mall Plaza', items: 198, alerts: 1 },
    { branch: 'Northside', items: 167, alerts: 5 },
    { branch: 'Westfield', items: 143, alerts: 2 }
  ];

  const monthlyRevenue = 147500;
  const totalPatients = 744;
  const avgGrowth = 8.6;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-admin rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Administrative Dashboard</h1>
        <p className="text-admin-foreground/90">
          Complete overview of all clinic operations, performance metrics, and system management.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Monthly Revenue"
          value={`₱${monthlyRevenue.toLocaleString()}`}
          description="Across all branches"
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
          description="Total registered"
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
          value="753"
          description="Items across branches"
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
          value={branchData.length}
          description="Operational locations"
          icon={Store}
          action={{
            label: 'Branch Analytics',
            onClick: () => navigate('/admin/analytics'),
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
            <CardDescription>Revenue and patient metrics by location</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {branchData.map((branch, index) => (
              <div key={index} className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-900">{branch.name}</h4>
                  <Badge className={branch.growth > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {branch.growth > 0 ? '+' : ''}{branch.growth}%
                  </Badge>
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
                </div>
                <Progress value={(branch.revenue / 50000) * 100} className="mt-2 h-2" />
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full">
              Detailed Branch Report
            </Button>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-admin" />
              <span>Top Selling Products</span>
            </CardTitle>
            <CardDescription>Best performing products this month</CardDescription>
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
            <Button variant="outline" size="sm" className="w-full">
              Product Analytics
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
            <CardDescription>System users by role</CardDescription>
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
            <Button variant="admin" size="sm" className="w-full">
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
            <CardDescription>Stock status across all branches</CardDescription>
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
            <Button variant="outline" size="sm" className="w-full">
              Inventory Management
            </Button>
          </CardContent>
        </Card>
      </div>

    </div>
  );
};

export default AdminDashboard;
