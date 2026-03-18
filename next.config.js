/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  typescript: { ignoreBuildErrors: true },
  transpilePackages: ['react-native', 'react-native-web'],
  turbopack: {
    resolveAlias: {
      'react-native': 'react-native-web',
      'react-native$': 'react-native-web',
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'react-native$': 'react-native-web',
    };
    config.resolve.extensions = ['.web.js', '.web.ts', '.web.tsx', ...config.resolve.extensions];
    return config;
  },
};

module.exports = nextConfig;
