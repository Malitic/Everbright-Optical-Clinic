import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Eye, Calendar, Phone, Mail, User, FileText, Activity, Loader2, AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { getOptometristPatients, getOptometristPatient, OptometristPatient, OptometristPatientDetails } from '@/services/optometristApi';
import { format } from 'date-fns';

const OptometristPatientRecords: React.FC = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<OptometristPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<OptometristPatient | null>(null);
  const [patientDetails, setPatientDetails] = useState<OptometristPatientDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Load patients on component mount
  useEffect(() => {
    if (user?.id) {
      loadPatients();
    } else if (user === null) {
      // User is not authenticated, don't try to load patients
      setLoading(false);
    }
  }, [user?.id, user]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getOptometristPatients();
      setPatients(response.data || []);
    } catch (err: any) {
      console.error('Error loading patients:', err);
      setPatients([]); // Ensure patients is always an array
      if (err.response?.status === 401) {
        setError('Please log in to view patient records');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view patient records');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load patients');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadPatientDetails = async (patientId: number) => {
    try {
      setLoadingDetails(true);
      const details = await getOptometristPatient(patientId);
      setPatientDetails(details);
    } catch (err) {
      console.error('Error loading patient details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredPatients = (patients || []).filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (patient.phone && patient.phone.includes(searchTerm))
  );

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading patients...</span>
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
        <Button onClick={loadPatients}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Patient Records</h1>
        <Button>
          <User className="mr-2 h-4 w-4" />
          Add New Patient
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patient Management</CardTitle>
          <CardDescription>Manage your patient records and medical history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search patients by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredPatients.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Patients Found</h3>
              <p className="text-gray-600">No patients match your search criteria.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Last Visit</TableHead>
                  <TableHead>Prescriptions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{patient.name}</p>
                        <p className="text-sm text-gray-500">{patient.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {patient.last_visit ? format(new Date(patient.last_visit), 'MMM d, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{patient.total_prescriptions}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(patient.status)}>
                        {patient.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPatient(patient);
                              loadPatientDetails(patient.id);
                            }}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>Patient Details & Prescription History</DialogTitle>
                            <DialogDescription>
                              Complete patient information and prescription history
                            </DialogDescription>
                          </DialogHeader>
                          {selectedPatient && patientDetails && (
                            <div className="space-y-6">
                              <div>
                                <h3 className="font-semibold mb-2">Basic Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm font-medium">Name</p>
                                    <p>{patientDetails.patient?.name || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">Email</p>
                                    <p>{patientDetails.patient?.email || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">Phone</p>
                                    <p>{patientDetails.patient?.phone || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">Date of Birth</p>
                                    <p>{patientDetails.patient?.date_of_birth || 'N/A'}</p>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h3 className="font-semibold mb-4">Appointment History</h3>
                                {!patientDetails.appointments || patientDetails.appointments.length === 0 ? (
                                  <p className="text-gray-500">No appointments found for this patient.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {patientDetails.appointments.map((appointment) => (
                                      <Card key={appointment.id}>
                                        <CardContent className="p-3">
                                          <div className="flex justify-between items-start">
                                            <div>
                                              <p className="font-medium">{appointment.type}</p>
                                              <p className="text-sm text-gray-500">
                                                {format(new Date(appointment.date), 'MMM d, yyyy')} at {appointment.time}
                                              </p>
                                              {appointment.branch && (
                                                <p className="text-sm text-gray-500">{appointment.branch.name}</p>
                                              )}
                                            </div>
                                            <Badge className={getStatusColor(appointment.status)}>
                                              {appointment.status}
                                            </Badge>
                                          </div>
                                          {appointment.notes && (
                                            <p className="text-sm mt-2 text-gray-600">{appointment.notes}</p>
                                          )}
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div>
                                <h3 className="font-semibold mb-4">Prescription History</h3>
                                {loadingDetails ? (
                                  <div className="flex items-center justify-center py-4">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                    <span className="ml-2">Loading prescriptions...</span>
                                  </div>
                                ) : !patientDetails.prescriptions || patientDetails.prescriptions.length === 0 ? (
                                  <p className="text-gray-500">No prescriptions found for this patient.</p>
                                ) : (
                                  <div className="space-y-3">
                                    {patientDetails.prescriptions.map((prescription) => (
                                      <Card key={prescription.id}>
                                        <CardContent className="p-4">
                                          <div className="flex justify-between items-start mb-2">
                                            <div>
                                              <p className="font-medium">
                                                {prescription.type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                              </p>
                                              <p className="text-sm text-gray-500">
                                                {format(new Date(prescription.issue_date), 'MMM d, yyyy')}
                                              </p>
                                            </div>
                                            <Badge className={getStatusColor(prescription.status)}>
                                              {prescription.status}
                                            </Badge>
                                          </div>
                                          
                                          <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                              <h5 className="font-medium">Right Eye (OD)</h5>
                                              <p>S: {prescription.right_eye?.sphere || 'N/A'}</p>
                                              <p>C: {prescription.right_eye?.cylinder || 'N/A'}</p>
                                              <p>A: {prescription.right_eye?.axis || 'N/A'}</p>
                                              <p>PD: {prescription.right_eye?.pd || 'N/A'}</p>
                                            </div>
                                            <div>
                                              <h5 className="font-medium">Left Eye (OS)</h5>
                                              <p>S: {prescription.left_eye?.sphere || 'N/A'}</p>
                                              <p>C: {prescription.left_eye?.cylinder || 'N/A'}</p>
                                              <p>A: {prescription.left_eye?.axis || 'N/A'}</p>
                                              <p>PD: {prescription.left_eye?.pd || 'N/A'}</p>
                                            </div>
                                          </div>

                                          {prescription.vision_acuity && (
                                            <div className="mt-2 text-sm">
                                              <p><strong>Vision Acuity:</strong> {prescription.vision_acuity}</p>
                                            </div>
                                          )}

                                          {prescription.additional_notes && (
                                            <div className="mt-2 text-sm">
                                              <p><strong>Notes:</strong> {prescription.additional_notes}</p>
                                            </div>
                                          )}

                                          {prescription.recommendations && (
                                            <div className="mt-2 text-sm">
                                              <p><strong>Recommendations:</strong> {prescription.recommendations}</p>
                                            </div>
                                          )}
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
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

export default OptometristPatientRecords;
