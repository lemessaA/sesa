import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

class StreamErrorBoundary extends Component<Props, State> {
    public state: State = { hasError: false, error: null };
    public static getDerivedStateFromError(error: Error): State { return { hasError: true, error }; }
    public componentDidCatch(error: Error, errorInfo: ErrorInfo) { console.error('Uncaught error in LiveStream:', error, errorInfo); }
    private handleReset = () => { this.setState({ hasError: false, error: null }); window.location.reload(); };

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                    <div style={{ maxWidth: '420px', width: '100%', background: 'rgba(30,41,59,0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '24px', padding: '48px 32px', textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
                        <div style={{ width: '72px', height: '72px', background: 'rgba(239,68,68,0.15)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '32px' }}>⚠️</div>
                        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '8px', fontStyle: 'italic' }}>Connection Interrupted</h2>
                        <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6, marginBottom: '32px' }}>Something went wrong with the media stream. This can happen due to network instability or session expiry.</p>
                        <button onClick={this.handleReset} style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontWeight: 800, border: 'none', borderRadius: '16px', cursor: 'pointer', fontSize: '15px', marginBottom: '12px', transition: 'transform 0.2s' }}>
                            🔄 Reconnect Now
                        </button>
                        <a href="/live/sessions" style={{ display: 'block', width: '100%', padding: '16px', background: 'rgba(51,65,85,0.5)', color: '#cbd5e1', fontWeight: 700, border: '1px solid rgba(71,85,105,0.5)', borderRadius: '16px', textDecoration: 'none', fontSize: '14px', boxSizing: 'border-box' }}>
                            🏠 Back to Lobby
                        </a>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default StreamErrorBoundary;
