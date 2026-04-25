# 🌐 ngrok Setup Guide (Deployment Simulation)

This guide helps you expose your local SESA Educational Platform to the internet using **ngrok**. This allows you to test the app on mobile devices or share it with others as if it were "deployed".

## 🛠️ Prerequisites

1.  **ngrok Account**: Sign up for a free account at [ngrok.com](https://ngrok.com/).
2.  **Auth Token**: Get your authtoken from the [ngrok Dashboard](https://dashboard.ngrok.com/get-started/your-authtoken).

## 🚀 How to Run

I have added a helper script `tunnel.mjs` in the root directory. Follow these steps:

### 1. Set your Auth Token
In your terminal (PowerShell), run:
```powershell
$env:NGROK_AUTHTOKEN="YOUR_NGROK_AUTHTOKEN_HERE"
```
*(Replace `YOUR_NGROK_AUTHTOKEN_HERE` with your actual token)*

### 2. Start the Tunnels
Run the tunnel script:
```bash
node tunnel.mjs
```

### 3. Update Environment Variables
The script will output two URLs (one for Backend and one for Frontend). You **must** update your `.env` files so they can talk to each other through the tunnels:

#### **Backend (`backend/.env`)**
Update these lines with the **Frontend** ngrok URL:
```env
CORS_ORIGIN=https://your-frontend-ngrok-url.ngrok-free.app
FRONTEND_URL=https://your-frontend-ngrok-url.ngrok-free.app
```

#### **Frontend (`frontend/.env`)**
Update this line with the **Backend** ngrok URL:
```env
VITE_API_URL=https://your-backend-ngrok-url.ngrok-free.app
```

### 4. Restart your Servers
After updating the `.env` files, restart your development servers:
- **Backend**: `npm run dev` (in `backend` folder)
- **Frontend**: `npm run dev` (in `frontend` folder)

---

## ⚠️ Important Notes for Free Users

- **Session Limit**: Free ngrok accounts sometimes only allow **one** active tunnel at a time. 
- **Workaround**: If you can only run one tunnel, expose only the **Frontend** (3000) and keep the backend on `localhost:5000`. However, this will only work on your local machine.
- **Full Remote Test**: To test on a phone, you need **both** to be exposed. If ngrok limits you, consider using **localtunnel** or **Cloudflare Tunnels**.

### Alternative: localtunnel (Completely Free)
If ngrok gives you trouble with multiple tunnels, try:
```bash
# In one terminal
npx localtunnel --port 5000

# In another terminal
npx localtunnel --port 3000
```
*(No account or token required!)*
