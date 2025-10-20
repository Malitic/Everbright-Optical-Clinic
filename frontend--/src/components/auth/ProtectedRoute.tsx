import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  console.log('ProtectedRoute: Checking access', { 
    user: user ? { id: user.id, role: user.role, name: user.name } : null, 
    isLoading, 
    allowedRoles 
  });

  if (isLoading) {
    console.log('ProtectedRoute: Still loading, showing loading indicator');
    // Optionally, render a loading indicator while auth state is loading
    return <div>Loading...</div>;
  }

  if (!user) {
    console.log('ProtectedRoute: No user, redirecting to login');
    // Not logged in, redirect to login page
    return <Navigate to="/login" replace />;
  }

  console.log('ProtectedRoute: User role:', user.role, 'Type:', typeof user.role, 'Allowed roles:', allowedRoles);
  const userRole = String(user.role).toLowerCase();
  const allowedRolesLower = allowedRoles.map(role => String(role).toLowerCase());
  console.log('ProtectedRoute: Normalized user role:', userRole, 'Normalized allowed roles:', allowedRolesLower);
  
  if (!allowedRolesLower.includes(userRole)) {
    console.log('ProtectedRoute: Role not authorized, redirecting to user dashboard');
    // Logged in but role not authorized, redirect to their dashboard
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  console.log('ProtectedRoute: Access granted, rendering children');
  // Authorized, render children
  return <>{children}</>;
};

export default ProtectedRoute;
