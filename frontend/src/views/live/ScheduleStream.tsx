import React, { useState, useEffect } from 'react';
import { useNavigate } from '@/lib/navigation';
import { liveStreamApi } from '../../services/liveStreamApi';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../../styles/livestream.css';

const ScheduleStream: React.FC = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        courseId: '',
        title: '',
        description: '',
        scheduledAt: '',
        maxParticipants: 50000,
        chatEnabled: true,
        raiseHandEnabled: true,
        waitingRoomEnabled: false,
        recordingEnabled: true,
        hlsEnabled: true
    });

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                // Fetch courses where the user is an instructor
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
                const res = await axios.get(`${API_URL}/courses/my/created`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setCourses(res.data || []);
                if (res.data?.length > 0) {
                    setFormData(prev => ({ ...prev, courseId: res.data[0]._id }));
                }
            } catch (err) {
                toast.error('Failed to load courses');
            }
        };
        fetchCourses();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.courseId || !formData.title) {
            toast.error('Please fill in required fields');
            return;
        }

        setLoading(true);
        try {
            await liveStreamApi.createSession(formData);
            toast.success('Live session scheduled successfully!');
            navigate('/live/sessions');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to schedule session');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="live-lobby" style={{ padding: '40px 20px' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ marginBottom: '32px' }}>
                    <h1 className="live-lobby-title">📅 Schedule Live Class</h1>
                    <p style={{ color: '#94a3b8', marginTop: '8px' }}>Create a new live session for your students.</p>
                </div>

                <form className="live-form" onSubmit={handleSubmit} style={{ background: 'rgba(30, 41, 59, 0.4)', borderRadius: '24px', border: '1px solid var(--live-border)', padding: '40px' }}>
                    <div className="live-form-group">
                        <label className="live-form-label">Select Course *</label>
                        <select 
                            className="live-form-input" 
                            value={formData.courseId} 
                            onChange={e => setFormData({ ...formData, courseId: e.target.value })}
                            required
                        >
                            <option value="">Select a course...</option>
                            {courses.map(c => (
                                <option key={c._id} value={c._id}>{c.title}</option>
                            ))}
                        </select>
                    </div>

                    <div className="live-form-group">
                        <label className="live-form-label">Session Title *</label>
                        <input 
                            className="live-form-input" 
                            type="text" 
                            placeholder="e.g. Advanced React Patterns - Week 4"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>

                    <div className="live-form-group">
                        <label className="live-form-label">Description</label>
                        <textarea 
                            className="live-form-input live-form-textarea" 
                            placeholder="What will students learn in this session?"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="live-form-group">
                            <label className="live-form-label">Scheduled Date & Time</label>
                            <input 
                                className="live-form-input" 
                                type="datetime-local"
                                value={formData.scheduledAt}
                                onChange={e => setFormData({ ...formData, scheduledAt: e.target.value })}
                            />
                        </div>
                        <div className="live-form-group">
                            <label className="live-form-label">Max Participants</label>
                            <input 
                                className="live-form-input" 
                                type="number"
                                value={formData.maxParticipants}
                                onChange={e => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                        <div className="live-form-toggle" onClick={() => setFormData({ ...formData, chatEnabled: !formData.chatEnabled })}>
                            <span style={{ fontSize: '14px', fontWeight: 600 }}>Enable Live Chat</span>
                            <div className={`live-toggle-switch ${formData.chatEnabled ? 'on' : ''}`} />
                        </div>
                        <div className="live-form-toggle" onClick={() => setFormData({ ...formData, raiseHandEnabled: !formData.raiseHandEnabled })}>
                            <span style={{ fontSize: '14px', fontWeight: 600 }}>Enable Hand Raising</span>
                            <div className={`live-toggle-switch ${formData.raiseHandEnabled ? 'on' : ''}`} />
                        </div>
                        <div className="live-form-toggle" onClick={() => setFormData({ ...formData, recordingEnabled: !formData.recordingEnabled })}>
                            <span style={{ fontSize: '14px', fontWeight: 600 }}>Auto-Record Session</span>
                            <div className={`live-toggle-switch ${formData.recordingEnabled ? 'on' : ''}`} />
                        </div>
                        <div className="live-form-toggle" onClick={() => setFormData({ ...formData, waitingRoomEnabled: !formData.waitingRoomEnabled })}>
                            <span style={{ fontSize: '14px', fontWeight: 600 }}>Enable Waiting Room</span>
                            <div className={`live-toggle-switch ${formData.waitingRoomEnabled ? 'on' : ''}`} />
                        </div>
                    </div>

                    <div style={{ marginTop: '40px', display: 'flex', gap: '16px' }}>
                        <button 
                            type="submit" 
                            className="live-btn live-btn-primary" 
                            style={{ flex: 1, justifyContent: 'center', height: '56px', fontSize: '16px' }}
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : '🚀 Create Live Session'}
                        </button>
                        <button 
                            type="button" 
                            className="live-btn live-btn-secondary" 
                            onClick={() => navigate('/live/sessions')}
                            style={{ height: '56px' }}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ScheduleStream;
