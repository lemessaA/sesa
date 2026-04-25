import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_URL, withCredentials: true });

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
            const code = error.response?.data?.code;
            if (code === 'TOKEN_INVALID' || code === 'TOKEN_MISSING') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.dispatchEvent(new Event('sesa:unauthorized'));
                error.response.data.message = 'Your session has expired. Please login again.';
            }
        }
        return Promise.reject(error);
    }
);

export interface LiveSession {
    _id: string;
    roomId: string;
    courseId: string | any;
    hostId: string | any;
    title: string;
    description?: string;
    status: 'scheduled' | 'live' | 'ended' | 'cancelled';
    scheduledAt?: string;
    startedAt?: string;
    endedAt?: string;
    createdAt?: string;
    maxParticipants: number;
    participantCount: number;
    peakParticipants: number;
    liveParticipantCount?: number;
    allowedRoles: string[];
    isRecording: boolean;
    recordingUrl?: string;
    chatEnabled?: boolean;
    raiseHandEnabled?: boolean;
    waitingRoomEnabled?: boolean;
    recordingEnabled?: boolean;
    screenShareEnabled?: boolean;
    hlsEnabled?: boolean;
    hlsPlaybackUrl?: string;
    analytics?: {
        totalAttendees: number;
        peakConcurrent: number;
        dropOffRate: number;
        avgWatchTimeSeconds: number;
        chatMessageCount: number;
        handRaiseCount: number;
    };
}

export const liveStreamApi = {
    createSession: async (data: Partial<LiveSession>) => (await api.post('/live-stream/sessions', data)).data,
    listSessions: async (params?: any) => (await api.get('/live-stream/sessions', { params })).data,
    getSession: async (id: string) => (await api.get(`/live-stream/sessions/${id}`)).data,
    startSession: async (id: string) => (await api.post(`/live-stream/sessions/${id}/start`)).data,
    joinSession: async (id: string) => (await api.post(`/live-stream/sessions/${id}/join`)).data,
    endSession: async (id: string) => (await api.post(`/live-stream/sessions/${id}/end`)).data,
    updateSession: async (id: string, data: Partial<LiveSession>) => (await api.patch(`/live-stream/sessions/${id}`, data)).data,
    kickParticipant: async (sessionId: string, targetUserId: string) => (await api.post(`/live-stream/sessions/${sessionId}/kick`, { targetUserId })).data,
    approveParticipant: async (sessionId: string, targetUserId: string) => (await api.post(`/live-stream/sessions/${sessionId}/approve`, { targetUserId })).data,
    toggleRecording: async (sessionId: string) => (await api.post(`/live-stream/sessions/${sessionId}/recording/toggle`)).data,
    getParticipants: async (id: string) => (await api.get(`/live-stream/sessions/${id}/participants`)).data,
    getAdminMonitor: async () => (await api.get('/live-stream/admin/monitor')).data,
    forceStopSession: async (id: string) => (await api.post(`/live-stream/admin/force-stop/${id}`)).data,
    getAnalyticsDashboard: async (courseId?: string) => (await api.get('/live-stream/analytics/dashboard', { params: { courseId } })).data,
    getSessionAnalytics: async (id: string) => (await api.get(`/live-stream/analytics/session/${id}`)).data,
};
