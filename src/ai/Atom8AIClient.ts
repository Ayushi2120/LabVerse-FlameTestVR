/**
 * Atom8AIClient.ts — Client-side AI Communication Layer for ATOM-8.
 * Communicates with the secure backend at /api/ai/chat and /api/ai/quiz.
 * Automatically handles timeout, error recovery, conversation memory, and offline fallback.
 */

import { ChemistryKnowledge } from './ChemistryKnowledge';

export interface AIExperimentContext {
    experimentName?: string;
    experiment?: string;
    state?: string;
    currentState?: string;
    saltIndex?: number;
    currentSaltIndex?: number;
    currentSaltLetter?: string;
    currentMysteryName?: string;
    currentSaltName?: string;
    currentSaltFormula?: string;
    currentFlameColorName?: string;
    observedFlameColor?: string;
    completedSalts?: string[];
    totalSalts?: number;
    completedCount?: number;
    areGlovesEquipped?: boolean;
    isWireGrabbed?: boolean;
    isWireDipped?: boolean;
    isBurnerLit?: boolean;
    isWireInFlame?: boolean;
    isFlameResultObserved?: boolean;
    isExperimentCompleted?: boolean;
    hintTier?: number;
    nextValidAction?: string;
    currentStepTitle?: string;
    currentStepDescription?: string;
    observations?: Array<{ letter: string; name: string; formula: string; flameColor: string; isObserved: boolean }>;
}

export interface AIChatResponse {
    reply: string;
    emotion: 'speaking' | 'happy' | 'thinking' | 'question';
    provider?: string;
    model?: string;
    configured?: boolean;
    error?: string;
}

export interface AIQuizQuestion {
    id?: number;
    question: string;
    options: [string, string, string, string];
    correctIndex: number;
    explanation: string;
}

export class Atom8AIClient {
    private conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [];
    private currentHintTier = 1;
    private baseUrl: string;

    constructor() {
        // Use relative URL so Vite proxy or same-origin backend automatically works
        this.baseUrl = '';
    }

    /**
     * Check if backend AI service is online and configured with an API key.
     */
    public async checkHealth(): Promise<{ ok: boolean; provider: string; model: string; configured: boolean }> {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 3000);
            const res = await fetch(`${this.baseUrl}/api/ai/health`, { signal: controller.signal });
            clearTimeout(timeout);
            if (res.ok) {
                const data = await res.json();
                return { ok: true, provider: data.provider || 'gemini', model: data.model || '', configured: Boolean(data.configured) };
            }
        } catch {
            // Backend offline or unreachable
        }
        return { ok: false, provider: 'offline', model: 'fallback', configured: false };
    }

    /**
     * Send a query to the AI Backend with complete experiment context.
     */
    public async askAI(
        query: string,
        mode: 'ask' | 'steps' | 'guide' | 'observations' | 'theory' | 'video' | 'experiments' | 'hint' | 'quiz' | 'current_step' | 'step' | 'explain' = 'ask',
        context: AIExperimentContext = {}
    ): Promise<AIChatResponse> {
        // Track progressive hint tier
        if (mode === 'hint') {
            context.hintTier = this.currentHintTier;
            this.currentHintTier = (this.currentHintTier % 3) + 1;
        } else {
            this.currentHintTier = 1;
        }

        const payload = {
            message: query,
            mode,
            experimentContext: context,
            conversationHistory: this.conversationHistory.slice(-4)
        };

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 11000);

        try {
            const res = await fetch(`${this.baseUrl}/api/ai/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeout);

            if (res.ok) {
                const data: AIChatResponse = await res.json();
                // Store in memory
                if (query) {
                    this.conversationHistory.push({ role: 'user', content: query });
                }
                this.conversationHistory.push({ role: 'assistant', content: data.reply });
                if (this.conversationHistory.length > 10) {
                    this.conversationHistory = this.conversationHistory.slice(-10);
                }
                return data;
            }
        } catch (err: any) {
            clearTimeout(timeout);
            console.warn('[Atom8AIClient] Backend request failed, engaging local chemistry fallback:', err);
        }

        // Local Fallback if network or server is unavailable
        let fallbackReply = "";
        let fallbackEmotion: 'speaking' | 'happy' | 'thinking' | 'question' = 'speaking';

        if (mode === 'steps') {
            const stepsResult = ChemistryKnowledge.getContextualExperimentSteps(context);
            fallbackReply = stepsResult.reply;
            fallbackEmotion = stepsResult.emotion;
        } else if (mode === 'guide') {
            const guideResult = ChemistryKnowledge.getContextualInteractionGuide(context);
            fallbackReply = guideResult.reply;
            fallbackEmotion = guideResult.emotion;
        } else if (mode === 'observations') {
            const obsResult = ChemistryKnowledge.getContextualObservations(context);
            fallbackReply = obsResult.reply;
            fallbackEmotion = obsResult.emotion;
        } else if (mode === 'current_step' || mode === 'step') {
            const step = ChemistryKnowledge.getContextualCurrentStep(context);
            fallbackReply = step.reply;
            fallbackEmotion = step.emotion;
        } else if (mode === 'hint') {
            const hint = ChemistryKnowledge.getContextualHint(context, context.hintTier || 1);
            fallbackReply = hint.reply;
            fallbackEmotion = hint.emotion;
        } else if (mode === 'explain') {
            const expl = ChemistryKnowledge.getContextualFlameExplanation(context);
            fallbackReply = expl.reply;
            fallbackEmotion = expl.emotion;
        } else if (mode === 'theory') {
            const th = ChemistryKnowledge.getContextualTheory(context);
            fallbackReply = th.reply;
            fallbackEmotion = th.emotion;
        } else if (mode === 'video') {
            const vid = ChemistryKnowledge.getContextualVideo(context);
            fallbackReply = vid.reply;
            fallbackEmotion = vid.emotion;
        } else if (mode === 'experiments') {
            const exp = ChemistryKnowledge.getContextualExperiments(context);
            fallbackReply = exp.reply;
            fallbackEmotion = exp.emotion;
        } else {
            const local = ChemistryKnowledge.answerQuestion(query, context);
            fallbackReply = local.reply;
            fallbackEmotion = local.emotion as any;
        }

        return {
            reply: fallbackReply,
            emotion: fallbackEmotion,
            provider: 'offline-local',
            configured: false
        };
    }

    /**
     * Generate dynamic AI Chemistry Quiz question based on current experiment.
     */
    public async generateDynamicQuiz(context: AIExperimentContext): Promise<AIQuizQuestion | null> {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 9000);

            const res = await fetch(`${this.baseUrl}/api/ai/quiz`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ experimentContext: context }),
                signal: controller.signal
            });

            clearTimeout(timeout);

            if (res.ok) {
                const data = await res.json();
                if (data.isAIGenerated && data.question && Array.isArray(data.question.options)) {
                    return data.question as AIQuizQuestion;
                }
            }
        } catch (err) {
            console.warn('[Atom8AIClient] Dynamic quiz generation failed, using standard quiz:', err);
        }
        return null;
    }

    public resetHints() {
        this.currentHintTier = 1;
    }

    public clearConversation() {
        this.conversationHistory = [];
        this.currentHintTier = 1;
    }
}
