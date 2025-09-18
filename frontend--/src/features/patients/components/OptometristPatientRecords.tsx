import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Eye, Calendar, Phone, Mail, User, FileText, Activity } from 'lucide-react';
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

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  lastVisit: string;
  nextAppointment?: string;
  medicalHistory: string[];
  prescriptions: number;
  status: 'active' | 'inactive';
}

const mockPatients: Patient[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@email.com',
    phone: '+1-555-0123',
    dateOfBirth: '1985-06-15',
    lastVisit: '2024-01-10',
    nextAppointment: '2024-02-15',
    medicalHistory: ['Myopia', 'Astigmatism'],
    prescriptions: 12,
    status: 'active'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@email.com',
    phone: '+1-555-0124',
    dateOfBirth: '1990-03-22',
    lastVisit: '2024-01-08',
    nextAppointment: '2024-01-25',
    medicalHistory: ['Hyperopia', 'Presbyopia'],
    prescriptions: 8,
    status: 'active'
  },
  {
    id: '3',
    name: 'Robert Johnson',
    email: 'robert.j@email.com',
    phone: '+1-555-0125',
    dateOfBirth: '1978-11-30',
    lastVisit: '2023-12-20',
    medicalHistory: ['Glaucoma', 'Cataract'],
    prescriptions: 15,
    status: 'active'
  }
];

const OptometristPatientRecords: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>(mockPatients);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
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

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Last Visit</TableHead>
                <TableHead>Next Appointment</TableHead>
                <TableHead>Medical History</TableHead>
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
                  <TableCell>{calculateAge(patient.dateOfBirth)}</TableCell>
                  <TableCell>{patient.lastVisit}</TableCell>
                  <TableCell>
                    {patient.nextAppointment || (
                      <span className="text-gray-400">Not scheduled</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {patient.medicalHistory.map((condition, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{patient.prescriptions}</Badge>
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
                          onClick={() => setSelectedPatient(patient)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Patient Details</DialogTitle>
                          <DialogDescription>
                            Complete patient information and medical history
                          </DialogDescription>
                        </DialogHeader>
                        {selectedPatient && (
                          <div className="space-y-4">
                            <div>
                              <h3 className="font-semibold mb-2">Basic Information</h3>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm font-medium">Name</p>
                                  <p>{selectedPatient.name}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Email</p>
                                  <p>{selectedPatient.email}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Phone</p>
                                  <p>{selectedPatient.phone}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Date of Birth</p>
                                  <p>{selectedPatient.dateOfBirth}</p>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h3 className="font-semibold mb-2">Medical History</h3>
                              <div className="flex flex-wrap gap-2">
                                {selectedPatient.medicalHistory.map((condition, index) => (
                                  <Badge key={index} variant="outline">
                                    {condition}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h3 className="font-semibold mb-2">Recent Activity</h3>
                              <div className="space-y-2">
                                <p>Last Visit: {selectedPatient.lastVisit}</p>
                                <p>Total Prescriptions: {selectedPatient.prescriptions}</p>
                                <p>Status: {selectedPatient.status}</p>
                              </div>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default OptometristPatientRecords;
