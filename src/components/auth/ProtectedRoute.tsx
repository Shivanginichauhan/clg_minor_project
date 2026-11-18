import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';
import { UserRole } from '../../types/database.types.js';
import { RefreshCw, GraduationCap } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, profile, role, loading } = useAuth();
  const location = useLocation();

  // Show loading while session is loading or if user is authenticated but role is still resolving
  if (loading || (user && allowedRoles && !role)) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-[#172033] gap-4 p-4">
        <div className="w-12 h-12 rounded-2xl bg-[#0F2747] text-white flex items-center justify-center shadow-md animate-pulse">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <RefreshCw className="w-4 h-4 text-[#1E5AA8] animate-spin" />
          <span>Verifying University Credentials &amp; Session...</span>
        </div>
      </div>
    );
  }

  // Not authenticated -> Redirect to login with source location state
  if (!user && !profile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Account status check
  if (profile && (profile.status === 'inactive' || profile.status === 'suspended')) {
    return <Navigate to="/login" state={{ error: 'Your account is currently inactive. Please contact the administrator.' }} replace />;
  }

  // Role validation
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
