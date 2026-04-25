'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import Analytics from '@/views/instructor/Analytics';
import { UserRole } from '@/types';

export default function InstructorAnalyticsPage() {
    return (
        <ProtectedRoute allowedRoles={[UserRole.INSTRUCTOR, UserRole.ADMIN]} wrapLayout>
            <Analytics />
        </ProtectedRoute>
    );
}
