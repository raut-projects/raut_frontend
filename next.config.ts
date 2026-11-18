import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  output: 'standalone',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

export default nextConfig
