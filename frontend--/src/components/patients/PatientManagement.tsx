import React, { useState } from 'react';
import { Users, Search, Plus, Edit, Eye, Calendar, FileText, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  lastVisit: string;
  nextAppointment?: string;
  prescriptions: number;
  totalVisits: number;
  avatar?: string;
  medicalHistory: string[];
  allergies: string[];
  insurance: {
    provider: string;
    policyNumber: string;
  };
}

const PatientManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const [patients] = useState<Patient[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '(555) 123-4567',
      dateOfBirth: '1985-03-15',
      address: '123 Main St, City, ST 12345',
      emergencyContact: 'John Johnson (Spouse)',
      emergencyPhone: '(555) 987-6543',
      lastVisit: '2024-01-15',
      nextAppointment: '2024-02-20',
      prescriptions: 3,
      totalVisits: 12,
      medicalHistory: ['Myopia', 'Astigmatism'],
      allergies: ['None reported'],
      insurance: {
        provider: 'Blue Cross Blue Shield',
        policyNumber: 'BC123456789'
      }
    },
    {
      id: '2',
      name: 'Michael Chen',
      email: 'michael.chen@email.com',
      phone: '(555) 234-5678',
      dateOfBirth: '1978-07-22',
      address: '456 Oak Ave, City, ST 12345',
      emergencyContact: 'Lisa Chen (Wife)',
      emergencyPhone: '(555) 876-5432',
      lastVisit: '2024-02-01',
      prescriptions: 2,
      totalVisits: 8,
      medicalHistory: ['Presbyopia', 'Dry Eyes'],
      allergies: ['Latex'],
      insurance: {
        provider: 'Aetna',
        policyNumber: 'AET987654321'
      }
    },
    {
      id: '3',
      name: 'Emily Davis',
      email: 'emily.davis@email.com',
      phone: '(555) 345-6789',
      dateOfBirth: '1992-11-08',
      address: '789 Pine Rd, City, ST 12345',
      emergencyContact: 'Robert Davis (Father)',
      emergencyPhone: '(555) 765-4321',
      lastVisit: '2023-12-10',
      nextAppointment: '2024-02-25',
      prescriptions: 1,
      totalVisits: 5,
      medicalHistory: ['Contact lens wearer'],
      allergies: ['Pollen'],
      insurance: {
        provider: 'Cigna',
        policyNumber: 'CIG456789123'
      }
    }
  ]);

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  );

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

  const PatientDetails = ({ patient }: { patient: Patient }) => (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={patient.avatar} alt={patient.name} />
          <AvatarFallback className="text-lg">
            {patient.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-bold">{patient.name}</h2>
          <p className="text-muted-foreground">Patient ID: {patient.id}</p>
          <p className="text-sm text-muted-foreground">
            Age: {calculateAge(patient.dateOfBirth)} years old
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="medical">Medical History</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{patient.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{patient.phone}</span>
                </div>
                <div className="text-sm">
                  <p className="font-medium">Address:</p>
                  <p className="text-muted-foreground">{patient.address}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium text-sm">{patient.emergencyContact}</p>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{patient.emergencyPhone}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Insurance Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium text-sm">{patient.insurance.provider}</p>
                <p className="text-sm text-muted-foreground">
                  Policy: {patient.insurance.policyNumber}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Visit Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Total Visits</p>
                    <p className="text-2xl font-bold">{patient.totalVisits}</p>
                  </div>
                  <div>
                    <p className="font-medium">Prescriptions</p>
                    <p className="text-2xl font-bold">{patient.prescriptions}</p>
                  </div>
                </div>
                <div className="text-sm">
                  <p className="font-medium">Last Visit:</p>
                  <p className="text-muted-foreground">{patient.lastVisit}</p>
                </div>
                {patient.nextAppointment && (
                  <div className="text-sm">
                    <p className="font-medium">Next Appointment:</p>
                    <p className="text-muted-foreground">{patient.nextAppointment}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="medical" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Medical History</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {patient.medicalHistory.map((condition, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span className="text-sm">{condition}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Allergies</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {patient.allergies.map((allergy, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                      <span className="text-sm">{allergy}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="appointments">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Appointment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Eye Examination</p>
                      <p className="text-sm text-muted-foreground">Dr. Sarah Johnson</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">2024-01-15</p>
                    <Badge>Completed</Badge>
                  </div>
                </div>
                {patient.nextAppointment && (
                  <div className="flex items-center justify-between p-3 border rounded border-green-200 bg-green-50">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="font-medium">Follow-up Visit</p>
                        <p className="text-sm text-muted-foreground">Dr. Sarah Johnson</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{patient.nextAppointment}</p>
                      <Badge className="bg-green-500 text-white">Scheduled</Badge>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prescriptions">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Prescription History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">RX-2024-001</p>
                      <p className="text-sm text-muted-foreground">Progressive Lenses</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">2024-01-15</p>
                    <Badge className="bg-green-500 text-white">Active</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Users className="h-6 w-6 text-staff" />
          <h1 className="text-2xl font-bold">Patient Management</h1>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="staff">
              <Plus className="mr-2 h-4 w-4" />
              Add Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Patient</DialogTitle>
              <DialogDescription>
                Enter patient information to create a new record.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" placeholder="First name" />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" placeholder="Last name" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="Email address" />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" placeholder="Phone number" />
                </div>
              </div>
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input id="dateOfBirth" type="date" />
              </div>
              <Button className="w-full" variant="staff">Add Patient</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {selectedPatient ? (
        <div>
          <Button
            variant="outline"
            onClick={() => setSelectedPatient(null)}
            className="mb-4"
          >
            ← Back to Patient List
          </Button>
          <PatientDetails patient={selectedPatient} />
        </div>
      ) : (
        <>
          {/* Search */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patients by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Patient List */}
          <Card>
            <CardHeader>
              <CardTitle>Patients ({filteredPatients.length})</CardTitle>
              <CardDescription>
                Manage patient records and information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Last Visit</TableHead>
                    <TableHead>Next Appointment</TableHead>
                    <TableHead>Visits</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={patient.avatar} alt={patient.name} />
                            <AvatarFallback>
                              {patient.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{patient.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Age: {calculateAge(patient.dateOfBirth)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{patient.email}</div>
                          <div className="text-muted-foreground">{patient.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>{patient.lastVisit}</TableCell>
                      <TableCell>
                        {patient.nextAppointment ? (
                          <Badge className="bg-green-500 text-white">
                            {patient.nextAppointment}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">None scheduled</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="font-medium">{patient.totalVisits}</div>
                          <div className="text-xs text-muted-foreground">total</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedPatient(patient)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Calendar className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default PatientManagement;
