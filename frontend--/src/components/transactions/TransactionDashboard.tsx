import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useAuth } from '../../contexts/AuthContext';
import { StaffTransactionManagement } from './StaffTransactionManagement';
import { AdminTransactionAnalytics } from './AdminTransactionAnalytics';
import { CustomerTransactionHistory } from './CustomerTransactionHistory';
import { TransactionNotification } from './TransactionNotification';
import { PatientTransactionList } from './PatientTransactionList';
import { transactionApi, Transaction } from '../../services/transactionApi';
import { useToast } from '../../hooks/use-toast';
import { ReceiptIcon, TrendingUpIcon, UsersIcon, EyeIcon } from 'lucide-react';

export const TransactionDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentTransactions();
  }, []);

  const loadRecentTransactions = async () => {
    try {
      setLoading(true);
      const response = await transactionApi.getTransactions({
        date_from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 7 days
      });
      setRecentTransactions(response.transactions.data?.slice(0, 5) || []);
    } catch (error) {
      console.error('Failed to load recent transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (transaction: Transaction) => {
    // This would open a detailed transaction modal
    console.log('View transaction details:', transaction);
    toast({
      title: 'Transaction Details',
      description: `Viewing details for transaction ${transaction.transaction_code}`,
    });
  };

  const handleDownloadReceipt = async (transactionId: number) => {
    try {
      const blob = await transactionApi.downloadReceipt(transactionId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt_${transactionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Success',
        description: 'Receipt downloaded successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download receipt',
        variant: 'destructive',
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const getRoleBasedContent = () => {
    switch (user?.role) {
      case 'admin':
        return (
          <Tabs defaultValue="analytics" className="space-y-6">
            <TabsList>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="management">Transaction Management</TabsTrigger>
            </TabsList>
            <TabsContent value="analytics">
              <AdminTransactionAnalytics />
            </TabsContent>
            <TabsContent value="management">
              <StaffTransactionManagement />
            </TabsContent>
          </Tabs>
        );
      
      case 'staff':
      case 'optometrist':
        return (
          <Tabs defaultValue="management" className="space-y-6">
            <TabsList>
              <TabsTrigger value="management">Transaction Management</TabsTrigger>
              <TabsTrigger value="patients">Patient Transactions</TabsTrigger>
            </TabsList>
            <TabsContent value="management">
              <StaffTransactionManagement />
            </TabsContent>
            <TabsContent value="patients">
              <PatientTransactionList />
            </TabsContent>
          </Tabs>
        );
      
      case 'customer':
        return <CustomerTransactionHistory />;
      
      default:
        return (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No transaction access for your role.</p>
            </CardContent>
          </Card>
        );
    }
  };

  const getQuickStats = () => {
    if (user?.role === 'customer') {
      const totalSpent = recentTransactions.reduce((sum, t) => sum + t.total_amount, 0);
      const completedCount = recentTransactions.filter(t => t.status === 'Completed').length;
      
      return [
        {
          title: 'Recent Transactions',
          value: recentTransactions.length,
          icon: ReceiptIcon,
          description: 'Last 7 days',
        },
        {
          title: 'Total Spent',
          value: formatCurrency(totalSpent),
          icon: TrendingUpIcon,
          description: 'Last 7 days',
        },
        {
          title: 'Completed',
          value: completedCount,
          icon: EyeIcon,
          description: 'Completed transactions',
        },
      ];
    }

    // Staff/Admin stats
    const totalAmount = recentTransactions.reduce((sum, t) => sum + t.total_amount, 0);
    const completedCount = recentTransactions.filter(t => t.status === 'Completed').length;
    const pendingCount = recentTransactions.filter(t => t.status === 'Pending').length;

    return [
      {
        title: 'Recent Transactions',
        value: recentTransactions.length,
        icon: ReceiptIcon,
        description: 'Last 7 days',
      },
      {
        title: 'Total Revenue',
        value: formatCurrency(totalAmount),
        icon: TrendingUpIcon,
        description: 'Last 7 days',
      },
      {
        title: 'Completed',
        value: completedCount,
        icon: EyeIcon,
        description: 'Completed transactions',
      },
      {
        title: 'Pending',
        value: pendingCount,
        icon: UsersIcon,
        description: 'Pending transactions',
      },
    ];
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getQuickStats().map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Transactions Notifications */}
      {recentTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Transaction Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentTransactions.map((transaction) => (
                <TransactionNotification
                  key={transaction.id}
                  transaction={transaction}
                  onViewDetails={handleViewDetails}
                  onDownloadReceipt={handleDownloadReceipt}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role-based Content */}
      {getRoleBasedContent()}
    </div>
  );
};

export default TransactionDashboard;
