import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { transactionApi, Transaction, TransactionAnalytics } from '../../services/transactionApi';
import { useToast } from '../../hooks/use-toast';
import { CalendarIcon, DollarSignIcon, TrendingUpIcon, UsersIcon } from 'lucide-react';

export const AdminTransactionAnalytics: React.FC = () => {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<TransactionAnalytics | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    date_from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    date_to: new Date().toISOString().split('T')[0],
    branch_id: 'all',
  });

  useEffect(() => {
    loadAnalytics();
    loadTransactions();
  }, [filters]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await transactionApi.getAnalytics(
        filters.date_from,
        filters.date_to,
        filters.branch_id && filters.branch_id !== 'all' ? parseInt(filters.branch_id) : undefined
      );
      setAnalytics(response.analytics);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load analytics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await transactionApi.getTransactions({
        date_from: filters.date_from,
        date_to: filters.date_to,
        branch_id: filters.branch_id ? parseInt(filters.branch_id) : undefined,
      });
      setTransactions(response.transactions.data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load transactions',
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'text-green-600';
      case 'Pending':
        return 'text-yellow-600';
      case 'Cancelled':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Transaction Analytics</h1>
        <Button onClick={loadAnalytics} disabled={loading}>
          <TrendingUpIcon className="w-4 h-4 mr-2" />
          Refresh Analytics
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="date_from">From Date</Label>
              <Input
                id="date_from"
                type="date"
                value={filters.date_from}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="date_to">To Date</Label>
              <Input
                id="date_to"
                type="date"
                value={filters.date_to}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="branch_id">Branch</Label>
              <Select
                value={filters.branch_id}
                onValueChange={(value) => setFilters({ ...filters, branch_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {/* Add branch options here */}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={loadAnalytics} className="w-full">
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics.total_income)}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.completed_transactions} completed transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.total_transactions}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.pending_transactions} pending, {analytics.cancelled_transactions} cancelled
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Transaction</CardTitle>
              <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics.average_transaction_value)}</div>
              <p className="text-xs text-muted-foreground">
                Per completed transaction
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.total_transactions > 0 
                  ? Math.round((analytics.completed_transactions / analytics.total_transactions) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Transactions completed
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sales by Branch */}
      {analytics && analytics.sales_by_branch.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sales by Branch</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch</TableHead>
                  <TableHead>Total Sales</TableHead>
                  <TableHead>Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.sales_by_branch.map((branch, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{branch.name}</TableCell>
                    <TableCell>{formatCurrency(branch.total_sales)}</TableCell>
                    <TableCell>
                      {analytics.total_income > 0 
                        ? Math.round((branch.total_sales / analytics.total_income) * 100)
                        : 0}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Sales by Payment Method */}
      {analytics && analytics.sales_by_payment_method.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sales by Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Total Sales</TableHead>
                  <TableHead>Transaction Count</TableHead>
                  <TableHead>Average per Transaction</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.sales_by_payment_method.map((method, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{method.payment_method}</TableCell>
                    <TableCell>{formatCurrency(method.total_sales)}</TableCell>
                    <TableCell>{method.transaction_count}</TableCell>
                    <TableCell>
                      {formatCurrency(method.total_sales / method.transaction_count)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading transactions...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction Code</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.slice(0, 10).map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-mono">{transaction.transaction_code}</TableCell>
                    <TableCell>{transaction.customer?.name || 'N/A'}</TableCell>
                    <TableCell>{formatCurrency(transaction.total_amount)}</TableCell>
                    <TableCell>
                      <span className={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </span>
                    </TableCell>
                    <TableCell>{transaction.payment_method}</TableCell>
                    <TableCell>{formatDate(transaction.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
