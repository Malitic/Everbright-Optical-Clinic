import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Eye, User, FileText, Plus, Edit, Trash2, Loader2, AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getOptometristPrescriptions, 
  OptometristPrescription,
  getOptometristAllAppointments,
  OptometristAppointment
} from '@/services/optometristApi';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import PrescriptionForm from '@/components/prescriptions/PrescriptionForm';

const OptometristPrescriptionManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [prescriptions, setPrescriptions] = useState<OptometristPrescription[]>([]);
  const [appointments, setAppointments] = useState<OptometristAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<OptometristAppointment | null>(null);

  // Load prescriptions and appointments on component mount
  useEffect(() => {
    if (user?.id) {
      loadData();
    } else if (user === null) {
      // User is not authenticated, don't try to load data
      setLoading(false);
    }
  }, [user?.id, user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([loadPrescriptions(), loadAppointments()]);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadPrescriptions = async () => {
    try {
      const response = await getOptometristPrescriptions();
      setPrescriptions(response.data);
    } catch (err: any) {
      console.error('Error loading prescriptions:', err);
      if (err.response?.status === 401) {
        setError('Please log in to view prescriptions');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view prescriptions');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load prescriptions');
      }
      throw err;
    }
  };

  const loadAppointments = async () => {
    try {
      const response = await getOptometristAllAppointments();
      // Filter for appointments that are in progress (can create prescription for these)
      const inProgressAppointments = response.data.filter(apt => apt.status === 'in_progress');
      setAppointments(inProgressAppointments);
    } catch (err: any) {
      console.error('Error loading appointments:', err);
      throw err;
    }
  };

  const handleOpenPrescriptionForm = (appointment: OptometristAppointment) => {
    setSelectedAppointment(appointment);
    setShowPrescriptionForm(true);
  };

  const handleClosePrescriptionForm = () => {
    setShowPrescriptionForm(false);
    setSelectedAppointment(null);
  };

  const handlePrescriptionSuccess = async () => {
    setShowPrescriptionForm(false);
    setSelectedAppointment(null);
    // Reload data
    await loadData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'updated': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading prescriptions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-red-600 mb-4">
          <AlertCircle className="h-5 w-5" />
          <span>Error: {error}</span>
        </div>
        <Button onClick={loadData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {showPrescriptionForm && selectedAppointment && (
        <PrescriptionForm
          appointment={{
            id: selectedAppointment.id,
            patient: {
              id: selectedAppointment.patient?.id || 0,
              name: selectedAppointment.patient?.name || 'Unknown'
            },
            appointment_date: selectedAppointment.date,
            start_time: selectedAppointment.start_time,
            type: selectedAppointment.type
          }}
          onSuccess={handlePrescriptionSuccess}
          onCancel={handleClosePrescriptionForm}
        />
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Prescription Management</h1>
      </div>

      {/* In-Progress Appointments Section */}
      {appointments.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>In-Progress Appointments</CardTitle>
            <CardDescription>Create prescriptions for these appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{appointment.patient?.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{appointment.patient?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{format(new Date(appointment.date), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{appointment.start_time}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{appointment.type}</Badge>
                    </TableCell>
                    <TableCell>{appointment.branch?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => handleOpenPrescriptionForm(appointment)}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Create Prescription
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Prescriptions</CardTitle>
          <CardDescription>Manage and track all patient prescriptions</CardDescription>
        </CardHeader>
        <CardContent>
          {prescriptions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Prescriptions Found</h3>
              <p className="text-gray-600">Create your first prescription to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Right Eye (OD)</TableHead>
                  <TableHead>Left Eye (OS)</TableHead>
                  <TableHead>Vision Acuity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prescriptions.map((prescription) => (
                  <TableRow key={prescription.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{prescription.patient?.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{prescription.patient?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{format(new Date(prescription.issue_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {prescription.type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>S: {prescription.right_eye?.sphere || 'N/A'}</p>
                        <p>C: {prescription.right_eye?.cylinder || 'N/A'}</p>
                        <p>A: {prescription.right_eye?.axis || 'N/A'}</p>
                        <p>PD: {prescription.right_eye?.pd || 'N/A'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>S: {prescription.left_eye?.sphere || 'N/A'}</p>
                        <p>C: {prescription.left_eye?.cylinder || 'N/A'}</p>
                        <p>A: {prescription.left_eye?.axis || 'N/A'}</p>
                        <p>PD: {prescription.left_eye?.pd || 'N/A'}</p>
                      </div>
                    </TableCell>
                    <TableCell>{prescription.vision_acuity || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(prescription.status)}>
                        {prescription.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
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

export default OptometristPrescriptionManagement;
