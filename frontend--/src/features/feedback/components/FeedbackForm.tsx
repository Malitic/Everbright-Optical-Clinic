import React, { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, MessageSquare, Send, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface FeedbackFormProps {
  onFeedbackSubmitted?: (feedback: any) => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ onFeedbackSubmitted }) => {
  const [feedback, setFeedback] = useState({
    type: 'service',
    rating: 0,
    satisfaction: '',
    service_quality: '',
    staff_friendliness: '',
    wait_time: '',
    facility_cleanliness: '',
    appointment_booking: '',
    product_quality: '',
    overall_experience: '',
    comments: '',
    name: '',
    email: '',
    phone: '',
    visit_date: '',
    branch: '',
    would_recommend: '',
    improvement_suggestions: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const feedbackTypes = [
    { value: 'service', label: 'Service Experience' },
    { value: 'product', label: 'Product Quality' },
    { value: 'appointment', label: 'Appointment Booking' },
    { value: 'staff', label: 'Staff Interaction' },
    { value: 'facility', label: 'Facility & Environment' },
    { value: 'general', label: 'General Feedback' }
  ];

  const ratingLabels = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent'
  };

  const satisfactionOptions = [
    { value: 'very_satisfied', label: 'Very Satisfied' },
    { value: 'satisfied', label: 'Satisfied' },
    { value: 'neutral', label: 'Neutral' },
    { value: 'dissatisfied', label: 'Dissatisfied' },
    { value: 'very_dissatisfied', label: 'Very Dissatisfied' }
  ];

  const branches = [
    { value: 'unitop', label: 'UNITOP Mall Branch' },
    { value: 'newstar', label: 'NEWSTAR Mall Branch' },
    { value: 'garnet', label: 'Garnet Street Branch' },
    { value: 'balibago', label: 'Balibago Branch' }
  ];

  const handleRatingChange = (rating: number) => {
    setFeedback({ ...feedback, rating });
  };

  const handleInputChange = (field: string, value: string) => {
    setFeedback({ ...feedback, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (feedback.rating === 0) {
      toast.error('Please provide a rating');
      return;
    }

    if (!feedback.comments.trim()) {
      toast.error('Please provide your feedback comments');
      return;
    }

    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, you would send this to your backend
      console.log('Feedback submitted:', feedback);
      
      toast.success('Thank you for your feedback!');
      setSubmitted(true);
      
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted(feedback);
      }
    } catch (error) {
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStarRating = () => (
    <div className="space-y-2">
      <Label>Overall Rating *</Label>
      <div className="flex items-center space-x-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRatingChange(star)}
            className={`p-1 transition-colors ${
              star <= feedback.rating
                ? 'text-yellow-400 hover:text-yellow-500'
                : 'text-gray-300 hover:text-gray-400'
            }`}
          >
            <Star className="h-8 w-8 fill-current" />
          </button>
        ))}
        {feedback.rating > 0 && (
          <span className="ml-2 text-sm text-gray-600">
            {ratingLabels[feedback.rating as keyof typeof ratingLabels]}
          </span>
        )}
      </div>
    </div>
  );

  const renderSatisfactionSection = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Service Quality Assessment</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Service Quality</Label>
          <Select value={feedback.service_quality} onValueChange={(value) => handleInputChange('service_quality', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select rating" />
            </SelectTrigger>
            <SelectContent>
              {satisfactionOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Staff Friendliness</Label>
          <Select value={feedback.staff_friendliness} onValueChange={(value) => handleInputChange('staff_friendliness', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select rating" />
            </SelectTrigger>
            <SelectContent>
              {satisfactionOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Wait Time</Label>
          <Select value={feedback.wait_time} onValueChange={(value) => handleInputChange('wait_time', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select rating" />
            </SelectTrigger>
            <SelectContent>
              {satisfactionOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Facility Cleanliness</Label>
          <Select value={feedback.facility_cleanliness} onValueChange={(value) => handleInputChange('facility_cleanliness', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select rating" />
            </SelectTrigger>
            <SelectContent>
              {satisfactionOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  if (submitted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-600 text-center mb-6">
            Your feedback has been submitted successfully. We appreciate you taking the time to share your experience with us.
          </p>
          <Button onClick={() => setSubmitted(false)} variant="outline">
            Submit Another Feedback
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="h-6 w-6" />
          <span>Customer Feedback Form</span>
        </CardTitle>
        <CardDescription>
          Help us improve our services by sharing your experience with Everbright Optical Clinic
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Feedback Type */}
          <div className="space-y-2">
            <Label>Feedback Type *</Label>
            <Select value={feedback.type} onValueChange={(value) => handleInputChange('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select feedback type" />
              </SelectTrigger>
              <SelectContent>
                {feedbackTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Overall Rating */}
          {renderStarRating()}

          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Your Information (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={feedback.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={feedback.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="your.email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={feedback.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Your phone number"
                />
              </div>
              <div className="space-y-2">
                <Label>Visit Date</Label>
                <Input
                  type="date"
                  value={feedback.visit_date}
                  onChange={(e) => handleInputChange('visit_date', e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Branch Visited</Label>
                <Select value={feedback.branch} onValueChange={(value) => handleInputChange('branch', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map(branch => (
                      <SelectItem key={branch.value} value={branch.value}>
                        {branch.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Service Quality Assessment */}
          {renderSatisfactionSection()}

          {/* Recommendation */}
          <div className="space-y-2">
            <Label>Would you recommend us to others? *</Label>
            <RadioGroup value={feedback.would_recommend} onValueChange={(value) => handleInputChange('would_recommend', value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="recommend-yes" />
                <Label htmlFor="recommend-yes" className="flex items-center space-x-2">
                  <ThumbsUp className="h-4 w-4 text-green-500" />
                  <span>Yes, I would recommend</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="recommend-no" />
                <Label htmlFor="recommend-no" className="flex items-center space-x-2">
                  <ThumbsDown className="h-4 w-4 text-red-500" />
                  <span>No, I would not recommend</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <Label>Your Comments *</Label>
            <Textarea
              value={feedback.comments}
              onChange={(e) => handleInputChange('comments', e.target.value)}
              placeholder="Please share your detailed feedback about your experience..."
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Improvement Suggestions */}
          <div className="space-y-2">
            <Label>Suggestions for Improvement</Label>
            <Textarea
              value={feedback.improvement_suggestions}
              onChange={(e) => handleInputChange('improvement_suggestions', e.target.value)}
              placeholder="Any suggestions on how we can improve our services?"
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={loading} className="min-w-32">
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Submitting...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Send className="h-4 w-4" />
                  <span>Submit Feedback</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default FeedbackForm;
