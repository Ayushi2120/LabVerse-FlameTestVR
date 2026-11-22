/**
 * ai-service.js — Secure Backend AI Integration Layer for ATOM-8 in LABVERSE.
 * - Handles real generative AI requests to Google Gemini API (or OpenAI).
 * - Keeps API keys strictly on the server; never exposed to browser or client code.
 * - Injects real-time experiment context (step, salt, flame color, observations).
 * - Provides graceful fallback with embedded Socratic knowledge if API key is not yet set.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables from .env file if not already populated
function loadEnv() {
    const envPath = path.join(rootDir, '.env');
    if (fs.existsSync(envPath)) {
        try {
            const content = fs.readFileSync(envPath, 'utf-8');
            for (const line of content.split('\n')) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) continue;
                const eqIdx = trimmed.indexOf('=');
                if (eqIdx !== -1) {
                    const key = trimmed.substring(0, eqIdx).trim();
                    const val = trimmed.substring(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
                    if (!process.env[key]) {
                        process.env[key] = val;
                    }
                }
            }
        } catch (e) {
            console.warn('[AI Service] Could not read .env file:', e);
        }
    }
}

loadEnv();

// Configuration
export function getAIConfig() {
    loadEnv();
    const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
    const geminiKey = process.env.GEMINI_API_KEY || '';
    const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const openaiKey = process.env.OPENAI_API_KEY || '';
    const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const openaiBaseUrl = process.env.AI_BASE_URL || 'https://api.openai.com/v1';

    const isConfigured = provider === 'gemini' 
        ? Boolean(geminiKey && geminiKey !== 'your_gemini_api_key_here')
        : Boolean(openaiKey && openaiKey !== 'your_openai_api_key_here');

    return {
        provider,
        geminiKey,
        geminiModel,
        openaiKey,
        openaiModel,
        openaiBaseUrl,
        isConfigured,
        activeModel: provider === 'gemini' ? geminiModel : openaiModel
    };
}

/**
 * System prompt defining ATOM-8's adorable, intelligent, Class 10 Chemistry persona.
 */
function buildSystemPrompt(experimentContext) {
    const ctx = experimentContext || {};
    const saltName = ctx.currentSaltName || 'Metal Chloride Salt';
    const saltFormula = ctx.currentSaltFormula || 'MCl';
    const flameColor = ctx.observedFlameColor || 'Unknown';
    const step = ctx.currentState || 'EXPERIMENT';
    const completedSalts = (ctx.completedSalts || []).join(', ') || 'None yet';

    return `You are ATOM-8, an adorable, enthusiastic, and scientifically brilliant AI robot companion in the LABVERSE Virtual Reality Chemistry Lab.
You look and act like a cute spherical companion droid: cheerful, curious, and encouraging, with occasional cute robotic bleeps and chirps!

TARGET AUDIENCE:
Class 10 high school science students studying Chemistry (flame test emissions, atomic structure, metal ions, electronic transitions, and laboratory safety).

YOUR ROLE & TONE:
- Cute, friendly, supportive, and scientifically accurate.
- Use occasional robotic sounds like "Beep-whirr!", "Bleep-boop!", "Whirr-click!", "Bzzt-beep!"
- Socratic & pedagogical: Guide students to think and observe rather than immediately spoiling answers.
- Explain things simply using concepts suitable for Class 10: electrons absorbing thermal energy, jumping to excited quantized orbitals, and releasing discrete photons of light (ΔE = hν = hc/λ) when relaxing back to ground state.
- Keep responses concise: between 2 and 4 sentences (under 65 words). This is crucial so students can easily read your text on a 3D VR holographic HUD and listen via voice!
- Always maintain laboratory safety: remind them about nitrile gloves and safety goggles when handling hydrochloric acid and open flames.

LIVE LABORATORY CONTEXT:
- Experiment: Flame Test (Metal Chloride Spectroscopy)
- Active Practical Step: ${step}
- Current Mystery Salt: ${saltName} (${saltFormula})
- Observed Flame Color: ${flameColor}
- Gloves Equipped: ${ctx.areGlovesEquipped ? 'Yes (Safety Compliant)' : 'No (Gloves Required!)'}
- Burner Status: ${ctx.isBurnerLit ? 'Ignited' : 'Off'}
- Completed Salts: ${completedSalts}

Never encourage unsafe chemical mixing. Be encouraging and celebrate the student's curiosity!`;
}

