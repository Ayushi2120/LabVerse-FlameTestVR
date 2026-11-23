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
    const saltLetter = ctx.currentSaltLetter || 'A';
    const mysteryName = ctx.currentMysteryName || `Mystery Salt ${saltLetter}`;
    const saltName = ctx.currentSaltName || 'Metal Chloride Salt';
    const saltFormula = ctx.currentSaltFormula || 'MCl';
    const flameStatus = ctx.isFlameResultObserved
        ? `Observed: ${ctx.observedFlameColor}`
        : 'Not yet observed in flame (DO NOT reveal or spoil the color to the student before observation!)';
    const step = ctx.currentState || ctx.state || 'IDLE';
    const completedSalts = (ctx.completedSalts || []).join(', ') || 'None yet';
    const nextAction = ctx.nextValidAction || 'Follow lab guidance';

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
- Always maintain laboratory safety: remind them about nitrile gloves and safety goggles when handling chemicals and open flames.

LIVE LABORATORY TELEMETRY (SINGLE SOURCE OF TRUTH):
- Experiment: Flame Test (Metal Chloride Spectroscopy)
- Active State: ${step}
- Next Required Action: ${nextAction}
- Gloves Equipped: ${ctx.areGlovesEquipped ? 'YES (Safety Compliant)' : 'NO (Safety Gloves Required!)'}
- Platinum Wire Held: ${ctx.isWireGrabbed ? 'YES' : 'NO'}
- Wire Coated with Salt: ${ctx.isWireDipped ? 'YES' : 'NO'}
- Bunsen Burner Lit: ${ctx.isBurnerLit ? 'YES (Blue Flame)' : 'NO (Burner Off)'}
- Wire in Flame: ${ctx.isWireInFlame ? 'YES' : 'NO'}
- Flame Color Status: ${flameStatus}
- Active Target Salt: ${mysteryName} (${saltName}, formula ${saltFormula})
- Completed Salts: ${completedSalts} (Total: ${ctx.completedCount || 0} of ${ctx.totalSalts || 6})
- Experiment Completed: ${ctx.isExperimentCompleted ? 'YES (All 6 salts tested!)' : 'NO'}

