import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import AppLayout from './AppLayout';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
    wrapLayout?: boolean;
    requireGuest?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles, wrapLayout, requireGuest }) => {
    const { user, isAuthenticated, isLoading } = useAuth();

    // Show loading spinner while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    // Redirect authenticated users away from guest-only route (like Login)
    if (requireGuest && isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    // Redirect to auth if not authenticated and this is a protected route
    if (!requireGuest && !isAuthenticated) {
        return <Navigate to="/auth" replace />;
    }

    // Check role-based access
    if (allowedRoles && user && user.role !== UserRole.SUPER_ADMIN && !allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    if (wrapLayout) {
        return <AppLayout>{children}</AppLayout>;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
