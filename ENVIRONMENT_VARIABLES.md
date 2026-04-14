# Environment Variables Configuration

## Backend Environment Variables (Render)

Add these in your Render dashboard under Environment Variables:

```env
# Core Configuration
NODE_ENV=production
PORT=10000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sesa-database?retryWrites=true&w=majority

# JWT Secrets
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key-here

# Email Service (SendGrid)
SENDGRID_API_KEY=SG.your-sendgrid-api-key-here
FROM_EMAIL=noreply@yourdomain.com

# OAuth Configuration
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GITHUB_CLIENT_ID=your-github-oauth-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-client-secret

# Payment Processing
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# AI Services
OPENAI_API_KEY=sk-your-openai-api-key
GEMINI_API_KEY=your-gemini-api-key

# CORS Configuration
CORS_ORIGIN=https://your-frontend-name.vercel.app

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/tmp/uploads
```

## Frontend Environment Variables (Vercel)

Add these in your Vercel dashboard under Environment Variables:

```env
# API Configuration
VITE_API_URL=https://your-backend-name.onrender.com
VITE_ENVIRONMENT=production

# OAuth Configuration (Public Keys Only)
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id

# Payment Processing (Public Key Only)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-publishable-key

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_CHAT=true
VITE_ENABLE_PAYMENTS=true
```

## How to Get These Values

### MongoDB Atlas:
1. Create cluster at mongodb.com/atlas
2. Create database user
3. Get connection string from "Connect" button
4. Replace `<password>` with your database user password

### SendGrid:
1. Sign up at sendgrid.com
2. Create API key in Settings > API Keys
3. Verify sender identity

### Google OAuth:
1. Go to Google Cloud Console
2. Create project and enable Google+ API
3. Create OAuth 2.0 credentials
4. Add your domains to authorized origins

### GitHub OAuth:
1. Go to GitHub Settings > Developer settings
2. Create new OAuth App
3. Set Authorization callback URL

### Stripe:
1. Sign up at stripe.com
2. Get API keys from Dashboard > Developers > API keys
3. Set up webhooks for payment events

### OpenAI:
1. Sign up at openai.com
2. Create API key in API section

### Gemini:
1. Go to Google AI Studio
2. Create API key

## Security Notes

- Never commit these values to your repository
- Use different keys for development and production
- Rotate keys regularly
- Monitor usage and set up alerts
- Use environment-specific values (dev/staging/prod)

## Testing Environment Variables

### Backend Test:
```bash
# Test if environment variables are loaded
curl https://your-backend-name.onrender.com/api/health
```

### Frontend Test:
```javascript
// In browser console on your deployed site
console.log(import.meta.env.VITE_API_URL);
```

## Common Issues

1. **Variables not loading**: Ensure they start with `VITE_` for frontend
2. **CORS errors**: Check CORS_ORIGIN matches your frontend URL exactly
3. **Database connection fails**: Verify MongoDB URI format and network access
4. **OAuth not working**: Check redirect URLs match exactly
5. **Payments failing**: Verify webhook endpoints are configured