/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  redirects: async () => [
    {
      source: '/admin',
      destination: '/admin/dashboard',
      permanent: true,
    },
  ],
}

module.exports = nextConfig