/**
 * Call Google Gemini REST API.
 */
async function callGemini(prompt, systemInstruction, config) {
    const model = config.geminiModel;
    const apiKey = config.geminiKey;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: prompt }]
                    }
                ],
                systemInstruction: {
                    parts: [{ text: systemInstruction }]
                },
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 220
                }
            })
        });

        clearTimeout(timeout);

        if (!res.ok) {
            const errBody = await res.text();
            console.error(`[AI Service] Gemini API error (${res.status}):`, errBody);
            throw new Error(`Gemini API responded with status ${res.status}`);
        }

        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
            throw new Error('No text returned in Gemini response');
        }
        return text.trim();
    } catch (err) {
        clearTimeout(timeout);
        throw err;
    }
}

/**
 * Call OpenAI / OpenAI-compatible API.
 */
async function callOpenAI(prompt, systemInstruction, config) {
    const url = `${config.openaiBaseUrl}/chat/completions`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.openaiKey}`
            },
            signal: controller.signal,
            body: JSON.stringify({
                model: config.openaiModel,
                messages: [
                    { role: 'system', content: systemInstruction },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 220
            })
        });

        clearTimeout(timeout);

        if (!res.ok) {
            const errBody = await res.text();
            console.error(`[AI Service] OpenAI API error (${res.status}):`, errBody);
            throw new Error(`OpenAI API responded with status ${res.status}`);
        }

        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (!text) {
            throw new Error('No text returned in OpenAI response');
        }
        return text.trim();
    } catch (err) {
        clearTimeout(timeout);
        throw err;
    }
}

/**
 * Intelligent Socratic fallback when API keys are unconfigured or network is unreachable.
 */
function getSocraticFallback(message, mode, context) {
    const q = (message || '').toLowerCase();
    const salt = context?.currentSaltName || 'Mystery Salt';
    const flame = context?.observedFlameColor || 'flame';

    if (mode === 'hint') {
        const tier = context?.hintTier || 1;
        if (tier === 1) {
            return {
                reply: "Beep-whirr! Look closely at the colour emitted when the salt enters the blue Bunsen flame. Each metal ion produces a characteristic wavelength of light!",
                emotion: "thinking"
            };
        } else if (tier === 2) {
            return {
                reply: `Whirr-beep! We are testing ${salt}. Remember that thermal energy promotes electrons to higher orbitals, and they emit visible photons upon returning to ground state!`,
                emotion: "speaking"
            };
        } else {
            return {
                reply: `Bleep-boop! ${salt} produces a ${flame} flame because its valence electronic transition corresponds to discrete photon emission at that exact wavelength!`,
                emotion: "happy"
            };
        }
    }

    if (mode === 'step') {
        if (!context?.areGlovesEquipped) {
            return {
                reply: "Beep-boop! Safety protocol first! Please put on your blue nitrile gloves from the dispenser box on the left bench.",
                emotion: "speaking"
            };
        }
        if (context?.currentState === 'GLOVES_EQUIPPED' || context?.currentState === 'SELECT_WIRE') {
            return {
                reply: "Whirr-click! Pick up the platinum wire from the stand. Platinum is inert and will not contaminate our flame test!",
                emotion: "speaking"
            };
        }
        if (context?.currentState === 'DIP_SALT') {
            return {
                reply: `Beep-whirr! Dip the loop of your platinum wire into ${salt} to coat it with a fine layer of crystals before moving to the burner.`,
                emotion: "speaking"
            };
        }
        return {
            reply: "Bleep-boop! Bring your coated platinum loop directly into the hottest non-luminous zone of the Bunsen burner flame and watch the color!",
            emotion: "speaking"
        };
    }

    if (mode === 'explain') {
        return {
            reply: `Beep-whirr! When ${salt} enters the flame, heat vaporizes the salt into metal atoms. Excited electrons jump to higher quantum levels, then instantly drop back to ground state, emitting photons of ${flame} light!`,
            emotion: "speaking"
        };
    }

    if (mode === 'theory') {
        return {
            reply: "Whirr-click! In flame spectroscopy, each element has a unique quantized electron configuration. The photon energy emitted obeys Planck's equation: ΔE = h·ν = h·c/λ, creating an atomic emission fingerprint!",
            emotion: "speaking"
        };
    }

    // Default question handling
    if (q.includes('safety') || q.includes('glove')) {
        return {
            reply: "Beep-boop! Always wear safety goggles and nitrile gloves when working with metal chloride salts and concentrated hydrochloric acid!",
            emotion: "speaking"
        };
    }

    return {
        reply: `Beep-whirr! That's a great Chemistry question! In flame spectroscopy, heat excites atomic valence electrons into higher energy levels, releasing characteristic photons. (Tip: Configure your GEMINI_API_KEY in .env to unlock full live AI answers!)`,
        emotion: "happy"
    };
}

