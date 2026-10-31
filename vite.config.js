import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const API = process.env.API_URL || 'http://localhost:3000';

/* The React app lives in ./web; the usof API (and its /admin panel and /uploads) runs on port 3000. */
export default defineConfig({
  root: 'web',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': API,
      '/uploads': API,
      '^/admin(/|$)': API,
    },
  },
  build: { outDir: '../dist', emptyOutDir: true },
});
