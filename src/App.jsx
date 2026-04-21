import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { ProtectedRoute } from './routes/ProtectedRoute.jsx';
import { ToastContainer } from './components/ToastContainer.jsx';
import MainLayout from './layouts/MainLayout.jsx';

import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import Profile from './pages/Profile.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Doctors from './pages/Doctors.jsx';
import Patients from './pages/Patients.jsx';
import Appointments from './pages/Appointments.jsx';
import MedicalRecords from './pages/MedicalRecords.jsx';
import Billing from './pages/Billing.jsx';

const wrap = (Component, role) => (
  <ProtectedRoute requiredRole={role}>
    <MainLayout><Component /></MainLayout>
  </ProtectedRoute>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <ToastContainer />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            <Route path="/dashboard" element={wrap(Dashboard)} />
            <Route path="/doctors" element={wrap(Doctors, 'admin')} />
            <Route path="/patients" element={wrap(Patients)} />
            <Route path="/appointments" element={wrap(Appointments)} />
            <Route path="/medical-records" element={wrap(MedicalRecords)} />
            <Route path="/billing" element={wrap(Billing)} />
            <Route path="/profile" element={wrap(Profile)} />

            <Route path="/unauthorized" element={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '100vh', backgroundColor: 'var(--bg-secondary)', flexDirection: 'column', gap: '16px' }}>
                <h1 style={{ color: 'var(--danger)' }}>403 - Unauthorized</h1>
                <p style={{ color: 'var(--text-secondary)' }}>You don&apos;t have access to this page.</p>
              </div>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
