import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { transactionApi, Transaction, CreateTransactionRequest, FinalizeTransactionRequest } from '../../services/transactionApi';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/use-toast';
import { CalendarIcon, DownloadIcon, EyeIcon, PlusIcon } from 'lucide-react';

export const StaffTransactionManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    date_from: '',
    date_to: '',
  });
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false);
  const [createForm, setCreateForm] = useState<CreateTransactionRequest>({
    customer_id: 0,
    branch_id: user?.branch_id || 0,
    total_amount: 0,
    payment_method: 'Cash',
    notes: '',
  });
  const [finalizeForm, setFinalizeForm] = useState<FinalizeTransactionRequest>({
    sales_type: 'cash',
    customer_name: '',
    tin: '',
    address: '',
    eye_exam_fee: 0,
  });

  useEffect(() => {
    loadTransactions();
  }, [filters]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await transactionApi.getTransactions(filters);
      setTransactions(response.transactions.data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load transactions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransaction = async () => {
    try {
      await transactionApi.createTransaction(createForm);
      toast({
        title: 'Success',
        description: 'Transaction created successfully',
      });
      setShowCreateDialog(false);
      setCreateForm({
        customer_id: 0,
        branch_id: user?.branch_id || 0,
        total_amount: 0,
        payment_method: 'Cash',
        notes: '',
      });
      loadTransactions();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create transaction',
        variant: 'destructive',
      });
    }
  };

  const handleFinalizeTransaction = async () => {
    if (!selectedTransaction) return;

    try {
      await transactionApi.finalizeTransaction(selectedTransaction.id, finalizeForm);
      toast({
        title: 'Success',
        description: 'Transaction finalized successfully',
      });
      setShowFinalizeDialog(false);
      setSelectedTransaction(null);
      setFinalizeForm({
        sales_type: 'cash',
        customer_name: '',
        tin: '',
        address: '',
        eye_exam_fee: 0,
      });
      loadTransactions();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to finalize transaction',
        variant: 'destructive',
      });
    }
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
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to download receipt',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      Pending: 'default',
      Completed: 'default',
      Cancelled: 'destructive',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status}
      </Badge>
    );
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Transaction Management</h1>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="w-4 h-4 mr-2" />
              Create Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Transaction</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="customer_id">Customer ID</Label>
                <Input
                  id="customer_id"
                  type="number"
                  value={createForm.customer_id}
                  onChange={(e) => setCreateForm({ ...createForm, customer_id: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="total_amount">Total Amount</Label>
                <Input
                  id="total_amount"
                  type="number"
                  step="0.01"
                  value={createForm.total_amount}
                  onChange={(e) => setCreateForm({ ...createForm, total_amount: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="payment_method">Payment Method</Label>
                <Select
                  value={createForm.payment_method}
                  onValueChange={(value) => setCreateForm({ ...createForm, payment_method: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                    <SelectItem value="Debit Card">Debit Card</SelectItem>
                    <SelectItem value="Online Payment">Online Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                />
              </div>
              <Button onClick={handleCreateTransaction} className="w-full">
                Create Transaction
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
            <div className="flex items-end">
              <Button onClick={loadTransactions} className="w-full">
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
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
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-mono">{transaction.transaction_code}</TableCell>
                    <TableCell>{transaction.customer?.name || 'N/A'}</TableCell>
                    <TableCell>{formatCurrency(transaction.total_amount)}</TableCell>
                    <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    <TableCell>{transaction.payment_method}</TableCell>
                    <TableCell>{formatDate(transaction.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTransaction(transaction)}
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Button>
                        {transaction.status === 'Pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTransaction(transaction);
                              setFinalizeForm({
                                sales_type: 'cash',
                                customer_name: transaction.customer?.name || '',
                                tin: '',
                                address: '',
                                eye_exam_fee: 0,
                              });
                              setShowFinalizeDialog(true);
                            }}
                          >
                            Finalize
                          </Button>
                        )}
                        {transaction.status === 'Completed' && transaction.receipt && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadReceipt(transaction.id)}
                          >
                            <DownloadIcon className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Finalize Transaction Dialog */}
      <Dialog open={showFinalizeDialog} onOpenChange={setShowFinalizeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Finalize Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="sales_type">Sales Type</Label>
              <Select
                value={finalizeForm.sales_type}
                onValueChange={(value) => setFinalizeForm({ ...finalizeForm, sales_type: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="charge">Charge</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="customer_name">Customer Name</Label>
              <Input
                id="customer_name"
                value={finalizeForm.customer_name}
                onChange={(e) => setFinalizeForm({ ...finalizeForm, customer_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="tin">TIN</Label>
              <Input
                id="tin"
                value={finalizeForm.tin}
                onChange={(e) => setFinalizeForm({ ...finalizeForm, tin: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={finalizeForm.address}
                onChange={(e) => setFinalizeForm({ ...finalizeForm, address: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="eye_exam_fee">Eye Exam Fee</Label>
              <Input
                id="eye_exam_fee"
                type="number"
                step="0.01"
                value={finalizeForm.eye_exam_fee}
                onChange={(e) => setFinalizeForm({ ...finalizeForm, eye_exam_fee: parseFloat(e.target.value) })}
              />
            </div>
            <Button onClick={handleFinalizeTransaction} className="w-full">
              Finalize Transaction
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