STRICT INTERACTION RULES:
1. NEXT STEP: Always instruct ONLY the single next valid action: "${nextAction}". Never skip steps, and never tell the student to do something they have already completed!
2. HINT: Give a contextual hint focused strictly on the current step and current state.
3. FLAME TEST: If flame color is NOT yet observed, explain how to test the sample and DO NOT spoil the secret flame color! Only explain the color once observed.
4. THEORY: Explain the quantum atomic theory relevant to the current step.
5. GENERAL QUESTIONS: Answer based on the live experiment state above. Never encourage unsafe chemical mixing.`;
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
 * Guaranteed 100% awareness of live telemetry and the student's exact stage.
 */
function getSocraticFallback(message, mode, context) {
    const ctx = context || {};
    const q = (message || '').toLowerCase();

    if (mode === 'step') {
        if (!ctx.areGlovesEquipped) {
            return {
                reply: "Beep-boop! Safety protocol first! Please put on your blue nitrile gloves from the dispenser box on the left bench before touching any chemicals or tools.",
                emotion: "speaking"
            };
        }
        if (ctx.isExperimentCompleted || (ctx.completedSalts && ctx.completedSalts.length >= 6)) {
            return {
                reply: "Bleep-boop! Congratulations! 🎉 You have completed all six flame test challenges! Review all your spectral observations in the 3D Lab Notebook on the right table.",
                emotion: "happy"
            };
        }
        if (ctx.isFlameResultObserved) {
            const name = ctx.currentSaltName || 'metal salt';
            const flame = ctx.observedFlameColor || ctx.currentFlameColorName || 'characteristic';
            return {
                reply: `Spectroscopy recorded! ${name} produced a brilliant ${flame} flame! Review the 3D result display on your right and click 'Continue' to advance to the next challenge.`,
                emotion: "happy"
            };
        }
        if (!ctx.isWireGrabbed && !ctx.isWireDipped) {
            return {
                reply: "Whirr-click! Pick up the platinum wire from the stand on the table. Platinum is chemically inert and will not color our test flame!",
                emotion: "speaking"
            };
        }
        if (!ctx.isWireDipped) {
            const mystery = ctx.currentMysteryName || `Mystery Salt ${ctx.currentSaltLetter || 'A'}`;
            return {
                reply: `Beep-whirr! Follow the cyan 3D arrow to dip the loop of your platinum wire into ${mystery} to coat the tip with sample crystals!`,
                emotion: "speaking"
            };
        }
        if (!ctx.isWireGrabbed && ctx.isWireDipped) {
            const mystery = ctx.currentMysteryName || `Mystery Salt ${ctx.currentSaltLetter || 'A'}`;
            return {
                reply: `Your platinum wire is coated with ${mystery}! Pick up the wire again to bring your sample to the Bunsen burner.`,
                emotion: "speaking"
            };
        }
        if (!ctx.isBurnerLit) {
            return {
                reply: "Whirr-click! Turn ON the Bunsen burner! Click or poke the round power switch button on the burner base to ignite the blue flame.",
                emotion: "speaking"
            };
        }
        if (!ctx.isWireInFlame && !ctx.isFlameResultObserved) {
            const mystery = ctx.currentMysteryName || `Mystery Salt ${ctx.currentSaltLetter || 'A'}`;
            return {
                reply: `Bleep-boop! Bring your coated platinum loop with ${mystery} directly into the hottest outer cone of the blue Bunsen flame and watch closely for the color burst!`,
                emotion: "speaking"
            };
        }
        if (ctx.isWireInFlame) {
            return {
                reply: "Beep-whirr! Hold the wire steady in the flame for 3.5 seconds to observe the vibrant flame emission burst!",
                emotion: "speaking"
            };
        }
        return {
            reply: `Beep-whirr! ${ctx.nextValidAction || 'Follow the cyan 3D directional arrow to continue the experiment.'}`,
            emotion: "speaking"
        };
    }

    if (mode === 'hint') {
        if (!ctx.areGlovesEquipped) {
            return {
                reply: "Nitrile gloves are essential in wet chemistry! They protect your skin from chemical exposure and prevent natural skin oils from contaminating pure salts.",
                emotion: "thinking"
            };
        }
        if (ctx.isFlameResultObserved) {
            const HINTS = [
                ["Observe the deep, rich crimson hue.", "Famous for lightweight rechargeable batteries in modern electronics!", "With an emission peak at 670.8 nm, this element is Lithium (Li)!"],
                ["Notice the intense golden-yellow glow.", "Abundant in seawater and common table seasoning!", "With strong D-lines at 589 nm, this element is Sodium (Na)!"],
                ["Look for a delicate, pale lilac or soft violet tint.", "Key nutrient for biological nerve function and in bananas.", "Emitting at 766 nm and 404 nm, this element is Potassium (K)!"],
                ["Notice the warm brick-red to orange flame.", "Essential for human bones, teeth, and limestone.", "With strong bands at 622 nm, this element is Calcium (Ca)!"],
                ["Behold the striking, cool blue-green emerald flash!", "Transition metal historically alloyed to form bronze.", "Emitting at 510–520 nm, this element is Copper (Cu)!"],
                ["Look closely at the deep scarlet-red flame.", "Heavily used in road flares and emergency signals.", "Emitting at 606 nm and 662 nm, this element is Strontium (Sr)!"]
            ];
            const sIdx = ctx.currentSaltIndex ?? ctx.saltIndex ?? 0;
            const t = Math.max(0, Math.min(2, (ctx.hintTier || 1) - 1));
            const hintStr = HINTS[sIdx]?.[t] || "Observe the characteristic flame color!";
            return {
                reply: `Hint for ${ctx.currentMysteryName || 'this salt'}: ${hintStr}`,
                emotion: "thinking"
            };
        }
        if (!ctx.isWireGrabbed && !ctx.isWireDipped) {
            return {
                reply: "Platinum has an extremely high melting point (1768°C) and is chemically inert, so it will not impart any color of its own to the flame!",
                emotion: "thinking"
            };
        }
        if (!ctx.isWireDipped) {
            return {
                reply: `Follow the cyan 3D beacon pointing to watch glass ${ctx.currentSaltLetter || 'A'}. Gently touch the wire loop to the crystals of ${ctx.currentMysteryName || 'the target salt'} to coat it.`,
                emotion: "thinking"
            };
        }
        if (!ctx.isBurnerLit) {
            return {
                reply: "We need a non-luminous blue flame (complete combustion) so the flame's own color does not mask the subtle emission wavelengths of the metal ions.",
                emotion: "thinking"
            };
        }
        if (!ctx.isWireInFlame && !ctx.isFlameResultObserved) {
            return {
                reply: "Aim for the outer cone of the blue flame right at the top of the inner cone, where temperatures reach ~1500°C for maximum thermal excitation!",
                emotion: "thinking"
            };
        }
        if (ctx.isWireInFlame) {
            return {
                reply: "Notice the sudden burst of light! Thermal energy has promoted valence electrons to higher orbitals, and they are now releasing discrete photons as they relax.",
                emotion: "speaking"
            };
        }
        if (ctx.isExperimentCompleted) {
            return {
                reply: "All six mystery salts have been analyzed! Review the 3D Lab Notebook on the right table to see your full spectroscopy report.",
                emotion: "happy"
            };
        }
        return {
            reply: "Observe closely! In flame tests, every element's valence electron arrangement creates a unique optical emission fingerprint.",
            emotion: "thinking"
        };
    }

    if (mode === 'explain') {
        if (ctx.isExperimentCompleted) {
            return {
                reply: "Spectroscopy complete! You observed Lithium (Crimson Red), Sodium (Golden Yellow), Potassium (Pale Lilac), Calcium (Brick Red), Copper (Blue-Green), and Strontium (Scarlet Red). Each color represents a unique atomic fingerprint!",
                emotion: "happy"
            };
        }
        if (ctx.isFlameResultObserved) {
            const name = ctx.currentSaltName || 'Metal Chloride';
            const formula = ctx.currentSaltFormula || 'MCl';
            const flame = ctx.observedFlameColor || ctx.currentFlameColorName || 'characteristic';
            return {
                reply: `Bleep-boop! ${ctx.currentMysteryName || 'This salt'} is ${name} (${formula})! It produced a brilliant ${flame} flame. Flame heat vaporized the salt, promoting valence electrons to excited quantum states. As they relaxed to ground state, they emitted photons of ${flame} light (ΔE = hc/λ)!`,
                emotion: "happy"
            };
        }
        const mystery = ctx.currentMysteryName || `Mystery Salt ${ctx.currentSaltLetter || 'A'}`;
        return {
            reply: `Whirr-click! We are preparing to test ${mystery}. To observe its emission spectrum, coat the platinum wire with sample crystals and bring it into the blue burner flame! I won't reveal the secret flame color until you observe it!`,
            emotion: "speaking"
        };
    }

    if (mode === 'theory') {
        if (!ctx.areGlovesEquipped || (!ctx.isWireGrabbed && !ctx.isWireDipped)) {
            return {
                reply: "In atomic spectroscopy, contamination control is vital. Platinum wires and clean gloves ensure no foreign alkali metal residues create false emission lines in our observations.",
                emotion: "speaking"
            };
        }
        if (!ctx.isWireDipped) {
            return {
                reply: `Metal chloride salts (${ctx.currentSaltFormula || 'MCl'}) are selected because chlorides have relatively low lattice energies, allowing them to vaporize and dissociate into gaseous metal atoms easily in the flame.`,
                emotion: "speaking"
            };
        }
        if (!ctx.isBurnerLit) {
            return {
                reply: "A non-luminous blue Bunsen flame undergoes complete combustion (CH₄ + 2O₂ → CO₂ + 2H₂O), generating ~1500°C without soot (unburnt carbon) that would produce interfering yellow blackbody radiation.",
                emotion: "speaking"
            };
        }
        if (ctx.isWireInFlame || ctx.isFlameResultObserved) {
            return {
                reply: "Bohr's atomic theory states electrons occupy quantized energy levels (n = 1, 2, 3...). Flame heat excites electrons (E₂). Returning to ground state (E₁) releases a photon satisfying Planck's relation: ΔE = E₂ - E₁ = h·ν = hc/λ, forming a discrete emission line!",
                emotion: "speaking"
            };
        }
        if (ctx.isExperimentCompleted) {
            return {
                reply: "Atomic emission spectroscopy is foundational to modern science: astronomers analyze starlight absorption and emission lines to determine the chemical composition and temperature of distant stars and galaxies!",
                emotion: "happy"
            };
        }
        return {
            reply: "Bohr's quantum model explains that each chemical element has a distinct electron configuration, so each metal ion emits unique, quantized wavelengths of light when heated.",
            emotion: "speaking"
        };
    }

    // Default question handling with context awareness
    if (q.includes('next') || q.includes('what do i do') || q.includes('step')) {
        return getSocraticFallback(message, 'step', context);
    }
    if (q.includes('hint') || q.includes('clue')) {
        return getSocraticFallback(message, 'hint', context);
    }
    if (q.includes('flame') || q.includes('color')) {
        return getSocraticFallback(message, 'explain', context);
    }
    if (q.includes('theory') || q.includes('planck') || q.includes('bohr')) {
        return getSocraticFallback(message, 'theory', context);
    }
    if (q.includes('safety') || q.includes('glove')) {
        return {
            reply: "Beep-boop! Always wear safety goggles and nitrile gloves when working with metal chloride salts and concentrated hydrochloric acid!",
            emotion: "speaking"
        };
    }

    const currentTarget = ctx.currentMysteryName || 'Mystery Salt A';
    return {
        reply: `Beep-whirr! That's a great Chemistry question! We are currently working on ${currentTarget}. In flame spectroscopy, heat excites atomic valence electrons into higher energy levels, releasing characteristic photons.`,
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
                prompt = `Explain to me what I should do right now in our flame test practical. My next valid action is: "${experimentContext.nextValidAction || 'Follow guidance'}". Instruct me ONLY on this single next action in a friendly, encouraging way without skipping ahead or repeating completed actions.`;
            } else if (mode === 'hint') {
                prompt = `Give me a progressive Socratic hint (Tier ${experimentContext.hintTier || 1} of 3) for my current step (${experimentContext.currentStepTitle || 'testing'}). Guide my scientific thinking without giving away answers prematurely.`;
            } else if (mode === 'explain') {
                if (experimentContext.isFlameResultObserved) {
                    prompt = `Explain why ${experimentContext.currentMysteryName || 'our sample'} (${experimentContext.currentSaltName}) produced a ${experimentContext.observedFlameColor} flame in our Bunsen burner flame test using atomic electron excitation concepts suitable for Class 10.`;
                } else {
                    prompt = `We are preparing to test ${experimentContext.currentMysteryName || 'the salt sample'}. Explain how the flame test works for this sample, but DO NOT reveal the secret flame color yet since I haven't heated it in the flame yet!`;
                }
            } else if (mode === 'theory') {
                prompt = `Explain the core scientific principles behind flame tests relevant to our current stage (${experimentContext.currentStepTitle || 'spectroscopy'}): Bohr model of the atom, quantum energy levels, excited vs ground states, and the Planck equation ΔE = h*nu. Keep it clear, concise, and engaging!`;
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

            const saltName = experimentContext.currentSaltName || 'Lithium Chloride';
            const mysteryName = experimentContext.currentMysteryName || 'Mystery Salt A';
            const prompt = `Generate a 4-choice multiple choice chemistry question for a Class 10 student based on our flame test practical testing ${mysteryName} (${saltName}).
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
