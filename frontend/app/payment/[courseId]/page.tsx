'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import Payment from '@/views/Payment';

export default function PaymentCourseIdPage() {
    return (
        <ProtectedRoute wrapLayout>
            <Payment />
        </ProtectedRoute>
    );
}
