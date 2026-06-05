/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**'
      },
      {
        // Sprint 7A demo: direct Pexels CDN images (query params vary, so no exact match).
        protocol: 'https',
        hostname: 'images.pexels.com',
        pathname: '/photos/**'
      }
    ]
  }
};

export default nextConfig;
