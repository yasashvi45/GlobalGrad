import React from 'react';
import { useAuth, Role } from '@/contexts/AuthContext';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: Role[];
  fallback?: React.ReactNode;
}

export function RoleGuard({ children, allowedRoles, fallback = null }: RoleGuardProps) {
  const { userData, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (userData && allowedRoles.includes(userData.role)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
