import { useState } from 'react';
import { BarChart3, TrendingUp, Users, Calendar, Banknote, RefreshCw, Building2, Target, Award, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { useQuery } from '@tanstack/react-query';
import { getBranchPerformance, BranchPerformance } from '@/services/branchAnalyticsApi';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useBranch } from '@/contexts/BranchContext';
import BranchFilter from '../common/BranchFilter';

const AnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState('month');
  const { selectedBranchId, setSelectedBranchId } = useBranch();

  // Fetch real branch performance data
  const { data: branchAnalytics, isLoading: branchLoading, refetch: refetchBranchData } = useQuery({
    queryKey: ['branch-performance', selectedBranchId],
    queryFn: getBranchPerformance,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const allBranchPerformance: BranchPerformance[] = branchAnalytics?.branches || [];
  
  // Filter branch performance data based on selected branch
  const branchPerformance = selectedBranchId === 'all' 
    ? allBranchPerformance 
    : allBranchPerformance.filter(branch => branch.id.toString() === selectedBranchId);

  const revenueData = [
    { month: 'Jan', revenue: 45000, appointments: 320, patients: 280 },
    { month: 'Feb', revenue: 52000, appointments: 380, patients: 310 },
    { month: 'Mar', revenue: 48000, appointments: 350, patients: 295 },
    { month: 'Apr', revenue: 61000, appointments: 420, patients: 340 },
    { month: 'May', revenue: 55000, appointments: 390, patients: 325 },
    { month: 'Jun', revenue: 67000, appointments: 450, patients: 380 }
  ];

  const appointmentsByType = [
    { name: 'Eye Examinations', value: 45, color: '#3b82f6' },
    { name: 'Contact Lens Fitting', value: 25, color: '#10b981' },
    { name: 'Follow-up Visits', value: 20, color: '#f59e0b' },
    { name: 'Emergency Consultations', value: 10, color: '#ef4444' }
  ];


  const kpis = [
    {
      title: 'Total Revenue',
      value: '₱328,000',
      change: '+12.5%',
      trend: 'up',
      icon: Banknote,
      description: 'vs last month'
    },
    {
      title: 'New Patients',
      value: '1,247',
      change: '+8.2%',
      trend: 'up',
      icon: Users,
      description: 'this month'
    },
    {
      title: 'Appointments',
      value: '2,156',
      change: '+15.3%',
      trend: 'up',
      icon: Calendar,
      description: 'scheduled'
    },
    {
      title: 'Avg. Revenue/Patient',
      value: '₱263',
      change: '+4.1%',
      trend: 'up',
      icon: TrendingUp,
      description: 'per visit'
    }
  ];


  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-6 w-6 text-admin" />
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          {selectedBranchId !== 'all' && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {branchPerformance[0]?.name || 'Selected Branch'}
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <BranchFilter 
            selectedBranchId={selectedBranchId} 
            onBranchChange={setSelectedBranchId}
            useAdminData={true}
          />
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Last 7 days</SelectItem>
            <SelectItem value="month">Last month</SelectItem>
            <SelectItem value="quarter">Last quarter</SelectItem>
            <SelectItem value="year">Last year</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={() => refetchBranchData()}
          variant="outline"
          size="sm"
          className="min-w-[100px] disabled:opacity-50"
          disabled={branchLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${branchLoading ? 'animate-spin' : ''}`} />
          {branchLoading ? 'Refreshing...' : 'Refresh'}
        </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {kpis.map((kpi, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <div className="flex items-center space-x-2">
                <Badge className={kpi.trend === 'up' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
                  {kpi.change}
                </Badge>
                <p className="text-xs text-muted-foreground">{kpi.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="revenue" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Monthly revenue and patient metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="revenue" orientation="left" />
                  <YAxis yAxisId="count" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="revenue" 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    name="Revenue (₱)"
                  />
                  <Line 
                    yAxisId="count" 
                    type="monotone" 
                    dataKey="patients" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="New Patients"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Comparison</CardTitle>
                <CardDescription>Revenue vs previous period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">This Month</span>
                    <span className="text-2xl font-bold">₱67,000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last Month</span>
                    <span className="text-lg">₱55,000</span>
                  </div>
                  <Progress value={82} className="h-2" />
                  <div className="text-center">
                    <Badge className="bg-green-500 text-white">+21.8% Growth</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Service</CardTitle>
                <CardDescription>Breakdown by service type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Eye Examinations</span>
                    <span className="font-medium">₱28,500 (42%)</span>
                  </div>
                  <Progress value={42} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Frame Sales</span>
                    <span className="font-medium">₱22,100 (33%)</span>
                  </div>
                  <Progress value={33} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Contact Lenses</span>
                    <span className="font-medium">₱10,400 (15%)</span>
                  </div>
                  <Progress value={15} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Other Services</span>
                    <span className="font-medium">₱6,700 (10%)</span>
                  </div>
                  <Progress value={10} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Appointment Trends</CardTitle>
                <CardDescription>Monthly appointment volumes</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="appointments" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Appointments by Type</CardTitle>
                <CardDescription>Distribution of appointment types</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={appointmentsByType}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(props) => {
                        const { name, value } = props;
                        return `${name ?? ''}: ${value ?? 0}%`;
                      }}
                    >
                      {appointmentsByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Appointment Metrics</CardTitle>
              <CardDescription>Key performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">94%</div>
                  <div className="text-sm text-muted-foreground">Show-up Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">18min</div>
                  <div className="text-sm text-muted-foreground">Avg Wait Time</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">85%</div>
                  <div className="text-sm text-muted-foreground">On-time Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">42min</div>
                  <div className="text-sm text-muted-foreground">Avg Duration</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>



        <TabsContent value="branches" className="space-y-6">
          {/* Branch Comparison Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Performing Branch</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {allBranchPerformance.length > 0 
                    ? allBranchPerformance.reduce((max, branch) => branch.revenue > max.revenue ? branch : max).name
                    : 'N/A'
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  Highest revenue
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Most Patients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {allBranchPerformance.length > 0 
                    ? allBranchPerformance.reduce((max, branch) => branch.patients > max.patients ? branch : max).name
                    : 'N/A'
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  Patient volume leader
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fastest Growing</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {allBranchPerformance.length > 0 
                    ? allBranchPerformance.reduce((max, branch) => branch.growth > max.growth ? branch : max).name
                    : 'N/A'
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  Growth rate leader
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Branches</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{allBranchPerformance.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active locations
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Branch Performance */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Detailed Branch Performance</CardTitle>
                  <CardDescription>Comprehensive analysis across all locations</CardDescription>
                </div>
                <Button
                  onClick={() => refetchBranchData()}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${branchLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {branchLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading branch performance...</span>
                </div>
              ) : branchPerformance.length > 0 ? (
                <div className="space-y-6">
                  {/* Branch Performance Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Branch</th>
                          <th className="text-right p-2">Revenue</th>
                          <th className="text-right p-2">Patients</th>
                          <th className="text-right p-2">Appointments</th>
                          <th className="text-right p-2">Growth</th>
                          <th className="text-right p-2">Efficiency</th>
                        </tr>
                      </thead>
                      <tbody>
                        {branchPerformance.map((branch) => (
                          <tr key={branch.id} className="border-b hover:bg-gray-50">
                            <td className="p-2">
                              <div>
                                <div className="font-medium">{branch.name}</div>
                                <div className="text-sm text-muted-foreground">{branch.code}</div>
                              </div>
                            </td>
                            <td className="text-right p-2">
                              <div className="font-bold">₱{branch.revenue.toLocaleString()}</div>
                            </td>
                            <td className="text-right p-2">
                              <div className="font-bold">{branch.patients.toLocaleString()}</div>
                            </td>
                            <td className="text-right p-2">
                              <div className="font-bold">{branch.appointments}</div>
                            </td>
                            <td className="text-right p-2">
                              <div className="flex items-center justify-end space-x-2">
                                <span className="font-bold">{branch.growth > 0 ? '+' : ''}{branch.growth}%</span>
                                <Badge className={branch.growth > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                  {branch.growth > 0 ? '↗' : '↘'}
                                </Badge>
                              </div>
                            </td>
                            <td className="text-right p-2">
                              <div className="flex items-center justify-end">
                                <Progress 
                                  value={Math.min(100, (branch.revenue / Math.max(...allBranchPerformance.map(b => b.revenue))) * 100)} 
                                  className="w-16 mr-2"
                                />
                                <span className="text-sm text-muted-foreground">
                                  {Math.round((branch.revenue / Math.max(...allBranchPerformance.map(b => b.revenue))) * 100)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Branch Comparison Chart */}
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">Revenue Comparison</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={branchPerformance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`₱${value.toLocaleString()}`, 'Revenue']} />
                        <Bar dataKey="revenue" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No branch performance data available.</p>
                  <Button 
                    variant="outline" 
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
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;