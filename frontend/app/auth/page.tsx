'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/views/auth/Login';

export default function AuthPage() {
    return (
        <ProtectedRoute requireGuest>
            <Login />
        </ProtectedRoute>
    );
}
