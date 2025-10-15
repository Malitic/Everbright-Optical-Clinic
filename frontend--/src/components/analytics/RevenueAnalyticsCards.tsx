import React from 'react';
import { TrendingUp, DollarSign, Calendar, PieChart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { revenueAnalyticsApi, MonthlyComparisonData, RevenueByServiceData } from '@/services/revenueAnalyticsApi';
import { formatPeso } from '@/utils/currency';
import { useBranch } from '@/contexts/BranchContext';

interface RevenueAnalyticsCardsProps {
  className?: string;
}

const RevenueAnalyticsCards: React.FC<RevenueAnalyticsCardsProps> = ({ className }) => {
  const { selectedBranchId } = useBranch();

  // Fetch monthly comparison data
  const { data: monthlyData, isLoading: monthlyLoading, error: monthlyError } = useQuery({
    queryKey: ['monthly-comparison', selectedBranchId],
    queryFn: () => revenueAnalyticsApi.getMonthlyComparison({
      branch_id: selectedBranchId !== 'all' ? parseInt(selectedBranchId) : undefined
    }),
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  // Fetch revenue by service data
  const { data: serviceData, isLoading: serviceLoading, error: serviceError } = useQuery({
    queryKey: ['revenue-by-service', selectedBranchId],
    queryFn: () => revenueAnalyticsApi.getRevenueByService({
      period: 30,
      branch_id: selectedBranchId !== 'all' ? parseInt(selectedBranchId) : undefined
    }),
    refetchInterval: 300000, // Refetch every 5 minutes
  });


  const getProgressPercentage = (current: number, previous: number) => {
    if (current === 0 && previous === 0) return 0;
    if (previous === 0) return 100;
    return Math.min((previous / current) * 100, 100);
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}>
      {/* Monthly Comparison Card */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span>Monthly Comparison</span>
          </CardTitle>
          <CardDescription>
            Revenue vs previous period
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {monthlyLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading monthly data...</span>
            </div>
          ) : monthlyError ? (
            <div className="text-center py-8 text-red-500">
              <p>Failed to load monthly comparison data</p>
            </div>
          ) : monthlyData ? (
            <>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">This Month</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatPeso(monthlyData.current_month.revenue)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Last Month</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatPeso(monthlyData.last_month.revenue)}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{monthlyData.last_month.period}</span>
                  <span>{monthlyData.current_month.period}</span>
                </div>
                <Progress 
                  value={getProgressPercentage(
                    monthlyData.current_month.revenue, 
                    monthlyData.last_month.revenue
                  )} 
                  className="h-3"
                />
              </div>

              {/* Growth Indicator */}
              <div className="flex justify-center">
                <Badge 
                  className={`px-4 py-2 text-sm font-medium ${
                    monthlyData.growth_percentage >= 0 
                      ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}
                >
                  {monthlyData.growth_percentage >= 0 ? '+' : ''}{monthlyData.growth_percentage}% Growth
                </Badge>
              </div>

              {/* Additional Info */}
              <div className="text-xs text-gray-500 space-y-1">
                <p>Growth Amount: {formatPeso(monthlyData.growth_amount)}</p>
                <p>Period: {monthlyData.current_month.period} vs {monthlyData.last_month.period}</p>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No monthly comparison data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenue by Service Card */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PieChart className="h-5 w-5 text-green-600" />
            <span>Revenue by Service</span>
          </CardTitle>
          <CardDescription>
            Revenue breakdown by service type
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {serviceLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              <span className="ml-2">Loading service data...</span>
            </div>
          ) : serviceError ? (
            <div className="text-center py-8 text-red-500">
              <p>Failed to load revenue by service data</p>
            </div>
          ) : serviceData && serviceData.revenue_by_service.length > 0 ? (
            <>
              <div className="space-y-3">
                {serviceData.revenue_by_service.map((service, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">{service.service}</span>
                      <span className="text-sm font-bold text-gray-900">
                        {formatPeso(service.revenue)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{service.percentage}% of total</span>
                      <span>Total: {formatPeso(serviceData.total_revenue)}</span>
                    </div>
                    <Progress 
                      value={service.percentage} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Total Revenue</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatPeso(serviceData.total_revenue)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Period: Last {serviceData.period} days
                  {selectedBranchId !== 'all' && (
                    <span> • Branch specific</span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No revenue by service data available</p>
              <p className="text-xs mt-1">Data will appear when services are used</p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default RevenueAnalyticsCards;
