import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Eye, Calendar, CreditCard, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface Receipt {
  id: string;
  date: string;
  invoiceNumber: string;
  items: {
    description: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  status: 'paid' | 'pending' | 'refunded';
  location: string;
  optometrist?: string;
}

const CustomerReceipts: React.FC = () => {
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  const receipts: Receipt[] = [
    {
      id: '1',
      date: '2024-10-15',
      invoiceNumber: 'INV-2024-001',
      items: [
        { description: 'Comprehensive Eye Exam', quantity: 1, price: 150.00, total: 150.00 },
        { description: 'Progressive Lenses', quantity: 1, price: 350.00, total: 350.00 },
        { description: 'Anti-Reflective Coating', quantity: 1, price: 85.00, total: 85.00 },
        { description: 'UV Protection', quantity: 1, price: 45.00, total: 45.00 }
      ],
      subtotal: 630.00,
      tax: 50.40,
      total: 680.40,
      paymentMethod: 'Credit Card',
      status: 'paid',
      location: 'Main Clinic - 123 Vision Street',
      optometrist: 'Dr. Sarah Johnson'
    },
    {
      id: '2',
      date: '2024-08-22',
      invoiceNumber: 'INV-2024-002',
      items: [
        { description: 'Contact Lens Fitting', quantity: 1, price: 75.00, total: 75.00 },
        { description: 'Daily Contact Lenses (3-month supply)', quantity: 1, price: 120.00, total: 120.00 }
      ],
      subtotal: 195.00,
      tax: 15.60,
      total: 210.60,
      paymentMethod: 'Insurance',
      status: 'paid',
      location: 'Downtown Branch - 456 Eye Care Ave',
      optometrist: 'Dr. Michael Chen'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'refunded': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'credit card': return <CreditCard className="w-4 h-4" />;
      case 'debit card': return <CreditCard className="w-4 h-4" />;
      case 'insurance': return <Eye className="w-4 h-4" />;
      default: return <span>$</span>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Receipts</h1>
        <p className="text-gray-600 mt-2">View and download your payment receipts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {receipts.map(receipt => (
            <Card key={receipt.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-lg">#{receipt.invoiceNumber}</span>
                    </div>
                    <Badge className={getStatusColor(receipt.status)}>
                      {receipt.status}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedReceipt(selectedReceipt === receipt.id ? null : receipt.id)}
                  >
                    {selectedReceipt === receipt.id ? 'Hide' : 'View'} Details
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {format(new Date(receipt.date), 'MMMM d, yyyy')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{receipt.location}</span>
                  </div>

                  {receipt.optometrist && (
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{receipt.optometrist}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {getPaymentIcon(receipt.paymentMethod)}
                    <span className="text-sm text-gray-600">Paid with {receipt.paymentMethod}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-bold">₱{receipt.total.toFixed(2)}</span>
                  </div>

                  {selectedReceipt === receipt.id && (
                    <div className="mt-4 space-y-3 pt-3 border-t">
                      <h4 className="font-medium text-sm mb-2">Items:</h4>
                      <div className="space-y-2">
                        {receipt.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.description} (x{item.quantity})</span>
                            <span>₱{item.total.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="border-t pt-2 space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal</span>
                          <span>₱{receipt.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Tax</span>
                          <span>₱{receipt.tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold">
                          <span>Total</span>
                          <span>₱{receipt.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomerReceipts;
