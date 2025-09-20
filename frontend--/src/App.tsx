import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Login from "@/components/auth/Login";
import Register from "@/components/auth/Register";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CustomerDashboard from "@/components/dashboard/CustomerDashboard";
import OptometristDashboard from "@/components/dashboard/OptometristDashboard";
import StaffDashboard from "@/components/dashboard/StaffDashboard";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import AppointmentBooking from "@/components/appoinments/AppointmentBooking";
import PrescriptionViewer from "@/components/prescriptions/PrescriptionViewer";
import InventoryManagement from "@/components/inventory/InventoryManagement";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import PatientManagement from "@/components/patients/PatientManagement";
import AnalyticsDashboard from "@/components/analytics/AnalyticsDashboard";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Customer Components
import CustomerAppointments from "@/features/customer/components/CustomerAppointments";
import CustomerVisionHistory from "@/features/customer/components/CustomerVisionHistory";
import CustomerPrescriptions from "@/features/customer/components/CustomerPrescriptions";
import CustomerReceipts from "@/features/customer/components/CustomerReceipts";
import { CustomerAppointmentsLocalStorage } from "@/features/customer/components/CustomerAppointmentsLocalStorage";
import { CustomerPrescriptionsLocalStorage } from "@/features/customer/components/CustomerPrescriptionsLocalStorage";

// Product Components
import ProductGallery from "@/features/products/components/ProductGallery";
import ProductDetails from "@/features/products/components/ProductDetails";
import ReservationList from "@/features/products/components/ReservationList";
import { ProductGalleryLocalStorage } from "@/features/products/components/ProductGalleryLocalStorage";
import { ProductGallerySimple } from "@/features/products/components/ProductGallerySimple";
import { ProductGalleryDatabase } from "@/features/products/components/ProductGalleryDatabase";
import { ProductGalleryTest } from "@/features/products/components/ProductGalleryTest";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Optometrist Components
import OptometristAppointments from "@/features/appointments/components/OptometristAppointments";
import OptometristPatientRecords from "@/features/patients/components/OptometristPatientRecords";
import OptometristPrescriptionManagement from "@/features/prescriptions/components/OptometristPrescriptionManagement";
import OptometristInventoryView from "@/features/inventory/components/OptometristInventoryView";
import OptometristReceiptGeneration from "@/features/receipts/components/OptometristReceiptGeneration";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Customer Routes */}
            <Route path="/customer" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<CustomerDashboard />} />
              <Route path="appointments" element={<CustomerAppointmentsLocalStorage />} />
              <Route path="history" element={<CustomerVisionHistory />} />
              <Route path="prescriptions" element={<CustomerPrescriptionsLocalStorage />} />
              <Route path="receipts" element={<CustomerReceipts />} />
              <Route path="notifications" element={<NotificationCenter />} />
              <Route path="products" element={<ProductGalleryDatabase />} />
              <Route path="products/:productId" element={<ProductDetails />} />
              <Route path="reservations" element={<ReservationList />} />
            </Route>

            {/* Optometrist Routes */}
            <Route path="/optometrist" element={
              <ProtectedRoute allowedRoles={['optometrist']}>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<OptometristDashboard />} />
              <Route path="appointments" element={<OptometristAppointments />} />
              <Route path="patients" element={<OptometristPatientRecords />} />
              <Route path="prescriptions" element={<OptometristPrescriptionManagement />} />
              <Route path="inventory" element={<OptometristInventoryView />} />
              <Route path="receipts" element={<OptometristReceiptGeneration />} />
            </Route>

            {/* Staff Routes */}
            <Route path="/staff" element={
              <ProtectedRoute allowedRoles={['staff']}>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<StaffDashboard />} />
              <Route path="appointments" element={<AppointmentBooking />} />
              <Route path="products" element={
                <ErrorBoundary>
                  <ProductGalleryDatabase />
                </ErrorBoundary>
              } />
              <Route path="inventory" element={<InventoryManagement />} />
              <Route path="patients" element={<PatientManagement />} />
              <Route path="notifications" element={<NotificationCenter />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="analytics" element={<AnalyticsDashboard />} />
              <Route path="users" element={<PatientManagement />} />
              <Route path="inventory" element={<InventoryManagement />} />
              <Route path="products" element={
                <ErrorBoundary>
                  <ProductGalleryDatabase />
                </ErrorBoundary>
              } />
              <Route path="notifications" element={<NotificationCenter />} />
              <Route path="patients" element={<PatientManagement />} />
              <Route path="sales" element={<AnalyticsDashboard />} />
            </Route>

            {/* Redirects */}
            <Route path="/customer" element={<Navigate to="/customer/dashboard" replace />} />
            <Route path="/optometrist" element={<Navigate to="/optometrist/dashboard" replace />} />
            <Route path="/staff" element={<Navigate to="/staff/dashboard" replace />} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
