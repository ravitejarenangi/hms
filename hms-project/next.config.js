/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `fs` module
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    // Add a rule to handle HTML files
    config.module.rules.push({
      test: /\.html$/,
      use: 'ignore-loader',
    });

    return config;
  },
};

module.exports = nextConfig;
