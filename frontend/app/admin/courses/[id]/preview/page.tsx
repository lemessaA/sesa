'use client';
import ProtectedRoute from '@/components/ProtectedRoute';
import CoursePreview from '@/views/admin/CoursePreview';
import { UserRole } from '@/types';
export default function AdminCoursePreviewPage() {
    return (<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.MODERATOR]} wrapLayout><CoursePreview /></ProtectedRoute>);
}
