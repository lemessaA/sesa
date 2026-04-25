'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import ScheduleStream from '@/views/live/ScheduleStream';
import { UserRole } from '@/types';

export default function InstructorLiveCreatePage() {
    return (
        <ProtectedRoute allowedRoles={[UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ASSISTANT_INSTRUCTOR]} wrapLayout>
            <ScheduleStream />
        </ProtectedRoute>
    );
}
