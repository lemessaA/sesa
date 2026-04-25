/**
 * useWebRTC â€” WebRTC P2P mesh hook for classroom streaming.
 * Used when LiveKit is not configured. Manages peer connections,
 * local/remote media streams, screen sharing, and track negotiation
 * via Socket.IO signaling.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { toast } from 'react-toastify';

export interface PeerInfo {
    peerId: string;
    peerName: string;
    peerRole: string;
}

export interface RemoteStreamInfo {
    peerId: string;
    peerName: string;
    peerRole: string;
    stream: MediaStream;
    kind: 'camera' | 'screen';
}

interface UseWebRTCOptions {
    socket: Socket | null;
    userId: string;
    userName: string;
    userRole: string;
    isHost: boolean;
    enabled: boolean;
}

const ICE_CONFIG: RTCConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

export const useWebRTC = (opts: UseWebRTCOptions) => {
    const { socket, userId, enabled } = opts;

    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
    const [remoteStreams, setRemoteStreams] = useState<RemoteStreamInfo[]>([]);
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [isCamOff, setIsCamOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [screenSharerId, setScreenSharerId] = useState<string | null>(null);
    const [isForceMuted, setIsForceMuted] = useState(false);

    // Refs to keep current values in callbacks
    const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
    const peerMetaRef = useRef<Map<string, PeerInfo>>(new Map());
    const localStreamRef = useRef<MediaStream | null>(null);
    const screenStreamRef = useRef<MediaStream | null>(null);
    const makingOfferRef = useRef<Set<string>>(new Set());

    // â”€â”€ Create peer connection â”€â”€
    const createPeerConnection = useCallback((peerId: string, meta: PeerInfo): RTCPeerConnection => {
        if (pcsRef.current.has(peerId)) {
            pcsRef.current.get(peerId)!.close();
        }

        const pc = new RTCPeerConnection(ICE_CONFIG);
        pcsRef.current.set(peerId, pc);
        peerMetaRef.current.set(peerId, meta);

        // Add local tracks to the connection
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current!);
            });
        }
        // Add screen share tracks if sharing
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, screenStreamRef.current!);
            });
        }

        // Handle incoming remote tracks
        pc.ontrack = (event) => {
            const [remoteStream] = event.streams;
            if (!remoteStream) return;
            setRemoteStreams(prev => {
                const filtered = prev.filter(s => !(s.peerId === peerId && s.stream.id === remoteStream.id));
                // Determine if this is a screen share stream (has only video, no audio)
                const isScreen = remoteStream.getVideoTracks().length > 0 && remoteStream.getAudioTracks().length === 0
                    && prev.some(s => s.peerId === peerId && s.kind === 'camera');
                return [...filtered, {
                    peerId,
                    peerName: meta.peerName,
                    peerRole: meta.peerRole,
                    stream: remoteStream,
                    kind: isScreen ? 'screen' : 'camera',
                }];
            });
        };

        // ICE candidate handling
        pc.onicecandidate = (event) => {
            if (event.candidate && socket) {
                socket.emit('live:webrtc_ice_candidate', { to: peerId, candidate: event.candidate });
            }
        };

        // Negotiation needed â€” perfect negotiation pattern
        pc.onnegotiationneeded = async () => {
            try {
                makingOfferRef.current.add(peerId);
                await pc.setLocalDescription();
                socket?.emit('live:webrtc_offer', { to: peerId, offer: pc.localDescription });
            } catch (err) {
                console.error('[WebRTC] negotiation error:', err);
            } finally {
                makingOfferRef.current.delete(peerId);
            }
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                setRemoteStreams(prev => prev.filter(s => s.peerId !== peerId));
            }
        };

        return pc;
    }, [socket]);

    // â”€â”€ Initialize local media â”€â”€
    const startLocalMedia = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;
            setLocalStream(stream);
            return stream;
        } catch (err: any) {
            console.error('[WebRTC] getUserMedia failed:', err);
            // Try audio only
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
                localStreamRef.current = stream;
                setLocalStream(stream);
                setIsCamOff(true);
                toast.warning('Camera not available, using audio only');
                return stream;
            } catch {
                toast.error('Could not access camera or microphone');
                return null;
            }
        }
    }, []);

    // â”€â”€ Connect to a peer â”€â”€
    const connectToPeer = useCallback((peer: PeerInfo) => {
        const pc = createPeerConnection(peer.peerId, peer);
        // The onnegotiationneeded handler will fire and send the offer
        return pc;
    }, [createPeerConnection]);

    // â”€â”€ Toggle Mic â”€â”€
    const toggleMic = useCallback(() => {
        if (isForceMuted) {
            toast.warning('You have been muted by the host');
            return;
        }
        const stream = localStreamRef.current;
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMicMuted(!audioTrack.enabled);
            }
        }
    }, [isForceMuted]);

    // â”€â”€ Toggle Camera â”€â”€
    const toggleCam = useCallback(() => {
        const stream = localStreamRef.current;
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsCamOff(!videoTrack.enabled);
            }
        }
    }, []);

    // â”€â”€ Start Screen Share â”€â”€
    const startScreenShare = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
            screenStreamRef.current = stream;
            setScreenStream(stream);
            setIsScreenSharing(true);

            // Add screen tracks to all existing peer connections
            pcsRef.current.forEach((pc) => {
                stream.getTracks().forEach(track => {
                    pc.addTrack(track, stream);
                });
            });

            // Notify server
            socket?.emit('live:screen_share_start');

            // Handle when user stops sharing via browser UI
            stream.getVideoTracks()[0].onended = () => {
                stopScreenShare();
            };
        } catch (err: any) {
            console.error('[WebRTC] getDisplayMedia failed:', err);
            if (err.name !== 'NotAllowedError') {
                toast.error('Screen sharing failed');
            }
        }
    }, [socket]);

    // â”€â”€ Stop Screen Share â”€â”€
    const stopScreenShare = useCallback(() => {
        const stream = screenStreamRef.current;
        if (stream) {
            // Remove screen tracks from all peer connections
            pcsRef.current.forEach((pc) => {
                const senders = pc.getSenders();
                stream.getTracks().forEach(track => {
                    const sender = senders.find(s => s.track === track);
                    if (sender) pc.removeTrack(sender);
                    track.stop();
                });
            });
            screenStreamRef.current = null;
            setScreenStream(null);
        }
        setIsScreenSharing(false);
        socket?.emit('live:screen_share_stop');
    }, [socket]);

    // â”€â”€ Socket event listeners for signaling â”€â”€
    useEffect(() => {
        if (!socket || !enabled) return;

        // Receive list of existing peers when we join
        const handlePeersList = ({ peers }: { peers: PeerInfo[] }) => {
            peers.forEach(peer => {
                if (peer.peerId !== userId) {
                    connectToPeer(peer);
                }
            });
        };

        // A new peer joined â€” create connection to them
        const handlePeerJoined = (data: any) => {
            if (data.peerId && data.peerId !== userId) {
                const peer: PeerInfo = { peerId: data.peerId, peerName: data.peerName || data.userName, peerRole: data.peerRole || data.role };
                connectToPeer(peer);
            }
        };

        // A peer left â€” clean up
        const handlePeerLeft = (data: any) => {
            const peerId = data.peerId || data.userId;
            if (peerId) {
                pcsRef.current.get(peerId)?.close();
                pcsRef.current.delete(peerId);
                peerMetaRef.current.delete(peerId);
                setRemoteStreams(prev => prev.filter(s => s.peerId !== peerId));
            }
        };

        // WebRTC Offer received
        const handleOffer = async ({ from, offer }: { from: string; offer: RTCSessionDescriptionInit }) => {
            let pc = pcsRef.current.get(from);
            const polite = userId < from; // Deterministic politeness

            if (!pc) {
                // Create a new connection for this unknown peer
                const meta = peerMetaRef.current.get(from) || { peerId: from, peerName: 'Participant', peerRole: 'student' };
                pc = createPeerConnection(from, meta);
            }

            const offerCollision = makingOfferRef.current.has(from) || pc.signalingState !== 'stable';
            if (!polite && offerCollision) return; // Impolite side ignores collision

            try {
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                await pc.setLocalDescription();
                socket.emit('live:webrtc_answer', { to: from, answer: pc.localDescription });
            } catch (err) {
                console.error('[WebRTC] handleOffer error:', err);
            }
        };

        // WebRTC Answer received
        const handleAnswer = async ({ from, answer }: { from: string; answer: RTCSessionDescriptionInit }) => {
            const pc = pcsRef.current.get(from);
            if (!pc) return;
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
            } catch (err) {
                console.error('[WebRTC] handleAnswer error:', err);
            }
        };

        // ICE Candidate received
        const handleIceCandidate = async ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
            const pc = pcsRef.current.get(from);
            if (!pc) return;
            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
                console.error('[WebRTC] addIceCandidate error:', err);
            }
        };

        // Screen share events
        const handleScreenShareStarted = ({ userId: sharerId }: { userId: string }) => {
            setScreenSharerId(sharerId);
        };
        const handleScreenShareStopped = ({ userId: sharerId }: { userId: string }) => {
            setScreenSharerId(prev => prev === sharerId ? null : prev);
            setRemoteStreams(prev => prev.filter(s => !(s.peerId === sharerId && s.kind === 'screen')));
        };

        // Force mute
        const handleMuted = ({ muted, byName }: { muted: boolean; by: string; byName: string }) => {
            setIsForceMuted(muted);
            if (muted) {
                const stream = localStreamRef.current;
                if (stream) {
                    stream.getAudioTracks().forEach(t => { t.enabled = false; });
                }
                setIsMicMuted(true);
                toast.warning(`${byName || 'Host'} muted your microphone`);
            } else {
                toast.info('You have been unmuted. You can now speak.');
            }
        };

        // Force stop screen share
        const handleForceStopScreen = () => {
            stopScreenShare();
            toast.warning('Host stopped your screen share');
        };

        socket.on('live:peers_list', handlePeersList);
        socket.on('live:participant_joined', handlePeerJoined);
        socket.on('live:participant_left', handlePeerLeft);
        socket.on('live:webrtc_offer', handleOffer);
        socket.on('live:webrtc_answer', handleAnswer);
        socket.on('live:webrtc_ice_candidate', handleIceCandidate);
        socket.on('live:screen_share_started', handleScreenShareStarted);
        socket.on('live:screen_share_stopped', handleScreenShareStopped);
        socket.on('live:muted', handleMuted);
        socket.on('live:force_stop_screen_share', handleForceStopScreen);

        return () => {
            socket.off('live:peers_list', handlePeersList);
            socket.off('live:participant_joined', handlePeerJoined);
            socket.off('live:participant_left', handlePeerLeft);
            socket.off('live:webrtc_offer', handleOffer);
            socket.off('live:webrtc_answer', handleAnswer);
            socket.off('live:webrtc_ice_candidate', handleIceCandidate);
            socket.off('live:screen_share_started', handleScreenShareStarted);
            socket.off('live:screen_share_stopped', handleScreenShareStopped);
            socket.off('live:muted', handleMuted);
            socket.off('live:force_stop_screen_share', handleForceStopScreen);
        };
    }, [socket, enabled, userId, connectToPeer, createPeerConnection, stopScreenShare]);

    // â”€â”€ Initialize local media on mount â”€â”€
    useEffect(() => {
        if (!enabled) return;
        startLocalMedia();
        return () => {
            // Cleanup all streams and connections
            localStreamRef.current?.getTracks().forEach(t => t.stop());
            screenStreamRef.current?.getTracks().forEach(t => t.stop());
            pcsRef.current.forEach(pc => pc.close());
            pcsRef.current.clear();
            peerMetaRef.current.clear();
        };
    }, [enabled, startLocalMedia]);

    return {
        localStream,
        screenStream,
        remoteStreams,
        isMicMuted,
        isCamOff,
        isScreenSharing,
        screenSharerId,
        isForceMuted,
        toggleMic,
        toggleCam,
        startScreenShare,
        stopScreenShare,
    };
};
