/**
 * ParticipantsSidebar — Shows all participants with role-based moderation controls.
 * Admin/Teacher can mute, unmute, kick, and force-stop screen share.
 */
import React from 'react';

interface Participant {
    peerId: string;
    peerName: string;
    peerRole: string;
    isMuted?: boolean;
}

interface ParticipantsSidebarProps {
    visible: boolean;
    participants: Participant[];
    userId: string;
    userName: string;
    userRole: string;
    isHost: boolean;
    participantsCount: number;
    screenSharerId: string | null;
    onMuteUser: (targetUserId: string, muted: boolean) => void;
    onKickUser: (targetUserId: string) => void;
    onForceStopScreenShare: (targetUserId: string) => void;
    mutedParticipants: Set<string>;
}

const ParticipantsSidebar: React.FC<ParticipantsSidebarProps> = ({
    visible, participants, userId, userName, userRole, isHost,
    participantsCount, screenSharerId, onMuteUser, onKickUser,
    onForceStopScreenShare, mutedParticipants,
}) => {
    const canModerate = isHost || ['admin', 'super_admin', 'instructor'].includes(userRole);

    const getRoleBadge = (role: string) => {
        if (['admin', 'super_admin'].includes(role)) return { label: 'ADMIN', color: '#ef4444' };
        if (role === 'instructor') return { label: 'TEACHER', color: '#6366f1' };
        if (role === 'assistant_instructor') return { label: 'ASSISTANT', color: '#8b5cf6' };
        return null;
    };

    return (
        <div className={`live-participants-sidebar ${visible ? 'visible' : ''}`}>
            <div className="sidebar-header">
                PARTICIPANTS ({participantsCount})
            </div>
            <div className="participants-list">
                {/* Self */}
                <div className="participant-item self">
                    <div className="ps-left">
                        <div className="p-avatar">{userName.charAt(0)}</div>
                        <div className="ps-info">
                            <span className="ps-name">{userName} (You)</span>
                            {getRoleBadge(userRole) && (
                                <span className="ps-role" style={{ color: getRoleBadge(userRole)!.color }}>
                                    {getRoleBadge(userRole)!.label}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Remote participants */}
                {participants.filter(p => p.peerId !== userId).map(p => {
                    const badge = getRoleBadge(p.peerRole);
                    const isMuted = mutedParticipants.has(p.peerId);
                    const isSharing = screenSharerId === p.peerId;

                    return (
                        <div key={p.peerId} className="participant-item">
                            <div className="ps-left">
                                <div className="p-avatar">{p.peerName.charAt(0)}</div>
                                <div className="ps-info">
                                    <span className="ps-name">{p.peerName}</span>
                                    <div className="ps-badges">
                                        {badge && (
                                            <span className="ps-role" style={{ color: badge.color }}>{badge.label}</span>
                                        )}
                                        {isMuted && <span className="ps-muted-badge">🔇 MUTED</span>}
                                        {isSharing && <span className="ps-sharing-badge">🖥️ SHARING</span>}
                                    </div>
                                </div>
                            </div>
                            {canModerate && !['admin', 'super_admin'].includes(p.peerRole) && (
                                <div className="ps-actions">
                                    <button
                                        className={`ps-action-btn ${isMuted ? 'ps-unmute' : 'ps-mute'}`}
                                        onClick={() => onMuteUser(p.peerId, !isMuted)}
                                        title={isMuted ? 'Unmute' : 'Mute'}
                                    >
                                        {isMuted ? '🔊' : '🔇'}
                                    </button>
                                    {isSharing && (
                                        <button
                                            className="ps-action-btn ps-stop-share"
                                            onClick={() => onForceStopScreenShare(p.peerId)}
                                            title="Stop Screen Share"
                                        >
                                            ⏹️
                                        </button>
                                    )}
                                    <button
                                        className="ps-action-btn ps-kick"
                                        onClick={() => {
                                            if (confirm(`Remove ${p.peerName} from the session?`)) {
                                                onKickUser(p.peerId);
                                            }
                                        }}
                                        title="Remove"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ParticipantsSidebar;
