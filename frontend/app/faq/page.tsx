'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import FAQ from '@/views/FAQ';

export default function FAQPage() {
    return (
        <ProtectedRoute wrapLayout>
            <FAQ />
        </ProtectedRoute>
    );
}
