let userConfig = undefined
try {
  userConfig = await import('./v0-user-next.config')
} catch (e) {
  // ignore error
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Enable static exports
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: ['api.seai.co'], // Add your API domain
  },
  experimental: {
    webpackBuildWorker: true,
    parallelServerBuildTraces: true,
    parallelServerCompiles: true,
  },
  trailingSlash: true, // Important for S3 static hosting
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://api.seai.co/api/v1/:path*",
      },
    ]
  },
  async headers() {
    return [
      {
        // matching all API routes
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ]
      }
    ]
  }
}

const mergedConfig = mergeConfig(nextConfig, userConfig)

function mergeConfig(nextConfig, userConfig) {
  if (!userConfig) {
    return nextConfig
  }

  const merged = { ...nextConfig }

  // Merge experimental options
  if (userConfig.experimental) {
    merged.experimental = {
      ...merged.experimental,
      ...userConfig.experimental,
    }
  }

  // Merge other options
  Object.keys(userConfig).forEach((key) => {
    if (key !== 'experimental') {
      merged[key] = userConfig[key]
    }
  })

  return merged
}

export default mergedConfig
