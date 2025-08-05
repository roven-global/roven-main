import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import isAdmin from '@/utils/isAdmin';

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, user, loading } = useAuth();

    if (loading) return null;
    if (!isAuthenticated || !isAdmin(user?.role)) {
        return <Navigate to="/" replace />;
    }
    return <>{children}</>;
};

export default AdminRoute;