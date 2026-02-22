import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

const PrivateRoute = ({ children, role }) => {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (role && userProfile && userProfile.role !== role) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default PrivateRoute;
