/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
        // Disable Webpack disk caching to eliminate ArrayBuffer Gunzip crashes
        config.cache = false;
        return config;
    },
};

export default nextConfig;