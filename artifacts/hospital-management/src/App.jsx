import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from './layouts/MainLayout.jsx';
import { ProtectedRoute } from './routes/ProtectedRoute.jsx';
import { useAuthStore } from './store/authStore.js';
import { ThemeProvider } from './context/ThemeContext.jsx';
import Appointments from './pages/Appointments.jsx';
import Billing from './pages/Billing.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Doctors from './pages/Doctors.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import MedicalRecords from './pages/MedicalRecords.jsx';
import MedicalReports from './pages/MedicalReports.jsx';
import AiTriage from './pages/AiTriage.jsx';
import Patients from './pages/Patients.jsx';
import Profile from './pages/Profile.jsx';
import Register from './pages/Register.jsx';
import Prescriptions from './pages/Prescriptions.jsx';
import AuditLogs from './pages/AuditLogs.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import Availability from './pages/Availability.jsx';
import Departments from './pages/Departments.jsx';
import BookAppointment from './pages/BookAppointment.jsx';
import LabOrders from './pages/LabOrders.jsx';
import Pharmacy from './pages/Pharmacy.jsx';
import Monitoring from './pages/Monitoring.jsx';
import VerifyPrescription from './pages/VerifyPrescription.jsx';
import Insurance from './pages/Insurance.jsx';
import SubscriptionPlans from './pages/SubscriptionPlans.jsx';

import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 grid place-items-center p-8">
          <div className="max-w-md bg-white dark:bg-slate-900 rounded-2xl p-8 shadow border border-red-100 dark:border-red-900">
            <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Application Error</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">Something went wrong:</p>
            <pre className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-4 rounded text-xs overflow-auto">{this.state.error?.toString()}</pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const hydrate = useAuthStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route
            element={(
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            )}
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/medical-records" element={<MedicalRecords />} />
            <Route path="/medical-reports" element={<MedicalReports />} />
            <Route path="/ai-triage" element={<AiTriage />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/prescriptions" element={<Prescriptions />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/availability" element={<Availability />} />
            <Route path="/departments" element={<Departments />} />
            <Route path="/book-appointment" element={<BookAppointment />} />
            <Route path="/lab-orders" element={<LabOrders />} />
            <Route path="/pharmacy" element={<Pharmacy />} />
            <Route path="/monitoring" element={<Monitoring />} />
            <Route path="/insurance" element={<Insurance />} />
            <Route path="/subscription-plans" element={<SubscriptionPlans />} />
          </Route>

          <Route path="/verify-rx/:token" element={<VerifyPrescription />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

function Unauthorized() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 grid place-items-center p-8">
      <div className="max-w-md rounded-2xl border border-red-100 dark:border-red-900 bg-white dark:bg-slate-900 p-8 text-center shadow-sm">
        <p className="text-sm font-semibold text-red-500 dark:text-red-400">403</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">Unauthorized</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">You do not have permission to access this page.</p>
      </div>
    </div>
  );
}

export default App;
