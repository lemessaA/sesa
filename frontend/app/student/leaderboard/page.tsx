'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import Leaderboard from '@/views/student/Leaderboard';
import { UserRole } from '@/types';

export default function LeaderboardPage() {
    return (
        <ProtectedRoute allowedRoles={[UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR]} wrapLayout>
            <Leaderboard />
        </ProtectedRoute>
    );
}