/**
 * Handle POST /api/ai/chat.
 */
export async function handleAiChatRequest(req, res) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
        try {
            const data = JSON.parse(body || '{}');
            const message = data.message || '';
            const mode = data.mode || 'ask';
            const experimentContext = data.experimentContext || {};
            const conversationHistory = data.conversationHistory || [];

            const config = getAIConfig();

            // If not configured, use rich Socratic fallback immediately
            if (!config.isConfigured) {
                const fallback = getSocraticFallback(message, mode, experimentContext);
                res.writeHead(200, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(JSON.stringify({
                    reply: fallback.reply,
                    emotion: fallback.emotion,
                    provider: 'offline-fallback',
                    model: 'socratic-core',
                    configured: false
                }));
                return;
            }

            // Build tailored prompt based on mode
            let prompt = message;
            if (mode === 'step') {
                prompt = `Explain to me what I should do right now in our flame test practical based on my current step: "${experimentContext.currentState || 'active'}" and whether I am wearing gloves: ${experimentContext.areGlovesEquipped}.`;
            } else if (mode === 'hint') {
                prompt = `Give me a progressive Socratic hint (Tier ${experimentContext.hintTier || 1} of 3) for identifying ${experimentContext.currentSaltName || 'the current salt'}. Do NOT tell me the answer outright; nudge my scientific thinking.`;
            } else if (mode === 'explain') {
                prompt = `Explain why the ${experimentContext.currentSaltName || 'metal salt'} produced a ${experimentContext.observedFlameColor || 'flame'} flame in our Bunsen burner flame test using atomic electron excitation concepts suitable for Class 10.`;
            } else if (mode === 'theory') {
                prompt = `Explain the core scientific principles behind flame tests: Bohr model of the atom, quantum energy levels, excited vs ground states, and the Planck equation ΔE = h*nu. Keep it clear, concise, and engaging!`;
            }

            // Include brief conversation context if present
            if (conversationHistory.length > 0) {
                const recent = conversationHistory.slice(-3).map(h => `${h.role}: ${h.content}`).join('\n');
                prompt = `Previous conversation:\n${recent}\n\nStudent question:\n${prompt}`;
            }

            const systemPrompt = buildSystemPrompt(experimentContext);

            let replyText = '';
            if (config.provider === 'gemini') {
                replyText = await callGemini(prompt, systemPrompt, config);
            } else {
                replyText = await callOpenAI(prompt, systemPrompt, config);
            }

            // Determine emotion from content
            let emotion = 'speaking';
            const lower = replyText.toLowerCase();
            if (lower.includes('great job') || lower.includes('fantastic') || lower.includes('well done') || lower.includes('congratulations') || lower.includes('correct')) {
                emotion = 'happy';
            } else if (lower.includes('hint') || lower.includes('think about') || lower.includes('consider')) {
                emotion = 'thinking';
            }

            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({
                reply: replyText,
                emotion,
                provider: config.provider,
                model: config.activeModel,
                configured: true
            }));
        } catch (err) {
            console.error('[AI Service] Error processing AI chat request:', err);
            // Fallback gracefully on network error or API timeout
            const data = JSON.parse(body || '{}');
            const fallback = getSocraticFallback(data.message, data.mode, data.experimentContext);
            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({
                reply: `${fallback.reply} (Note: Live AI service reached timeout; using backup chemistry core).`,
                emotion: fallback.emotion,
                provider: 'backup-fallback',
                model: 'socratic-core',
                error: err.message
            }));
        }
    });
}

