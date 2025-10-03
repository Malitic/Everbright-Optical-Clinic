import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Users, Calendar, Package, AlertTriangle, Brain, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, AreaChart, Area } from 'recharts';
import { toast } from 'sonner';

interface PredictiveData {
  revenue_forecast: Array<{
    month: string;
    actual: number;
    predicted: number;
    confidence: number;
  }>;
  patient_growth: Array<{
    month: string;
    current: number;
    predicted: number;
    growth_rate: number;
  }>;
  inventory_demand: Array<{
    product: string;
    current_stock: number;
    predicted_demand: number;
    reorder_point: number;
    risk_level: 'low' | 'medium' | 'high';
  }>;
  appointment_patterns: Array<{
    day_of_week: string;
    current_avg: number;
    predicted_avg: number;
    peak_hours: string[];
  }>;
  seasonal_trends: Array<{
    month: string;
    revenue_multiplier: number;
    patient_multiplier: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }>;
  risk_analysis: {
    high_risk_products: number;
    expiring_soon: number;
    low_stock_alerts: number;
    revenue_at_risk: number;
  };
}

const PredictiveAnalytics: React.FC = () => {
  const [data, setData] = useState<PredictiveData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('6months');

  useEffect(() => {
    fetchPredictiveData();
  }, [selectedTimeframe]);

  const fetchPredictiveData = async () => {
    try {
      setLoading(true);
      
      // Simulate API call - in real implementation, this would call your backend
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock predictive data
      const mockData: PredictiveData = {
        revenue_forecast: [
          { month: 'Jan', actual: 45000, predicted: 45000, confidence: 95 },
          { month: 'Feb', actual: 52000, predicted: 52000, confidence: 95 },
          { month: 'Mar', actual: 48000, predicted: 48000, confidence: 95 },
          { month: 'Apr', actual: 61000, predicted: 61000, confidence: 95 },
          { month: 'May', actual: 55000, predicted: 55000, confidence: 95 },
          { month: 'Jun', actual: 67000, predicted: 67000, confidence: 95 },
          { month: 'Jul', actual: null, predicted: 72000, confidence: 88 },
          { month: 'Aug', actual: null, predicted: 68000, confidence: 85 },
          { month: 'Sep', actual: null, predicted: 75000, confidence: 82 },
          { month: 'Oct', actual: null, predicted: 80000, confidence: 80 },
          { month: 'Nov', actual: null, predicted: 85000, confidence: 78 },
          { month: 'Dec', actual: null, predicted: 90000, confidence: 75 }
        ],
        patient_growth: [
          { month: 'Jan', current: 280, predicted: 280, growth_rate: 0 },
          { month: 'Feb', current: 310, predicted: 310, growth_rate: 10.7 },
          { month: 'Mar', current: 295, predicted: 295, growth_rate: -4.8 },
          { month: 'Apr', current: 340, predicted: 340, growth_rate: 15.3 },
          { month: 'May', current: 325, predicted: 325, growth_rate: -4.4 },
          { month: 'Jun', current: 380, predicted: 380, growth_rate: 16.9 },
          { month: 'Jul', current: null, predicted: 420, growth_rate: 10.5 },
          { month: 'Aug', current: null, predicted: 450, growth_rate: 7.1 },
          { month: 'Sep', current: null, predicted: 480, growth_rate: 6.7 },
          { month: 'Oct', current: null, predicted: 520, growth_rate: 8.3 },
          { month: 'Nov', current: null, predicted: 550, growth_rate: 5.8 },
          { month: 'Dec', current: null, predicted: 580, growth_rate: 5.5 }
        ],
        inventory_demand: [
          { product: 'Crizal Prevencia Lenses', current_stock: 45, predicted_demand: 60, reorder_point: 20, risk_level: 'medium' },
          { product: 'Ray-Ban Aviator', current_stock: 12, predicted_demand: 25, reorder_point: 15, risk_level: 'high' },
          { product: 'Oakley Holbrook', current_stock: 8, predicted_demand: 18, reorder_point: 10, risk_level: 'high' },
          { product: 'Contact Lens Solution', current_stock: 120, predicted_demand: 100, reorder_point: 30, risk_level: 'low' },
          { product: 'Eye Drops', current_stock: 85, predicted_demand: 70, reorder_point: 25, risk_level: 'low' },
          { product: 'Frame Cleaner', current_stock: 35, predicted_demand: 40, reorder_point: 15, risk_level: 'medium' }
        ],
        appointment_patterns: [
          { day_of_week: 'Monday', current_avg: 8.5, predicted_avg: 9.2, peak_hours: ['10:00', '14:00', '16:00'] },
          { day_of_week: 'Tuesday', current_avg: 7.8, predicted_avg: 8.5, peak_hours: ['09:00', '13:00', '15:00'] },
          { day_of_week: 'Wednesday', current_avg: 9.2, predicted_avg: 10.1, peak_hours: ['10:00', '14:00', '17:00'] },
          { day_of_week: 'Thursday', current_avg: 8.1, predicted_avg: 8.8, peak_hours: ['09:00', '12:00', '16:00'] },
          { day_of_week: 'Friday', current_avg: 10.5, predicted_avg: 11.8, peak_hours: ['10:00', '13:00', '15:00', '17:00'] },
          { day_of_week: 'Saturday', current_avg: 6.8, predicted_avg: 7.5, peak_hours: ['10:00', '14:00'] },
          { day_of_week: 'Sunday', current_avg: 3.2, predicted_avg: 3.8, peak_hours: ['11:00', '15:00'] }
        ],
        seasonal_trends: [
          { month: 'Jan', revenue_multiplier: 0.95, patient_multiplier: 0.90, trend: 'decreasing' },
          { month: 'Feb', revenue_multiplier: 1.05, patient_multiplier: 1.10, trend: 'increasing' },
          { month: 'Mar', revenue_multiplier: 0.98, patient_multiplier: 0.95, trend: 'stable' },
          { month: 'Apr', revenue_multiplier: 1.15, patient_multiplier: 1.20, trend: 'increasing' },
          { month: 'May', revenue_multiplier: 1.08, patient_multiplier: 1.05, trend: 'increasing' },
          { month: 'Jun', revenue_multiplier: 1.25, patient_multiplier: 1.30, trend: 'increasing' },
          { month: 'Jul', revenue_multiplier: 1.30, patient_multiplier: 1.35, trend: 'increasing' },
          { month: 'Aug', revenue_multiplier: 1.20, patient_multiplier: 1.25, trend: 'increasing' },
          { month: 'Sep', revenue_multiplier: 1.35, patient_multiplier: 1.40, trend: 'increasing' },
          { month: 'Oct', revenue_multiplier: 1.40, patient_multiplier: 1.45, trend: 'increasing' },
          { month: 'Nov', revenue_multiplier: 1.45, patient_multiplier: 1.50, trend: 'increasing' },
          { month: 'Dec', revenue_multiplier: 1.50, patient_multiplier: 1.55, trend: 'increasing' }
        ],
        risk_analysis: {
          high_risk_products: 3,
          expiring_soon: 12,
          low_stock_alerts: 8,
          revenue_at_risk: 15000
        }
      };
      
      setData(mockData);
    } catch (error) {
      toast.error('Failed to load predictive analytics data');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'stable': return <Target className="h-4 w-4 text-blue-600" />;
      default: return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
        <p className="text-gray-500">Unable to load predictive analytics data.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Brain className="h-6 w-6 text-purple-600" />
          <h1 className="text-2xl font-bold">Predictive Analytics</h1>
        </div>
        <Badge variant="outline" className="text-purple-600 border-purple-200">
          AI-Powered Insights
        </Badge>
      </div>

      {/* Risk Analysis Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">High Risk Products</p>
                <p className="text-2xl font-bold text-red-600">{data.risk_analysis.high_risk_products}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-orange-600">{data.risk_analysis.expiring_soon}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Low Stock Alerts</p>
                <p className="text-2xl font-bold text-yellow-600">{data.risk_analysis.low_stock_alerts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Revenue at Risk</p>
                <p className="text-2xl font-bold text-red-600">₱{data.risk_analysis.revenue_at_risk.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="revenue" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="revenue">Revenue Forecast</TabsTrigger>
          <TabsTrigger value="patients">Patient Growth</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Demand</TabsTrigger>
          <TabsTrigger value="appointments">Appointment Patterns</TabsTrigger>
          <TabsTrigger value="seasonal">Seasonal Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Forecast (Next 6 Months)</CardTitle>
              <CardDescription>
                AI-powered revenue predictions with confidence intervals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={data.revenue_forecast}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₱${Number(value).toLocaleString()}`, '']} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="actual"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                    name="Actual Revenue"
                  />
                  <Area
                    type="monotone"
                    dataKey="predicted"
                    stackId="2"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.6}
                    name="Predicted Revenue"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patients" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Patient Growth Prediction</CardTitle>
              <CardDescription>
                Forecasted patient volume and growth rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data.patient_growth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="current"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    name="Current Patients"
                  />
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="#10b981"
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    name="Predicted Patients"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Demand Prediction</CardTitle>
              <CardDescription>
                AI-forecasted demand vs current stock levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.inventory_demand.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{item.product}</h3>
                      <Badge className={getRiskColor(item.risk_level)}>
                        {item.risk_level.toUpperCase()} RISK
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Current Stock</p>
                        <p className="font-semibold">{item.current_stock} units</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Predicted Demand</p>
                        <p className="font-semibold">{item.predicted_demand} units</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Reorder Point</p>
                        <p className="font-semibold">{item.reorder_point} units</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            item.risk_level === 'high' ? 'bg-red-500' :
                            item.risk_level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{
                            width: `${Math.min((item.current_stock / item.predicted_demand) * 100, 100)}%`
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Stock level: {Math.round((item.current_stock / item.predicted_demand) * 100)}% of predicted demand
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appointment Pattern Analysis</CardTitle>
              <CardDescription>
                Predicted appointment volumes by day of week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.appointment_patterns}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day_of_week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="current_avg" fill="#3b82f6" name="Current Average" />
                  <Bar dataKey="predicted_avg" fill="#10b981" name="Predicted Average" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seasonal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Seasonal Trend Analysis</CardTitle>
              <CardDescription>
                Monthly performance multipliers and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.seasonal_trends.map((trend, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{trend.month}</h3>
                      {getTrendIcon(trend.trend)}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Revenue Multiplier:</span>
                        <span className="font-semibold">{trend.revenue_multiplier}x</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Patient Multiplier:</span>
                        <span className="font-semibold">{trend.patient_multiplier}x</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Trend:</span>
                        <Badge variant="outline" className={
                          trend.trend === 'increasing' ? 'text-green-600 border-green-200' :
                          trend.trend === 'decreasing' ? 'text-red-600 border-red-200' :
                          'text-blue-600 border-blue-200'
                        }>
                          {trend.trend}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PredictiveAnalytics;
