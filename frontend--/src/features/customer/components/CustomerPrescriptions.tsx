import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Download, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { usePatientPrescriptions } from '@/features/prescriptions/hooks/usePrescriptions';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

const CustomerPrescriptions: React.FC = () => {
  const { user } = useAuth();
  const [selectedPrescription, setSelectedPrescription] = useState<number | null>(null);
  const { prescriptions, loading, error } = usePatientPrescriptions(user?.id || null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'glasses': return <Eye className="w-4 h-4" />;
      case 'contact-lenses': return <Eye className="w-4 h-4" />;
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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Prescriptions</h1>
        <p className="text-gray-600 mt-2">Manage your vision prescriptions and orders</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Current Prescriptions</CardTitle>
              <CardDescription>Your active vision prescriptions</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                  <p className="text-red-600">Failed to load prescriptions</p>
                  <p className="text-sm text-gray-500 mt-2">{error}</p>
                </div>
              ) : prescriptions.length === 0 ? (
                <div className="text-center py-8">
                  <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Prescriptions Found</h3>
                  <p className="text-gray-600">You don't have any prescriptions yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {prescriptions.map(prescription => (
                    <Card key={prescription.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {getTypeIcon(prescription.type)}
                              <span className="font-semibold">{getTypeLabel(prescription.type)}</span>
                            </div>
                            <Badge className={getStatusColor(prescription.status)}>
                              {prescription.status}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedPrescription(selectedPrescription === prescription.id ? null : prescription.id)}
                          >
                            {selectedPrescription === prescription.id ? 'Hide' : 'View'} Details
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>Issued: {format(new Date(prescription.issue_date), 'MMM d, yyyy')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <AlertCircle className="w-4 h-4" />
                            <span>Valid until: {format(new Date(prescription.expiry_date), 'MMM d, yyyy')}</span>
                          </div>

                          {selectedPrescription === prescription.id && (
                            <div className="mt-4 space-y-3 pt-3 border-t">
                              <div>
                                <h4 className="font-medium text-sm mb-2">Prescription Details:</h4>
                                <div className="bg-gray-50 p-3 rounded-md text-sm">
                                  <div className="grid grid-cols-2 gap-2">
                                    {prescription.prescription_data.sphere_od && (
                                      <div>
                                        <span className="font-medium">Sphere (OD):</span> {prescription.prescription_data.sphere_od}
                                      </div>
                                    )}
                                    {prescription.prescription_data.cylinder_od && (
                                      <div>
                                        <span className="font-medium">Cylinder (OD):</span> {prescription.prescription_data.cylinder_od}
                                      </div>
                                    )}
                                    {prescription.prescription_data.axis_od && (
                                      <div>
                                        <span className="font-medium">Axis (OD):</span> {prescription.prescription_data.axis_od}°
                                      </div>
                                    )}
                                    {prescription.prescription_data.add_od && (
                                      <div>
                                        <span className="font-medium">Add (OD):</span> {prescription.prescription_data.add_od}
                                      </div>
                                    )}
                                    {prescription.prescription_data.sphere_os && (
                                      <div>
                                        <span className="font-medium">Sphere (OS):</span> {prescription.prescription_data.sphere_os}
                                      </div>
                                    )}
                                    {prescription.prescription_data.cylinder_os && (
                                      <div>
                                        <span className="font-medium">Cylinder (OS):</span> {prescription.prescription_data.cylinder_os}
                                      </div>
                                    )}
                                    {prescription.prescription_data.axis_os && (
                                      <div>
                                        <span className="font-medium">Axis (OS):</span> {prescription.prescription_data.axis_os}°
                                      </div>
                                    )}
                                    {prescription.prescription_data.add_os && (
                                      <div>
                                        <span className="font-medium">Add (OS):</span> {prescription.prescription_data.add_os}
                                      </div>
                                    )}
                                    {prescription.prescription_data.pd && (
                                      <div>
                                        <span className="font-medium">PD:</span> {prescription.prescription_data.pd}mm
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h4 className="font-medium text-sm mb-1">Optometrist:</h4>
                                <p className="text-sm text-gray-600">{prescription.optometrist?.name || 'Unknown'}</p>
                              </div>

                              {prescription.notes && (
                                <div>
                                  <h4 className="font-medium text-sm mb-1">Notes:</h4>
                                  <p className="text-sm text-gray-600">{prescription.notes}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="default">
                Order New Glasses
              </Button>
              <Button className="w-full" variant="outline">
                Order Contact Lenses
              </Button>
              <Button className="w-full" variant="outline">
                Schedule Eye Exam
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prescription Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Prescriptions</span>
                  <Badge variant="secondary">
                    {prescriptions.filter(p => p.status === 'active').length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Expiring Soon</span>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    {prescriptions.filter(p => {
                      const daysUntilExpiry = Math.ceil(
                        (new Date(p.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                      );
                      return daysUntilExpiry <= 30 && p.status === 'active';
                    }).length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Prescriptions</span>
                  <Badge variant="secondary">
                    {prescriptions.length}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download All Prescriptions
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomerPrescriptions;