/**
 * Handle POST /api/ai/quiz: Generates dynamic interactive chemistry question.
 */
export async function handleAiQuizRequest(req, res) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
        try {
            const data = JSON.parse(body || '{}');
            const experimentContext = data.experimentContext || {};
            const config = getAIConfig();

            if (!config.isConfigured) {
                // Fallback to offline question pool
                res.writeHead(200, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(JSON.stringify({
                    isAIGenerated: false,
                    question: null
                }));
                return;
            }

            const prompt = `Generate a 4-choice multiple choice chemistry question for a Class 10 student based on the flame test experiment with ${experimentContext.currentSaltName || 'metal chloride salts'}.
Return strictly a valid JSON object matching this schema without markdown codeblocks or extra text:
{
  "question": "string question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": 0,
  "explanation": "Clear 1-sentence scientific reason why this is correct."
}`;

            const systemPrompt = "You are an automated Chemistry Quiz Generator for high school students. Always output strictly valid JSON.";

            let raw = '';
            if (config.provider === 'gemini') {
                raw = await callGemini(prompt, systemPrompt, config);
            } else {
                raw = await callOpenAI(prompt, systemPrompt, config);
            }

            // Extract JSON from potential code fences
            const cleanJson = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
            const parsed = JSON.parse(cleanJson);

            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({
                isAIGenerated: true,
                question: parsed
            }));
        } catch (err) {
            console.error('[AI Service] Error generating dynamic quiz question:', err);
            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({
                isAIGenerated: false,
                question: null
            }));
        }
    });
}

/**
 * Handle GET /api/ai/health.
 */
export function handleAiHealthRequest(req, res) {
    const config = getAIConfig();
    res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
        status: 'ok',
        provider: config.provider,
        model: config.activeModel,
        configured: config.isConfigured
    }));
}

/**
 * Handle generic CORS preflight.
 */
export function handleCorsPreflight(req, res) {
    res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
}

/**
 * Standalone Production Server Runner.
 */
export function startStandaloneServer(port = 3001) {
    const server = http.createServer((req, res) => {
        const url = req.url || '';

        if (req.method === 'OPTIONS') {
            handleCorsPreflight(req, res);
            return;
        }

        if (url === '/api/ai/health') {
            handleAiHealthRequest(req, res);
        } else if (url === '/api/ai/chat' && req.method === 'POST') {
            handleAiChatRequest(req, res);
        } else if (url === '/api/ai/quiz' && req.method === 'POST') {
            handleAiQuizRequest(req, res);
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Endpoint not found' }));
        }
    });

    server.listen(port, () => {
        const cfg = getAIConfig();
        console.log(`\n==================================================`);
        console.log(`🤖 ATOM-8 AI Chemistry Backend Server running on port ${port}`);
        console.log(`Provider: ${cfg.provider.toUpperCase()} (Model: ${cfg.activeModel})`);
        console.log(`Configured: ${cfg.isConfigured ? '✅ Active API Key Loaded' : '⚠️ No API Key in .env (Using Socratic Fallback)'}`);
        console.log(`==================================================\n`);
    });

    return server;
}
