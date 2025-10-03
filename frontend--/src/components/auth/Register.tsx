import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, User, Lock, Mail, UserPlus, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { getActiveBranches } from '@/services/branchApi';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<'customer' | 'staff'>('customer');
  const [branch, setBranch] = useState('');
  const [approvalStatus, setApprovalStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [submittedEmail, setSubmittedEmail] = useState('');
  
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch branches
  const { data: branches = [], isLoading: branchesLoading } = useQuery({
    queryKey: ['activeBranches'],
    queryFn: getActiveBranches,
  });

  // Check approval status for submitted email
  const checkApprovalStatus = async (email: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/role-requests/status/${email}`);
      if (response.ok) {
        const data = await response.json();
        setApprovalStatus(data.status);
      }
    } catch (error) {
      console.error('Error checking approval status:', error);
    }
  };

  // Check status when email changes or component mounts
  useEffect(() => {
    if (submittedEmail) {
      checkApprovalStatus(submittedEmail);
    }
  }, [submittedEmail]);

  // Check status periodically for pending requests
  useEffect(() => {
    if (approvalStatus === 'pending') {
      const interval = setInterval(() => {
        if (submittedEmail) {
          checkApprovalStatus(submittedEmail);
        }
      }, 5000); // Check every 5 seconds

      return () => clearInterval(interval);
    }
  }, [approvalStatus, submittedEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await register(name, email, password, confirmPassword, role, branch || undefined as any);
      if (role === 'customer') {
        toast({
          title: "Registration successful",
          description: "Welcome! Redirecting to your customer dashboard.",
        });
        navigate(`/customer/dashboard`);
      } else {
        setSubmittedEmail(email);
        setApprovalStatus('pending');
        toast({
          title: "Registration submitted",
          description: "Your role request is pending admin approval. You can check your status here.",
        });
      }
    } catch (error) {
      // For non-customer roles, show waiting message instead of error
      if (role !== 'customer') {
        setSubmittedEmail(email);
        setApprovalStatus('pending');
        toast({
          title: "Registration submitted",
          description: "Your role request is pending admin approval. You can check your status here.",
        });
      } else {
        toast({
          title: "Registration failed",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-2xl transition-all duration-300">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <UserPlus className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">Create Account</CardTitle>
          <CardDescription className="text-slate-600">
            Join our optical clinic platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Status Check Section */}
          {!submittedEmail && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Check Your Request Status</h3>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email to check status"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (email) {
                      setSubmittedEmail(email);
                      checkApprovalStatus(email);
                    }
                  }}
                  disabled={!email}
                >
                  Check
                </Button>
              </div>
            </div>
          )}

          {/* Approval Status Display */}
          {approvalStatus !== 'none' && submittedEmail && (
            <Alert className={`mb-4 ${
              approvalStatus === 'approved' ? 'border-green-200 bg-green-50' :
              approvalStatus === 'pending' ? 'border-yellow-200 bg-yellow-50' :
              'border-red-200 bg-red-50'
            }`}>
              {approvalStatus === 'approved' && <CheckCircle className="h-4 w-4 text-green-600" />}
              {approvalStatus === 'pending' && <Clock className="h-4 w-4 text-yellow-600" />}
              {approvalStatus === 'rejected' && <AlertCircle className="h-4 w-4 text-red-600" />}
              <AlertDescription className={
                approvalStatus === 'approved' ? 'text-green-800' :
                approvalStatus === 'pending' ? 'text-yellow-800' :
                'text-red-800'
              }>
                {approvalStatus === 'approved' && (
                  <>
                    <strong>Account Approved!</strong><br />
                    Your role request has been approved. You can now sign in to access the system.
                  </>
                )}
                {approvalStatus === 'pending' && (
                  <>
                    <strong>Request Pending</strong><br />
                    Your role request is under review. Please wait for admin approval.
                  </>
                )}
                {approvalStatus === 'rejected' && (
                  <>
                    <strong>Request Rejected</strong><br />
                    Your role request was not approved. Please contact admin for more information.
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Reset Button */}
          {submittedEmail && (
            <div className="mb-4 text-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSubmittedEmail('');
                  setApprovalStatus('none');
                  setEmail('');
                  setName('');
                  setPassword('');
                  setConfirmPassword('');
                  setRole('customer');
                  setBranch('');
                }}
              >
                Start New Registration
              </Button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">Desired Role</Label>
              <select 
                id="role" 
                className="w-full border rounded-md h-10 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                value={role} 
                onChange={(e) => setRole(e.target.value as any)}
              >
                <option value="customer">Customer</option>
                <option value="staff">Staff</option>
              </select>
            </div>

            {role === 'staff' && (
              <div className="space-y-2">
                <Label htmlFor="branch">Designated Branch</Label>
                <select 
                  id="branch" 
                  className="w-full border rounded-md h-10 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  value={branch} 
                  onChange={(e) => setBranch(e.target.value)} 
                  required
                  disabled={branchesLoading}
                >
                  <option value="">
                    {branchesLoading ? 'Loading branches...' : 'Select a branch'}
                  </option>
                  {branches.map((branchItem) => (
                    <option key={branchItem.id} value={branchItem.id}>
                      {branchItem.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button 
              type={approvalStatus === 'approved' ? "button" : "submit"}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg" 
              disabled={isLoading || approvalStatus === 'pending'}
              onClick={approvalStatus === 'approved' ? () => navigate('/login') : undefined}
            >
              {isLoading ? "Creating account..." : 
               approvalStatus === 'pending' ? "Request Pending..." :
               approvalStatus === 'approved' ? "Account Approved - Sign In" :
               "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
