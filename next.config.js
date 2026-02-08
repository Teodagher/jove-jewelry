/** @type {import('next').NextConfig} */
const nextConfig = {
  // Preserve console logs in production for auth debugging
  compiler: {
    removeConsole: false,
  },
  // Ensure sharp is available in serverless functions
  serverExternalPackages: ['sharp'],
  images: {
    unoptimized: false, // Enable optimization for better performance
    minimumCacheTTL: 3600, // Cache images for 1 hour (cache busting via ?t= handles updates)
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
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
