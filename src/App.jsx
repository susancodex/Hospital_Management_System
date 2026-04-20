import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { ProtectedRoute } from './routes/ProtectedRoute.jsx';
import { ToastContainer } from './components/ToastContainer.jsx';
import MainLayout from './layouts/MainLayout.jsx';

// Pages
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Doctors from './pages/Doctors.jsx';
import Patients from './pages/Patients.jsx';
import Appointments from './pages/Appointments.jsx';
import MedicalRecords from './pages/MedicalRecords.jsx';
import Billing from './pages/Billing.jsx';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <ToastContainer />
          <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/doctors"
            element={
              <ProtectedRoute requiredRole="admin">
                <MainLayout>
                  <Doctors />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/patients"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Patients />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/appointments"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Appointments />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/medical-records"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <MedicalRecords />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/billing"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Billing />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route path="/unauthorized" element={<div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            backgroundColor: 'var(--bg-secondary)',
            flexDirection: 'column',
            gap: '16px',
          }}>
            <h1 style={{ color: 'var(--danger)' }}>403 - Unauthorized</h1>
            <p style={{ color: 'var(--text-secondary)' }}>You don&apos;t have access to this page.</p>
          </div>} />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
