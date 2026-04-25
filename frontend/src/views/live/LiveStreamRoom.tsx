import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from '@/lib/navigation';
import { useAuth } from '../../context/AuthContext';
import { liveStreamApi } from '../../services/liveStreamApi';
import { useStreamChat } from '../../hooks/useStreamChat';
import { useWebRTC } from '../../hooks/useWebRTC';
import VideoGrid from '../../components/live/VideoGrid';
import ParticipantsSidebar from '../../components/live/ParticipantsSidebar';
import WaitingRoom from '../../components/live/WaitingRoom';
import { toast } from 'react-toastify';
import {
    LiveKitRoom,
    VideoConference,
} from '@livekit/components-react';
import '../../styles/livestream.css';

const LiveStreamRoom: React.FC = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [sessionData, setSessionData] = useState<any>(null);
    const [token, setToken] = useState('');
    const [livekitUrl, setLivekitUrl] = useState('');
    const [useP2P, setUseP2P] = useState(false);
    const [chatOpen, setChatOpen] = useState(true);
    const [isWaiting, setIsWaiting] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [isRecording, setIsRecording] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [showParticipants, setShowParticipants] = useState(false);
    const [mutedParticipants, setMutedParticipants] = useState<Set<string>>(new Set());
    const [peerList, setPeerList] = useState<Array<{ peerId: string; peerName: string; peerRole: string }>>([]);

    const chatEndRef = useRef<HTMLDivElement>(null);

    const isHost = sessionData?.session?.hostId?.toString() === user?.id
        || sessionData?.session?.hostId?._id === user?.id;
    const isAdmin = ['admin', 'super_admin'].includes(user?.role || '');
    const isTeacher = user?.role === 'instructor';
    const canModerate = isHost || isAdmin || isTeacher;

    // ── Chat hook (existing, preserved) ──
    const {
        messages, participantsCount, handQueue, waitingUsers, isConnected,
        sendMessage, deleteMessage, raiseHand, lowerHand, muteUser, socket,
    } = useStreamChat(sessionId || '');

    // ── WebRTC P2P hook (new) ──
    const webrtc = useWebRTC({
        socket,
        userId: user?.id || '',
        userName: user?.name || 'Anonymous',
        userRole: user?.role || 'student',
        isHost: isHost || isAdmin,
        enabled: useP2P && !loading && !isWaiting,
    });

    // ── Initialize session ──
    useEffect(() => {
        if (!sessionId) return;
        const init = async () => {
            try {
                const sessionInfo = await liveStreamApi.getSession(sessionId);
                const session = sessionInfo.data;

                if (session.status === 'scheduled' && (session.hostId?._id === user?.id || session.hostId === user?.id)) {
                    const startRes = await liveStreamApi.startSession(sessionId);
                    setToken(startRes.data.token);
                    setLivekitUrl(startRes.data.livekitUrl || startRes.data.serverUrl || 'ws://localhost:7880');
                    setUseP2P(startRes.data.useP2P === true);
                    setSessionData(startRes.data);
                    setIsRecording(session.isRecording);
                } else if (session.status === 'live') {
                    const joinRes = await liveStreamApi.joinSession(sessionId);
                    if (joinRes.data.waiting) {
                        setIsWaiting(true);
                        setSessionData({ session });
                        return;
                    }
                    setToken(joinRes.data.token);
                    setLivekitUrl(joinRes.data.livekitUrl || joinRes.data.serverUrl || 'ws://localhost:7880');
                    setUseP2P(joinRes.data.useP2P === true);
                    setSessionData(joinRes.data);
                    setIsRecording(session.isRecording);
                    setIsWaiting(false);
                } else {
                    toast.error(`Session is ${session.status}`);
                    navigate('/live/sessions');
                    return;
                }
            } catch (err: any) {
                toast.error(err.response?.data?.message || 'Failed to join session');
                navigate('/live/sessions');
            } finally { setLoading(false); }
        };
        init();
    }, [sessionId]);

    // ── Track peers from socket events ──
    useEffect(() => {
        if (!socket) return;

        const handlePeersList = ({ peers }: any) => {
            setPeerList(peers || []);
        };
        const handlePeerJoined = (data: any) => {
            if (data.peerId && data.peerId !== user?.id) {
                setPeerList(prev => {
                    if (prev.find(p => p.peerId === data.peerId)) return prev;
                    return [...prev, { peerId: data.peerId, peerName: data.peerName || data.userName, peerRole: data.peerRole || data.role }];
                });
            }
        };
        const handlePeerLeft = (data: any) => {
            const peerId = data.peerId || data.userId;
            if (peerId) setPeerList(prev => prev.filter(p => p.peerId !== peerId));
        };
        const handleParticipantMuted = ({ targetUserId, muted }: any) => {
            setMutedParticipants(prev => {
                const next = new Set(prev);
                if (muted) next.add(targetUserId); else next.delete(targetUserId);
                return next;
            });
        };

        socket.on('live:peers_list', handlePeersList);
        socket.on('live:participant_joined', handlePeerJoined);
        socket.on('live:participant_left', handlePeerLeft);
        socket.on('live:participant_muted', handleParticipantMuted);

        return () => {
            socket.off('live:peers_list', handlePeersList);
            socket.off('live:participant_joined', handlePeerJoined);
            socket.off('live:participant_left', handlePeerLeft);
            socket.off('live:participant_muted', handleParticipantMuted);
        };
    }, [socket, user?.id]);

    // ── Waiting room approval ──
    useEffect(() => {
        if (!socket) return;
        socket.on('live:waiting_room_update', (data: any) => {
            if (data.action === 'approve' && data.userId === user?.id) {
                toast.success('You have been approved! Joining session...');
                setLoading(true);
                setIsWaiting(false);
                window.location.reload();
            }
        });
    }, [socket, user?.id]);

    // ── Elapsed Timer ──
    useEffect(() => {
        const timer = setInterval(() => setElapsed(prev => prev + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    // ── Scroll chat to bottom ──
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const formatTime = (s: number) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        return `${h > 0 ? `${h}:` : ''}${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    const handleSendChat = (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim()) return;
        sendMessage(chatInput);
        setChatInput('');
    };

    const handleEndSession = async () => {
        if (!confirm('Are you sure you want to end this session?')) return;
        try {
            await liveStreamApi.endSession(sessionId!);
            toast.success('Session ended');
            navigate('/live/sessions');
        } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to end session'); }
    };

    const handleToggleRecording = async () => {
        try {
            const res = await liveStreamApi.toggleRecording(sessionId!);
            setIsRecording(res.isRecording);
            toast.success(res.isRecording ? 'Recording started' : 'Recording stopped');
        } catch (err: any) { toast.error('Failed to toggle recording'); }
    };

    const handleApprove = async (targetUserId: string) => {
        try {
            await liveStreamApi.approveParticipant(sessionId!, targetUserId);
            toast.success('Participant approved');
        } catch (err: any) { toast.error('Failed to approve'); }
    };

    const handleMuteUser = useCallback((targetUserId: string, muted: boolean) => {
        muteUser(targetUserId, muted);
        toast.info(muted ? 'Participant muted' : 'Participant unmuted');
    }, [muteUser]);

    const handleKickUser = useCallback((targetUserId: string) => {
        socket?.emit('live:kick_user', { targetUserId });
        toast.info('Participant removed');
    }, [socket]);

    const handleForceStopScreenShare = useCallback((targetUserId: string) => {
        socket?.emit('live:force_stop_screen_share', { targetUserId });
        toast.info('Screen share stopped');
    }, [socket]);

    const handleLeave = () => {
        webrtc.stopScreenShare();
        navigate('/live/sessions');
    };

    // ── Mic/Cam/Screen toggle handlers ──
    const toggleMic = () => {
        webrtc.toggleMic();
        toast.info(webrtc.isMicMuted ? 'Microphone Unmuted' : 'Microphone Muted');
    };

    const toggleCam = () => {
        webrtc.toggleCam();
        toast.info(webrtc.isCamOff ? 'Camera Enabled' : 'Camera Disabled');
    };

    const toggleScreenShare = () => {
        if (webrtc.isScreenSharing) {
            webrtc.stopScreenShare();
            toast.success('Screen sharing stopped');
        } else {
            webrtc.startScreenShare();
        }
    };

    // ── Loading state ──
    if (loading) {
        return (
            <div className="live-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="sesa-loader" />
                    <p style={{ color: '#a5b4fc', fontWeight: 700, fontSize: '15px', marginTop: '20px' }}>Establishing Secure Connection...</p>
                </div>
            </div>
        );
    }

    // ── Waiting room ──
    if (isWaiting) {
        return (
            <WaitingRoom
                sessionTitle={sessionData?.session?.title || 'Live Class'}
                userName={user?.name || 'Student'}
                onLeave={() => navigate('/live/sessions')}
            />
        );
    }

    // ── Determine rendering mode ──
    const isLiveKitMode = !useP2P && token && !token.startsWith('dev-mock-');

    return (
        <div className="live-container">
            {/* ═══ Top Bar ═══ */}
            <div className="live-topbar">
                <div className="live-topbar-info">
                    <button onClick={() => navigate('/live/sessions')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' }}>←</button>
                    <span className="live-topbar-title">{sessionData?.session?.title || 'Live Session'}</span>
                    <span className="live-badge live-badge-live">LIVE</span>
                    <span className="live-badge live-badge-viewers">👁 {participantsCount}</span>
                    <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>⏱ {formatTime(elapsed)}</span>
                    {isRecording && <span className="live-badge" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>⏺ REC</span>}
                    {useP2P && <span className="live-badge" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', fontSize: '9px' }}>P2P</span>}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {!isConnected && <span style={{ color: '#f59e0b', fontSize: '12px', fontWeight: 700 }}>⚠ Reconnecting...</span>}
                    {webrtc.isForceMuted && <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: 700 }}>🔇 MUTED BY HOST</span>}
                    {(isHost || isAdmin) && (
                        <button onClick={handleEndSession} className="live-btn live-btn-danger" style={{ padding: '8px 16px', fontSize: '12px' }}>
                            ⏹ End Session
                        </button>
                    )}
                </div>
            </div>

            {/* ═══ Main Content ═══ */}
            <div className="live-main">
                {/* Participants Sidebar */}
                <ParticipantsSidebar
                    visible={showParticipants}
                    participants={peerList}
                    userId={user?.id || ''}
                    userName={user?.name || ''}
                    userRole={user?.role || 'student'}
                    isHost={isHost || false}
                    participantsCount={participantsCount}
                    screenSharerId={webrtc.screenSharerId}
                    onMuteUser={handleMuteUser}
                    onKickUser={handleKickUser}
                    onForceStopScreenShare={handleForceStopScreenShare}
                    mutedParticipants={mutedParticipants}
                />

                {/* Video Area */}
                <div className="live-video-area">
                    <div className="live-video-container">
                        {isLiveKitMode ? (
                            /* LiveKit Mode — production SFU */
                            <LiveKitRoom
                                video={!webrtc.isCamOff}
                                audio={!webrtc.isMicMuted}
                                screen={webrtc.isScreenSharing}
                                token={token}
                                serverUrl={livekitUrl}
                                connect={true}
                                data-lk-theme="default"
                                style={{ height: '100%' }}
                                onDisconnected={() => {
                                    toast.error('Disconnected from session');
                                    navigate('/live/sessions');
                                }}
                            >
                                <VideoConference />
                            </LiveKitRoom>
                        ) : (
                            /* P2P WebRTC Mode — development/small classes */
                            <VideoGrid
                                localStream={webrtc.localStream}
                                screenStream={webrtc.screenStream}
                                remoteStreams={webrtc.remoteStreams}
                                isScreenSharing={webrtc.isScreenSharing}
                                screenSharerId={webrtc.screenSharerId}
                                userId={user?.id || ''}
                                userName={user?.name || 'You'}
                                isCamOff={webrtc.isCamOff}
                                isMicMuted={webrtc.isMicMuted}
                            />
                        )}
                    </div>
                </div>

                {/* ═══ Chat Panel ═══ */}
                <div className={`live-chat-panel ${chatOpen ? '' : 'collapsed'}`}>
                    <div className="live-chat-header">
                        <span>💬 Live Chat</span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>{messages.length} msgs</span>
                    </div>
                    <div className="live-chat-messages">
                        {messages.map(msg => (
                            <div key={msg.id} className={`live-chat-msg ${['instructor', 'admin', 'super_admin'].includes(msg.role) ? 'live-chat-msg-host' : ''}`}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span className="live-chat-author">
                                        {msg.userName}
                                        {['instructor', 'admin'].includes(msg.role) && <span style={{ marginLeft: '6px', fontSize: '9px', background: 'rgba(99,102,241,0.2)', padding: '1px 5px', borderRadius: '4px', color: '#a5b4fc' }}>HOST</span>}
                                    </span>
                                    {(isHost || isAdmin) && (
                                        <button onClick={() => deleteMessage(msg.id)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '12px', padding: '2px' }} title="Delete">✕</button>
                                    )}
                                </div>
                                <div className="live-chat-text">{msg.text}</div>
                                <div className="live-chat-time">{new Date(msg.timestamp).toLocaleTimeString()}</div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>
                    {sessionData?.session?.chatEnabled !== false && (
                        <div className="live-chat-input-area">
                            <form className="live-chat-input-wrapper" onSubmit={handleSendChat}>
                                <input className="live-chat-input" type="text" placeholder="Type a message..." value={chatInput} onChange={e => setChatInput(e.target.value)} maxLength={500} />
                                <button type="submit" className="live-chat-send-btn">→</button>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {/* ═══ Admin Overlay Panels ═══ */}
            {(isHost || isAdmin) && (
                <div className="live-admin-side-panel">
                    {handQueue.length > 0 && (
                        <div className="admin-side-card hand-card">
                            <h4>✋ Raised Hands</h4>
                            <div className="admin-side-list">
                                {handQueue.map((h: any) => (
                                    <div key={h.userId} className="admin-side-item">
                                        <span>{h.userName}</span>
                                        <button onClick={() => lowerHand(h.userId)}>Lower</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {waitingUsers.length > 0 && (
                        <div className="admin-side-card waiting-card">
                            <h4>🚪 Waiting Room</h4>
                            <div className="admin-side-list">
                                {waitingUsers.map((w: any) => (
                                    <div key={w.userId} className="admin-side-item">
                                        <span>{w.userName}</span>
                                        <button onClick={() => handleApprove(w.userId)}>Admit</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ═══ Controls Bar ═══ */}
            <div className="live-controls">
                <button
                    className={`live-ctrl-btn ${webrtc.isMicMuted ? 'muted' : ''}`}
                    onClick={toggleMic}
                    title={webrtc.isMicMuted ? 'Unmute' : 'Mute'}
                    id="btn-mic"
                >
                    {webrtc.isMicMuted ? '🔇' : '🎙️'}
                </button>
                <button
                    className={`live-ctrl-btn ${webrtc.isCamOff ? 'muted' : ''}`}
                    onClick={toggleCam}
                    title={webrtc.isCamOff ? 'Turn Cam On' : 'Turn Cam Off'}
                    id="btn-cam"
                >
                    {webrtc.isCamOff ? '📷' : '📹'}
                </button>
                <div className="live-ctrl-divider" />
                <button
                    className={`live-ctrl-btn ${showParticipants ? 'active' : ''}`}
                    onClick={() => setShowParticipants(!showParticipants)}
                    title="Participants"
                    id="btn-participants"
                >
                    👥
                </button>
                <button
                    className={`live-ctrl-btn ${chatOpen ? 'active' : ''}`}
                    onClick={() => setChatOpen(!chatOpen)}
                    title="Toggle Chat"
                    id="btn-chat"
                >
                    💬
                </button>
                <button className="live-ctrl-btn" onClick={raiseHand} title="Raise Hand" id="btn-raise-hand">✋</button>

                {/* Screen Share — visible for Admin, Teacher, and Host */}
                {(canModerate) && (
                    <>
                        <div className="live-ctrl-divider" />
                        <button
                            className={`live-ctrl-btn screen-share-btn ${webrtc.isScreenSharing ? 'active sharing' : ''}`}
                            onClick={toggleScreenShare}
                            title={webrtc.isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
                            id="btn-screen-share"
                        >
                            {webrtc.isScreenSharing ? '⏹️' : '🖥️'}
                            <span className="ctrl-label">{webrtc.isScreenSharing ? 'Stop' : 'Share'}</span>
                        </button>
                    </>
                )}

                {(isHost || isAdmin) && (
                    <>
                        <div className="live-ctrl-divider" />
                        <button
                            className={`live-ctrl-btn ${isRecording ? 'active' : ''}`}
                            onClick={handleToggleRecording}
                            title="Toggle Recording"
                            id="btn-recording"
                        >
                            ⏺
                        </button>
                    </>
                )}

                <div className="live-ctrl-divider" />
                <button className="live-ctrl-btn danger" onClick={handleLeave} title="Leave" id="btn-leave">
                    📴
                </button>
            </div>
        </div>
    );
};

export default LiveStreamRoom;
