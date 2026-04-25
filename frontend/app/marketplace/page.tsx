'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import Marketplace from '@/views/Marketplace';

export default function MarketplacePage() {
    return (
        <ProtectedRoute wrapLayout>
            <Marketplace />
        </ProtectedRoute>
    );
}
