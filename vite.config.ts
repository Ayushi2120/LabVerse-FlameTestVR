/// <reference types="node" />
import { defineConfig } from 'vite';
import { resolve } from 'path';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig(({ command }) => {
  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true' || !!process.env.VERCEL;
  const base = isVercel ? '/' : (command === 'serve' ? '/' : '/LabVerse-FlameTestVR/');

  return {
    base,
  plugins: [basicSsl()],
  resolve: {
    alias: {
      'three': resolve(import.meta.dirname, 'node_modules/three'),
    },
    dedupe: ['three'],
  },
  optimizeDeps: {
    include: ['three'],
  },
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          main: resolve(import.meta.dirname, 'index.html'),
          litmus: resolve(import.meta.dirname, 'litmus.html'),
        },
      },
    },
  };
});
