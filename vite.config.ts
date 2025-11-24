import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    base: './', // Important for relative paths in extensions
    define: {
      // Polyfill process.env.API_KEY for the @google/genai SDK
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY),
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          main: 'index.html',
        },
      },
    },
  };
});