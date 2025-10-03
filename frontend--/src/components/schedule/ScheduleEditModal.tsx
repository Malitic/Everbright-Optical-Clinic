import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Edit, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { submitScheduleChangeRequest, updateScheduleDirectly, getAllOptometrists } from '@/services/scheduleApi';
import { getActiveBranches } from '@/services/branchApi';

interface ScheduleEditModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  dayOfWeek: number;
  currentSchedule?: {
    branch_id: number | null;
    start_time: string | null;
    end_time: string | null;
  };
  onSuccess?: () => void;
}

interface Branch {
  id: number;
  name: string;
  code: string;
}

const ScheduleEditModal: React.FC<ScheduleEditModalProps> = ({
  isOpen,
  onOpenChange,
  dayOfWeek,
  currentSchedule,
  onSuccess
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [formData, setFormData] = useState({
    branch_id: currentSchedule?.branch_id || null,
    start_time: currentSchedule?.start_time || '',
    end_time: currentSchedule?.end_time || '',
    reason: ''
  });

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const currentDayName = dayNames[dayOfWeek - 1];

  // Load branches on mount
  useEffect(() => {
    const loadBranches = async () => {
      try {
        setBranchesLoading(true);
        const branchesData = await getActiveBranches();
        setBranches(Array.isArray(branchesData) ? branchesData : []);
      } catch (error) {
        console.error('Error loading branches:', error);
        // Don't show error toast for branch loading since it's not critical for the modal
        // Just set empty branches array and continue
        setBranches([]);
      } finally {
        setBranchesLoading(false);
      }
    };
    loadBranches();
  }, []);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        branch_id: currentSchedule?.branch_id || null,
        start_time: currentSchedule?.start_time || '',
        end_time: currentSchedule?.end_time || '',
        reason: ''
      });
    }
  }, [isOpen, currentSchedule]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if branches are available for selection
    if (isAvailable && branches.length === 0) {
      toast({
        title: "Branches Not Available",
        description: "Unable to load branch information. Please contact your administrator.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.start_time || !formData.end_time) {
      toast({
        title: "Validation Error",
        description: "Please provide both start and end times",
        variant: "destructive",
      });
      return;
    }

    if (formData.start_time >= formData.end_time) {
      toast({
        title: "Validation Error",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (user?.role === 'admin') {
        // Admin can update directly
        await updateScheduleDirectly(
          user.id,
          dayOfWeek,
          formData.branch_id,
          formData.start_time,
          formData.end_time
        );
        
        toast({
          title: "Schedule Updated",
          description: `Schedule for ${currentDayName} has been updated successfully`,
        });
      } else {
        // Optometrist needs to submit a request
        if (!formData.reason.trim()) {
          toast({
            title: "Validation Error",
            description: "Please provide a reason for the schedule change",
            variant: "destructive",
          });
          return;
        }

        await submitScheduleChangeRequest({
          optometrist_id: user?.id || 0,
          day_of_week: dayOfWeek,
          branch_id: formData.branch_id,
          start_time: formData.start_time,
          end_time: formData.end_time,
          reason: formData.reason
        });

        toast({
          title: "Change Request Submitted",
          description: `Schedule change request for ${currentDayName} has been submitted for admin approval. You'll be notified when it's reviewed.`,
        });
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating schedule:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update schedule",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isAvailable = formData.branch_id !== null;
  const selectedBranch = branches.find(b => b.id === formData.branch_id);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Edit className="h-5 w-5" />
            <span>Edit {currentDayName} Schedule</span>
          </DialogTitle>
          <DialogDescription>
            {user?.role === 'admin' 
              ? 'Update the schedule directly' 
              : 'Request a schedule change (requires admin approval)'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Availability Toggle */}
          <div className="space-y-2">
            <Label>Availability</Label>
            <div className="flex items-center space-x-4">
              <Button
                type="button"
                variant={isAvailable ? "default" : "outline"}
                size="sm"
                onClick={() => handleInputChange('branch_id', isAvailable ? null : 1)}
              >
                Available
              </Button>
              <Button
                type="button"
                variant={!isAvailable ? "default" : "outline"}
                size="sm"
                onClick={() => handleInputChange('branch_id', null)}
              >
                Not Available
              </Button>
            </div>
          </div>

          {/* Branch Selection */}
          {isAvailable && (
            <div className="space-y-2">
              <Label htmlFor="branch">Branch</Label>
              {branchesLoading ? (
                <div className="p-3 text-center text-sm text-gray-500">
                  Loading branches...
                </div>
              ) : branches.length === 0 ? (
                <div className="p-3 text-center text-sm text-gray-500 border rounded-md">
                  Branches not available. Please contact your administrator.
                </div>
              ) : (
                <Select
                  value={formData.branch_id?.toString() || ''}
                  onValueChange={(value) => handleInputChange('branch_id', value ? parseInt(value) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span>{branch.name} ({branch.code})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Time Selection */}
          {isAvailable && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => handleInputChange('start_time', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">End Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => handleInputChange('end_time', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Reason (for optometrist) */}
          {user?.role === 'optometrist' && (
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Change</Label>
              <Textarea
                id="reason"
                placeholder="Please explain why you need to change this schedule..."
                value={formData.reason}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                rows={3}
                required
              />
            </div>
          )}

          {/* Preview */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">Preview</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{currentDayName}</span>
                </div>
                {isAvailable ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{selectedBranch?.name || (branches.length === 0 ? 'Branches not available' : 'Select a branch')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        {formData.start_time} - {formData.end_time}
                      </span>
                    </div>
                    <Badge variant="default" className="text-xs">Available</Badge>
                  </>
                ) : (
                  <Badge variant="secondary" className="text-xs">Not Available</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {user?.role === 'admin' ? 'Update Schedule' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleEditModal;
