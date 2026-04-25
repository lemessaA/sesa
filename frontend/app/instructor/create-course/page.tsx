'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import CreateCourse from '@/views/instructor/CreateCourse';
import { UserRole } from '@/types';

export default function CreateCoursePage() {
    return (
        <ProtectedRoute allowedRoles={[UserRole.INSTRUCTOR, UserRole.ADMIN]} wrapLayout>
            <CreateCourse />
        </ProtectedRoute>
    );
}
