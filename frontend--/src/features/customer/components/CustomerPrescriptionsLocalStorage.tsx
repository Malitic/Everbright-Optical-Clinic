import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Download, Calendar, AlertCircle, Loader2, FileText, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { prescriptionService } from '@/features/prescriptions/services/prescription.service';
import { Prescription } from '@/features/prescriptions/services/prescription.service';

export const CustomerPrescriptionsLocalStorage: React.FC = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load prescriptions on mount
  useEffect(() => {
    if (user?.id) {
      loadPrescriptions();
    } else if (user === null) {
      // User is not authenticated, don't try to load prescriptions
      setLoading(false);
    }
  }, [user?.id, user]);

  // Refresh when user returns to the page (focus event) - no auto-refresh
  useEffect(() => {
    const handleFocus = () => {
      if (user?.id) {
        loadPrescriptions();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user?.id]);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await prescriptionService.getPrescriptions();
      // The API returns paginated data, so we need to access the 'data' property
      const prescriptionsData = response.data?.data || response.data || [];
      
      // Sort prescriptions by appointment date (newest first) - issue date should match appointment date
      const sortedPrescriptions = prescriptionsData.sort((a: Prescription, b: Prescription) => {
        const dateA = new Date(a.appointment?.appointment_date || a.issue_date);
        const dateB = new Date(b.appointment?.appointment_date || b.issue_date);
        return dateB.getTime() - dateA.getTime();
      });
      
      setPrescriptions(sortedPrescriptions);
    } catch (err: any) {
      console.error('Error loading prescriptions:', err);
      if (err.response?.status === 401) {
        setError('Please log in to view your prescriptions');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view prescriptions');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load prescriptions');
      }
    } finally {
      setLoading(false);
    }
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
  Sphere: ${prescription.right_eye?.sphere || 'N/A'}
  Cylinder: ${prescription.right_eye?.cylinder || 'N/A'}
  Axis: ${prescription.right_eye?.axis || 'N/A'}
  PD: ${prescription.right_eye?.pd || 'N/A'}

Left Eye (OS):
  Sphere: ${prescription.left_eye?.sphere || 'N/A'}
  Cylinder: ${prescription.left_eye?.cylinder || 'N/A'}
  Axis: ${prescription.left_eye?.axis || 'N/A'}
  PD: ${prescription.left_eye?.pd || 'N/A'}

Vision Acuity: ${prescription.vision_acuity || 'N/A'}

Notes: ${prescription.additional_notes || 'None'}

Recommendations: ${prescription.recommendations || 'None'}

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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Prescriptions</h1>
          <p className="text-gray-600 mt-2">View and manage your eye care prescriptions</p>
        </div>
        <Button
          onClick={loadPrescriptions}
          disabled={loading}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
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
                        Issued: {format(new Date(prescription.appointment?.appointment_date || prescription.issue_date), 'MMMM d, yyyy')}
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

                    {selectedPrescription === prescription.id && (
                      <div className="mt-4 space-y-3 pt-3 border-t">
                        <h4 className="font-medium text-sm mb-2">Prescription Details:</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <h5 className="font-medium">Right Eye (OD)</h5>
                            <p>Sphere: {prescription.prescription_data?.right_eye?.sphere || 'N/A'}</p>
                            <p>Cylinder: {prescription.prescription_data?.right_eye?.cylinder || 'N/A'}</p>
                            <p>Axis: {prescription.prescription_data?.right_eye?.axis || 'N/A'}</p>
                            <p>PD: {prescription.prescription_data?.right_eye?.pd || 'N/A'}</p>
                          </div>
                          <div>
                            <h5 className="font-medium">Left Eye (OS)</h5>
                            <p>Sphere: {prescription.prescription_data?.left_eye?.sphere || 'N/A'}</p>
                            <p>Cylinder: {prescription.prescription_data?.left_eye?.cylinder || 'N/A'}</p>
                            <p>Axis: {prescription.prescription_data?.left_eye?.axis || 'N/A'}</p>
                            <p>PD: {prescription.prescription_data?.left_eye?.pd || 'N/A'}</p>
                          </div>
                        </div>
                        {prescription.prescription_data?.vision_acuity && (
                          <div className="text-sm">
                            <p><strong>Vision Acuity:</strong> {prescription.prescription_data.vision_acuity}</p>
                          </div>
                        )}
                        {prescription.prescription_data?.additional_notes && (
                          <div className="text-sm">
                            <p><strong>Notes:</strong> {prescription.prescription_data.additional_notes}</p>
                          </div>
                        )}
                        {prescription.prescription_data?.recommendations && (
                          <div className="text-sm">
                            <p><strong>Recommendations:</strong> {prescription.prescription_data.recommendations}</p>
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

