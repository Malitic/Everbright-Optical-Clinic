import { useState } from 'react';
import { BarChart3, TrendingUp, Users, Calendar, Banknote, RefreshCw, Building2, Target, Award, Activity, Download, AlertTriangle, Star, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { useQuery } from '@tanstack/react-query';
import { getBranchPerformance, BranchPerformance } from '@/services/branchAnalyticsApi';
import { analyticsApi, AdminAnalytics, AnalyticsTrends } from '@/services/analyticsApi';
import { getFeedbackAnalytics, FeedbackAnalytics } from '@/services/feedbackApi';
import RevenueAnalyticsCards from './RevenueAnalyticsCards';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { useBranch } from '@/contexts/BranchContext';
import BranchFilter from '../common/BranchFilter';

const AnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState('30');
  const { selectedBranchId, setSelectedBranchId } = useBranch();

  // Fetch real branch performance data
  const { data: branchAnalytics, isLoading: branchLoading, refetch: refetchBranchData } = useQuery({
    queryKey: ['branch-performance', selectedBranchId],
    queryFn: getBranchPerformance,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch admin analytics data
  const { data: adminAnalytics, isLoading: adminLoading, refetch: refetchAdminData } = useQuery({
    queryKey: ['admin-analytics', timeRange, selectedBranchId],
    queryFn: () => analyticsApi.getAdminAnalytics({
      period: parseInt(timeRange),
      branch_id: selectedBranchId !== 'all' ? parseInt(selectedBranchId) : undefined
    }),
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch real-time analytics
  const { data: realTimeData, isLoading: realTimeLoading, refetch: refetchRealTime } = useQuery({
    queryKey: ['realtime-analytics'],
    queryFn: analyticsApi.getRealTimeAnalytics,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Fetch trends data
  const { data: trendsData, isLoading: trendsLoading } = useQuery<AnalyticsTrends>({
    queryKey: ['analytics-trends', timeRange, selectedBranchId],
    queryFn: () => analyticsApi.getAnalyticsTrends({
      period: parseInt(timeRange),
      branch_id: selectedBranchId !== 'all' ? parseInt(selectedBranchId) : undefined
    }),
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  // Fetch feedback analytics data
  const { data: feedbackData, isLoading: feedbackLoading, error: feedbackError, refetch: refetchFeedbackData } = useQuery<FeedbackAnalytics>({
    queryKey: ['feedback-analytics', selectedBranchId],
    queryFn: () => getFeedbackAnalytics({
      branch_id: selectedBranchId !== 'all' ? parseInt(selectedBranchId) : undefined,
      start_date: new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0]
    }),
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  // Debug logging
  console.log('Feedback Analytics Debug:', {
    feedbackData,
    feedbackLoading,
    feedbackError,
    selectedBranchId,
    timeRange
  });

  const allBranchPerformance: BranchPerformance[] = branchAnalytics?.branches || [];
  
  // Filter branch performance data based on selected branch
  const branchPerformance = selectedBranchId === 'all' 
    ? allBranchPerformance 
    : allBranchPerformance.filter(branch => branch.id.toString() === selectedBranchId);

  // Transform trends data for charts
  const revenueData = trendsData?.revenue_trend?.map(item => ({
    month: new Date(item.date).toLocaleDateString('en-US', { month: 'short' }),
    date: item.date,
    revenue: item.revenue,
    appointments: item.appointments,
    patients: item.patients
  })) || [];

  // Get appointment types from real data
  const appointmentsByType = trendsData?.appointment_types?.map((item, index) => ({
    name: item.name,
    value: item.value,
    color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'][index % 6]
  })) || [];

  // Transform appointment trend data for charts
  const appointmentTrendData = trendsData?.appointment_trend?.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    fullDate: item.date,
    total: item.total,
    completed: item.completed,
    cancelled: item.cancelled
  })) || [];


  // Calculate KPIs from real data
  const kpis = [
    {
      title: 'Total Revenue',
      value: realTimeData?.total_revenue_today ? `₱${realTimeData.total_revenue_today.toLocaleString()}` : '₱0',
      change: adminAnalytics?.system_wide_stats?.revenue ? `₱${adminAnalytics.system_wide_stats.revenue.toLocaleString()}` : '₱0',
      trend: 'up',
      icon: Banknote,
      description: 'today / period total'
    },
    {
      title: 'Active Users',
      value: realTimeData?.active_users ? realTimeData.active_users.toString() : '0',
      change: adminAnalytics?.system_wide_stats?.users ? adminAnalytics.system_wide_stats.users.toString() : '0',
      trend: 'up',
      icon: Users,
      description: 'active / total users'
    },
    {
      title: 'Appointments Today',
      value: realTimeData?.total_appointments_today ? realTimeData.total_appointments_today.toString() : '0',
      change: adminAnalytics?.system_wide_stats?.appointments ? adminAnalytics.system_wide_stats.appointments.toString() : '0',
      trend: 'up',
      icon: Calendar,
      description: 'today / period total'
    },
    {
      title: 'Low Stock Alerts',
      value: realTimeData?.low_stock_alerts ? realTimeData.low_stock_alerts.toString() : '0',
      change: realTimeData?.upcoming_appointments ? realTimeData.upcoming_appointments.toString() : '0',
      trend: (realTimeData?.low_stock_alerts && realTimeData.low_stock_alerts > 0) ? 'down' : 'up',
      icon: AlertTriangle,
      description: 'alerts / upcoming appointments'
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
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={() => {
            refetchBranchData();
            refetchAdminData();
            refetchRealTime();
            refetchFeedbackData();
          }}
          variant="outline"
          size="sm"
          className="min-w-[100px] disabled:opacity-50"
          disabled={branchLoading || adminLoading || realTimeLoading || feedbackLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${(branchLoading || adminLoading || realTimeLoading || feedbackLoading) ? 'animate-spin' : ''}`} />
          {(branchLoading || adminLoading || realTimeLoading || feedbackLoading) ? 'Refreshing...' : 'Refresh'}
        </Button>
        <Button
          onClick={async () => {
            try {
              const blob = await analyticsApi.exportAnalytics('admin', 'csv', {
                period: parseInt(timeRange),
                branch_id: selectedBranchId !== 'all' ? parseInt(selectedBranchId) : undefined
              });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);
            } catch (error) {
              console.error('Export failed:', error);
            }
          }}
          variant="outline"
          size="sm"
          className="min-w-[100px]"
        >
          <Download className="h-4 w-4 mr-2" />
          Export
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

      {/* Revenue Analytics Cards */}
      <RevenueAnalyticsCards />

      <Tabs defaultValue="revenue" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Daily revenue and patient metrics over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              {trendsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading trends data...</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={trendsData?.revenue_trend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="revenue" orientation="left" />
                    <YAxis yAxisId="count" orientation="right" />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'Revenue (₱)' ? `₱${Number(value || 0).toLocaleString()}` : value,
                        name
                      ]}
                    />
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
                      name="Patients"
                    />
                    <Line 
                      yAxisId="count" 
                      type="monotone" 
                      dataKey="appointments" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      name="Appointments"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
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
                <CardDescription>Daily appointment volumes over time</CardDescription>
              </CardHeader>
              <CardContent>
                {trendsLoading ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Loading appointment trends...</p>
                    </div>
                  </div>
                ) : appointmentTrendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={appointmentTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(value, payload) => {
                          const data = payload?.[0]?.payload;
                          return data ? new Date(data.fullDate).toLocaleDateString() : value;
                        }}
                        formatter={(value, name) => [
                          value,
                          name === 'total' ? 'Total' : 
                          name === 'completed' ? 'Completed' : 
                          name === 'cancelled' ? 'Cancelled' : name
                        ]}
                      />
                      <Bar dataKey="total" fill="#3b82f6" name="total" />
                      <Bar dataKey="completed" fill="#10b981" name="completed" />
                      <Bar dataKey="cancelled" fill="#ef4444" name="cancelled" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px]">
                    <div className="text-center">
                      <p className="text-muted-foreground">No appointment data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Appointments by Type</CardTitle>
                <CardDescription>Distribution of appointment types</CardDescription>
              </CardHeader>
              <CardContent>
                {trendsLoading ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Loading appointment types...</p>
                    </div>
                  </div>
                ) : appointmentsByType.length > 0 ? (
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
                          const total = appointmentsByType.reduce((sum, item) => sum + item.value, 0);
                          const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                          return `${name ?? ''}: ${percentage}%`;
                        }}
                      >
                        {appointmentsByType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value, name) => [
                          value,
                          name
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px]">
                    <div className="text-center">
                      <p className="text-muted-foreground">No appointment type data available</p>
                    </div>
                  </div>
                )}
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
                              <div className="font-bold">₱{(branch.revenue || 0).toLocaleString()}</div>
                            </td>
                            <td className="text-right p-2">
                              <div className="font-bold">{(branch.patients || 0).toLocaleString()}</div>
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
                                  value={allBranchPerformance.length > 0 ? Math.min(100, (branch.revenue / Math.max(...allBranchPerformance.map(b => b.revenue))) * 100) : 0} 
                                  className="w-16 mr-2"
                                />
                                <span className="text-sm text-muted-foreground">
                                  {allBranchPerformance.length > 0 ? Math.round((branch.revenue / Math.max(...allBranchPerformance.map(b => b.revenue))) * 100) : 0}%
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
                        <Tooltip formatter={(value) => [`₱${(value || 0).toLocaleString()}`, 'Revenue']} />
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

        <TabsContent value="feedback" className="space-y-6">
          {/* Debug Information */}
          {feedbackError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-red-800 font-semibold">Error Loading Feedback Data</h3>
              <p className="text-red-600 text-sm mt-1">
                {feedbackError instanceof Error ? feedbackError.message : 'Unknown error occurred'}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => refetchFeedbackData()}
              >
                Retry
              </Button>
            </div>
          )}
          
          {feedbackLoading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-600">Loading feedback data...</p>
            </div>
          )}
          
          {/* Feedback Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {feedbackData?.overall_stats?.avg_rating ? feedbackData.overall_stats.avg_rating.toFixed(1) : '0.0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  out of 5.0 stars
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {feedbackData?.overall_stats?.total_feedback || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  customer reviews
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {feedbackData?.overall_stats?.unique_customers || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  provided feedback
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {feedbackData?.overall_stats?.total_feedback && feedbackData?.overall_stats?.unique_customers 
                    ? Math.round((feedbackData.overall_stats.total_feedback / feedbackData.overall_stats.unique_customers) * 100) 
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  feedback per customer
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rating Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Rating Distribution</CardTitle>
                <CardDescription>Breakdown of customer ratings</CardDescription>
              </CardHeader>
              <CardContent>
                {feedbackLoading ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Loading rating distribution...</p>
                    </div>
                  </div>
                ) : feedbackData?.rating_distribution && feedbackData.rating_distribution.length > 0 ? (
                  <div className="space-y-3">
                    {feedbackData.rating_distribution.map((item) => {
                      const total = feedbackData.rating_distribution.reduce((sum, i) => sum + i.count, 0);
                      const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
                      return (
                        <div key={item.rating} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium">{item.rating} Star{item.rating !== 1 ? 's' : ''}</span>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < item.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <span className="text-sm text-muted-foreground">{item.count} ({percentage}%)</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px]">
                    <div className="text-center">
                      <p className="text-muted-foreground">No rating data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Branch Ratings Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Branch Ratings</CardTitle>
                <CardDescription>Average ratings by branch</CardDescription>
              </CardHeader>
              <CardContent>
                {feedbackLoading ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Loading branch ratings...</p>
                    </div>
                  </div>
                ) : feedbackData?.branch_ratings && feedbackData.branch_ratings.length > 0 ? (
                  <div className="space-y-4">
                    {feedbackData.branch_ratings.map((branch) => (
                      <div key={branch.branch_id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{branch.branch_name}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-bold">{branch.avg_rating.toFixed(1)}</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < Math.floor(branch.avg_rating) ? 'text-yellow-400 fill-current' : 
                                    i < branch.avg_rating ? 'text-yellow-400 fill-current opacity-50' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{branch.feedback_count} reviews</span>
                          <Progress 
                            value={(branch.avg_rating / 5) * 100} 
                            className="w-20 h-1" 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px]">
                    <div className="text-center">
                      <p className="text-muted-foreground">No branch rating data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Feedback Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Feedback Trends</CardTitle>
              <CardDescription>Rating trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              {feedbackLoading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading feedback trends...</p>
                  </div>
                </div>
              ) : feedbackData?.trend_data && feedbackData.trend_data.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={feedbackData.trend_data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => new Date(value + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                    />
                    <YAxis domain={[0, 5]} />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'avg_rating' ? Number(value).toFixed(2) : value,
                        name === 'avg_rating' ? 'Average Rating' : 'Feedback Count'
                      ]}
                      labelFormatter={(value) => new Date(value + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="avg_rating" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.3}
                      name="avg_rating"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px]">
                  <div className="text-center">
                    <p className="text-muted-foreground">No trend data available</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Latest Feedback */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Latest Feedback</CardTitle>
                  <CardDescription>Recent customer reviews and comments</CardDescription>
                </div>
                <Button
                  onClick={() => refetchFeedbackData()}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${feedbackLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {feedbackLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading latest feedback...</span>
                </div>
              ) : feedbackData?.latest_feedback && feedbackData.latest_feedback.length > 0 ? (
                <div className="space-y-4">
                  {feedbackData.latest_feedback.map((feedback) => (
                    <div key={feedback.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{feedback.customer_name}</span>
                          <Badge variant="outline" className="text-xs">
                            {feedback.branch_name}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < feedback.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(feedback.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {feedback.comment && (
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                          "{feedback.comment}"
                        </p>
                      )}
                      {feedback.appointment_date && (
                        <p className="text-xs text-muted-foreground">
                          Appointment: {new Date(feedback.appointment_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No feedback data available.</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => refetchFeedbackData()}
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