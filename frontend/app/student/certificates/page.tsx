'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import Certificates from '@/views/student/Certificates';
import { UserRole } from '@/types';

export default function CertificatesPage() {
    return (
        <ProtectedRoute allowedRoles={[UserRole.STUDENT]} wrapLayout>
            <Certificates />
        </ProtectedRoute>
    );
}
