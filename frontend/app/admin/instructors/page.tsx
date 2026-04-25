'use client';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminInstructors from '@/views/admin/AdminInstructors';
import { UserRole } from '@/types';
export default function AdminInstructorsPage() {
    return (<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]} wrapLayout><AdminInstructors /></ProtectedRoute>);
}
