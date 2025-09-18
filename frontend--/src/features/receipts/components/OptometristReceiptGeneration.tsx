import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ReceiptItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Receipt {
  id: string;
  patientName: string;
  date: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid';
  notes?: string;
}

const mockReceipts: Receipt[] = [
    {
      id: '1',
      patientName: 'John Doe',
      date: '2024-01-15',
      items: [
        { id: '1', description: 'Eye Examination', quantity: 1, unitPrice: 150.00, total: 150.00 },
        { id: '2', description: 'Prescription Glasses', quantity: 1, unitPrice: 299.99, total: 299.99 }
      ],
      subtotal: 449.99,
      tax: 36.00,
      total: 485.99,
      status: 'paid',
      notes: 'Annual eye exam and new prescription glasses'
    }
];

const OptometristReceiptGeneration: React.FC = () => {
  const [receipts, setReceipts] = useState<Receipt[]>(mockReceipts);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Receipt Generation</h1>
        <Button>
          Create New Receipt
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Receipts</CardTitle>
          <CardDescription>Manage and track all patient receipts</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipts.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell>{receipt.patientName}</TableCell>
                  <TableCell>{receipt.date}</TableCell>
                  <TableCell>{receipt.items.length} items</TableCell>
                  <TableCell>₱{receipt.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-800">
                      {receipt.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default OptometristReceiptGeneration;
