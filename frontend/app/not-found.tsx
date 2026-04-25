'use client';

import { useAuth } from '@/context/AuthContext';
import { Navigate } from '@/lib/navigation';
import NotFound from '@/views/NotFound';

export default function NotFoundPage() {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/auth" replace />;
    }

    return <NotFound />;
}
