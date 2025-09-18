import { useState } from 'react';
import { BarChart3, TrendingUp, Users, Calendar, Banknote } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState('month');

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

  const branchPerformance = [
    { branch: 'Downtown', revenue: 185000, patients: 1245, satisfaction: 4.8 },
    { branch: 'Westside', revenue: 162000, patients: 1098, satisfaction: 4.6 },
    { branch: 'Northside', revenue: 148000, patients: 987, satisfaction: 4.7 },
    { branch: 'Eastside', revenue: 134000, patients: 876, satisfaction: 4.5 }
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

  const patientSatisfaction = [
    { branch: 'Downtown', score: 4.8, reviews: 234 },
    { branch: 'Westside', score: 4.6, reviews: 198 },
    { branch: 'Northside', score: 4.7, reviews: 156 },
    { branch: 'Eastside', score: 4.5, reviews: 142 }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-6 w-6 text-admin" />
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        </div>
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="satisfaction">Satisfaction</TabsTrigger>
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
          <Card>
            <CardHeader>
              <CardTitle>Branch Performance</CardTitle>
              <CardDescription>Comparative analysis across all locations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {branchPerformance.map((branch, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{branch.branch}</div>
                      <div className="text-sm text-muted-foreground">Branch Location</div>
                    </div>
                    <div>
                      <div className="font-bold">₱{branch.revenue.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Revenue</div>
                    </div>
                    <div>
                      <div className="font-bold">{branch.patients.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Patients</div>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold">{branch.satisfaction}</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`text-sm ${i < Math.floor(branch.satisfaction) ? 'text-yellow-400' : 'text-gray-300'}`}>
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">Satisfaction</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="satisfaction" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Patient Satisfaction Scores</CardTitle>
                <CardDescription>Average ratings by branch</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {patientSatisfaction.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{item.branch}</div>
                        <div className="text-sm text-muted-foreground">{item.reviews} reviews</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-lg">{item.score}</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`${i < Math.floor(item.score) ? 'text-yellow-400' : 'text-gray-300'}`}>
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Satisfaction Trends</CardTitle>
                <CardDescription>Monthly satisfaction scores</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[
                    { month: 'Jan', score: 4.5 },
                    { month: 'Feb', score: 4.6 },
                    { month: 'Mar', score: 4.4 },
                    { month: 'Apr', score: 4.7 },
                    { month: 'May', score: 4.6 },
                    { month: 'Jun', score: 4.8 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[4.0, 5.0]} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Feedback Categories</CardTitle>
              <CardDescription>Common themes in patient feedback</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">92%</div>
                  <div className="text-sm text-muted-foreground">Staff Friendliness</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">88%</div>
                  <div className="text-sm text-muted-foreground">Wait Times</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">95%</div>
                  <div className="text-sm text-muted-foreground">Service Quality</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">91%</div>
                  <div className="text-sm text-muted-foreground">Facility Cleanliness</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;