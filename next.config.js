/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'seai-manning-agent-ui.s3.eu-central-1.amazonaws.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Add trailing slashes to ensure proper routing
  trailingSlash: true,
  // Ensure we're using the correct base path if needed
  basePath: '',
  // Enable static optimization
  staticPageGenerationTimeout: 120,
}

module.exports = nextConfig
