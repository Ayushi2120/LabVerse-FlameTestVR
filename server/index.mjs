/**
 * index.mjs — Standalone Production Backend Runner for ATOM-8 AI Assistant.
 * Usage: node server/index.mjs
 */

import { startStandaloneServer } from './ai-service.js';

const port = Number(process.env.PORT) || 3001;
startStandaloneServer(port);
