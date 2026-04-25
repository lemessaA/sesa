'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import AdminMonitor from '@/views/live/AdminMonitor';
import { UserRole } from '@/types';

export default function LiveAdminPage() {
    return (
        <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]} wrapLayout>
            <AdminMonitor />
        </ProtectedRoute>
    );
}
