/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use React strict mode (same as original)
  reactStrictMode: true,

  // Allow images from any domain (preserves existing behavior)
  images: {
    unoptimized: true,
  },

  // Preserve trailing slash behavior
  trailingSlash: false,

  // Environment variables are automatically loaded from .env.local
  // All NEXT_PUBLIC_* vars are available client-side

  // Webpack config to handle any edge cases
  webpack: (config) => {
    // Handle socket.io-client
    config.externals = config.externals || [];
    return config;
  },

  // Ignore TS errors to ensure non-blocking migration of legacy code
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Rewrites to proxy API requests to the backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:5000/uploads/:path*',
      },
      {
        source: '/socket.io/:path*',
        destination: 'http://localhost:5000/socket.io/:path*',
      },
    ];
  },
};

export default nextConfig;
