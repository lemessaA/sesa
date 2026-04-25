'use client';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminCourses from '@/views/admin/AdminCourses';
import { UserRole } from '@/types';
export default function AdminCoursesPage() {
    return (<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.MODERATOR]} wrapLayout><AdminCourses /></ProtectedRoute>);
}
