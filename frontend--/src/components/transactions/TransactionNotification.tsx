import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CheckCircleIcon, DownloadIcon, EyeIcon, ReceiptIcon } from 'lucide-react';
import { Transaction } from '../../services/transactionApi';

interface TransactionNotificationProps {
  transaction: Transaction;
  onViewDetails: (transaction: Transaction) => void;
  onDownloadReceipt: (transactionId: number) => void;
}

export const TransactionNotification: React.FC<TransactionNotificationProps> = ({
  transaction,
  onViewDetails,
  onDownloadReceipt,
}) => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'text-green-600 bg-green-50';
      case 'Pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'Cancelled':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getTransactionSummary = (transaction: Transaction) => {
    const items = [];
    
    if (transaction.appointment) {
      items.push('Eye Examination');
    }
    
    if (transaction.reservation) {
      // Use optional chaining to safely access nested properties
      const productName = transaction.reservation.product?.name || 'Product';
      const quantity = transaction.reservation.quantity || 1;
      items.push(`${productName} (${quantity}x)`);
    }
    
    // If no items, return a default message
    return items.length > 0 ? items.join(', ') : 'Transaction';
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Transaction Update</CardTitle>
          <div className="flex items-center space-x-2">
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
            <Badge className={getStatusColor(transaction.status)}>
              {transaction.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Transaction Code</p>
          <p className="font-mono text-lg">{transaction.transaction_code}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-muted-foreground">Services/Products</p>
          <p className="text-sm">{getTransactionSummary(transaction)}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
          <p className="text-lg font-semibold">{formatCurrency(transaction.total_amount)}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
          <p className="text-sm">{transaction.payment_method}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-muted-foreground">Date</p>
          <p className="text-sm">{formatDate(transaction.created_at)}</p>
        </div>

        {transaction.branch && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Branch</p>
            <p className="text-sm">{transaction.branch?.name || 'N/A'}</p>
          </div>
        )}

        {transaction.status === 'Completed' && (
          <div className="pt-2 border-t">
            <p className="text-sm font-medium text-green-600 mb-2">
              ✓ Transaction completed successfully
            </p>
            {transaction.receipt && (
              <p className="text-xs text-muted-foreground mb-3">
                Receipt #{transaction.receipt?.id || 'N/A'} has been generated
              </p>
            )}
          </div>
        )}

        <div className="flex space-x-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(transaction)}
            className="flex-1"
          >
            <EyeIcon className="w-4 h-4 mr-2" />
            View Details
          </Button>
          
          {transaction.status === 'Completed' && transaction.receipt && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownloadReceipt(transaction.id)}
              className="flex-1"
            >
              <DownloadIcon className="w-4 h-4 mr-2" />
              Download Receipt
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionNotification;
