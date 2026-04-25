'use client';
import ProtectedRoute from '@/components/ProtectedRoute';
import Approvals from '@/views/admin/Approvals';
import { UserRole } from '@/types';
export default function AdminApprovalsPage() {
    return (<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.MODERATOR]} wrapLayout><Approvals /></ProtectedRoute>);
}
