import api from '../api/axiosClient';

export interface MonthlyComparisonData {
  current_month: {
    revenue: number;
    period: string;
  };
  last_month: {
    revenue: number;
    period: string;
  };
  growth_percentage: number;
  growth_amount: number;
}

export interface RevenueByServiceData {
  revenue_by_service: Array<{
    service: string;
    revenue: number;
    percentage: number;
  }>;
  total_revenue: number;
  period: number;
  branch_id?: number;
}


export interface RevenueAnalyticsFilters {
  period?: number;
  branch_id?: number;
}

class RevenueAnalyticsApi {
  /**
   * Get monthly comparison analytics
   */
  async getMonthlyComparison(filters: RevenueAnalyticsFilters = {}): Promise<MonthlyComparisonData> {
    const params: Record<string, any> = {};
    if (filters.branch_id) params.branch_id = filters.branch_id;

    const response = await api.get('/admin/revenue/monthly-comparison', { params });
    return response.data;
  }

  /**
   * Get revenue by service analytics
   */
  async getRevenueByService(filters: RevenueAnalyticsFilters = {}): Promise<RevenueByServiceData> {
    const params: Record<string, any> = {};
    if (filters.period) params.period = filters.period;
    if (filters.branch_id) params.branch_id = filters.branch_id;

    const response = await api.get('/admin/revenue/by-service', { params });
    return response.data;
  }
}

export const revenueAnalyticsApi = new RevenueAnalyticsApi();
