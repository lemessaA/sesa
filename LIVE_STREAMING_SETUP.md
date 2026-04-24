# Live Streaming Setup Guide

## Overview

The SESA Academy platform now supports production-ready live streaming with two modes:

1. **LiveKit Mode** (Production) - Scalable SFU-based streaming for 500+ participants
2. **P2P WebRTC Mode** (Development) - Direct peer-to-peer connections for testing

## Quick Start (Development Mode)

The system works out of the box in P2P mode without any additional configuration:

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000/live/sessions` to create and join live sessions.

## Production Setup (LiveKit)

For production deployments with better scalability and reliability:

### 1. Get LiveKit Credentials

**Option A: LiveKit Cloud (Recommended)**
1. Visit https://cloud.livekit.io
2. Create a free account
3. Create a new project
4. Copy your credentials:
   - API Key
   - API Secret
   - WebSocket URL (wss://your-project.livekit.cloud)

**Option B: Self-Hosted LiveKit**
1. Follow https://docs.livekit.io/deploy/
2. Deploy LiveKit server
3. Generate API credentials

### 2. Configure Backend

Update `backend/.env`:

```env
# LiveKit Configuration
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key_here
LIVEKIT_API_SECRET=your_api_secret_here

# Redis (Optional but recommended for production)
REDIS_URL=redis://localhost:6379
```

### 3. Configure Frontend

Update `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
```

### 4. Restart Services

```bash
# Backend
cd backend
npm run dev

# Frontend  
cd frontend
npm run dev
```

## Features

### Current Features ✅

- **Real-time Video/Audio Streaming**
  - HD video quality (1280x720)
  - Echo cancellation and noise suppression
  - Adaptive bitrate streaming (LiveKit mode)

- **Interactive Controls**
  - Mute/unmute microphone
  - Enable/disable camera
  - Screen sharing
  - Recording (host only)

- **Chat & Collaboration**
  - Real-time text chat
  - Raise hand feature
  - Participant list
  - Waiting room (optional)

- **Automatic Fallback**
  - Tries LiveKit first if configured
  - Falls back to P2P WebRTC automatically
  - No manual intervention needed

### Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Browser   │◄───────►│   Backend    │◄───────►│   LiveKit   │
│  (WebRTC)   │         │  (Node.js)   │         │     SFU     │
└─────────────┘         └──────────────┘         └─────────────┘
       │                        │
       │                        │
       ▼                        ▼
┌─────────────┐         ┌──────────────┐
│  Socket.io  │◄───────►│    Redis     │
│  (Signaling)│         │   (Cache)    │
└─────────────┘         └──────────────┘
```

## Troubleshooting

### Blank Screen Issues

**Problem**: Video shows blank/black screen

**Solutions**:

1. **Check Browser Permissions**
   ```
   - Chrome: Settings → Privacy → Site Settings → Camera/Microphone
   - Firefox: Preferences → Privacy → Permissions
   - Allow camera and microphone access for localhost
   ```

2. **Check Console Logs**
   ```
   - Open browser DevTools (F12)
   - Check Console tab for errors
   - Look for WebRTC connection errors
   ```

3. **Verify Backend Connection**
   ```bash
   # Check if backend is running
   curl http://localhost:5000/api/health
   
   # Check Socket.io connection
   # Should see "Socket connected" in browser console
   ```

4. **Test Media Devices**
   ```javascript
   // Run in browser console
   navigator.mediaDevices.getUserMedia({ video: true, audio: true })
     .then(stream => console.log('Media OK:', stream))
     .catch(err => console.error('Media Error:', err));
   ```

### Connection Issues

**Problem**: Cannot connect to session

**Solutions**:

1. **Check CORS Configuration**
   ```env
   # backend/.env
   CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000
   SOCKET_CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000
   ```

2. **Verify Socket.io URL**
   ```env
   # frontend/.env
   VITE_SOCKET_URL=http://localhost:5000
   ```

3. **Check Firewall/Network**
   - Ensure ports 5000 (backend) and 3000 (frontend) are open
   - Check if corporate firewall blocks WebRTC
   - Try disabling VPN temporarily

### LiveKit Connection Fails

**Problem**: Falls back to P2P even with credentials

**Solutions**:

1. **Verify Credentials**
   ```bash
   # Check if credentials are set
   echo $LIVEKIT_API_KEY
   echo $LIVEKIT_API_SECRET
   ```

2. **Test LiveKit Connection**
   ```bash
   # Install LiveKit CLI
   npm install -g livekit-cli
   
   # Test connection
   livekit-cli test-connection \
     --url wss://your-project.livekit.cloud \
     --api-key your_key \
     --api-secret your_secret
   ```

3. **Check Backend Logs**
   ```bash
   # Look for LiveKit connection messages
   tail -f backend/combined.log | grep LiveKit
   ```

## Performance Optimization

### For Development
- Use P2P mode (no configuration needed)
- Limit to 2-4 participants
- Use lower video quality if needed

### For Production
- Use LiveKit mode
- Enable Redis for better performance
- Configure CDN for static assets
- Use TURN servers for better connectivity

### Video Quality Settings

Edit `frontend/src/pages/live/LiveStreamRoom.tsx`:

```typescript
// Lower quality for slower connections
const stream = await navigator.mediaDevices.getUserMedia({ 
    video: { width: 640, height: 480 }, // Lower resolution
    audio: true 
});

// Higher quality for better connections
const stream = await navigator.mediaDevices.getUserMedia({ 
    video: { width: 1920, height: 1080 }, // Full HD
    audio: true 
});
```

## API Endpoints

### Create Session
```http
POST /api/live-stream/sessions
Authorization: Bearer <token>
Content-Type: application/json

{
  "courseId": "course_id",
  "title": "Live Class",
  "scheduledAt": "2024-01-01T10:00:00Z",
  "maxParticipants": 100
}
```

### Start Session (Host)
```http
POST /api/live-stream/sessions/:id/start
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "token": "livekit_token",
    "serverUrl": "wss://...",
    "session": {...}
  }
}
```

### Join Session (Student)
```http
POST /api/live-stream/sessions/:id/join
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "token": "livekit_token",
    "serverUrl": "wss://...",
    "session": {...}
  }
}
```

## Security Considerations

1. **Token Expiration**
   - Host tokens: 4 hours
   - Participant tokens: 1 hour
   - Tokens auto-refresh in LiveKit mode

2. **Permissions**
   - Only instructors can start sessions
   - Waiting room for controlled access
   - Host can kick participants

3. **Data Privacy**
   - Recordings stored securely
   - Chat messages encrypted in transit
   - No data stored in P2P mode

## Monitoring

### Backend Logs
```bash
# View all logs
tail -f backend/combined.log

# View errors only
tail -f backend/error.log

# Filter live streaming logs
tail -f backend/combined.log | grep LiveStream
```

### Frontend Console
- Open DevTools (F12)
- Check Console for connection status
- Monitor Network tab for API calls
- Check WebRTC stats in chrome://webrtc-internals

## Support

For issues or questions:
1. Check browser console for errors
2. Review backend logs
3. Test with different browsers
4. Verify network connectivity
5. Check LiveKit status (if using cloud)

## Next Steps

- [ ] Add recording playback UI
- [ ] Implement breakout rooms
- [ ] Add virtual backgrounds
- [ ] Support mobile apps
- [ ] Add analytics dashboard
