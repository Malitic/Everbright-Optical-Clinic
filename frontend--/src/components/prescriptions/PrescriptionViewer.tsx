import React, { useState } from 'react';
import { Download, Eye, FileText, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface Prescription {
  id: string;
  date: string;
  optometrist: string;
  type: 'glasses' | 'contact_lenses';
  status: 'active' | 'expired' | 'filled';
  rightEye: {
    sphere: string;
    cylinder: string;
    axis: string;
    add?: string;
  };
  leftEye: {
    sphere: string;
    cylinder: string;
    axis: string;
    add?: string;
  };
  notes?: string;
  expiryDate: string;
}

const PrescriptionViewer = () => {
  const { toast } = useToast();
  const [selectedPrescription, setSelectedPrescription] = useState<string | null>(null);

  const prescriptions: Prescription[] = [
    {
      id: 'RX-2024-001',
      date: '2024-01-15',
      optometrist: 'Dr. Sarah Johnson',
      type: 'glasses',
      status: 'active',
      rightEye: { sphere: '-2.25', cylinder: '-0.50', axis: '90' },
      leftEye: { sphere: '-2.00', cylinder: '-0.75', axis: '85' },
      notes: 'Progressive lenses recommended for computer work',
      expiryDate: '2025-01-15'
    },
    {
      id: 'RX-2023-045',
      date: '2023-01-20',
      optometrist: 'Dr. Michael Chen',
      type: 'contact_lenses',
      status: 'expired',
      rightEye: { sphere: '-2.00', cylinder: '-0.25', axis: '95' },
      leftEye: { sphere: '-1.75', cylinder: '-0.50', axis: '90' },
      expiryDate: '2024-01-20'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500 text-white';
      case 'expired': return 'bg-red-500 text-white';
      case 'filled': return 'bg-blue-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  const handleDownload = (prescriptionId: string) => {
    toast({
      title: "Download Started",
      description: `Downloading prescription ${prescriptionId} as PDF...`
    });
    // Mock download functionality
  };

  const PrescriptionDetails = ({ prescription }: { prescription: Prescription }) => (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Prescription Details</span>
            </CardTitle>
            <CardDescription>ID: {prescription.id}</CardDescription>
          </div>
          <Badge className={getStatusColor(prescription.status)}>
            {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-muted-foreground">PRESCRIPTION INFO</h4>
            <div className="space-y-1">
              <p><span className="font-medium">Date Issued:</span> {prescription.date}</p>
              <p><span className="font-medium">Optometrist:</span> {prescription.optometrist}</p>
              <p><span className="font-medium">Type:</span> {prescription.type.replace('_', ' ').toUpperCase()}</p>
              <p><span className="font-medium">Expires:</span> {prescription.expiryDate}</p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-semibold text-center">RIGHT EYE (OD)</h4>
            <div className="space-y-2 text-center">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">SPH</p>
                  <p className="font-mono text-lg">{prescription.rightEye.sphere}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">CYL</p>
                  <p className="font-mono text-lg">{prescription.rightEye.cylinder}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">AXIS</p>
                  <p className="font-mono text-lg">{prescription.rightEye.axis}°</p>
                </div>
              </div>
              {prescription.rightEye.add && (
                <div className="text-center">
                  <p className="font-medium text-muted-foreground">ADD</p>
                  <p className="font-mono text-lg">{prescription.rightEye.add}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-center">LEFT EYE (OS)</h4>
            <div className="space-y-2 text-center">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">SPH</p>
                  <p className="font-mono text-lg">{prescription.leftEye.sphere}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">CYL</p>
                  <p className="font-mono text-lg">{prescription.leftEye.cylinder}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">AXIS</p>
                  <p className="font-mono text-lg">{prescription.leftEye.axis}°</p>
                </div>
              </div>
              {prescription.leftEye.add && (
                <div className="text-center">
                  <p className="font-medium text-muted-foreground">ADD</p>
                  <p className="font-mono text-lg">{prescription.leftEye.add}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {prescription.notes && (
          <>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2">Additional Notes</h4>
              <p className="text-muted-foreground">{prescription.notes}</p>
            </div>
          </>
        )}

        <div className="flex space-x-2">
          <Button 
            onClick={() => handleDownload(prescription.id)} 
            variant="customer" 
            className="flex-1"
          >
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Eye className="h-6 w-6 text-customer" />
            <CardTitle>My Prescriptions</CardTitle>
          </div>
          <CardDescription>
            View and download your digital prescriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {prescriptions.map((prescription) => (
              <div key={prescription.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="font-semibold">{prescription.id}</h3>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          {prescription.date}
                        </span>
                        <span className="flex items-center">
                          <User className="mr-1 h-3 w-3" />
                          {prescription.optometrist}
                        </span>
                      </div>
                    </div>
                    <Badge className={getStatusColor(prescription.status)}>
                      {prescription.status.charAt(0).toUpperCase() + prescription.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPrescription(
                        selectedPrescription === prescription.id ? null : prescription.id
                      )}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      {selectedPrescription === prescription.id ? 'Hide' : 'View'}
                    </Button>
                    <Button
                      variant="customer"
                      size="sm"
                      onClick={() => handleDownload(prescription.id)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>
                
                {selectedPrescription === prescription.id && (
                  <PrescriptionDetails prescription={prescription} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrescriptionViewer;
