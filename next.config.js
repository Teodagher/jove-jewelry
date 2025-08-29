/** @type {import('next').NextConfig} */
const nextConfig = {
  // Preserve console logs in production for auth debugging
  compiler: {
    removeConsole: false,
  },
  images: {
    unoptimized: true, // Disable optimization for external images to avoid timeouts
    domains: [
      "source.unsplash.com",
      "images.unsplash.com", 
      "ext.same-assets.com",
      "ugc.same-assets.com",
      "ndqxwvascqwhqaoqkpng.supabase.co", // Add Supabase storage domain
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "source.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ext.same-assets.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ugc.same-assets.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ndqxwvascqwhqaoqkpng.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

module.exports = nextConfig;
