/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: '.',
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Prevents clickjacking - page can't be loaded in iframes
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Modern replacement for X-Frame-Options
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'none';",
          },
          // Prevents MIME sniffing attacks
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Controls referrer info sent to other sites
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Forces HTTPS for 2 years
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // Disables unnecessary browser features
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          // Legacy XSS protection for older browsers
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
}

export default nextConfig
