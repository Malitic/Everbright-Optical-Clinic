import { useState } from 'react';
import { Eye, TrendingUp, Calendar, FileText, Activity, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi, CustomerAnalytics as CustomerAnalyticsType } from '@/services/analyticsApi';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';

const CustomerAnalytics = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('30');

  // Fetch customer analytics data
  const { data: analytics, isLoading, refetch } = useQuery<CustomerAnalyticsType>({
    queryKey: ['customer-analytics', user?.id, timeRange],
    queryFn: () => analyticsApi.getCustomerAnalytics(user?.id || 0, {
      period: parseInt(timeRange)
    }),
    enabled: !!user?.id,
    refetchInterval: 60000, // Refetch every minute
  });

  if (!user) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Please log in to view your analytics.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total Appointments',
      value: analytics?.appointment_summary?.total_appointments || 0,
      icon: Calendar,
      description: 'All time'
    },
    {
      title: 'Completed Appointments',
      value: analytics?.appointment_summary?.completed_appointments || 0,
      icon: Activity,
      description: 'Successfully completed'
    },
    {
      title: 'Active Prescriptions',
      value: analytics?.prescription_summary?.active_prescriptions || 0,
      icon: FileText,
      description: 'Currently valid'
    },
    {
      title: 'Vision Trend',
      value: analytics?.vision_trends?.trend_available ? 'Available' : 'Insufficient Data',
      icon: TrendingUp,
      description: 'Based on your history'
    }
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Eye className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">My Vision Analytics</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
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
              <p className="text-xs text-muted-foreground">{kpi.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="vision" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="vision">Vision History</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
        </TabsList>

        <TabsContent value="vision" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vision Trends</CardTitle>
              <CardDescription>Your vision changes over time</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading vision data...</span>
                </div>
              ) : analytics?.vision_trends?.trend_available ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Right Eye</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>SPH Trend:</span>
                          <Badge variant={analytics.vision_trends.right_eye.sph_trend === 'improving' ? 'default' : 'secondary'}>
                            {analytics.vision_trends.right_eye.sph_trend}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>CYL Trend:</span>
                          <Badge variant={analytics.vision_trends.right_eye.cyl_trend === 'improving' ? 'default' : 'secondary'}>
                            {analytics.vision_trends.right_eye.cyl_trend}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Left Eye</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>SPH Trend:</span>
                          <Badge variant={analytics.vision_trends.left_eye.sph_trend === 'improving' ? 'default' : 'secondary'}>
                            {analytics.vision_trends.left_eye.sph_trend}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>CYL Trend:</span>
                          <Badge variant={analytics.vision_trends.left_eye.cyl_trend === 'improving' ? 'default' : 'secondary'}>
                            {analytics.vision_trends.left_eye.cyl_trend}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {analytics.vision_history && analytics.vision_history.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Vision History Chart</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analytics.vision_history}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="right_eye.sph" stroke="#3b82f6" name="Right SPH" />
                          <Line type="monotone" dataKey="left_eye.sph" stroke="#10b981" name="Left SPH" />
                          <Line type="monotone" dataKey="right_eye.cyl" stroke="#f59e0b" name="Right CYL" />
                          <Line type="monotone" dataKey="left_eye.cyl" stroke="#ef4444" name="Left CYL" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Insufficient data for vision trend analysis.</p>
                  <p className="text-sm">Complete more eye examinations to see your vision trends.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appointment Summary</CardTitle>
              <CardDescription>Your appointment history and statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {analytics?.appointment_summary?.total_appointments || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Appointments</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {analytics?.appointment_summary?.completed_appointments || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">
                    {analytics?.appointment_summary?.upcoming_appointments || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Upcoming</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {analytics?.appointment_summary?.cancelled_appointments || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Cancelled</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prescriptions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Prescription Summary</CardTitle>
              <CardDescription>Your prescription history and status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {analytics?.prescription_summary?.total_prescriptions || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Prescriptions</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {analytics?.prescription_summary?.active_prescriptions || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {analytics?.prescription_summary?.expired_prescriptions || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Expired</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerAnalytics;
