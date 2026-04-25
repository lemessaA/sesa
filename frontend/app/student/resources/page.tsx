'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import Resources from '@/views/student/Resources';
import { UserRole } from '@/types';

export default function ResourcesPage() {
    return (
        <ProtectedRoute allowedRoles={[UserRole.STUDENT]} wrapLayout>
            <Resources />
        </ProtectedRoute>
    );
}
