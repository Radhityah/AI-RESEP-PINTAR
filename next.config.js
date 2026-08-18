/** @type {import('next').NextConfig} */

// Semua request /api/* diteruskan ke RESTful API backend (Express JS + Swagger).
// Lokal : http://localhost:4000   |   Docker : http://api:4000 (via build arg)
const API_PROXY_URL = process.env.API_PROXY_URL || 'http://localhost:4000'

const nextConfig = {
  output: 'standalone', // untuk Docker image yang ringan
  experimental: {
    // Request AI (suggest/generate) bisa lama saat server Ollama lambat —
    // jangan biarkan proxy rewrites memutus koneksi sebelum backend selesai.
    proxyTimeout: 300000,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return {
      // beforeFiles = selalu diproxy ke backend Express,
      // route API bawaan Next.js tidak dipakai lagi
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: `${API_PROXY_URL}/api/:path*`,
        },
      ],
    }
  },
}

module.exports = nextConfig
