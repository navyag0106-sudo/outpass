import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContextProvider';
import PrivateRoute from './components/PrivateRoute';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load components for better performance
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const StudentProfile = lazy(() => import('./pages/StudentProfile'));
const WardenDashboard = lazy(() => import('./pages/WardenDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const OutpassForm = lazy(() => import('./pages/OutpassForm'));
const OutpassHistory = lazy(() => import('./pages/OutpassHistory'));

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Student Routes */}
              <Route path="/student" element={
                <PrivateRoute role="student">
                  <StudentDashboard />
                </PrivateRoute>
              } />
              <Route path="/student/apply" element={
                <PrivateRoute role="student">
                  <OutpassForm />
                </PrivateRoute>
              } />
              <Route path="/student/history" element={
                <PrivateRoute role="student">
                  <OutpassHistory />
                </PrivateRoute>
              } />
              <Route path="/student/profile" element={
                <PrivateRoute role="student">
                  <StudentProfile />
                </PrivateRoute>
              } />

              {/* Warden Routes */}
              <Route path="/warden" element={
                <PrivateRoute role="warden">
                  <WardenDashboard />
                </PrivateRoute>
              } />

              {/* Admin Routes */}
              <Route path="/admin" element={
                <PrivateRoute role="admin">
                  <AdminDashboard />
                </PrivateRoute>
              } />

              <Route path="/" element={<Navigate to="/login" />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;