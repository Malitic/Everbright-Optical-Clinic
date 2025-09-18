import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Calendar,
  Clock,
  FileText,
  Users,
  Package,
  BarChart3,
  Settings,
  Eye,
  Receipt,
  Bell,
  UserCheck,
  Activity,
  ShoppingCart,
  TrendingUp
} from 'lucide-react';
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
import { useAuth, UserRole } from '@/contexts/AuthContext';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  description?: string;
}

const getNavItems = (role: UserRole): NavItem[] => {
  const baseItems: Record<UserRole, NavItem[]> = {
    customer: [
      {
        title: 'Dashboard',
        href: '/customer/dashboard',
        icon: Activity,
        description: 'Overview and quick actions'
      },
      {
        title: 'Book Appointment',
        href: '/customer/appointments',
        icon: Calendar,
        description: 'Schedule new appointments'
      },
      {
        title: 'Vision History',
        href: '/customer/history',
        icon: Eye,
        description: 'View your vision records'
      },
      {
        title: 'Prescriptions',
        href: '/customer/prescriptions',
        icon: FileText,
        description: 'Digital prescriptions'
      },
      {
        title: 'Products',
        href: '/customer/products',
        icon: ShoppingCart,
        description: 'Browse eye care products'
      },
      {
        title: 'Receipts',
        href: '/customer/receipts',
        icon: Receipt,
        description: 'View and download receipts'
      },
      {
        title: 'Notifications',
        href: '/customer/notifications',
        icon: Bell,
        description: 'Reminders and updates'
      }
    ],
    optometrist: [
      {
        title: 'Dashboard',
        href: '/optometrist/dashboard',
        icon: Activity,
        description: 'Daily overview'
      },
      {
        title: 'Today\'s Appointments',
        href: '/optometrist/appointments',
        icon: Clock,
        description: 'View scheduled appointments'
      },
      {
        title: 'Patient History',
        href: '/optometrist/patients',
        icon: Users,
        description: 'Medical records'
      },
      {
        title: 'Prescriptions',
        href: '/optometrist/prescriptions',
        icon: FileText,
        description: 'Create and manage prescriptions'
      },
      {
        title: 'Inventory',
        href: '/optometrist/inventory',
        icon: Package,
        description: 'View available items'
      },
      {
        title: 'Receipts',
        href: '/optometrist/receipts',
        icon: Receipt,
        description: 'Generate receipts'
      }
    ],
    staff: [
      {
        title: 'Dashboard',
        href: '/staff/dashboard',
        icon: Activity,
        description: 'Clinic overview'
      },
      {
        title: 'Appointments',
        href: '/staff/appointments',
        icon: Calendar,
        description: 'Manage appointments'
      },
      {
        title: 'Inventory',
        href: '/staff/inventory',
        icon: Package,
        description: 'Stock management'
      },
      {
        title: 'Patients',
        href: '/staff/patients',
        icon: UserCheck,
        description: 'Patient management'
      },
      {
        title: 'Notifications',
        href: '/staff/notifications',
        icon: Bell,
        description: 'Send notifications'
      }
    ],
    admin: [
      {
        title: 'Dashboard',
        href: '/admin/dashboard',
        icon: BarChart3,
        description: 'Analytics overview'
      },
      {
        title: 'Analytics',
        href: '/admin/analytics',
        icon: TrendingUp,
        description: 'Sales and performance'
      },
      {
        title: 'User Management',
        href: '/admin/users',
        icon: Users,
        description: 'Manage users and roles'
      },
      {
        title: 'Inventory',
        href: '/admin/inventory',
        icon: Package,
        description: 'Multi-branch inventory'
      },
      {
        title: 'Product Gallery Management',
        href: '/admin/products',
        icon: ShoppingCart,
        description: 'Manage eye care products'
      },
      {
        title: 'Settings',
        href: '/admin/settings',
        icon: Settings,
        description: 'System configuration'
      }
    ]
  };

  return baseItems[role] || [];
};

export const DashboardSidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const navItems = getNavItems(user.role);

  const getRoleAccentColor = (role: UserRole) => {
    const colors = {
      customer: 'border-l-customer bg-customer/5',
      optometrist: 'border-l-optometrist bg-optometrist/5',
      staff: 'border-l-staff bg-staff/5',
      admin: 'border-l-admin bg-admin/5'
    };
    return colors[role];
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-screen">
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                'hover:bg-slate-50 group',
                isActive && [
                  'border-l-4',
                  getRoleAccentColor(user.role),
                  'text-slate-900 font-semibold'
                ],
                !isActive && 'text-slate-600 hover:text-slate-900'
              )}
            >
              <item.icon className={cn(
                'h-5 w-5 transition-colors',
                isActive ? 'text-slate-700' : 'text-slate-500 group-hover:text-slate-700'
              )} />
              <div className="flex-1">
                <div>{item.title}</div>
                {item.description && (
                  <div className="text-xs text-slate-500 mt-0.5">
                    {item.description}
                  </div>
                )}
              </div>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};
