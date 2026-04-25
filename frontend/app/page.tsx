'use client';

import { useAuth } from '@/context/AuthContext';
import { Navigate } from '@/lib/navigation';
import Landing from '@/views/Landing';

export default function HomePage() {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/auth" replace />;
    }

    return <Landing />;
}
