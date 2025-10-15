import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Calendar, User, Download, Plus, Eye, Receipt as ReceiptIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { PatientTransactionList } from '@/components/transactions/PatientTransactionList';

interface Appointment {
  id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  type: string;
  status: string;
  patient: {
    id: number;
    name: string;
    email: string;
  };
  optometrist?: {
    id: number;
    name: string;
  };
  has_receipt: boolean;
  receipt_id?: number;
}

/**
 * Component that shows completed appointments and allows creating receipts
 * Also displays existing patient transactions
 */
export const AppointmentsAndReceipts: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [completedAppointments, setCompletedAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompletedAppointments();
  }, []);

  const loadCompletedAppointments = async () => {
    try {
      setLoading(true);
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const token = sessionStorage.getItem('auth_token');

      const response = await fetch(`${apiBaseUrl}/appointments?status=completed`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }

      const data = await response.json();
      setCompletedAppointments(data.data || data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load completed appointments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReceipt = (appointmentId: number) => {
    navigate(`/staff/create-receipt/${appointmentId}`);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <Tabs defaultValue="create-receipts" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="create-receipts">
          <Plus className="h-4 w-4 mr-2" />
          Create Receipts
        </TabsTrigger>
        <TabsTrigger value="transaction-history">
          <ReceiptIcon className="h-4 w-4 mr-2" />
          Transaction History
        </TabsTrigger>
      </TabsList>

      {/* Create Receipts Tab */}
      <TabsContent value="create-receipts" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-staff" />
              Completed Appointments - Create Receipts
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Click "Create Receipt" for completed appointments that don't have a receipt yet
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-staff"></div>
              </div>
            ) : completedAppointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No completed appointments found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Optometrist</TableHead>
                    <TableHead>Receipt Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedAppointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{formatDate(appointment.appointment_date)}</span>
                          <span className="text-sm text-gray-600">
                            {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium">{appointment.patient.name}</div>
                            <div className="text-sm text-gray-600">{appointment.patient.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {appointment.type.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {appointment.optometrist?.name || 'Not assigned'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {appointment.has_receipt ? (
                          <Badge className="bg-green-100 text-green-800">
                            <ReceiptIcon className="h-3 w-3 mr-1" />
                            Has Receipt
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-600 border-orange-300">
                            No Receipt
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {!appointment.has_receipt ? (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleCreateReceipt(appointment.id)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              Create Receipt
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                              className="text-gray-500"
                            >
                              <ReceiptIcon className="h-3 w-3 mr-1" />
                              Receipt Created
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
      </TabsContent>

      {/* Transaction History Tab */}
      <TabsContent value="transaction-history" className="mt-6">
        <PatientTransactionList />
      </TabsContent>
    </Tabs>
  );
};

export default AppointmentsAndReceipts;

