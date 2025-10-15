import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Receipt, BarChart3 } from 'lucide-react';
import StaffReservationDashboard from './StaffReservationDashboard';
import AppointmentsAndReceipts from './AppointmentsAndReceipts';

/**
 * Unified Reservations & Transactions Dashboard for Staff
 * Combines:
 * - Customer Product Reservations
 * - Patient Transactions & Receipts
 * - Totals and Analytics
 */
const UnifiedReservationsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('reservations');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reservations & Transactions</h1>
          <p className="text-gray-600 mt-1">Manage customer reservations, transactions, and receipts</p>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="reservations" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Product Reservations</span>
            <span className="sm:hidden">Reservations</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Receipts & Transactions</span>
            <span className="sm:hidden">Receipts</span>
          </TabsTrigger>
          <TabsTrigger value="totals" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Totals & Summary</span>
            <span className="sm:hidden">Summary</span>
          </TabsTrigger>
        </TabsList>

        {/* Product Reservations Tab */}
        <TabsContent value="reservations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-staff" />
                Customer Product Reservations
              </CardTitle>
              <CardDescription>
                Approve, reject, and manage customer product reservations from your branch
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <StaffReservationDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Patient Transactions Tab */}
        <TabsContent value="transactions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-staff" />
                Appointments & Receipts
              </CardTitle>
              <CardDescription>
                Create receipts for completed appointments and view all patient transaction history
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <AppointmentsAndReceipts />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Totals & Summary Tab */}
        <TabsContent value="totals" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-staff" />
                Totals & Summary
              </CardTitle>
              <CardDescription>
                Overview of reservations and transactions totals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReservationSummary />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

/**
 * Summary component showing totals for reservations and transactions
 */
const ReservationSummary: React.FC = () => {
  const [reservationStats, setReservationStats] = React.useState({
    totalReservations: 0,
    pendingValue: 0,
    approvedValue: 0,
    completedValue: 0,
  });
  const [transactionStats, setTransactionStats] = React.useState({
    totalTransactions: 0,
    totalRevenue: 0,
    avgTransaction: 0,
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchSummaryData();
  }, []);

  const fetchSummaryData = async () => {
    try {
      setLoading(true);
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
      const token = sessionStorage.getItem('auth_token');

      // Fetch reservations
      const reservationsResponse = await fetch(`${apiBaseUrl}/reservations`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (reservationsResponse.ok) {
        const reservations = await reservationsResponse.json();
        
        const pending = reservations.filter((r: any) => r.status === 'pending');
        const approved = reservations.filter((r: any) => r.status === 'approved');
        const completed = reservations.filter((r: any) => r.status === 'completed');

        const calculateTotal = (items: any[]) => 
          items.reduce((sum, r) => sum + (r.quantity * Number(r.product.price)), 0);

        setReservationStats({
          totalReservations: reservations.length,
          pendingValue: calculateTotal(pending),
          approvedValue: calculateTotal(approved),
          completedValue: calculateTotal(completed),
        });
      }

      // You can fetch transaction data similarly here if available
      
    } catch (error) {
      console.error('Error fetching summary data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-staff"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Reservation Totals */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Reservation Totals</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
            <div className="text-sm text-blue-600 font-medium mb-1">Total Reservations</div>
            <div className="text-3xl font-bold text-blue-700">
              {reservationStats.totalReservations}
            </div>
          </div>
          
          <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-100">
            <div className="text-sm text-yellow-600 font-medium mb-1">Pending Value</div>
            <div className="text-3xl font-bold text-yellow-700">
              ₱{reservationStats.pendingValue.toFixed(2)}
            </div>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg border border-green-100">
            <div className="text-sm text-green-600 font-medium mb-1">Approved Value</div>
            <div className="text-3xl font-bold text-green-700">
              ₱{reservationStats.approvedValue.toFixed(2)}
            </div>
          </div>
          
          <div className="bg-purple-50 p-6 rounded-lg border border-purple-100">
            <div className="text-sm text-purple-600 font-medium mb-1">Completed Value</div>
            <div className="text-3xl font-bold text-purple-700">
              ₱{reservationStats.completedValue.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Totals */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Transaction Totals</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-100">
            <div className="text-sm text-indigo-600 font-medium mb-1">Total Transactions</div>
            <div className="text-3xl font-bold text-indigo-700">
              {transactionStats.totalTransactions}
            </div>
          </div>
          
          <div className="bg-teal-50 p-6 rounded-lg border border-teal-100">
            <div className="text-sm text-teal-600 font-medium mb-1">Total Revenue</div>
            <div className="text-3xl font-bold text-teal-700">
              ₱{transactionStats.totalRevenue.toFixed(2)}
            </div>
          </div>
          
          <div className="bg-rose-50 p-6 rounded-lg border border-rose-100">
            <div className="text-sm text-rose-600 font-medium mb-1">Avg Transaction</div>
            <div className="text-3xl font-bold text-rose-700">
              ₱{transactionStats.avgTransaction.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Quick Insights</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            <span className="font-medium">Total Potential Revenue:</span>{' '}
            ₱{(reservationStats.pendingValue + reservationStats.approvedValue + reservationStats.completedValue).toFixed(2)}
          </p>
          <p>
            <span className="font-medium">Conversion Rate:</span>{' '}
            {reservationStats.totalReservations > 0
              ? ((reservationStats.completedValue / (reservationStats.pendingValue + reservationStats.approvedValue + reservationStats.completedValue)) * 100).toFixed(1)
              : 0}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnifiedReservationsDashboard;

