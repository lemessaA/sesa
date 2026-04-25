import React, { useState, useEffect } from 'react';
import { useNavigate } from '@/lib/navigation';
import { liveStreamApi, LiveSession } from '../../services/liveStreamApi';
import { toast } from 'react-toastify';
import '../../styles/livestream.css';

const AdminMonitor: React.FC = () => {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState<LiveSession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMonitor = async () => {
            try {
                const res = await liveStreamApi.getAdminMonitor();
                setSessions(res.data || []);
            } catch (err) {
                toast.error('Failed to load monitor data');
            } finally {
                setLoading(false);
            }
        };
        fetchMonitor();
        const interval = setInterval(fetchMonitor, 5000); // 5s refresh for admin
        return () => clearInterval(interval);
    }, []);

    const handleForceStop = async (id: string) => {
        if (!confirm('CRITICAL: Are you sure you want to FORCE STOP this session? This will disconnect all users immediately.')) return;
        try {
            await liveStreamApi.forceStopSession(id);
            toast.success('Session force-stopped');
            setSessions(prev => prev.filter(s => s._id !== id));
        } catch (err) {
            toast.error('Failed to stop session');
        }
    };

    return (
        <div className="live-lobby" style={{ padding: '40px 32px' }}>
            <div className="live-lobby-header">
                <div>
                    <h1 className="live-lobby-title">🛡️ Global Monitor</h1>
                    <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '8px' }}>Real-time oversight of all active live streams on the platform.</p>
                </div>
                <button className="live-btn live-btn-secondary" onClick={() => navigate('/live/sessions')}>Back to Sessions</button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px 0' }}>
                    <div style={{ width: '48px', height: '48px', border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
                </div>
            ) : sessions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px 0', background: 'rgba(30, 41, 59, 0.2)', borderRadius: '32px', border: '1px solid var(--live-border)' }}>
                    <div style={{ fontSize: '64px', marginBottom: '24px' }}>📡</div>
                    <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: 900, fontStyle: 'italic' }}>No Active Streams</h2>
                    <p style={{ color: '#94a3b8', marginTop: '8px' }}>There are currently no live sessions running on the platform.</p>
                </div>
            ) : (
                <div className="live-monitor-grid">
                    {sessions.map(session => (
                        <div key={session._id} className="live-monitor-card active" style={{ padding: '24px', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '24px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                <div className="live-badge live-badge-live">ACTIVE</div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ color: '#10b981', fontSize: '14px', fontWeight: 900 }}>👁 {session.liveParticipantCount || 0}</div>
                                    <div style={{ color: '#64748b', fontSize: '10px', fontWeight: 800 }}>LIVE VIEWERS</div>
                                </div>
                            </div>
                            
                            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginBottom: '4px', fontStyle: 'italic' }}>{session.title}</h3>
                            <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '16px' }}>📚 {session.courseId?.title}</div>
                            
                            <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <img src={session.hostId?.profileImage || '/default-avatar.png'} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                                    <div>
                                        <div style={{ color: '#fff', fontSize: '13px', fontWeight: 700 }}>{session.hostId?.name}</div>
                                        <div style={{ color: '#64748b', fontSize: '11px' }}>{session.hostId?.email}</div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button 
                                    className="live-btn live-btn-primary" 
                                    style={{ flex: 1, padding: '10px', fontSize: '12px' }}
                                    onClick={() => navigate(`/live/room/${session._id}`)}
                                >
                                    👀 View Stream
                                </button>
                                <button 
                                    className="live-btn live-btn-danger" 
                                    style={{ flex: 1, padding: '10px', fontSize: '12px' }}
                                    onClick={() => handleForceStop(session._id)}
                                >
                                    🚫 Force Stop
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminMonitor;
