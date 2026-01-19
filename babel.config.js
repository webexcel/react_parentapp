module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': './src',
          '@/design-system': './src/design-system',
          '@/core': './src/core',
          '@/modules': './src/modules',
          '@/app': './src/app',
        },
      },
    ],
  ],
};
