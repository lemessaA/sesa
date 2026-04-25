'use client';
import ProtectedRoute from '@/components/ProtectedRoute';
import Categories from '@/views/admin/Categories';
import { UserRole } from '@/types';
export default function AdminCategoriesPage() {
    return (<ProtectedRoute allowedRoles={[UserRole.ADMIN]} wrapLayout><Categories /></ProtectedRoute>);
}
