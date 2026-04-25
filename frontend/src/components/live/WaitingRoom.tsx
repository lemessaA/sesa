import React from 'react';
import '../../styles/livestream.css';

interface WaitingRoomProps {
    sessionTitle: string;
    userName: string;
    onLeave: () => void;
}

const WaitingRoom: React.FC<WaitingRoomProps> = ({ sessionTitle, userName, onLeave }) => {

    return (
        <div className="live-container" style={{ alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)' }}>
            <div style={{ maxWidth: '480px', width: '100%', background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(20px)', border: '1px solid var(--live-border)', borderRadius: '32px', padding: '48px 40px', textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
                <div style={{ width: '80px', height: '80px', background: 'rgba(99,102,241,0.1)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', fontSize: '36px', animation: 'float 3s ease-in-out infinite' }}>
                    🚪
                </div>
                
                <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#fff', marginBottom: '12px', fontStyle: 'italic', letterSpacing: '-0.02em' }}>
                    Waiting Room
                </h1>
                
                <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: 1.6, marginBottom: '32px' }}>
                    Hello <span style={{ color: '#fff', fontWeight: 700 }}>{userName}</span>, the host has been notified. Please wait while they approve your entry to <span style={{ color: '#a5b4fc', fontWeight: 700 }}>{sessionTitle}</span>.
                </p>

                <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '16px', padding: '20px', border: '1px solid var(--live-border)', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                        <div style={{ width: '8px', height: '8px', background: '#6366f1', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
                        <span style={{ color: '#a5b4fc', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            Awaiting Approval
                        </span>
                    </div>
                </div>

                <button 
                    onClick={onLeave}
                    className="live-btn live-btn-secondary" 
                    style={{ width: '100%', justifyContent: 'center', height: '52px' }}
                >
                    Leave Waiting Room
                </button>
            </div>

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(0.95); opacity: 0.5; }
                    50% { transform: scale(1.05); opacity: 1; }
                    100% { transform: scale(0.95); opacity: 0.5; }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
            `}</style>
        </div>
    );
};

export default WaitingRoom;
