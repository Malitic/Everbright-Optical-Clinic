import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Eye, User, FileText, Plus, Edit, Trash2 } from 'lucide-react';
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

interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  rightEye: {
    sphere: string;
    cylinder: string;
    axis: string;
    add: string;
  };
  leftEye: {
    sphere: string;
    cylinder: string;
    axis: string;
    add: string;
  };
  notes: string;
  doctor: string;
  status: 'active' | 'expired' | 'updated';
}

const mockPrescriptions: Prescription[] = [
  {
    id: '1',
    patientId: '1',
    patientName: 'John Doe',
    date: '2024-01-15',
    rightEye: { sphere: '-2.50', cylinder: '-1.25', axis: '180', add: '+1.50' },
    leftEye: { sphere: '-2.25', cylinder: '-1.00', axis: '175', add: '+1.50' },
    notes: 'Annual eye exam, no complaints. Updated prescription for myopia and astigmatism.',
    doctor: 'Dr. Smith',
    status: 'active'
  },
  {
    id: '2',
    patientId: '2',
    patientName: 'Jane Smith',
    date: '2024-01-10',
    rightEye: { sphere: '+1.75', cylinder: '-0.50', axis: '90', add: '+2.00' },
    leftEye: { sphere: '+1.50', cylinder: '-0.25', axis: '85', add: '+2.00' },
    notes: 'Contact lens fitting for hyperopia and presbyopia.',
    doctor: 'Dr. Smith',
    status: 'active'
  },
  {
    id: '3',
    patientId: '3',
    patientName: 'Robert Johnson',
    date: '2023-12-20',
    rightEye: { sphere: '-1.00', cylinder: '-0.75', axis: '45', add: '+2.50' },
    leftEye: { sphere: '-0.75', cylinder: '-0.50', axis: '40', add: '+2.50' },
    notes: 'Post-cataract surgery prescription update.',
    doctor: 'Dr. Smith',
    status: 'expired'
  }
];

const OptometristPrescriptionManagement: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(mockPrescriptions);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPrescription, setNewPrescription] = useState({
    patientId: '',
    patientName: '',
    rightEye: { sphere: '', cylinder: '', axis: '', add: '' },
    leftEye: { sphere: '', cylinder: '', axis: '', add: '' },
    notes: '',
    doctor: 'Dr. Smith'
  });

  const handleCreatePrescription = () => {
    const prescription: Prescription = {
      id: Date.now().toString(),
      ...newPrescription,
      date: new Date().toISOString().split('T')[0],
      status: 'active'
    };
    setPrescriptions([...prescriptions, prescription]);
    setShowCreateDialog(false);
    setNewPrescription({
      patientId: '',
      patientName: '',
      rightEye: { sphere: '', cylinder: '', axis: '', add: '' },
      leftEye: { sphere: '', cylinder: '', axis: '', add: '' },
      notes: '',
      doctor: 'Dr. Smith'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'updated': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
              <div>
                <Label>Patient Name</Label>
                <Input
                  value={newPrescription.patientName}
                  onChange={(e) => setNewPrescription({...newPrescription, patientName: e.target.value})}
                  placeholder="Enter patient name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Right Eye</h3>
                  <div className="space-y-2">
                    <div>
                      <Label>Sphere</Label>
                      <Input
                        value={newPrescription.rightEye.sphere}
                        onChange={(e) => setNewPrescription({
                          ...newPrescription,
                          rightEye: {...newPrescription.rightEye, sphere: e.target.value}
                        })}
                        placeholder="-2.50"
                      />
                    </div>
                    <div>
                      <Label>Cylinder</Label>
                      <Input
                        value={newPrescription.rightEye.cylinder}
                        onChange={(e) => setNewPrescription({
                          ...newPrescription,
                          rightEye: {...newPrescription.rightEye, cylinder: e.target.value}
                        })}
                        placeholder="-1.25"
                      />
                    </div>
                    <div>
                      <Label>Axis</Label>
                      <Input
                        value={newPrescription.rightEye.axis}
                        onChange={(e) => setNewPrescription({
                          ...newPrescription,
                          rightEye: {...newPrescription.rightEye, axis: e.target.value}
                        })}
                        placeholder="180"
                      />
                    </div>
                    <div>
                      <Label>Add</Label>
                      <Input
                        value={newPrescription.rightEye.add}
                        onChange={(e) => setNewPrescription({
                          ...newPrescription,
                          rightEye: {...newPrescription.rightEye, add: e.target.value}
                        })}
                        placeholder="+1.50"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Left Eye</h3>
                  <div className="space-y-2">
                    <div>
                      <Label>Sphere</Label>
                      <Input
                        value={newPrescription.leftEye.sphere}
                        onChange={(e) => setNewPrescription({
                          ...newPrescription,
                          leftEye: {...newPrescription.leftEye, sphere: e.target.value}
                        })}
                        placeholder="-2.25"
                      />
                    </div>
                    <div>
                      <Label>Cylinder</Label>
                      <Input
                        value={newPrescription.leftEye.cylinder}
                        onChange={(e) => setNewPrescription({
                          ...newPrescription,
                          leftEye: {...newPrescription.leftEye, cylinder: e.target.value}
                        })}
                        placeholder="-1.00"
                      />
                    </div>
                    <div>
                      <Label>Axis</Label>
                      <Input
                        value={newPrescription.leftEye.axis}
                        onChange={(e) => setNewPrescription({
                          ...newPrescription,
                          leftEye: {...newPrescription.leftEye, axis: e.target.value}
                        })}
                        placeholder="175"
                      />
                    </div>
                    <div>
                      <Label>Add</Label>
                      <Input
                        value={newPrescription.leftEye.add}
                        onChange={(e) => setNewPrescription({
                          ...newPrescription,
                          leftEye: {...newPrescription.leftEye, add: e.target.value}
                        })}
                        placeholder="+1.50"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={newPrescription.notes}
                  onChange={(e) => setNewPrescription({...newPrescription, notes: e.target.value})}
                  placeholder="Enter prescription notes..."
                  rows={3}
                />
              </div>
              
              <Button onClick={handleCreatePrescription}>Create Prescription</Button>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Right Eye</TableHead>
                <TableHead>Left Eye</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prescriptions.map((prescription) => (
                <TableRow key={prescription.id}>
                  <TableCell>{prescription.patientName}</TableCell>
                  <TableCell>{prescription.date}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>S: {prescription.rightEye.sphere}</p>
                      <p>C: {prescription.rightEye.cylinder}</p>
                      <p>A: {prescription.rightEye.axis}</p>
                      <p>Add: {prescription.rightEye.add}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>S: {prescription.leftEye.sphere}</p>
                      <p>C: {prescription.leftEye.cylinder}</p>
                      <p>A: {prescription.leftEye.axis}</p>
                      <p>Add: {prescription.leftEye.add}</p>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{prescription.notes}</TableCell>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default OptometristPrescriptionManagement;
