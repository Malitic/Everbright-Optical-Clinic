import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface PrescriptionFormProps {
  appointment: {
    id: number;
    patient: {
      id: number;
      name: string;
    };
    appointment_date: string;
    start_time: string;
    type: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

interface EyeData {
  sphere: string;
  cylinder: string;
  axis: string;
  pd: string;
  add: string;
}

const PrescriptionForm: React.FC<PrescriptionFormProps> = ({ appointment, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [rightEye, setRightEye] = useState<EyeData>({
    sphere: '',
    cylinder: '',
    axis: '',
    pd: '',
    add: ''
  });
  const [leftEye, setLeftEye] = useState<EyeData>({
    sphere: '',
    cylinder: '',
    axis: '',
    pd: '',
    add: ''
  });
  const [formData, setFormData] = useState({
    vision_acuity: '',
    additional_notes: '',
    recommendations: '',
    lens_type: '',
    coating: '',
    follow_up_date: '',
    follow_up_notes: ''
  });

  // Condition tracking state
  const [condition, setCondition] = useState('');
  const [trackable, setTrackable] = useState(false);
  const [progressStatus, setProgressStatus] = useState('');
  const [progressNotes, setProgressNotes] = useState('');
  const [referralNotes, setReferralNotes] = useState('');
  const [suggestedCondition, setSuggestedCondition] = useState('');

  const handleEyeDataChange = (eye: 'right' | 'left', field: keyof EyeData, value: string) => {
    if (eye === 'right') {
      setRightEye(prev => ({ ...prev, [field]: value }));
    } else {
      setLeftEye(prev => ({ ...prev, [field]: value }));
    }
  };

  // Helper function to parse visual acuity (e.g., "20/40" -> 40)
  const parseVisualAcuity = (va: string): number => {
    if (!va) return 20; // Default to 20/20 if empty
    const match = va.match(/20\/(\d+)/);
    return match ? parseInt(match[1]) : 20;
  };

  // Auto-detection logic based on prescription inputs
  useEffect(() => {
    const sphLeft = parseFloat(leftEye.sphere) || 0;
    const sphRight = parseFloat(rightEye.sphere) || 0;
    const cylLeft = parseFloat(leftEye.cylinder) || 0;
    const cylRight = parseFloat(rightEye.cylinder) || 0;
    const addLeft = parseFloat(leftEye.add) || 0;
    const addRight = parseFloat(rightEye.add) || 0;
    
    // Parse visual acuity for amblyopia detection
    const vaLeft = parseVisualAcuity(formData.vision_acuity);
    const vaRight = parseVisualAcuity(formData.vision_acuity);
    
    // Only suggest if we have some prescription data
    if (!leftEye.sphere && !rightEye.sphere && !leftEye.cylinder && !rightEye.cylinder && !leftEye.add && !rightEye.add && !formData.vision_acuity) {
      setSuggestedCondition('');
      return;
    }

    let suggestion = "";

    // Enhanced Auto-detection logic based on prescription values
    
    // 1. Check for Amblyopia based on visual acuity differences
    if (formData.vision_acuity) {
      // For now, we'll use a simplified approach since we have one VA field
      // In a real system, you'd have separate OD and OS VA fields
      if (vaLeft > 40 || vaRight > 40) {
        suggestion = "Amblyopia";
      }
    }
    
    // 2. Enhanced Anisometropia detection
    if (!suggestion && (Math.abs(sphLeft - sphRight) >= 2.00 || Math.abs(cylLeft - cylRight) >= 2.00)) {
      suggestion = "Anisometropia";
    }
    
    // 3. Check for Presbyopia
    if (!suggestion && (addLeft >= 1.00 || addRight >= 1.00)) {
      suggestion = "Presbyopia";
    }
    
    // 4. Check for Myopia
    if (!suggestion && (sphLeft <= -0.50 || sphRight <= -0.50)) {
      suggestion = "Myopia";
    }
    
    // 5. Check for Hyperopia
    if (!suggestion && (sphLeft >= 0.50 || sphRight >= 0.50)) {
      suggestion = "Hyperopia";
    }
    
    // 6. Check for Astigmatism
    if (!suggestion && (cylLeft <= -0.50 || cylRight <= -0.50)) {
      suggestion = "Astigmatism";
    }
    
    // 7. No significant refractive error
    if (!suggestion && sphLeft === 0 && sphRight === 0 && cylLeft === 0 && cylRight === 0 && addLeft === 0 && addRight === 0) {
      suggestion = "None";
    }
    
    // 8. Default for mild refractive errors
    if (!suggestion && (sphLeft !== 0 || sphRight !== 0 || cylLeft !== 0 || cylRight !== 0)) {
      if (Math.abs(sphLeft) > Math.abs(cylLeft) || Math.abs(sphRight) > Math.abs(cylRight)) {
        suggestion = sphLeft < 0 || sphRight < 0 ? "Myopia" : "Hyperopia";
      } else {
        suggestion = "Astigmatism";
      }
    }

    setSuggestedCondition(suggestion);
  }, [leftEye.sphere, rightEye.sphere, leftEye.cylinder, rightEye.cylinder, leftEye.add, rightEye.add, formData.vision_acuity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = sessionStorage.getItem('auth_token');
      
      // Check if token exists
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      // Get user data for logging (optional)
      const user = sessionStorage.getItem('auth_current_user');
      let userData = null;
      if (user) {
        try {
          userData = JSON.parse(user);
        } catch (parseError) {
          console.warn('Could not parse user data:', parseError);
        }
      }

      console.log('Creating prescription with token:', token.substring(0, 20) + '...');
      console.log('User data:', userData);

      // Using no-auth endpoint, no authentication test needed

      // Calculate dates based on appointment date
      const appointmentDate = new Date(appointment.appointment_date);
      const expiryDate = new Date(appointmentDate);
      expiryDate.setFullYear(expiryDate.getFullYear() + 2); // Prescriptions typically valid for 2 years

      const requestBody = {
        appointment_id: appointment.id,
        right_eye: rightEye,
        left_eye: leftEye,
        ...formData,
        // Set issue date to appointment date (same day process)
        issue_date: appointment.appointment_date,
        expiry_date: expiryDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
        // Condition tracking data
        condition,
        trackable,
        progress_status: progressStatus,
        progress_notes: progressNotes,
        referral_notes: referralNotes
      };

      console.log('Request body:', requestBody);
      console.log('API URL:', `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/prescriptions`);

    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/prescriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorMessage = 'Failed to create prescription';
        
        // Clone the response to read it multiple times if needed
        const responseClone = response.clone();
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          console.error('Error response:', errorData);
          console.error('Full error object:', JSON.stringify(errorData, null, 2));
        } catch (parseError) {
          try {
            const errorText = await responseClone.text();
            console.error('Error text:', errorText);
            errorMessage = `HTTP ${response.status}: ${errorText}`;
          } catch (textError) {
            console.error('Could not read response as text:', textError);
            errorMessage = `HTTP ${response.status}: Unable to read error details`;
          }
        }
        
        // If it's an authentication error, provide more specific guidance
        if (response.status === 401) {
          errorMessage = `Authentication failed (401). Token may be invalid or expired. Please log out and log back in.`;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Prescription created successfully:', result);
      toast.success('Prescription created successfully');
      onSuccess();
    } catch (error: any) {
      console.error('Prescription creation error:', error);
      toast.error(error.message || 'Failed to create prescription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Eye className="h-6 w-6 text-blue-600" />
              Create Prescription
            </h2>
            <p className="text-gray-600 mt-1">
              Patient: <strong>{appointment.patient.name}</strong> | 
              Date: {appointment.appointment_date} | 
              Time: {appointment.start_time}
            </p>
          </div>
          <Button variant="ghost" onClick={onCancel}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Eye Examination Results */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Eye Examination Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Right Eye */}
              <div>
                <h3 className="text-md font-semibold mb-4 text-blue-700">Right Eye (OD)</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <Label htmlFor="right_sphere">Sphere</Label>
                    <Input
                      id="right_sphere"
                      type="number"
                      step="0.25"
                      value={rightEye.sphere}
                      onChange={(e) => handleEyeDataChange('right', 'sphere', e.target.value)}
                      placeholder="e.g., -2.50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="right_cylinder">Cylinder</Label>
                    <Input
                      id="right_cylinder"
                      type="number"
                      step="0.25"
                      value={rightEye.cylinder}
                      onChange={(e) => handleEyeDataChange('right', 'cylinder', e.target.value)}
                      placeholder="e.g., -1.25"
                    />
                  </div>
                  <div>
                    <Label htmlFor="right_axis">Axis</Label>
                    <Input
                      id="right_axis"
                      type="number"
                      min="0"
                      max="180"
                      value={rightEye.axis}
                      onChange={(e) => handleEyeDataChange('right', 'axis', e.target.value)}
                      placeholder="e.g., 90"
                    />
                  </div>
                  <div>
                    <Label htmlFor="right_add">Add</Label>
                    <Input
                      id="right_add"
                      type="number"
                      step="0.25"
                      min="0"
                      max="4.00"
                      value={rightEye.add}
                      onChange={(e) => handleEyeDataChange('right', 'add', e.target.value)}
                      placeholder="e.g., +2.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="right_pd">PD</Label>
                    <Input
                      id="right_pd"
                      type="number"
                      step="0.5"
                      value={rightEye.pd}
                      onChange={(e) => handleEyeDataChange('right', 'pd', e.target.value)}
                      placeholder="e.g., 32.5"
                    />
                  </div>
                </div>
              </div>

              {/* Left Eye */}
              <div>
                <h3 className="text-md font-semibold mb-4 text-green-700">Left Eye (OS)</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <Label htmlFor="left_sphere">Sphere</Label>
                    <Input
                      id="left_sphere"
                      type="number"
                      step="0.25"
                      value={leftEye.sphere}
                      onChange={(e) => handleEyeDataChange('left', 'sphere', e.target.value)}
                      placeholder="e.g., -2.50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="left_cylinder">Cylinder</Label>
                    <Input
                      id="left_cylinder"
                      type="number"
                      step="0.25"
                      value={leftEye.cylinder}
                      onChange={(e) => handleEyeDataChange('left', 'cylinder', e.target.value)}
                      placeholder="e.g., -1.25"
                    />
                  </div>
                  <div>
                    <Label htmlFor="left_axis">Axis</Label>
                    <Input
                      id="left_axis"
                      type="number"
                      min="0"
                      max="180"
                      value={leftEye.axis}
                      onChange={(e) => handleEyeDataChange('left', 'axis', e.target.value)}
                      placeholder="e.g., 90"
                    />
                  </div>
                  <div>
                    <Label htmlFor="left_add">Add</Label>
                    <Input
                      id="left_add"
                      type="number"
                      step="0.25"
                      min="0"
                      max="4.00"
                      value={leftEye.add}
                      onChange={(e) => handleEyeDataChange('left', 'add', e.target.value)}
                      placeholder="e.g., +2.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="left_pd">PD</Label>
                    <Input
                      id="left_pd"
                      type="number"
                      step="0.5"
                      value={leftEye.pd}
                      onChange={(e) => handleEyeDataChange('left', 'pd', e.target.value)}
                      placeholder="e.g., 32.5"
                    />
                  </div>
                </div>
              </div>

              {/* Vision Acuity */}
              <div>
                <Label htmlFor="vision_acuity">Vision Acuity</Label>
                <Input
                  id="vision_acuity"
                  value={formData.vision_acuity}
                  onChange={(e) => setFormData(prev => ({ ...prev, vision_acuity: e.target.value }))}
                  placeholder="e.g., 20/20, 20/25"
                />
              </div>

              {/* Condition */}
              <div>
                <Label htmlFor="condition">Condition {suggestedCondition && "(Suggested)"}</Label>
                <Select 
                  value={condition || suggestedCondition} 
                  onValueChange={(value) => {
                    setCondition(value);
                    const trackableConditions = [
                      "None",
                      "Other",
                      "Myopia",
                      "Hyperopia", 
                      "Astigmatism",
                      "Presbyopia",
                      "Anisometropia",
                      "Amblyopia"
                    ];
                    setTrackable(trackableConditions.includes(value));
                    // Reset dependent fields when condition changes
                    setProgressStatus('');
                    setProgressNotes('');
                    setReferralNotes('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="-- Select Condition --" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* General Options */}
                    <SelectItem value="None">None</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                    
                    {/* Trackable Conditions Group */}
                    <div className="px-2 py-1.5 text-sm font-semibold text-gray-500 border-t mt-1 pt-2">Trackable Conditions</div>
                    <SelectItem value="Myopia">Myopia</SelectItem>
                    <SelectItem value="Hyperopia">Hyperopia</SelectItem>
                    <SelectItem value="Astigmatism">Astigmatism</SelectItem>
                    <SelectItem value="Presbyopia">Presbyopia</SelectItem>
                    <SelectItem value="Anisometropia">Anisometropia</SelectItem>
                    <SelectItem value="Amblyopia">Amblyopia</SelectItem>
                    
                    {/* Referral Conditions Group */}
                    <div className="px-2 py-1.5 text-sm font-semibold text-gray-500 border-t mt-1 pt-2">Referral Conditions</div>
                    <SelectItem value="Strabismus">Strabismus</SelectItem>
                    <SelectItem value="Keratoconus">Keratoconus</SelectItem>
                    <SelectItem value="Cataract">Cataract</SelectItem>
                    <SelectItem value="Glaucoma">Glaucoma</SelectItem>
                    <SelectItem value="Macular Degeneration">Macular Degeneration</SelectItem>
                    <SelectItem value="Corneal Scar/Disease">Corneal Scar/Disease</SelectItem>
                    <SelectItem value="Post-surgery / Trauma">Post-surgery / Trauma</SelectItem>
                  </SelectContent>
                </Select>
                {suggestedCondition && (
                  <p className="text-sm text-blue-600 mt-1">
                    💡 System Suggestion: {suggestedCondition}
                  </p>
                )}
              </div>

              {/* Progress Status for trackable conditions */}
              {condition && trackable && (
                <>
                  <div>
                    <Label htmlFor="progress_status">Progress Status</Label>
                    <Select 
                      value={progressStatus} 
                      onValueChange={setProgressStatus}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="-- Select Status --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Stable">Stable (no significant change)</SelectItem>
                        <SelectItem value="Clearer">Clearer (improved vision)</SelectItem>
                        <SelectItem value="Worse">Worse (declined vision)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="progress_notes">Progress Notes (Optional)</Label>
                    <Textarea
                      id="progress_notes"
                      value={progressNotes}
                      onChange={(e) => setProgressNotes(e.target.value)}
                      placeholder="Add details about stability, clarity, or worsening..."
                      rows={2}
                    />
                  </div>
                </>
              )}

              {/* Referral Notes for non-trackable conditions */}
              {condition && !trackable && (
                <div>
                  <Label htmlFor="referral_notes">Referral Notes</Label>
                  <Textarea
                    id="referral_notes"
                    value={referralNotes}
                    onChange={(e) => setReferralNotes(e.target.value)}
                    placeholder="Enter referral notes if needed"
                    rows={3}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prescription Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Prescription Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lens_type">Lens Type</Label>
                  <Select value={formData.lens_type} onValueChange={(value) => setFormData(prev => ({ ...prev, lens_type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select lens type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single Vision</SelectItem>
                      <SelectItem value="bifocal">Bifocal</SelectItem>
                      <SelectItem value="progressive">Progressive</SelectItem>
                      <SelectItem value="reading">Reading</SelectItem>
                      <SelectItem value="computer">Computer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="coating">Coating</Label>
                  <Select value={formData.coating} onValueChange={(value) => setFormData(prev => ({ ...prev, coating: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select coating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="anti_reflective">Anti-Reflective</SelectItem>
                      <SelectItem value="uv_protection">UV Protection</SelectItem>
                      <SelectItem value="blue_light">Blue Light Filter</SelectItem>
                      <SelectItem value="photochromic">Photochromic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="recommendations">Recommendations</Label>
                <Textarea
                  id="recommendations"
                  value={formData.recommendations}
                  onChange={(e) => setFormData(prev => ({ ...prev, recommendations: e.target.value }))}
                  placeholder="Enter any specific recommendations for the patient..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="additional_notes">Additional Notes</Label>
                <Textarea
                  id="additional_notes"
                  value={formData.additional_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, additional_notes: e.target.value }))}
                  placeholder="Enter any additional notes about the examination..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="follow_up_date">Follow-up Date</Label>
                  <Input
                    id="follow_up_date"
                    type="date"
                    value={formData.follow_up_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, follow_up_date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label htmlFor="follow_up_notes">Follow-up Notes</Label>
                  <Input
                    id="follow_up_notes"
                    value={formData.follow_up_notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, follow_up_notes: e.target.value }))}
                    placeholder="Follow-up instructions..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex items-center gap-2">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {loading ? 'Creating...' : 'Create Prescription'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PrescriptionForm;

