import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'customer' | 'staff' | 'admin' | 'optometrist'>('customer');
  const [isLoading, setIsLoading] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Starting login with:', { email, password, role });
      const loggedIn = await login(email, password, role);
      console.log('Login response (normalized):', loggedIn);
      
      // Use normalized role from login response - prioritize the role from loggedIn user
      const roleFromResponse = (loggedIn as any)?.role;
      const roleName = roleFromResponse ? String(roleFromResponse).toLowerCase() : String(role).toLowerCase();
      console.log('Role from API response:', roleFromResponse);
      console.log('Selected role in form:', role);
      console.log('Final role name:', roleName);

      toast({
        title: "Login successful",
        description: `Welcome back! Redirecting to your ${roleName} dashboard.`,
      });

      // Use the role from the successful login response
      const destRole = roleName;
      console.log('Destination role:', destRole);
      console.log('Navigating to:', `/${destRole}/dashboard`);
      
      // Navigate immediately after successful login
      console.log('Navigating immediately to:', `/${destRole}/dashboard`);
      navigate(`/${destRole}/dashboard`, { replace: true });
    } catch (error: any) {
      console.error('Login error:', error);
      const apiMsg = error?.response?.data?.message;
      toast({
        title: "Login failed",
        description: apiMsg === 'Account pending admin approval' 
          ? 'Your account is pending admin approval. Please try again later.'
          : (error instanceof Error ? error.message : "Please check your credentials and try again."),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (user && window.location.pathname === '/login') {
      const roleStr = String(user.role).toLowerCase();
      console.log('Login useEffect: User already logged in, user role:', user.role);
      console.log('Login useEffect: Redirecting to:', `/${roleStr}/dashboard`);
      navigate(`/${roleStr}/dashboard`, { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      {/* Header with FAQ button */}
      <div className="absolute top-4 right-4">
        <Button variant="outline" asChild>
          <Link to="/faq">
            <HelpCircle className="h-4 w-4 mr-2" />
            FAQ
          </Link>
        </Button>
      </div>
      
      <Card className="w-full max-w-sm shadow-sm border border-gray-200">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-xl font-semibold text-gray-900">Sign In</CardTitle>
          <CardDescription className="text-gray-600">
            Access your account
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="role" className="text-sm text-gray-700">Role</Label>
              <select
                id="role"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
              >
                <option value="customer">Customer</option>
                <option value="staff">Staff</option>
                <option value="optometrist">Optometrist</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="email" className="text-sm text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-sm text-gray-700">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Don't have an account? </span>
            <Link to="/register" className="text-blue-600 hover:text-blue-700">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
