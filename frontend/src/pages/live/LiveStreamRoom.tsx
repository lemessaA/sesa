import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { liveStreamApi } from '../../services/liveStreamApi';
import { useStreamChat } from '../../hooks/useStreamChat';
import WaitingRoom from '../../components/live/WaitingRoom';
import { toast } from 'react-toastify';
import {
    LiveKitRoom,
    VideoConference,
} from '@livekit/components-react';
import '../../styles/livestream.css';

// Using the generated image as a mock background
const MOCK_PREVIEW_IMG = '/classroom_preview.png';

const LiveStreamRoom: React.FC = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [sessionData, setSessionData] = useState<any>(null);
    const [token, setToken] = useState('');
    const [livekitUrl, setLivekitUrl] = useState('');
    const [chatOpen, setChatOpen] = useState(true);
    const [isWaiting, setIsWaiting] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [isRecording, setIsRecording] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [showParticipants, setShowParticipants] = useState(false);

    // New Media States
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [isCamOff, setIsCamOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const isHost = sessionData?.session?.hostId?.toString() === user?.id || sessionData?.session?.hostId?._id === user?.id;
    const isAdmin = ['admin', 'super_admin'].includes(user?.role || '');

    const { messages, participantsCount, handQueue, waitingUsers, isConnected, sendMessage, deleteMessage, raiseHand, lowerHand, socket } = useStreamChat(sessionId || '');

    // Media Streams for Mock Mode
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [localScreenStream, setLocalScreenStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const screenVideoRef = useRef<HTMLVideoElement>(null);
    const isMockMode = !token || token.startsWith('dev-mock-');
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

    // ── Elapsed Timer ──
    useEffect(() => {
        const timer = setInterval(() => setElapsed(prev => prev + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    // ── Scroll chat to bottom ──
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

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

    const handleScreenshot = () => {
        toast.info('Capturing classroom screenshot...');
    };

    // ── Media Stream Effects (Mock Mode) ──
    useEffect(() => {
        if (isMockMode && !isCamOff) {
            navigator.mediaDevices.getUserMedia({ video: true, audio: !isMicMuted })
                .then(stream => {
                    setLocalStream(stream);
                    if (videoRef.current) videoRef.current.srcObject = stream;
                })
                .catch(err => {
                    console.error("Camera access denied:", err);
                    setIsCamOff(true);
                });
        } else if (localStream) {
            localStream.getTracks().forEach(t => t.stop());
            setLocalStream(null);
        }
        return () => localStream?.getTracks().forEach(t => t.stop());
    }, [isCamOff, isMockMode]);

    useEffect(() => {
        if (isMockMode && isScreenSharing) {
            navigator.mediaDevices.getDisplayMedia({ video: true })
                .then(stream => {
                    setLocalScreenStream(stream);
                    if (screenVideoRef.current) screenVideoRef.current.srcObject = stream;
                    stream.getVideoTracks()[0].onended = () => setIsScreenSharing(false);
                })
                .catch(err => {
                    console.error("Screen share denied:", err);
                    setIsScreenSharing(false);
                });
        } else if (localScreenStream) {
            localScreenStream.getTracks().forEach(t => t.stop());
            setLocalScreenStream(null);
        }
        return () => localScreenStream?.getTracks().forEach(t => t.stop());
    }, [isScreenSharing, isMockMode]);

    const toggleMic = () => {
        setIsMicMuted(!isMicMuted);
        if (localStream) {
            localStream.getAudioTracks().forEach(track => track.enabled = isMicMuted);
        }
        toast.info(isMicMuted ? 'Microphone Unmuted' : 'Microphone Muted');
    };

    const toggleCam = () => {
        setIsCamOff(!isCamOff);
        toast.info(isCamOff ? 'Camera Enabled' : 'Camera Disabled');
    };

    const toggleScreenShare = () => {
        setIsScreenSharing(!isScreenSharing);
        toast.success(isScreenSharing ? 'Screen sharing stopped' : 'Starting screen share...');
    };

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

    if (isWaiting) {
        return (
            <WaitingRoom
                sessionTitle={sessionData?.session?.title || 'Live Class'}
                userName={user?.name || 'Student'}
                onLeave={() => navigate('/live/sessions')}
            />
        );
    }

    return (
        <div className="live-container">
            {/* Top Bar */}
            <div className="live-topbar">
                <div className="live-topbar-info">
                    <button onClick={() => navigate('/live/sessions')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' }}>←</button>
                    <span className="live-topbar-title">{sessionData?.session?.title || 'Live Session'}</span>
                    <span className="live-badge live-badge-live">LIVE</span>
                    <span className="live-badge live-badge-viewers">👁 {participantsCount}</span>
                    <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>⏱ {formatTime(elapsed)}</span>
                    {isRecording && <span className="live-badge" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>⏺ REC</span>}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {!isConnected && <span style={{ color: '#f59e0b', fontSize: '12px', fontWeight: 700 }}>⚠ Reconnecting...</span>}
                    {(isHost || isAdmin) && (
                        <button onClick={handleEndSession} className="live-btn live-btn-danger" style={{ padding: '8px 16px', fontSize: '12px' }}>
                            ⏹ End Session
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="live-main">
                {/* Side Participants */}
                <div className={`live-participants-sidebar ${showParticipants ? 'visible' : ''}`}>
                    <div className="sidebar-header">STUDENTS ({participantsCount})</div>
                    <div className="participants-list">
                        <div className="participant-item self">
                            <div className="p-avatar">{user?.name?.charAt(0)}</div>
                            <span>{user?.name} (You)</span>
                        </div>
                        {isMockMode && [
                            { id: 1, name: 'Ameen', role: 'student' },
                            { id: 2, name: 'Sarah', role: 'student' },
                            { id: 3, name: 'John', role: 'student' }
                        ].map(p => (
                            <div key={p.id} className="participant-item">
                                <div className="p-avatar">{p.name.charAt(0)}</div>
                                <span>{p.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Video Area */}
                <div className="live-video-area">
                    <div className="live-video-container">
                        {!isMockMode ? (
                            <LiveKitRoom
                                video={!isCamOff}
                                audio={!isMicMuted}
                                screen={isScreenSharing}
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
                            <div className="live-video-preview" style={{ background: '#000', display: 'flex', flexDirection: isScreenSharing ? 'row' : 'column', gap: '10px', padding: '10px' }}>
                                {/* Main Camera Feed */}
                                <div style={{ flex: 2, position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#1e293b' }}>
                                    {!isCamOff ? (
                                        <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div className="cam-off-overlay">
                                            <div className="cam-off-icon">📷</div>
                                            <span>Camera Off</span>
                                        </div>
                                    )}
                                    <div className="mock-badge" style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(99, 102, 241, 0.8)' }}>
                                        {user?.name} (You)
                                    </div>
                                </div>

                                {/* Screen Share Feed */}
                                {isScreenSharing && (
                                    <div style={{ flex: 3, position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#0f172a', border: '2px solid var(--live-primary)' }}>
                                        <video ref={screenVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                        <div className="mock-badge" style={{ position: 'absolute', top: '10px', right: '10px' }}>SCREEN SHARING</div>
                                    </div>
                                )}

                                {!isCamOff && !isScreenSharing && (
                                    <div className="mock-overlay">
                                        <div className="mock-status">
                                            <div className="sesa-loader" style={{ width: '24px', height: '24px' }} />
                                            <span>STAGING REAL-TIME FEED...</span>
                                        </div>
                                        <div className="mock-badge">LOCAL PREVIEW</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Panel */}
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

            {/* Admin Overlay Panels */}
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

            {/* Controls Bar */}
            <div className="live-controls">
                <button className={`live-ctrl-btn ${isMicMuted ? 'muted' : ''}`} onClick={toggleMic} title={isMicMuted ? 'Unmute' : 'Mute'}>{isMicMuted ? '🔇' : '🎙️'}</button>
                <button className={`live-ctrl-btn ${isCamOff ? 'muted' : ''}`} onClick={toggleCam} title={isCamOff ? 'Turn Cam On' : 'Turn Cam Off'}>{isCamOff ? '📷❌' : '📷'}</button>
                <div className="live-ctrl-divider" />
                <button className={`live-ctrl-btn ${showParticipants ? 'active' : ''}`} onClick={() => setShowParticipants(!showParticipants)} title="Participants">👥</button>
                <button className={`live-ctrl-btn ${chatOpen ? 'active' : ''}`} onClick={() => setChatOpen(!chatOpen)} title="Toggle Chat">💬</button>
                <button className="live-ctrl-btn" onClick={raiseHand} title="Raise Hand">✋</button>
                <button className="live-ctrl-btn" onClick={handleScreenshot} title="Capture Screenshot">📸</button>
                {(isHost || isAdmin) && (
                    <>
                        <div className="live-ctrl-divider" />
                        <button className={`live-ctrl-btn ${isRecording ? 'active' : ''}`} onClick={handleToggleRecording} title="Toggle Recording">⏺</button>
                        <button className={`live-ctrl-btn ${isScreenSharing ? 'active' : ''}`} onClick={toggleScreenShare} title="Share Screen">{isScreenSharing ? '⏹️🖥️' : '🖥️'}</button>
                    </>
                )}
                <div className="live-ctrl-divider" />
                <button className="live-ctrl-btn danger" onClick={() => { navigate('/live/sessions'); }} title="Leave">📴</button>
            </div>
        </div>
    );
};

export default LiveStreamRoom;
