/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // In local dev, proxy /api/* to the FastAPI server running on :8000.
    // On Vercel, both apps deploy together and /api/* routes to the Python
    // functions directly, so this rewrite is a no-op there.
    return [
      { source: "/api/:path*", destination: "http://localhost:8000/api/:path*" },
    ];
  },
};

module.exports = nextConfig;
