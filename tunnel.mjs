import ngrok from 'ngrok';

// Configuration
const BACKEND_PORT = 5000;
const FRONTEND_PORT = 3000;

async function setupTunnels() {
  console.log('🚀 Starting ngrok tunnels...');

  // Check for authtoken
  let authtoken = process.env.NGROK_AUTHTOKEN;
  if (!authtoken) {
    console.error('❌ NGROK_AUTHTOKEN not found in environment variables.');
    console.log('Please get your token from https://dashboard.ngrok.com/get-started/your-authtoken');
    console.log('Then run: $env:NGROK_AUTHTOKEN="your_token_here"; node tunnel.js');
    process.exit(1);
  }

  try {
    // 1. Start Backend Tunnel
    console.log(`📡 Exposing Backend on port ${BACKEND_PORT}...`);
    const backendUrl = await ngrok.connect({
      addr: BACKEND_PORT,
      authtoken: authtoken,
    });
    console.log(`✅ Backend available at: ${backendUrl}`);

    // 2. Start Frontend Tunnel
    console.log(`📡 Exposing Frontend on port ${FRONTEND_PORT}...`);
    const frontendUrl = await ngrok.connect({
      addr: FRONTEND_PORT,
      authtoken: authtoken,
    });
    console.log(`✅ Frontend available at: ${frontendUrl}`);

    console.log('\n--- DEPLOYMENT SIMULATION ---');
    console.log(`Your app is now live for testing!`);
    console.log(`Access the frontend here: ${frontendUrl}`);
    console.log(`\nTo make the app work correctly, update your .env files:`);
    
    console.log(`\n1. In backend/.env:`);
    console.log(`   CORS_ORIGIN=${frontendUrl}`);
    console.log(`   FRONTEND_URL=${frontendUrl}`);
    
    console.log(`\n2. In frontend/.env:`);
    console.log(`   VITE_API_URL=${backendUrl}`);

    console.log('\n--- Keep this process running to maintain the tunnels ---');
    console.log('Press Ctrl+C to stop.');

  } catch (error) {
    console.error('❌ Error starting tunnels:', error.message);
    if (error.message.includes('Too many sessions')) {
      console.log('Tip: Free ngrok accounts usually support only 1 or 2 concurrent tunnels.');
      console.log('Try using "localtunnel" or upgrading your ngrok account.');
    }
  }
}

setupTunnels();
