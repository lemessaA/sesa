'use client';

import StreamErrorBoundary from '@/components/live/StreamErrorBoundary';
import LiveStreamRoom from '@/views/live/LiveStreamRoom';

export default function LiveRoomPage() {
    return (
        <StreamErrorBoundary>
            <LiveStreamRoom />
        </StreamErrorBoundary>
    );
}
