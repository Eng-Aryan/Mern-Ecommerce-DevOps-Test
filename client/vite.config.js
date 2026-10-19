import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, 
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': 'http://backend:5000',
      '/uploads': 'http://backend:5000',
    },
  },
});