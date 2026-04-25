'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import RecordingViewer from '@/views/live/RecordingViewer';

export default function RecordingPage() {
    return (
        <ProtectedRoute wrapLayout>
            <RecordingViewer />
        </ProtectedRoute>
    );
}
