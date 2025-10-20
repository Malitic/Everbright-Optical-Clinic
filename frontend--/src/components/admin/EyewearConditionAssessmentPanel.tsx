import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Eye, Users, Send, Calendar as CalendarIcon, AlertTriangle, CheckCircle, Wrench, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { sendEyewearConditionNotification, getCustomersForAssessment, EyewearConditionAssessment } from '@/services/eyewearConditionApi';
import { useAuth } from '@/contexts/AuthContext';

interface Customer {
  id: number;
  name: string;
  email: string;
  recent_eyewear?: string;
}

const EyewearConditionAssessmentPanel: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [sending, setSending] = useState(false);
  
  const [formData, setFormData] = useState<EyewearConditionAssessment>({
    customer_id: 0,
    eyewear_label: '',
    condition: 'good',
    assessment_date: new Date().toISOString().split('T')[0],
    next_check_date: '',
    notes: '',
    assessed_by: user?.id || 0
  });

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [assessmentDate, setAssessmentDate] = useState<Date>(new Date());
  const [nextCheckDate, setNextCheckDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const customerList = await getCustomersForAssessment();
      setCustomers(customerList);
    } catch (error) {
      console.error('Failed to load customers:', error);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive"
      });
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === parseInt(customerId));
    setSelectedCustomer(customer || null);
    setFormData(prev => ({
      ...prev,
      customer_id: parseInt(customerId),
      eyewear_label: customer?.recent_eyewear || ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customer_id || !formData.eyewear_label) {
      toast({
        title: "Validation Error",
        description: "Please select a customer and enter eyewear label",
        variant: "destructive"
      });
      return;
    }

    try {
      setSending(true);
      
      const assessmentData = {
        ...formData,
        assessment_date: format(assessmentDate, 'yyyy-MM-dd'),
        next_check_date: nextCheckDate ? format(nextCheckDate, 'yyyy-MM-dd') : undefined
      };

      await sendEyewearConditionNotification(assessmentData);
      
      toast({
        title: "Success",
        description: "Eyewear condition notification sent successfully",
      });

      // Reset form
      setFormData({
        customer_id: 0,
        eyewear_label: '',
        condition: 'good',
        assessment_date: new Date().toISOString().split('T')[0],
        next_check_date: '',
        notes: '',
        assessed_by: user?.id || 0
      });
      setSelectedCustomer(null);
      setAssessmentDate(new Date());
      setNextCheckDate(undefined);
      
    } catch (error: any) {
      console.error('Failed to send notification:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to send notification",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const getConditionIcon = (condition: string) => {
    switch (condition) {
      case 'good': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'needs_fix': return <Wrench className="h-4 w-4 text-yellow-500" />;
      case 'needs_replacement': return <RefreshCw className="h-4 w-4 text-orange-500" />;
      case 'bad': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Eye className="h-4 w-4 text-blue-500" />;
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'good': return 'border-green-200 bg-green-50';
      case 'needs_fix': return 'border-yellow-200 bg-yellow-50';
      case 'needs_replacement': return 'border-orange-200 bg-orange-50';
      case 'bad': return 'border-red-200 bg-red-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Eyewear Condition Assessment</h1>
          <p className="text-gray-600">Assess and notify customers about their eyewear condition</p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-gray-500" />
          <span className="text-sm text-gray-600">{customers.length} customers</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Assessment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              New Assessment
            </CardTitle>
            <CardDescription>
              Fill out the details to send an eyewear condition notification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Customer Selection */}
              <div className="space-y-2">
                <Label htmlFor="customer">Customer</Label>
                <Select onValueChange={handleCustomerSelect} value={formData.customer_id.toString()}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <span>{customer.name}</span>
                          <span className="text-xs text-gray-500 ml-2">{customer.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCustomer && (
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    Selected: {selectedCustomer.name} ({selectedCustomer.email})
                  </div>
                )}
              </div>

              {/* Eyewear Label */}
              <div className="space-y-2">
                <Label htmlFor="eyewear_label">Eyewear Label/Description</Label>
                <Input
                  id="eyewear_label"
                  value={formData.eyewear_label}
                  onChange={(e) => setFormData(prev => ({ ...prev, eyewear_label: e.target.value }))}
                  placeholder="e.g., Ray-Ban Aviator, Progressive Lenses"
                  required
                />
              </div>

              {/* Condition */}
              <div className="space-y-2">
                <Label htmlFor="condition">Condition</Label>
                <Select 
                  value={formData.condition} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, condition: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="good">
                      <div className="flex items-center gap-2">
                        {getConditionIcon('good')}
                        <span>Good Condition</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="needs_fix">
                      <div className="flex items-center gap-2">
                        {getConditionIcon('needs_fix')}
                        <span>Needs Repair</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="needs_replacement">
                      <div className="flex items-center gap-2">
                        {getConditionIcon('needs_replacement')}
                        <span>Needs Replacement</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="bad">
                      <div className="flex items-center gap-2">
                        {getConditionIcon('bad')}
                        <span>Poor Condition</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Assessment Date */}
              <div className="space-y-2">
                <Label>Assessment Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {assessmentDate ? format(assessmentDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={assessmentDate}
                      onSelect={(date) => date && setAssessmentDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Next Check Date */}
              <div className="space-y-2">
                <Label>Next Recommended Check (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {nextCheckDate ? format(nextCheckDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={nextCheckDate}
                      onSelect={setNextCheckDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional details about the assessment..."
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={sending}>
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Notification
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Preview</CardTitle>
            <CardDescription>
              This is how the notification will appear to the customer
            </CardDescription>
          </CardHeader>
          <CardContent>
            {formData.customer_id && formData.eyewear_label ? (
              <div className={`p-4 rounded-lg border ${getConditionColor(formData.condition)}`}>
                <div className="flex items-center gap-2 mb-2">
                  {getConditionIcon(formData.condition)}
                  <span className="font-semibold">Eyewear Condition Assessment</span>
                </div>
                <div className="space-y-2 text-sm">
                  <p><strong>Eyewear:</strong> {formData.eyewear_label}</p>
                  <p><strong>Condition:</strong> {formData.condition.replace('_', ' ')}</p>
                  <p><strong>Assessment Date:</strong> {format(assessmentDate, 'PPP')}</p>
                  {nextCheckDate && (
                    <p><strong>Next Check:</strong> {format(nextCheckDate, 'PPP')}</p>
                  )}
                  {formData.notes && (
                    <p><strong>Notes:</strong> {formData.notes}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Fill out the form to see a preview</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EyewearConditionAssessmentPanel;
