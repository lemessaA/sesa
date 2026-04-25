'use client';
import ProtectedRoute from '@/components/ProtectedRoute';
import LiveStreamLobby from '@/views/live/LiveStreamLobby';
export default function LiveSessionsPage() {
    return (<ProtectedRoute wrapLayout><LiveStreamLobby /></ProtectedRoute>);
}
