'use client';
import ProtectedRoute from '@/components/ProtectedRoute';
import ManageUsers from '@/views/admin/ManageUsers';
import { UserRole } from '@/types';
export default function AdminUsersPage() {
    return (<ProtectedRoute allowedRoles={[UserRole.ADMIN]} wrapLayout><ManageUsers /></ProtectedRoute>);
}
