import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, userData, loading, isStudent, isAdmin, isSuperAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user || !userData) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (userData.status === 'suspended' || userData.status === 'blocked') {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen bg-slate-50 p-4">
        <h1 className="text-xl font-bold text-slate-800 mb-2">Account {userData.status}</h1>
        <p className="text-slate-600 text-center">Your account is currently {userData.status}. Please contact support.</p>
      </div>
    );
  }

  if (isAdmin || isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }

  if (!isStudent) {
    return <Navigate to="/login" replace />;
  }

  if (userData.profileCompleted === false) {
    return <Navigate to="/signup" replace />;
  }

  return <>{children}</>;
}
