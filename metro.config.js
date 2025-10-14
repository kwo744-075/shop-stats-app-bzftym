
const { getDefaultConfig } = require('expo/metro-config');
const { FileStore } = require('metro-cache');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Use turborepo to restore the cache when possible
config.cacheStores = [
    new FileStore({ root: path.join(__dirname, 'node_modules', '.cache', 'metro') }),
];

// Ensure proper resolver configuration
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Add source extensions
config.resolver.sourceExts.push('jsx', 'js', 'ts', 'tsx', 'json');

// Ensure proper asset extensions for fonts
config.resolver.assetExts.push('ttf', 'otf', 'woff', 'woff2', 'eot');

// Add transformer configuration for better font handling
config.transformer = {
  ...config.transformer,
  assetPlugins: ['expo-asset/tools/hashAssetFiles'],
};

// Improve caching for fonts
config.cacheVersion = '1.0';

module.exports = config;
