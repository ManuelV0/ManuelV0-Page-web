/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      { module: /@supabase\/realtime-js/, message: /Critical dependency:/ },
    ];
    return config;
  },
};

export default nextConfig;
