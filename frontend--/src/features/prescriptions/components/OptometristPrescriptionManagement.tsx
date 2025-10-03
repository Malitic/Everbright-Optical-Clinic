import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Eye, User, FileText, Plus, Edit, Trash2, Loader2, AlertCircle } from 'lucide-react';
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
import { prescriptionService } from '@/features/prescriptions/services/prescription.service';
import { Prescription } from '@/features/prescriptions/services/prescription.service';
import { format } from 'date-fns';

const OptometristPrescriptionManagement: React.FC = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPrescription, setNewPrescription] = useState({
    patient_id: '',
    appointment_id: '',
    type: 'glasses',
    right_eye: { sphere: '', cylinder: '', axis: '', pd: '' },
    left_eye: { sphere: '', cylinder: '', axis: '', pd: '' },
    vision_acuity: '',
    additional_notes: '',
    recommendations: '',
    lens_type: '',
    coating: '',
    follow_up_date: '',
    follow_up_notes: ''
  });

  // Load prescriptions on component mount
  useEffect(() => {
    if (user?.id) {
      loadPrescriptions();
    } else if (user === null) {
      // User is not authenticated, don't try to load prescriptions
      setLoading(false);
    }
  }, [user?.id, user]);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await prescriptionService.getPrescriptions();
      setPrescriptions(response.data?.data || []);
    } catch (err: any) {
      console.error('Error loading prescriptions:', err);
      if (err.response?.status === 401) {
        setError('Please log in to view prescriptions');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view prescriptions');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load prescriptions');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePrescription = async () => {
    try {
      setLoading(true);
      const prescriptionData = {
        ...newPrescription,
        issue_date: new Date().toISOString().split('T')[0],
        expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
        status: 'active'
      };
      
      const newPrescriptionData = await prescriptionService.createPrescription(prescriptionData);
      setPrescriptions([newPrescriptionData, ...prescriptions]);
      setShowCreateDialog(false);
      setNewPrescription({
        patient_id: '',
        appointment_id: '',
        type: 'glasses',
        right_eye: { sphere: '', cylinder: '', axis: '', pd: '' },
        left_eye: { sphere: '', cylinder: '', axis: '', pd: '' },
        vision_acuity: '',
        additional_notes: '',
        recommendations: '',
        lens_type: '',
        coating: '',
        follow_up_date: '',
        follow_up_notes: ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create prescription');
      console.error('Error creating prescription:', err);
    } finally {
      setLoading(false);
    }
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
        <Button onClick={loadPrescriptions}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Prescription Management</h1>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create New Prescription
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Create New Prescription</DialogTitle>
              <DialogDescription>
                Fill in the prescription details for the patient
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Patient ID</Label>
                  <Input
                    value={newPrescription.patient_id}
                    onChange={(e) => setNewPrescription({...newPrescription, patient_id: e.target.value})}
                    placeholder="Enter patient ID"
                  />
                </div>
                <div>
                  <Label>Appointment ID</Label>
                  <Input
                    value={newPrescription.appointment_id}
                    onChange={(e) => setNewPrescription({...newPrescription, appointment_id: e.target.value})}
                    placeholder="Enter appointment ID (optional)"
                  />
                </div>
              </div>

              <div>
                <Label>Type</Label>
                <Select value={newPrescription.type} onValueChange={(value) => setNewPrescription({...newPrescription, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="glasses">Glasses</SelectItem>
                    <SelectItem value="contact_lenses">Contact Lenses</SelectItem>
                    <SelectItem value="sunglasses">Sunglasses</SelectItem>
                    <SelectItem value="progressive">Progressive</SelectItem>
                    <SelectItem value="bifocal">Bifocal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Right Eye (OD)</h3>
                  <div className="space-y-2">
                    <div>
                      <Label>Sphere</Label>
                      <Input
                        value={newPrescription.right_eye.sphere}
                        onChange={(e) => setNewPrescription({
                          ...newPrescription,
                          right_eye: {...newPrescription.right_eye, sphere: e.target.value}
                        })}
                        placeholder="-2.50"
                      />
                    </div>
                    <div>
                      <Label>Cylinder</Label>
                      <Input
                        value={newPrescription.right_eye.cylinder}
                        onChange={(e) => setNewPrescription({
                          ...newPrescription,
                          right_eye: {...newPrescription.right_eye, cylinder: e.target.value}
                        })}
                        placeholder="-1.25"
                      />
                    </div>
                    <div>
                      <Label>Axis</Label>
                      <Input
                        value={newPrescription.right_eye.axis}
                        onChange={(e) => setNewPrescription({
                          ...newPrescription,
                          right_eye: {...newPrescription.right_eye, axis: e.target.value}
                        })}
                        placeholder="180"
                      />
                    </div>
                    <div>
                      <Label>PD</Label>
                      <Input
                        value={newPrescription.right_eye.pd}
                        onChange={(e) => setNewPrescription({
                          ...newPrescription,
                          right_eye: {...newPrescription.right_eye, pd: e.target.value}
                        })}
                        placeholder="32"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Left Eye (OS)</h3>
                  <div className="space-y-2">
                    <div>
                      <Label>Sphere</Label>
                      <Input
                        value={newPrescription.left_eye.sphere}
                        onChange={(e) => setNewPrescription({
                          ...newPrescription,
                          left_eye: {...newPrescription.left_eye, sphere: e.target.value}
                        })}
                        placeholder="-2.25"
                      />
                    </div>
                    <div>
                      <Label>Cylinder</Label>
                      <Input
                        value={newPrescription.left_eye.cylinder}
                        onChange={(e) => setNewPrescription({
                          ...newPrescription,
                          left_eye: {...newPrescription.left_eye, cylinder: e.target.value}
                        })}
                        placeholder="-1.00"
                      />
                    </div>
                    <div>
                      <Label>Axis</Label>
                      <Input
                        value={newPrescription.left_eye.axis}
                        onChange={(e) => setNewPrescription({
                          ...newPrescription,
                          left_eye: {...newPrescription.left_eye, axis: e.target.value}
                        })}
                        placeholder="175"
                      />
                    </div>
                    <div>
                      <Label>PD</Label>
                      <Input
                        value={newPrescription.left_eye.pd}
                        onChange={(e) => setNewPrescription({
                          ...newPrescription,
                          left_eye: {...newPrescription.left_eye, pd: e.target.value}
                        })}
                        placeholder="30"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Vision Acuity</Label>
                  <Input
                    value={newPrescription.vision_acuity}
                    onChange={(e) => setNewPrescription({...newPrescription, vision_acuity: e.target.value})}
                    placeholder="20/20"
                  />
                </div>
                <div>
                  <Label>Lens Type</Label>
                  <Input
                    value={newPrescription.lens_type}
                    onChange={(e) => setNewPrescription({...newPrescription, lens_type: e.target.value})}
                    placeholder="Single vision, Progressive, etc."
                  />
                </div>
              </div>
              
              <div>
                <Label>Additional Notes</Label>
                <Textarea
                  value={newPrescription.additional_notes}
                  onChange={(e) => setNewPrescription({...newPrescription, additional_notes: e.target.value})}
                  placeholder="Enter prescription notes..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Recommendations</Label>
                <Textarea
                  value={newPrescription.recommendations}
                  onChange={(e) => setNewPrescription({...newPrescription, recommendations: e.target.value})}
                  placeholder="Enter recommendations..."
                  rows={2}
                />
              </div>
              
              <Button onClick={handleCreatePrescription} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Prescription
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
