import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { liveStreamApi, LiveSession } from '../../services/liveStreamApi';
import { toast } from 'react-toastify';
import '../../styles/livestream.css';

const RecordingViewer: React.FC = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const [session, setSession] = useState<LiveSession | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!sessionId) return;
        const fetchSession = async () => {
            try {
                const res = await liveStreamApi.getSession(sessionId);
                setSession(res.data);
                if (!res.data.recordingUrl && res.data.status === 'ended') {
                    toast.info('Recording is still processing. Please check back later.');
                }
            } catch (err) {
                toast.error('Failed to load recording');
                navigate('/live/sessions');
            } finally {
                setLoading(false);
            }
        };
        fetchSession();
    }, [sessionId]);

    if (loading) {
        return (
            <div className="live-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '48px', height: '48px', border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
        );
    }

    return (
        <div className="live-container">
            <div className="live-topbar">
                <div className="live-topbar-info">
                    <button onClick={() => navigate('/live/sessions')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' }}>←</button>
                    <span className="live-topbar-title">Recording: {session?.title}</span>
                    <span className="live-badge" style={{ background: 'rgba(100, 116, 139, 0.15)', color: '#94a3b8' }}>ARCHIVED</span>
                </div>
            </div>

            <div className="live-video-area" style={{ padding: '40px' }}>
                <div className="live-video-container" style={{ maxWidth: '1000px' }}>
                    {session?.recordingUrl ? (
                        <video 
                            src={session.recordingUrl} 
                            controls 
                            autoPlay 
                            className="w-full h-full"
                            poster={session.courseId?.thumbnailUrl}
                        />
                    ) : (
                        <div className="live-video-placeholder">
                            <div className="live-video-placeholder-icon">📼</div>
                            <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: 800 }}>Recording Processing</h3>
                            <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '8px' }}>The recording for this session is being processed by the server.</p>
                            <button className="live-btn live-btn-secondary" style={{ marginTop: '24px' }} onClick={() => navigate('/live/sessions')}>Back to Lobby</button>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ maxWidth: '1000px', margin: '0 auto 40px', padding: '0 40px', width: '100%', boxSizing: 'border-box' }}>
                <div style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: '24px', border: '1px solid var(--live-border)', padding: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                        <div>
                            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', fontStyle: 'italic', marginBottom: '8px' }}>{session?.title}</h2>
                            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Session held on {session?.endedAt ? new Date(session.endedAt).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ color: '#a5b4fc', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Instructor</div>
                            <div style={{ color: '#fff', fontWeight: 700 }}>{session?.hostId?.name}</div>
                        </div>
                    </div>
                    <div style={{ height: '1px', background: 'var(--live-border)', margin: '24px 0' }} />
                    <h4 style={{ color: '#a5b4fc', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '12px' }}>Description</h4>
                    <p style={{ color: '#cbd5e1', fontSize: '15px', lineHeight: 1.6 }}>{session?.description || 'No description provided for this session.'}</p>
                    
                    <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                        <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '16px', borderRadius: '16px', border: '1px solid var(--live-border)' }}>
                            <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Peak Viewers</div>
                            <div style={{ color: '#fff', fontSize: '18px', fontWeight: 800 }}>{session?.peakParticipants || 0}</div>
                        </div>
                        <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '16px', borderRadius: '16px', border: '1px solid var(--live-border)' }}>
                            <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Total Messages</div>
                            <div style={{ color: '#fff', fontSize: '18px', fontWeight: 800 }}>{session?.analytics?.chatMessageCount || 0}</div>
                        </div>
                        <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '16px', borderRadius: '16px', border: '1px solid var(--live-border)' }}>
                            <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Hand Raises</div>
                            <div style={{ color: '#fff', fontSize: '18px', fontWeight: 800 }}>{session?.analytics?.handRaiseCount || 0}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecordingViewer;
