import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EyewearReminder {
  id: string;
  eyewear_id: string;
  eyewear_label: string;
  next_check_date: string;
  assessment_date: string;
  assessed_by: string;
  notes?: string;
  priority: string;
  is_overdue: boolean;
}

interface EyewearConditionFormProps {
  reminder: EyewearReminder;
  onClose: () => void;
  onSubmit: (formData: any) => void;
}

const EyewearConditionForm: React.FC<EyewearConditionFormProps> = ({
  reminder,
  onClose,
  onSubmit
}) => {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    lens_clarity: '',
    frame_condition: '',
    eye_discomfort: '',
    remarks: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.lens_clarity || !formData.frame_condition || !formData.eye_discomfort) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(formData);
      
      toast({
        title: "Success",
        description: "Self-check submitted successfully",
      });
      
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit self-check",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-200 bg-red-50';
      case 'high': return 'border-orange-200 bg-orange-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-green-200 bg-green-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium': return <Eye className="h-4 w-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Eye className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getPriorityIcon(reminder.priority)}
              <CardTitle className="text-lg">Eyewear Self-Check</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Complete a quick self-assessment for your eyewear
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Reminder Info */}
          <div className={`p-3 rounded-lg border mb-4 ${getPriorityColor(reminder.priority)}`}>
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4" />
              <span className="font-medium">{reminder.eyewear_label}</span>
            </div>
            <div className="text-sm text-gray-600">
              <p>Last assessed: {new Date(reminder.assessment_date).toLocaleDateString()}</p>
              <p>Assessed by: {reminder.assessed_by}</p>
              {reminder.is_overdue && (
                <p className="text-red-600 font-medium">⚠️ This check is overdue</p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Lens Clarity */}
            <div className="space-y-2">
              <Label htmlFor="lens_clarity">How clear are your lenses?</Label>
              <Select 
                value={formData.lens_clarity} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, lens_clarity: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select lens clarity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clear">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Clear - Perfect vision</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="slightly_blurry">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-yellow-500" />
                      <span>Slightly Blurry - Minor issues</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="blurry">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span>Blurry - Noticeable problems</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="very_blurry">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span>Very Blurry - Major issues</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Frame Condition */}
            <div className="space-y-2">
              <Label htmlFor="frame_condition">How is your frame condition?</Label>
              <Select 
                value={formData.frame_condition} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, frame_condition: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frame condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Excellent - Perfect condition</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="good">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-green-500" />
                      <span>Good - Minor wear</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="loose">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span>Loose - Needs adjustment</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="damaged">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span>Damaged - Needs repair</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Eye Discomfort */}
            <div className="space-y-2">
              <Label htmlFor="eye_discomfort">Any eye discomfort?</Label>
              <Select 
                value={formData.eye_discomfort} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, eye_discomfort: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select discomfort level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>No - No discomfort</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="mild">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-yellow-500" />
                      <span>Mild - Slight discomfort</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="moderate">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span>Moderate - Noticeable discomfort</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="severe">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span>Severe - Significant discomfort</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Remarks */}
            <div className="space-y-2">
              <Label htmlFor="remarks">Additional remarks (optional)</Label>
              <Textarea
                id="remarks"
                value={formData.remarks}
                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Any additional details about your eyewear condition..."
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Submit Self-Check
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EyewearConditionForm;
