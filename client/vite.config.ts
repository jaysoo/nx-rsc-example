/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  cacheDir: '../node_modules/.vite/app',
  plugins: [
    react(),
    viteTsConfigPaths({
      root: '../',
    }),
  ],
});
