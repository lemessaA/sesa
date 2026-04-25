'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import BrowseCourses from '@/views/student/BrowseCourses';
import { UserRole } from '@/types';

export default function BrowseCoursesPage() {
    return (
        <ProtectedRoute allowedRoles={[UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR]} wrapLayout>
            <BrowseCourses />
        </ProtectedRoute>
    );
}
