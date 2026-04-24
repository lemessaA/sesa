# Quick Start - Live Streaming

## 🚀 Start in 3 Steps

### Step 1: Install & Run Backend
```bash
cd backend
npm install
npm run dev
```

### Step 2: Install & Run Frontend
```bash
cd frontend
npm install
npm run dev
```

### Step 3: Test Live Streaming
1. Open browser: `http://localhost:3000`
2. Login as instructor
3. Navigate to "Live Sessions"
4. Click "Schedule New Session"
5. Fill details and click "Create"
6. Click "Start Session"
7. Allow camera/microphone access
8. Click "Start Class"

## ✅ What's Fixed

- ✅ Blank screen issue resolved
- ✅ Video streams display properly
- ✅ Audio works bidirectionally
- ✅ Automatic fallback (LiveKit → P2P)
- ✅ Better error messages
- ✅ HD video quality
- ✅ Screen sharing works
- ✅ Recording support

## 🎯 Current Mode

**Development Mode (P2P WebRTC)**
- Works out of the box
- No configuration needed
- Perfect for testing
- Supports 2-4 participants

## 🔧 Upgrade to Production

Want to support 100+ participants? Add to `backend/.env`:

```env
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
```

Get free credentials: https://cloud.livekit.io

## 🐛 Troubleshooting

### Blank Screen?
1. Check browser console (F12)
2. Allow camera/mic permissions
3. Try different browser (Chrome recommended)
4. Restart backend and frontend

### Can't Connect?
1. Verify backend is running on port 5000
2. Verify frontend is running on port 3000
3. Check `backend/.env` has correct CORS settings
4. Disable VPN temporarily

### No Audio/Video?
1. Check device permissions in browser settings
2. Test camera: `chrome://settings/content/camera`
3. Test mic: `chrome://settings/content/microphone`
4. Try different device if available

## 📚 More Help

- Full Setup Guide: `LIVE_STREAMING_SETUP.md`
- All Fixes: `LIVE_STREAMING_FIXES.md`
- Test Script: `./test-live-streaming.sh`

## 🎉 You're Ready!

The live streaming feature is now working and production-ready. Start creating engaging live classes!
