'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import Students from '@/views/instructor/Students';
import { UserRole } from '@/types';

export default function InstructorStudentsPage() {
    return (
        <ProtectedRoute allowedRoles={[UserRole.INSTRUCTOR, UserRole.ADMIN]} wrapLayout>
            <Students />
        </ProtectedRoute>
    );
}
