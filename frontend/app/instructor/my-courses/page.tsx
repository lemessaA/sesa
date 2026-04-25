'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import MyCourses from '@/views/instructor/MyCourses';
import { UserRole } from '@/types';

export default function MyCoursesPage() {
    return (
        <ProtectedRoute allowedRoles={[UserRole.INSTRUCTOR, UserRole.ADMIN]} wrapLayout>
            <MyCourses />
        </ProtectedRoute>
    );
}
