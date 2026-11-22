/// <reference types="node" />
import { defineConfig } from 'vite';
import { resolve } from 'path';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { handleAiChatRequest, handleAiQuizRequest, handleAiHealthRequest, handleCorsPreflight } from './server/ai-service.js';

function atom8AiPlugin() {
  return {
    name: 'atom8-ai-backend',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = req.url || '';
        if (url.startsWith('/api/ai/health')) {
          handleAiHealthRequest(req, res);
        } else if (url.startsWith('/api/ai/chat') && req.method === 'POST') {
          await handleAiChatRequest(req, res);
        } else if (url.startsWith('/api/ai/quiz') && req.method === 'POST') {
          await handleAiQuizRequest(req, res);
        } else if (url.startsWith('/api/ai/') && req.method === 'OPTIONS') {
          handleCorsPreflight(req, res);
        } else {
          next();
        }
      });
    }
  };
}

export default defineConfig(({ command }) => {
  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true' || !!process.env.VERCEL;
  const base = isVercel ? '/' : (command === 'serve' ? '/' : '/LabVerse-FlameTestVR/');

  return {
    base,
    plugins: [basicSsl(), atom8AiPlugin()],
    server: {
      proxy: {
        // Fallback proxy if standalone server runs on port 3001
        '^/api/ai/.*': {
          target: 'http://localhost:3001',
          changeOrigin: true
        }
      }
    },
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
