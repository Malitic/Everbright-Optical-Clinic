import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { transactionApi, Transaction } from '../../services/transactionApi';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/use-toast';
import { ReservedProductsGallery } from './ReservedProductsGallery';
import { EyeIcon, DownloadIcon, CalendarIcon, UserIcon, PackageIcon } from 'lucide-react';

interface PatientTransaction {
  id: number;
  name: string;
  email: string;
  total_transactions: number;
  total_spent: number;
  last_transaction_date: string;
  completed_appointments: number;
  reserved_products: number;
  transactions: Transaction[];
}

export const PatientTransactionList: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [patients, setPatients] = useState<PatientTransaction[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadPatientTransactions();
  }, []);

  const loadPatientTransactions = async () => {
    try {
      setLoading(true);
      // Use the new patient transactions endpoint
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const response = await fetch(`${API_BASE_URL}/transactions/patients`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch patient transactions');
      }

      const data = await response.json();
      setPatients(data.patients || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load patient transactions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePatientClick = (patient: PatientTransaction) => {
    setSelectedPatient(patient);
    setShowDetails(true);
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

  const getReceiptPreview = (transaction: Transaction) => {
    const items = [];
    
    // Add reserved product details
    if (transaction.reservation && transaction.reservation.product) {
      const product = transaction.reservation.product;
      let description = product.name || 'Product';
      
      if (product.brand) {
        description += ` - Brand: ${product.brand}`;
      }
      if (product.category) {
        description += ` - Category: ${product.category.name}`;
      }
      if (product.model) {
        description += ` - Model: ${product.model}`;
      }
      if (product.description) {
        description += ` - ${product.description}`;
      }
      
      items.push({
        description,
        qty: transaction.reservation.quantity || 1,
        unitPrice: product.price || 0,
        amount: (product.price || 0) * (transaction.reservation.quantity || 1)
      });
    }
    
    // Add eye examination
    if (transaction.appointment) {
      items.push({
        description: 'Eye Examination',
        qty: 1,
        unitPrice: 500, // Default eye exam fee
        amount: 500
      });
    }
    
    return items;
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

  const getTransactionSummary = (transaction: Transaction) => {
    const items = [];
    
    if (transaction.appointment) {
      items.push('Eye Examination');
    }
    
    if (transaction.reservation) {
      const productName = transaction.reservation.product?.name || 'Product';
      const quantity = transaction.reservation.quantity || 1;
      items.push(`${productName} (${quantity}x)`);
    }
    
    return items.length > 0 ? items.join(', ') : 'Transaction';
  };

  const getProductImage = (product: any) => {
    // Return product image URL or placeholder
    return product?.image_url || product?.image || '/placeholder-product.jpg';
  };

  const getProductDetails = (product: any) => {
    return {
      name: product?.name || 'Unknown Product',
      price: product?.price || 0,
      brand: product?.brand || 'Unknown Brand',
      category: product?.category?.name || 'Uncategorized',
      image: getProductImage(product)
    };
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Patient Transaction History</h1>
        <Button onClick={loadPatientTransactions} disabled={loading}>
          <CalendarIcon className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Patients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="search">Search by name or email</Label>
              <Input
                id="search"
                placeholder="Enter patient name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patient List */}
      <Card>
        <CardHeader>
          <CardTitle>Patients with Completed Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading patient data...</div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No patients found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Total Transactions</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Appointments</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Last Transaction</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => (
                  <TableRow key={patient.id} className="cursor-pointer hover:bg-gray-50">
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <UserIcon className="w-4 h-4" />
                        <span>{patient.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{patient.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{patient.total_transactions}</Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(patient.total_spent)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{patient.completed_appointments}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <PackageIcon className="w-4 h-4" />
                        <span>{patient.reserved_products}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(patient.last_transaction_date)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePatientClick(patient)}
                      >
                        <EyeIcon className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Patient Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Transaction Details for {selectedPatient?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedPatient && (
            <div className="space-y-6">
              {/* Patient Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Patient Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                      <p className="text-2xl font-bold">{selectedPatient.total_transactions}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                      <p className="text-2xl font-bold">{formatCurrency(selectedPatient.total_spent)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Appointments</p>
                      <p className="text-2xl font-bold">{selectedPatient.completed_appointments}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Products</p>
                      <p className="text-2xl font-bold">{selectedPatient.reserved_products}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reserved Products Gallery */}
              <ReservedProductsGallery transactions={selectedPatient.transactions} />

              {/* Transaction History */}
              <Card>
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {selectedPatient.transactions.map((transaction) => (
                      <div key={transaction.id} className="border rounded-lg p-6">
                        {/* Transaction Header */}
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="font-medium text-lg">{transaction.transaction_code}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(transaction.created_at)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-xl">{formatCurrency(transaction.total_amount)}</p>
                            <div className="flex space-x-2 mt-2">
                              <Badge variant="outline">{transaction.status}</Badge>
                              <Badge variant="secondary">{transaction.payment_method}</Badge>
                            </div>
                          </div>
                        </div>

                        {/* Services and Products */}
                        <div className="space-y-4">
                          {/* Eye Examination */}
                          {transaction.appointment && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <EyeIcon className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-blue-900">Eye Examination</h4>
                                  <p className="text-sm text-blue-700">
                                    Completed on {formatDate(transaction.appointment.appointment_date)}
                                  </p>
                                  {transaction.appointment.optometrist && (
                                    <p className="text-xs text-blue-600">
                                      {transaction.appointment.optometrist.name}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Reserved Products */}
                          {transaction.reservation && transaction.reservation.product && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <div className="flex items-start space-x-4">
                                <div className="w-16 h-16 bg-white rounded-lg border border-green-200 overflow-hidden">
                                  <img 
                                    src={getProductImage(transaction.reservation.product)} 
                                    alt={transaction.reservation.product.name || 'Product'}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.src = '/placeholder-product.jpg';
                                    }}
                                  />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium text-green-900">
                                    {transaction.reservation.product.name || 'Product'}
                                  </h4>
                                  <p className="text-sm text-green-700">
                                    Quantity: {transaction.reservation.quantity || 1} × {formatCurrency(transaction.reservation.product.price || 0)}
                                  </p>
                                  <p className="text-sm text-green-600">
                                    Total: {formatCurrency((transaction.reservation.product.price || 0) * (transaction.reservation.quantity || 1))}
                                  </p>
                                  {transaction.reservation.product.brand && (
                                    <p className="text-xs text-green-500">
                                      Brand: {transaction.reservation.product.brand}
                                    </p>
                                  )}
                                  {transaction.reservation.product.category && (
                                    <p className="text-xs text-green-500">
                                      Category: {transaction.reservation.product.category.name}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-green-900">
                                    {formatCurrency((transaction.reservation.product.price || 0) * (transaction.reservation.quantity || 1))}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Receipt Preview */}
                        {transaction.status === 'Completed' && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <h5 className="font-medium text-gray-900 mb-3">Receipt Preview</h5>
                            <div className="space-y-2">
                              {getReceiptPreview(transaction).map((item, index) => (
                                <div key={index} className="flex justify-between items-center text-sm">
                                  <div className="flex-1">
                                    <p className="font-medium">{item.description}</p>
                                    <p className="text-gray-600">Qty: {item.qty} × {formatCurrency(item.unitPrice)}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium">{formatCurrency(item.amount)}</p>
                                  </div>
                                </div>
                              ))}
                              <div className="border-t pt-2 mt-2">
                                <div className="flex justify-between items-center font-medium">
                                  <span>Total:</span>
                                  <span>{formatCurrency(getReceiptPreview(transaction).reduce((sum, item) => sum + item.amount, 0))}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Transaction Actions */}
                        <div className="flex justify-between items-center mt-4 pt-4 border-t">
                          <div className="text-sm text-muted-foreground">
                            Transaction completed on {formatDate(transaction.completed_at || transaction.created_at)}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadReceipt(transaction.id)}
                          >
                            <DownloadIcon className="w-4 h-4 mr-2" />
                            Download Receipt
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientTransactionList;
