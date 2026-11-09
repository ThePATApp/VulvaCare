import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite builds the React app. The Express server in server/index.js runs it during development.
export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist' },
});
