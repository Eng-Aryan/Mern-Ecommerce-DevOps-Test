import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Where the API lives while developing. Plain `npm run dev` uses localhost;
// docker-compose sets VITE_PROXY_TARGET=http://backend:5000 for the container network.
const target = process.env.VITE_PROXY_TARGET || 'http://localhost:5000';
const proxy = { '/api': target, '/uploads': target, '/sitemap.xml': target, '/robots.txt': target };

export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5173, strictPort: true, proxy },
  preview: { host: true, port: 4173, proxy },
  build: {
    rollupOptions: {
      output: { manualChunks: { react: ['react', 'react-dom', 'react-router-dom'] } },
    },
  },
});
