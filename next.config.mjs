/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '16mb',
    },
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
