import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Download, Calendar, AlertCircle, Loader2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface Prescription {
  id: string;
  patient_id: string;
  optometrist_id: string;
  appointment_id?: string;
  type: 'glasses' | 'contact_lenses' | 'sunglasses' | 'progressive' | 'bifocal';
  prescription_data: {
    sphere_od?: string;
    cylinder_od?: string;
    axis_od?: string;
    add_od?: string;
    sphere_os?: string;
    cylinder_os?: string;
    axis_os?: string;
    add_os?: string;
    pd?: string;
  };
  issue_date: string;
  expiry_date: string;
  notes?: string;
  status: 'active' | 'expired' | 'cancelled';
  created_at: string;
  updated_at: string;
  patient?: {
    id: string;
    name: string;
    email: string;
  };
  optometrist?: {
    id: string;
    name: string;
    email: string;
  };
  appointment?: {
    id: string;
    appointment_date: string;
    start_time: string;
    type: string;
  };
}

const PRESCRIPTIONS_STORAGE_KEY = 'localStorage_prescriptions';

export const CustomerPrescriptionsLocalStorage: React.FC = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load prescriptions on mount
  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = () => {
    try {
      const stored = localStorage.getItem(PRESCRIPTIONS_STORAGE_KEY);
      if (stored) {
        const allPrescriptions = JSON.parse(stored);
        // Filter prescriptions for current user
        const userPrescriptions = allPrescriptions.filter((prescription: Prescription) => 
          prescription.patient_id === user?.id
        );
        setPrescriptions(userPrescriptions);
      } else {
        // Create sample prescriptions if none exist
        createSamplePrescriptions();
      }
    } catch (error) {
      console.error('Error loading prescriptions:', error);
    }
  };

  const createSamplePrescriptions = () => {
    if (!user) return;

    const samplePrescriptions: Prescription[] = [
      {
        id: '1',
        patient_id: user.id,
        optometrist_id: '1',
        appointment_id: '1',
        type: 'glasses',
        prescription_data: {
          sphere_od: '-2.50',
          cylinder_od: '-0.75',
          axis_od: '180',
          add_od: '+1.00',
          sphere_os: '-2.25',
          cylinder_os: '-0.50',
          axis_os: '175',
          add_os: '+1.00',
          pd: '62'
        },
        issue_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
        expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
        notes: 'For distance and reading. Progressive lenses recommended.',
        status: 'active',
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        patient: {
          id: user.id,
          name: user.name || '',
          email: user.email || ''
        },
        optometrist: {
          id: '1',
          name: 'Dr. Sarah Johnson',
          email: 'sarah.johnson@clinic.com'
        },
        appointment: {
          id: '1',
          appointment_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          start_time: '10:00',
          type: 'eye_exam'
        }
      },
      {
        id: '2',
        patient_id: user.id,
        optometrist_id: '2',
        appointment_id: '2',
        type: 'contact_lenses',
        prescription_data: {
          sphere_od: '-2.50',
          cylinder_od: '-0.75',
          axis_od: '180',
          sphere_os: '-2.25',
          cylinder_os: '-0.50',
          axis_os: '175',
          pd: '62'
        },
        issue_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days ago
        expiry_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6 months from now
        notes: 'Daily disposable contact lenses. Replace every day.',
        status: 'active',
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        patient: {
          id: user.id,
          name: user.name || '',
          email: user.email || ''
        },
        optometrist: {
          id: '2',
          name: 'Dr. Michael Chen',
          email: 'michael.chen@clinic.com'
        },
        appointment: {
          id: '2',
          appointment_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          start_time: '14:00',
          type: 'contact_fitting'
        }
      }
    ];

    localStorage.setItem(PRESCRIPTIONS_STORAGE_KEY, JSON.stringify(samplePrescriptions));
    setPrescriptions(samplePrescriptions);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'glasses': return <Eye className="w-4 h-4" />;
      case 'contact_lenses': return <Eye className="w-4 h-4" />;
      case 'sunglasses': return <Eye className="w-4 h-4" />;
      default: return <Eye className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'glasses': return 'Glasses';
      case 'contact_lenses': return 'Contact Lenses';
      case 'sunglasses': return 'Sunglasses';
      case 'progressive': return 'Progressive Lenses';
      case 'bifocal': return 'Bifocal Lenses';
      default: return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  const downloadPrescription = (prescription: Prescription) => {
    // Create a simple text-based prescription document
    const prescriptionText = `
PRESCRIPTION

Patient: ${prescription.patient?.name}
Date: ${format(new Date(prescription.issue_date), 'MMMM d, yyyy')}
Expires: ${format(new Date(prescription.expiry_date), 'MMMM d, yyyy')}
Optometrist: ${prescription.optometrist?.name}

Type: ${getTypeLabel(prescription.type)}

PRESCRIPTION DATA:
Right Eye (OD):
  Sphere: ${prescription.prescription_data.sphere_od || 'N/A'}
  Cylinder: ${prescription.prescription_data.cylinder_od || 'N/A'}
  Axis: ${prescription.prescription_data.axis_od || 'N/A'}
  Add: ${prescription.prescription_data.add_od || 'N/A'}

Left Eye (OS):
  Sphere: ${prescription.prescription_data.sphere_os || 'N/A'}
  Cylinder: ${prescription.prescription_data.cylinder_os || 'N/A'}
  Axis: ${prescription.prescription_data.axis_os || 'N/A'}
  Add: ${prescription.prescription_data.add_os || 'N/A'}

Pupillary Distance (PD): ${prescription.prescription_data.pd || 'N/A'}

Notes: ${prescription.notes || 'None'}

Status: ${prescription.status.toUpperCase()}
    `.trim();

    const blob = new Blob([prescriptionText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prescription-${prescription.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Prescriptions</h1>
        <p className="text-gray-600 mt-2">View and manage your eye care prescriptions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {prescriptions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Prescriptions Found</h3>
                <p className="text-gray-600 mb-4">You don't have any prescriptions yet. Schedule an appointment to get your first prescription.</p>
              </CardContent>
            </Card>
          ) : (
            prescriptions.map(prescription => (
              <Card key={prescription.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(prescription.type)}
                      <span className="font-semibold text-lg">{getTypeLabel(prescription.type)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(prescription.status)}>
                        {prescription.status}
                      </Badge>
                      {isExpired(prescription.expiry_date) && (
                        <Badge variant="destructive">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Expired
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        Issued: {format(new Date(prescription.issue_date), 'MMMM d, yyyy')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        Expires: {format(new Date(prescription.expiry_date), 'MMMM d, yyyy')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        Optometrist: {prescription.optometrist?.name}
                      </span>
                    </div>

                    {prescription.appointment && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          From appointment: {format(new Date(prescription.appointment.appointment_date), 'MMM d, yyyy')} at {prescription.appointment.start_time}
                        </span>
                      </div>
                    )}

                    {selectedPrescription === prescription.id && (
                      <div className="mt-4 space-y-3 pt-3 border-t">
                        <h4 className="font-medium text-sm mb-2">Prescription Details:</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <h5 className="font-medium">Right Eye (OD)</h5>
                            <p>Sphere: {prescription.prescription_data.sphere_od || 'N/A'}</p>
                            <p>Cylinder: {prescription.prescription_data.cylinder_od || 'N/A'}</p>
                            <p>Axis: {prescription.prescription_data.axis_od || 'N/A'}</p>
                            <p>Add: {prescription.prescription_data.add_od || 'N/A'}</p>
                          </div>
                          <div>
                            <h5 className="font-medium">Left Eye (OS)</h5>
                            <p>Sphere: {prescription.prescription_data.sphere_os || 'N/A'}</p>
                            <p>Cylinder: {prescription.prescription_data.cylinder_os || 'N/A'}</p>
                            <p>Axis: {prescription.prescription_data.axis_os || 'N/A'}</p>
                            <p>Add: {prescription.prescription_data.add_os || 'N/A'}</p>
                          </div>
                        </div>
                        {prescription.prescription_data.pd && (
                          <div className="text-sm">
                            <p><strong>Pupillary Distance (PD):</strong> {prescription.prescription_data.pd}mm</p>
                          </div>
                        )}
                        {prescription.notes && (
                          <div className="text-sm">
                            <p><strong>Notes:</strong> {prescription.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedPrescription(selectedPrescription === prescription.id ? null : prescription.id)}
                    >
                      {selectedPrescription === prescription.id ? 'Hide' : 'View'} Details
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadPrescription(prescription)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                    {prescription.status === 'active' && !isExpired(prescription.expiry_date) && (
                      <Button size="sm" variant="outline">
                        Order Glasses
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Prescription Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Total Prescriptions</span>
                  <span className="text-sm font-medium">{prescriptions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Active</span>
                  <span className="text-sm font-medium">
                    {prescriptions.filter(p => p.status === 'active' && !isExpired(p.expiry_date)).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Expired</span>
                  <span className="text-sm font-medium">
                    {prescriptions.filter(p => isExpired(p.expiry_date)).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Glasses</span>
                  <span className="text-sm font-medium">
                    {prescriptions.filter(p => p.type === 'glasses').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Contact Lenses</span>
                  <span className="text-sm font-medium">
                    {prescriptions.filter(p => p.type === 'contact_lenses').length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Eye Exam
              </Button>
              <Button variant="outline" className="w-full" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                Order New Glasses
              </Button>
              <Button variant="outline" className="w-full" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                Contact Optometrist
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
