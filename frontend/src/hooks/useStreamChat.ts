import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-toastify';

export interface ChatMessage {
    id: string;
    userId: string;
    userName: string;
    text: string;
    timestamp: Date;
    role: string;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

export const useStreamChat = (sessionId: string) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [participantsCount, setParticipantsCount] = useState(0);
    const [handQueue, setHandQueue] = useState<any[]>([]);
    const [waitingUsers, setWaitingUsers] = useState<any[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token || !sessionId) return;

        const newSocket = io(`${SOCKET_URL}/live`, {
            auth: { token },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        newSocket.on('connect', () => { setIsConnected(true); newSocket.emit('live:join', { sessionId }); });
        newSocket.on('disconnect', () => setIsConnected(false));
        newSocket.on('live:chat_history', (history: any[]) => setMessages(history.map(m => ({ ...m, timestamp: new Date(m.timestamp) }))));
        newSocket.on('live:chat_message', (msg: any) => setMessages(prev => [...prev, { ...msg, timestamp: new Date(msg.timestamp) }]));
        newSocket.on('live:message_deleted', ({ messageId }: any) => setMessages(prev => prev.filter(m => m.id !== messageId)));
        newSocket.on('live:participant_joined', (data: any) => setParticipantsCount(data.count));
        newSocket.on('live:participant_left', (data: any) => setParticipantsCount(data.count));
        newSocket.on('live:hand_raised', (data: any) => { setHandQueue(data.queue || []); toast.info(`${data.userName} raised their hand`); });
        newSocket.on('live:hand_lowered', (data: any) => setHandQueue(data.queue || []));
        newSocket.on('live:waiting_room_update', (data: any) => {
            if (data.action === 'join') setWaitingUsers(prev => [...prev.filter(u => u.userId !== data.userId), data]);
            else if (data.action === 'approve') setWaitingUsers(prev => prev.filter(u => u.userId !== data.userId));
        });
        newSocket.on('live:error', (err: any) => toast.error(err.message));
        newSocket.on('live:kicked', (data: any) => { toast.error(data.message || 'You have been removed'); window.location.href = '/live/sessions'; });
        newSocket.on('live:session_ended', () => { toast.info('The session has ended'); window.location.href = '/live/sessions'; });

        setSocket(newSocket);
        return () => { newSocket.disconnect(); };
    }, [sessionId]);

    const sendMessage = useCallback((text: string) => { if (socket?.connected) socket.emit('live:chat', { text }); }, [socket]);
    const deleteMessage = useCallback((messageId: string) => { if (socket?.connected) socket.emit('live:delete_message', { messageId }); }, [socket]);
    const raiseHand = useCallback(() => { if (socket?.connected) socket.emit('live:raise_hand'); }, [socket]);
    const lowerHand = useCallback((targetUserId?: string) => { if (socket?.connected) socket.emit('live:lower_hand', { targetUserId }); }, [socket]);
    const muteUser = useCallback((targetUserId: string, muted: boolean) => { if (socket?.connected) socket.emit('live:mute_user', { targetUserId, muted }); }, [socket]);

    return { messages, participantsCount, handQueue, waitingUsers, isConnected, sendMessage, deleteMessage, raiseHand, lowerHand, muteUser, socket };
};
