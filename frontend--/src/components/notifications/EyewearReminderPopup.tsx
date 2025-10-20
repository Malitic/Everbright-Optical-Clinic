import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Calendar, Clock, AlertTriangle, CheckCircle, X, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import EyewearConditionForm from './EyewearConditionForm';

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
  created_at: string;
}

interface EyewearReminderPopupProps {
  reminder: EyewearReminder;
  onDismiss: (reminderId: string) => void;
  onSubmitSelfCheck: (eyewearId: string, formData: any) => Promise<void>;
  onScheduleAppointment: (eyewearId: string, appointmentData: any) => Promise<void>;
}

const EyewearReminderPopup: React.FC<EyewearReminderPopupProps> = ({
  reminder,
  onDismiss,
  onSubmitSelfCheck,
  onScheduleAppointment
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showSelfCheckForm, setShowSelfCheckForm] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

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
      case 'urgent': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'high': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'medium': return <Eye className="h-5 w-5 text-yellow-500" />;
      case 'low': return <CheckCircle className="h-5 w-5 text-green-500" />;
      default: return <Eye className="h-5 w-5 text-blue-500" />;
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss(reminder.id);
    }, 300);
  };

  const handleSelfCheck = () => {
    setShowSelfCheckForm(true);
  };

  const handleScheduleAppointment = () => {
    setShowAppointmentForm(true);
  };

  const handleSelfCheckSubmit = async (formData: any) => {
    await onSubmitSelfCheck(reminder.eyewear_id, formData);
    setShowSelfCheckForm(false);
    handleDismiss();
  };

  const handleAppointmentSubmit = async (appointmentData: any) => {
    await onScheduleAppointment(reminder.eyewear_id, appointmentData);
    setShowAppointmentForm(false);
    handleDismiss();
  };

  if (!isVisible) return null;

  return (
    <>
      <Card className={`mb-4 animate-in slide-in-from-top-2 duration-300 ${getPriorityColor(reminder.priority)}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="h-5 w-5 text-orange-500" />
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  Eyewear Check Reminder
                  <Badge className={getPriorityBadgeColor(reminder.priority)}>
                    {reminder.priority.toUpperCase()}
                  </Badge>
                </CardTitle>
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(reminder.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Eyewear Info */}
            <div className="flex items-center space-x-2">
              {getPriorityIcon(reminder.priority)}
              <div>
                <span className="font-medium">{reminder.eyewear_label}</span>
                {reminder.is_overdue && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    OVERDUE
                  </Badge>
                )}
              </div>
            </div>

            {/* Assessment Info */}
            <div className="text-sm text-gray-700 bg-white p-3 rounded-md border">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <strong>Last Check:</strong><br />
                  {new Date(reminder.assessment_date).toLocaleDateString()}
                </div>
                <div>
                  <strong>Assessed By:</strong><br />
                  {reminder.assessed_by}
                </div>
              </div>
              {reminder.notes && (
                <div className="mt-2">
                  <strong>Notes:</strong> {reminder.notes}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-700">
                Choose how you'd like to proceed:
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleSelfCheck}
                  className="justify-start h-auto p-3"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div className="text-left">
                      <div className="font-medium">Quick Self-Check</div>
                      <div className="text-xs text-gray-600">
                        Answer a few questions about your eyewear condition
                      </div>
                    </div>
                  </div>
                </Button>

                <Button 
                  variant="outline" 
                  onClick={handleScheduleAppointment}
                  className="justify-start h-auto p-3"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <div className="text-left">
                      <div className="font-medium">Schedule Appointment</div>
                      <div className="text-xs text-gray-600">
                        Book a physical check with our optometrist
                      </div>
                    </div>
                  </div>
                </Button>
              </div>
            </div>

            {/* Urgency Notice */}
            {reminder.is_overdue && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">This check is overdue</span>
                </div>
                <p className="text-sm text-red-700 mt-1">
                  Please schedule an appointment as soon as possible to ensure optimal eye health.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Self-Check Form Modal */}
      {showSelfCheckForm && (
        <EyewearConditionForm
          reminder={reminder}
          onClose={() => setShowSelfCheckForm(false)}
          onSubmit={handleSelfCheckSubmit}
        />
      )}

      {/* Appointment Form Modal */}
      {showAppointmentForm && (
        <EyewearAppointmentForm
          reminder={reminder}
          onClose={() => setShowAppointmentForm(false)}
          onSubmit={handleAppointmentSubmit}
        />
      )}
    </>
  );
};

// Simple appointment form component
const EyewearAppointmentForm: React.FC<{
  reminder: EyewearReminder;
  onClose: () => void;
  onSubmit: (data: any) => void;
}> = ({ reminder, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    appointment_date: '',
    preferred_time: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Schedule Eyewear Check</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Book an appointment for your eyewear condition check
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Preferred Date</label>
              <input
                type="date"
                value={formData.appointment_date}
                onChange={(e) => setFormData(prev => ({ ...prev, appointment_date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="w-full mt-1 p-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Preferred Time</label>
              <select
                value={formData.preferred_time}
                onChange={(e) => setFormData(prev => ({ ...prev, preferred_time: e.target.value }))}
                className="w-full mt-1 p-2 border rounded-md"
                required
              >
                <option value="">Select time</option>
                <option value="09:00">9:00 AM</option>
                <option value="10:00">10:00 AM</option>
                <option value="11:00">11:00 AM</option>
                <option value="14:00">2:00 PM</option>
                <option value="15:00">3:00 PM</option>
                <option value="16:00">4:00 PM</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Notes (optional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any specific concerns or details..."
                className="w-full mt-1 p-2 border rounded-md"
                rows={3}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Scheduling...' : 'Schedule Appointment'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EyewearReminderPopup;
