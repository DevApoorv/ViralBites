import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Vite automatically exposes VITE_ prefixed env vars to import.meta.env
  // No need for manual define config
});