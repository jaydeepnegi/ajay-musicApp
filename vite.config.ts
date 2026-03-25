import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/',   // ✅ Fixed for Vercel
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.AIzaSyC8cF4ldhLYrk2xZmbhLQgSxeDT7fT7KdY': JSON.stringify(env.AIzaSyC8cF4ldhLYrk2xZmbhLQgSxeDT7fT7KdY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
