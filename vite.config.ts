import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Safely replace process.env.API_KEY with the actual string value during build
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});