import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { liveStreamApi, LiveSession } from '../../services/liveStreamApi';
import { toast } from 'react-toastify';
import '../../styles/livestream.css';

const LiveStreamLobby: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState<LiveSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');

    const isHost = ['instructor', 'admin', 'super_admin', 'assistant_instructor'].includes(user?.role || '');
    const isAdmin = ['admin', 'super_admin'].includes(user?.role || '');

    useEffect(() => {
        fetchSessions();
        const interval = setInterval(fetchSessions, 10000);
        return () => clearInterval(interval);
    }, [filter]);

    const fetchSessions = async () => {
        try {
            const params: any = {};
            if (filter !== 'all') params.status = filter;
            const res = await liveStreamApi.listSessions(params);
            setSessions(res.data || []);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to load sessions');
        } finally { setLoading(false); }
    };

    const handleJoinOrStart = async (session: LiveSession) => {
        if (session.status === 'live') {
            navigate(`/live/room/${session._id}`);
        } else if (session.status === 'scheduled' && isHost && session.hostId?._id === user?.id) {
            try {
                await liveStreamApi.startSession(session._id);
                navigate(`/live/room/${session._id}`);
            } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to start'); }
        } else if (session.status === 'ended' && session.recordingUrl) {
            navigate(`/live/recording/${session._id}`);
        }
    };

    const formatDate = (d?: string) => d ? new Date(d).toLocaleString() : '';
    const getStatusDot = (s: string) => s === 'live' ? '🔴' : s === 'scheduled' ? '🟡' : '⚫';

    return (
        <div className="live-lobby">
            <div className="live-lobby-header">
                <div>
                    <h1 className="live-lobby-title">📡 Live Classes</h1>
                    <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>
                        {isAdmin ? 'All sessions across the platform' : isHost ? 'Your live streaming sessions' : 'Available live classes for your courses'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <select value={filter} onChange={e => setFilter(e.target.value)} className="live-form-input" style={{ width: '160px', padding: '10px 14px', fontSize: '13px' }}>
                        <option value="all">All Sessions</option>
                        <option value="live">🔴 Live Now</option>
                        <option value="scheduled">📅 Scheduled</option>
                        <option value="ended">✅ Ended</option>
                    </select>
                    {isHost && (
                        <button onClick={() => navigate('/instructor/live/create')} className="live-btn live-btn-primary">
                            ➕ Create Session
                        </button>
                    )}
                    {isAdmin && (
                        <button onClick={() => navigate('/live/admin')} className="live-btn live-btn-secondary">
                            🛡️ Monitor
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                    <div style={{ width: '48px', height: '48px', border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                    <p style={{ color: '#94a3b8', fontWeight: 600 }}>Loading sessions...</p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            ) : sessions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>📺</div>
                    <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 800, fontStyle: 'italic' }}>No Sessions Found</h3>
                    <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '8px' }}>
                        {isHost ? 'Create your first live session to get started!' : 'No live sessions available for your courses yet.'}
                    </p>
                </div>
            ) : (
                <div className="live-lobby-grid">
                    {sessions.map(session => (
                        <div key={session._id} className="live-session-card" onClick={() => handleJoinOrStart(session)}>
                            <div className={`live-session-status ${session.status}`}>
                                {getStatusDot(session.status)} {session.status.toUpperCase()}
                            </div>
                            <h3 className="live-session-title">{session.title}</h3>
                            <div className="live-session-meta">
                                <div style={{ marginBottom: '4px' }}>👨‍🏫 {session.hostId?.name || 'Instructor'}</div>
                                <div style={{ marginBottom: '4px' }}>📚 {session.courseId?.title || 'Course'}</div>
                                {session.status === 'live' && (
                                    <div style={{ color: '#10b981', fontWeight: 700 }}>
                                        👁 {session.liveParticipantCount || session.participantCount || 0} watching
                                    </div>
                                )}
                                {session.status === 'scheduled' && session.scheduledAt && (
                                    <div>📅 {formatDate(session.scheduledAt)}</div>
                                )}
                                {session.status === 'ended' && session.endedAt && (
                                    <div>✅ Ended {formatDate(session.endedAt)}</div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                                {session.chatEnabled && <span style={{ padding: '2px 8px', background: 'rgba(99,102,241,0.1)', borderRadius: '6px', fontSize: '11px', color: '#a5b4fc' }}>💬 Chat</span>}
                                {session.raiseHandEnabled && <span style={{ padding: '2px 8px', background: 'rgba(245,158,11,0.1)', borderRadius: '6px', fontSize: '11px', color: '#fbbf24' }}>✋ Hand</span>}
                                {session.recordingEnabled && <span style={{ padding: '2px 8px', background: 'rgba(239,68,68,0.1)', borderRadius: '6px', fontSize: '11px', color: '#f87171' }}>⏺ Rec</span>}
                            </div>
                            {session.status === 'live' && (
                                <button className="live-btn live-btn-primary" style={{ width: '100%', marginTop: '16px', justifyContent: 'center' }}>
                                    🚀 Join Live Class
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LiveStreamLobby;
