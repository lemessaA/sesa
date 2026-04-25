/**
 * VideoGrid — Displays the main video area with screen share (large) and participant tiles.
 * Handles both P2P mode (WebRTC streams) and local-only preview.
 */
import React, { useRef, useEffect } from 'react';
import type { RemoteStreamInfo } from '../../hooks/useWebRTC';

interface VideoGridProps {
    localStream: MediaStream | null;
    screenStream: MediaStream | null;
    remoteStreams: RemoteStreamInfo[];
    isScreenSharing: boolean;
    screenSharerId: string | null;
    userId: string;
    userName: string;
    isCamOff: boolean;
    isMicMuted: boolean;
}

/** Attaches a MediaStream to a <video> element */
const VideoTile: React.FC<{
    stream: MediaStream | null;
    label: string;
    muted?: boolean;
    mirror?: boolean;
    isMain?: boolean;
    isCamOff?: boolean;
    micMuted?: boolean;
    role?: string;
    badge?: string;
}> = ({ stream, label, muted = false, mirror = false, isMain = false, isCamOff = false, micMuted = false, role, badge }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    const hasVideo = stream && stream.getVideoTracks().some(t => t.enabled && t.readyState === 'live');

    return (
        <div className={`vg-tile ${isMain ? 'vg-tile-main' : 'vg-tile-small'}`}>
            {(hasVideo && !isCamOff) ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={muted}
                    style={{ transform: mirror ? 'scaleX(-1)' : 'none' }}
                    className="vg-video"
                />
            ) : (
                <div className="vg-avatar-wrapper">
                    <div className="vg-avatar">{label.charAt(0).toUpperCase()}</div>
                    {isCamOff && <span className="vg-cam-off-label">Camera Off</span>}
                </div>
            )}
            <div className="vg-tile-label">
                {micMuted && <span className="vg-mic-off" style={{ marginRight: '6px' }}>🔇</span>}
                <span className="vg-name">{label}</span>
                {role && ['instructor', 'admin', 'super_admin'].includes(role) && (
                    <span className="vg-role-badge">HOST</span>
                )}
                {badge && <span className="vg-screen-badge">{badge}</span>}
            </div>
        </div>
    );
};

const VideoGrid: React.FC<VideoGridProps> = ({
    localStream, screenStream, remoteStreams, isScreenSharing,
    screenSharerId, userId, userName, isCamOff, isMicMuted,
}) => {
    // Find the active screen share stream (local or remote)
    const localScreenActive = isScreenSharing && screenStream;
    const remoteScreenStream = remoteStreams.find(s => s.kind === 'screen' && s.peerId === screenSharerId);
    const activeScreen = localScreenActive ? screenStream : remoteScreenStream?.stream || null;
    const screenLabel = localScreenActive ? `${userName}'s Screen` : remoteScreenStream?.peerName ? `${remoteScreenStream.peerName}'s Screen` : 'Screen Share';

    // Camera streams (excluding screen share streams)
    const remoteCameraStreams = remoteStreams.filter(s => s.kind === 'camera');

    const hasScreenShare = !!(activeScreen || screenSharerId);

    return (
        <div className={`vg-container ${hasScreenShare ? 'vg-with-screen' : 'vg-grid-only'}`}>
            {/* Main screen share area */}
            {hasScreenShare && activeScreen && (
                <div className="vg-main-area">
                    <VideoTile
                        stream={activeScreen}
                        label={screenLabel}
                        muted={true}
                        isMain={true}
                        badge="SCREEN SHARE"
                    />
                </div>
            )}

            {/* If screen is being shared but stream not yet received, show placeholder */}
            {hasScreenShare && !activeScreen && screenSharerId && screenSharerId !== userId && (
                <div className="vg-main-area">
                    <div className="vg-tile vg-tile-main">
                        <div className="vg-avatar-wrapper">
                            <div className="vg-screen-loading">
                                <div className="sesa-loader" style={{ width: 32, height: 32 }} />
                                <span>Receiving screen share...</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Participant tiles */}
            <div className={`vg-tiles ${hasScreenShare ? 'vg-tiles-sidebar' : 'vg-tiles-grid'}`}>
                {/* Self tile */}
                <VideoTile
                    stream={localStream}
                    label={`${userName} (You)`}
                    muted={true}
                    mirror={true}
                    isCamOff={isCamOff}
                    micMuted={isMicMuted}
                />

                {/* Remote camera tiles */}
                {remoteCameraStreams.map(rs => (
                    <VideoTile
                        key={rs.peerId}
                        stream={rs.stream}
                        label={rs.peerName}
                        role={rs.peerRole}
                    />
                ))}
            </div>
        </div>
    );
};

export default VideoGrid;
