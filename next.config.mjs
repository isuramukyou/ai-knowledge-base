/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['pg', 'pg-native'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['t.me'],
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Исключаем проблемные модули только на сервере
      config.externals.push({
        'pg-native': 'pg-native',
        'pg-cloudflare': 'pg-cloudflare',
        'cloudflare:sockets': 'cloudflare:sockets',
      })
      
      // Добавляем fallback для Node.js модулей
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'pg-native': false,
        'pg-cloudflare': false,
      }
    }
    
    return config
  },
}

export default nextConfig
