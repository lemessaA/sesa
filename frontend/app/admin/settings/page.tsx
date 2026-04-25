'use client';
import ProtectedRoute from '@/components/ProtectedRoute';
import Settings from '@/views/admin/Settings';
import { UserRole } from '@/types';
export default function AdminSettingsPage() {
    return (<ProtectedRoute allowedRoles={[UserRole.ADMIN]} wrapLayout><Settings /></ProtectedRoute>);
}
