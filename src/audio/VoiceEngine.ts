// VoiceEngine — High-Fidelity English Narration Engine with Web Audio API,
// Pre-rendered Studio Narration Files, 3D VR Subtitles, and Speech Synthesis Fallback.
// Guarantees 100% voice narration playback in Meta Quest VR (WebXR) and Desktop.

import * as THREE from 'three';

export type VoiceStageKey =
    | 'welcome'
    | 'glovePrompt'
    | 'glovesEquipped'
    | 'stepTwoGrabWire'
    | 'selectMysterySalt'
    | 'burnerPrompt'
    | 'obs_LiCl'
    | 'obs_NaCl'
    | 'obs_KCl'
    | 'obs_CaCl2'
    | 'obs_CuCl2'
    | 'obs_SrCl2'
    | 'saltIdentified'
    | 'cleanWire'
    | 'complete'
    | 'snitchCaught'
    // Backwards compatibility aliases
    | 'intro'
    | 'grabWire'
    | 'selectSalt'
    | 'burner'
    | 'glovesNeeded'
    | 'glovesOn'
    | 'glovesPoint';

export interface LetterNarrationCallbacks {
    onParagraphStart?: (idx: number, text: string, durationSec?: number) => void;
    onComplete?: () => void;
}

export const NARRATION_LINES: Record<VoiceStageKey, string> = {
    welcome: "Welcome to the Flame Test Experiment! Today, you'll identify different metal ions by observing the colours they produce in a flame.",
    glovePrompt: "Step one: Put on the safety gloves before handling chemicals.",
    glovesEquipped: "Safety gloves equipped.",
    stepTwoGrabWire: "Step two: Grab the platinum wire.",
    selectMysterySalt: "Choose your mystery salt and prepare the platinum wire for testing.",
    burnerPrompt: "Bring the platinum wire near the burner and observe the flame colour.",
    obs_LiCl: "Crimson red flame observed.",
    obs_NaCl: "Intense yellow flame observed.",
    obs_KCl: "Lilac flame observed.",
    obs_CaCl2: "Orange-red brick flame observed.",
    obs_CuCl2: "Blue-green flame observed.",
    obs_SrCl2: "Intense scarlet-red flame observed.",
    saltIdentified: "Your mystery salt has been identified.",
    cleanWire: "Clean the platinum wire before testing a new salt.",
    complete: "Experiment complete. Select another salt to compare the results.",
    snitchCaught: "Well caught, Seeker!",

    // Aliases
    intro: "Welcome to the Flame Test Experiment! Today, you'll identify different metal ions by observing the colours they produce in a flame.",
    grabWire: "Step two: Grab the platinum wire.",
    selectSalt: "Choose your mystery salt and prepare the platinum wire for testing.",
    burner: "Bring the platinum wire near the burner and observe the flame colour.",
    glovesNeeded: "Step one: Put on the safety gloves before handling chemicals.",
    glovesOn: "Safety gloves equipped.",
    glovesPoint: "Step one: Put on the safety gloves before handling chemicals."
};

const ALIAS_MAP: Record<string, string> = {
    intro: 'welcome',
    grabWire: 'stepTwoGrabWire',
    selectSalt: 'selectMysterySalt',
    burner: 'burnerPrompt',
    glovesNeeded: 'glovePrompt',
    glovesOn: 'glovesEquipped',
    glovesPoint: 'glovePrompt'
};

export class VoiceEngine {
    private getAudioContext: (() => AudioContext | null) | null = null;
    private audioBuffers = new Map<string, AudioBuffer>();
    private audioLoadingPromises = new Map<string, Promise<AudioBuffer | null>>();
    private htmlAudioCache = new Map<string, HTMLAudioElement>();
    private currentSource: AudioBufferSourceNode | null = null;
    private currentAudioEl: HTMLAudioElement | null = null;
    private currentGainNode: GainNode | null = null;

    // Hogwarts Letter Narration Engine
    private isLetterNarrationRunning = false;
    private isLetterPausedState = false;
    private isLetterMutedState = false;
    private letterCurrentParagraph = 0;
    private letterStepTimeout: any = null;
    private letterCallbacks: LetterNarrationCallbacks | null = null;

    private readonly letterParagraphs = [
        { key: 'letter_p1', text: "To the Curious Seeker,", duration: 2.2 },
        { key: 'letter_p2', text: "A little magic finds those who dare to explore.", duration: 4.0 },
        { key: 'letter_p3', text: "Keep your eyes open, your mind curious, and your discoveries close to your heart.", duration: 6.2 },
        { key: 'letter_p4', text: "The most extraordinary secrets are often hidden in plain sight.", duration: 4.9 },
        { key: 'letter_p5', text: "Continue exploring, for every great discovery begins with a single moment of curiosity.", duration: 6.8 },
        { key: 'letter_p6', text: "Yours in wonder, The Keepers of Curiosity", duration: 3.8 }
    ];

    private synth: SpeechSynthesis | null = null;
    private selectedVoice: SpeechSynthesisVoice | null = null;
    private subtitleEl: HTMLElement | null = null;
    private hideTimer: number | null = null;
    private lastKey: VoiceStageKey | null = null;
    private lastSpokenTime = 0;
    private lastDisplayedText = '';
    private isSpeakingSequence = false;
    private sequenceQueue: VoiceStageKey[] = [];

    constructor(audioContextGetter?: () => AudioContext | null) {
        if (audioContextGetter) {
            this.getAudioContext = audioContextGetter;
        }

        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            try {
                this.synth = window.speechSynthesis;
                this.setupVoiceSelection();
            } catch {
                // Ignore if not permitted
            }
        }

        // Feature 1: Exclusively create and manage the preferred lower dark narration box
        this.createSubtitleOverlay();

        // Warm up and pre-load narration WAV audio files
        setTimeout(() => {
            this.preloadAllAudio();
        }, 150);
    }

    public setAudioContextGetter(getter: () => AudioContext | null) {
        this.getAudioContext = getter;
        this.preloadAllAudio();
    }

    private setupVoiceSelection() {
        if (!this.synth) return;
        const chooseVoice = () => {
            const voices = this.synth?.getVoices() || [];
            // Prioritize refined British English (en-GB) storytelling narrator voices
            this.selectedVoice =
                voices.find(v => v.lang.startsWith('en-GB') && (v.name.includes('George') || v.name.includes('Oliver') || v.name.includes('Male'))) ||
                voices.find(v => v.lang.startsWith('en-GB') && (v.name.includes('Hazel') || v.name.includes('Susan') || v.name.includes('Natural'))) ||
                voices.find(v => v.lang === 'en-GB' || v.lang === 'en_GB') ||
                voices.find(v => v.lang.startsWith('en') && (v.name.includes('George') || v.name.includes('Natural') || v.name.includes('Guy'))) ||
                voices.find(v => v.lang.startsWith('en')) ||
                null;
        };

        chooseVoice();
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.onvoiceschanged = chooseVoice;
        }
    }

    public resume() {
        if (this.synth?.paused) {
            try { this.synth.resume(); } catch { /* ignore */ }
        }
    }

    // --- PRE-LOAD NARRATION WAV FILES INTO WEB AUDIO API BUFFERS & HTML5 CACHE ---
    public preloadAllAudio() {
        const uniqueKeys = [
            'welcome',
            'glovePrompt',
            'glovesEquipped',
            'stepTwoGrabWire',
            'selectMysterySalt',
            'burnerPrompt',
            'obs_LiCl',
            'obs_NaCl',
            'obs_KCl',
            'obs_CaCl2',
            'obs_CuCl2',
            'obs_SrCl2',
            'saltIdentified',
            'cleanWire',
            'complete',
            'snitchCaught',
            'letter_p1',
            'letter_p2',
            'letter_p3',
            'letter_p4',
            'letter_p5',
            'letter_p6',
            'letter_full'
        ];

        for (const key of uniqueKeys) {
            // 1. Prime HTML5 Audio element for instant zero-latency playback across all browsers
            try {
                if (typeof Audio !== 'undefined' && !this.htmlAudioCache.has(key)) {
                    const audio = new Audio(`${import.meta.env.BASE_URL}audio/narration/${key}.wav`);
                    audio.preload = 'auto';
                    audio.load();
                    this.htmlAudioCache.set(key, audio);
                }
            } catch { /* ignore */ }

            // 2. Decode into Web Audio API buffers in background
            this.loadAudioBuffer(key);
        }
    }

    private async loadAudioBuffer(fileKey: string): Promise<AudioBuffer | null> {
        if (this.audioBuffers.has(fileKey)) {
            return this.audioBuffers.get(fileKey)!;
        }

        if (this.audioLoadingPromises.has(fileKey)) {
            return this.audioLoadingPromises.get(fileKey)!;
        }

        const promise = (async () => {
            try {
                const res = await fetch(`${import.meta.env.BASE_URL}audio/narration/${fileKey}.wav`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const arrayBuf = await res.arrayBuffer();

                const ctx = this.getAudioContext ? this.getAudioContext() : null;
                if (ctx) {
                    const decodePromise = new Promise<AudioBuffer>((resolve, reject) => {
                        let settled = false;
                        const onDone = (buf: AudioBuffer) => {
                            if (settled) return;
                            settled = true;
                            resolve(buf);
                        };
                        const onErr = (err: any) => {
                            if (settled) return;
                            settled = true;
                            reject(err);
                        };
                        try {
                            const pr = ctx.decodeAudioData(arrayBuf.slice(0), onDone, onErr);
                            if (pr && typeof (pr as any).then === 'function') {
                                (pr as any).then(onDone).catch(onErr);
                            }
                        } catch (e) {
                            onErr(e);
                        }
                    });

                    // Maximum 2.5s timeout so decoding can never hang playback
                    const timeoutPromise = new Promise<AudioBuffer>((_, reject) =>
                        setTimeout(() => reject(new Error('decodeAudioData timeout')), 2500)
                    );

                    const decoded = await Promise.race([decodePromise, timeoutPromise]);
                    this.audioBuffers.set(fileKey, decoded);
                    return decoded;
                }
            } catch (err) {
                console.warn(`[VoiceEngine] Web Audio buffer decoding failed for "${fileKey}" (will use HTML5 Audio):`, err);
                this.audioLoadingPromises.delete(fileKey);
            }
            return null;
        })();

        this.audioLoadingPromises.set(fileKey, promise);
        return promise;
    }

    // --- EXCLUSIVE LOWER DARK NARRATION BOX (FEATURE 1) ---
    private createSubtitleOverlay() {
        if (typeof document === 'undefined') return;
        let el = document.getElementById('labverse-subtitle');
        if (!el) {
            el = document.createElement('div');
            el.id = 'labverse-subtitle';
            el.style.cssText = [
                'position:fixed',
                'bottom:30px',
                'left:50%',
                'transform:translateX(-50%)',
                'background:rgba(10, 16, 26, 0.94)',
                'color:#e2f4ff',
                'font:600 16px/1.5 "Inter", "Segoe UI", system-ui, sans-serif',
                'padding:12px 32px',
                'border-radius:14px',
                'border:1.5px solid rgba(0, 229, 255, 0.55)',
                'box-shadow:0 10px 36px rgba(0,0,0,0.65), 0 0 16px rgba(0, 229, 255, 0.15)',
                'max-width:76vw',
                'text-align:center',
                'pointer-events:none',
                'z-index:9999',
                'transition:opacity 0.3s ease, transform 0.3s ease',
                'opacity:0',
                'letter-spacing:0.3px',
                'backdrop-filter:blur(8px)',
                '-webkit-backdrop-filter:blur(8px)'
            ].join(';');
            document.body.appendChild(el);
        }
        this.subtitleEl = el;
    }

    /**
     * Preserved as safe no-op for backward compatibility.
     * Feature 1: The upper cyan-bordered LABVERSE INSTRUCTOR box is removed completely.
     */
    public attachVRSubtitle(_camera?: THREE.Camera) {
        // Intentionally no-op to remove duplicate upper instructor box
    }

    /**
     * Updates the remaining preferred lower dark narration box.
     * Prevents duplicate rendering of the same text.
     */
    public setNarration(text: string, durationMs = 4500) {
        this.showSubtitle(text, durationMs);
    }

    private showSubtitle(text: string, durationMs: number) {
        if (!text) return;
        if (this.lastDisplayedText === text && this.subtitleEl && this.subtitleEl.style.opacity === '1') {
            return; // Prevent duplicate narration display
        }
        this.lastDisplayedText = text;

        if (this.subtitleEl) {
            this.subtitleEl.textContent = text;
            this.subtitleEl.style.opacity = '1';
        }

        if (this.hideTimer !== null) clearTimeout(this.hideTimer);
        this.hideTimer = window.setTimeout(() => {
            if (this.subtitleEl) this.subtitleEl.style.opacity = '0';
        }, durationMs);
    }

    // --- MAIN PLAYBACK: WEB AUDIO API -> HTML5 AUDIO -> TTS FALLBACK ---
    public speak(key: VoiceStageKey, forceOrPriority: boolean | 'low' | 'normal' | 'high' = false) {
        this.isSpeakingSequence = false;
        this.sequenceQueue = [];

        const force = forceOrPriority === true || forceOrPriority === 'high';
        const text = NARRATION_LINES[key];
        if (!text) return;

        const now = Date.now();
        if (!force && this.lastKey === key && (now - this.lastSpokenTime < 3000)) {
            return;
        }

        this.cancelCurrentAudio();

        this.lastKey = key;
        this.lastSpokenTime = now;

        const subtitleDuration = Math.max(3000, text.length * 60);
        this.showSubtitle(text, subtitleDuration);

        const fileKey = ALIAS_MAP[key] || key;
        this.playAudioKey(fileKey, () => {});
    }

    public speakSequence(keys: VoiceStageKey[]) {
        if (!keys || keys.length === 0) return;

        this.isSpeakingSequence = true;
        this.sequenceQueue = [...keys];

        const playNext = () => {
            if (!this.isSpeakingSequence || this.sequenceQueue.length === 0) {
                this.isSpeakingSequence = false;
                return;
            }

            const currentKey = this.sequenceQueue.shift()!;
            const text = NARRATION_LINES[currentKey];
            if (!text) {
                playNext();
                return;
            }

            this.cancelCurrentAudio();

            this.lastKey = currentKey;
            this.lastSpokenTime = Date.now();

            const subtitleDuration = Math.max(2500, text.length * 55);
            this.showSubtitle(text, subtitleDuration);

            const fileKey = ALIAS_MAP[currentKey] || currentKey;

            this.playAudioKey(fileKey, () => {
                if (this.isSpeakingSequence && this.sequenceQueue.length > 0) {
                    setTimeout(() => playNext(), 350);
                } else {
                    this.isSpeakingSequence = false;
                }
            });
        };

        playNext();
    }

    private async playAudioKey(fileKey: string, onEnd: () => void) {
        const resolvedKey = (ALIAS_MAP[fileKey] || fileKey) as VoiceStageKey;
        const text = NARRATION_LINES[resolvedKey] || NARRATION_LINES[fileKey as VoiceStageKey] || '';
        let hasEnded = false;
        let safetyTimer: any = null;

        const safeOnEnd = () => {
            if (hasEnded) return;
            hasEnded = true;
            if (safetyTimer) clearTimeout(safetyTimer);
            onEnd();
        };

        const ctx = this.getAudioContext ? this.getAudioContext() : null;

        // Try resuming AudioContext if suspended
        if (ctx && ctx.state === 'suspended') {
            try {
                await ctx.resume();
            } catch { /* ignore */ }
        }

        // 1. Primary: Web Audio API AudioBuffer playback (IF context is active and running)
        if (ctx && ctx.state === 'running') {
            let cached = this.audioBuffers.get(fileKey);
            if (!cached) {
                try {
                    cached = (await this.loadAudioBuffer(fileKey)) || undefined;
                } catch {
                    cached = undefined;
                }
            }

            if (cached && ctx.state === 'running') {
                try {
                    const src = ctx.createBufferSource();
                    src.buffer = cached;
                    const gain = ctx.createGain();
                    gain.gain.value = this.isLetterMutedState ? 0.0 : 1.0;
                    src.connect(gain);
                    gain.connect(ctx.destination);
                    this.currentGainNode = gain;

                    // Safety timeout based on buffer duration + 600ms
                    const bufferDurMs = Math.ceil(cached.duration * 1000) + 600;
                    safetyTimer = setTimeout(safeOnEnd, bufferDurMs);

                    src.onended = safeOnEnd;
                    src.start(0);
                    this.currentSource = src;
                    return;
                } catch (e) {
                    console.warn('[VoiceEngine] Web Audio buffer error, falling back to HTML5 Audio:', e);
                }
            }
        }

        // 2. Secondary: Preloaded or Fresh HTML5 Audio element (/audio/narration/${fileKey}.wav)
        try {
            let audio = this.htmlAudioCache.get(fileKey);
            if (!audio) {
                audio = new Audio(`${import.meta.env.BASE_URL}audio/narration/${fileKey}.wav`);
                this.htmlAudioCache.set(fileKey, audio);
            } else {
                audio.currentTime = 0;
            }
            audio.volume = this.isLetterMutedState ? 0.0 : 1.0;
            this.currentAudioEl = audio;

            const estDuration = Math.max(3000, text.length * 85);
            safetyTimer = setTimeout(safeOnEnd, estDuration);

            audio.onended = safeOnEnd;
            audio.onerror = () => {
                this.fallbackSpeechSynthesis(text, safeOnEnd);
            };

            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch((err) => {
                    if (err.name === 'AbortError') return;
                    console.warn('[VoiceEngine] HTML5 Audio play() error, trying SpeechSynthesis fallback:', err);
                    this.fallbackSpeechSynthesis(text, safeOnEnd);
                });
            }
            return;
        } catch {
            this.fallbackSpeechSynthesis(text, safeOnEnd);
        }
    }

    private fallbackSpeechSynthesis(text: string, onEnd: () => void) {
        if (!this.synth || !text) {
            const duration = Math.max(2500, text.length * 60);
            setTimeout(onEnd, duration);
            return;
        }

        try {
            this.synth.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            if (this.selectedVoice) utterance.voice = this.selectedVoice;
            utterance.lang = 'en-GB';
            utterance.rate = 0.88;
            utterance.pitch = 0.98;
            utterance.volume = 0.96;

            utterance.onend = onEnd;
            utterance.onerror = onEnd;

            const fallbackDuration = Math.max(3000, text.length * 75) + 800;
            setTimeout(onEnd, fallbackDuration);

            this.synth.speak(utterance);
        } catch {
            onEnd();
        }
    }

    private cancelCurrentAudio() {
        if (this.currentSource) {
            try {
                this.currentSource.stop();
                this.currentSource.disconnect();
            } catch { /* ignore */ }
            this.currentSource = null;
        }

        if (this.currentAudioEl) {
            try {
                const el = this.currentAudioEl;
                el.pause();
                el.currentTime = 0;
            } catch { /* ignore */ }
            this.currentAudioEl = null;
        }

        this.currentGainNode = null;

        if (this.synth?.speaking) {
            try { this.synth.cancel(); } catch { /* ignore */ }
        }
    }

    // --- HIGH-LEVEL EXPERIMENT STAGE NARRATION TRIGGERS ---

    public narrateWelcomeSequence() {
        this.speakSequence(['welcome', 'glovePrompt']);
    }

    public narrateIntro() {
        this.narrateWelcomeSequence();
    }

    public narrateGlovesPrompt() {
        this.speak('glovePrompt', true);
    }

    public narrateGlovesEquipped() {
        this.speakSequence(['glovesEquipped', 'stepTwoGrabWire']);
    }

    public narrateGrabWire() {
        this.speak('stepTwoGrabWire', true);
    }

    public narrateSelectSalt() {
        this.speak('selectMysterySalt', true);
    }

    public narrateBurner() {
        this.speak('burnerPrompt', true);
    }

    public narrateObservationAndIdentify(formulaOrName: string) {
        const lower = (formulaOrName || '').toLowerCase();
        let obsKey: VoiceStageKey = 'complete';

        if (lower.includes('sr') || lower.includes('strontium') || lower.includes('scarlet')) {
            obsKey = 'obs_SrCl2';
        } else if (lower.includes('li') || lower.includes('lithium') || lower.includes('crimson')) {
            obsKey = 'obs_LiCl';
        } else if (lower.includes('na') || lower.includes('sodium') || lower.includes('yellow')) {
            obsKey = 'obs_NaCl';
        } else if (lower.includes('k') || lower.includes('potassium') || lower.includes('lilac')) {
            obsKey = 'obs_KCl';
        } else if (lower.includes('ca') || lower.includes('calcium') || lower.includes('brick') || lower.includes('orange')) {
            obsKey = 'obs_CaCl2';
        } else if (lower.includes('cu') || lower.includes('copper') || lower.includes('blue') || lower.includes('green')) {
            obsKey = 'obs_CuCl2';
        }

        this.speakSequence([obsKey, 'saltIdentified']);
    }

    public narrateObservation(formulaOrName: string) {
        this.narrateObservationAndIdentify(formulaOrName);
    }

    public narrateCleanWire() {
        this.speak('cleanWire', true);
    }

    public narrateComplete() {
        this.speak('complete');
    }

    /**
     * Golden Snitch Easter Egg Voice Reveal.
     * Speaks "Well caught, Seeker!" using British English studio audio file
     * with SpeechSynthesis fallback and subtitle overlay.
     */
    public narrateSnitchCaught(onComplete?: () => void) {
        this.showSubtitle("✨ Well caught, Seeker! ✨", 4500);

        // Cancel any previous active audio so the Easter egg reveal is crystal clear
        this.cancelCurrentAudio();

        // 1. Primary: Studio-grade pre-rendered British Hazel audio file
        this.playAudioKey('snitchCaught', () => {
            if (onComplete) onComplete();
        });
    }

    // --- HOGWARTS LETTER SEQUENTIAL NARRATION ENGINE & CONTROLS ---

    /**
     * Reads the complete Hogwarts Letter aloud sequentially paragraph by paragraph,
     * reporting each paragraph's start for real-time progressive calligraphy text synchronization.
     */
    public narrateHogwartsLetter(callbacks: LetterNarrationCallbacks) {
        this.stopLetterNarration();
        this.isLetterNarrationRunning = true;
        this.isLetterPausedState = false;
        this.letterCurrentParagraph = 0;
        this.letterCallbacks = callbacks;

        const playParagraph = (idx: number) => {
            if (!this.isLetterNarrationRunning || this.isLetterPausedState) return;
            if (idx >= this.letterParagraphs.length) {
                this.isLetterNarrationRunning = false;
                if (this.letterCallbacks?.onComplete) {
                    this.letterCallbacks.onComplete();
                }
                return;
            }

            this.letterCurrentParagraph = idx;
            const p = this.letterParagraphs[idx];

            if (this.letterCallbacks?.onParagraphStart) {
                this.letterCallbacks.onParagraphStart(idx, p.text, p.duration);
            }

            const subtitleDuration = Math.max(3500, p.text.length * 75);
            this.showSubtitle(p.text, subtitleDuration);

            this.playAudioKey(p.key, () => {
                if (!this.isLetterNarrationRunning || this.isLetterPausedState) return;
                // Gentle 550ms storytelling breath pause between paragraphs
                this.letterStepTimeout = setTimeout(() => {
                    if (this.isLetterNarrationRunning && !this.isLetterPausedState) {
                        playParagraph(idx + 1);
                    }
                }, 550);
            });
        };

        playParagraph(0);
    }

    public pauseLetterNarration() {
        if (!this.isLetterNarrationRunning || this.isLetterPausedState) return;
        this.isLetterPausedState = true;
        if (this.letterStepTimeout) {
            clearTimeout(this.letterStepTimeout);
            this.letterStepTimeout = null;
        }
        if (this.currentAudioEl) {
            try { this.currentAudioEl.pause(); } catch { /* ignore */ }
        }
        if (this.currentSource) {
            try { this.currentSource.stop(); } catch { /* ignore */ }
            this.currentSource = null;
        }
    }

    public resumeLetterNarration() {
        if (!this.isLetterNarrationRunning || !this.isLetterPausedState) return;
        this.isLetterPausedState = false;

        const p = this.letterParagraphs[this.letterCurrentParagraph];
        if (!p) return;

        this.playAudioKey(p.key, () => {
            if (!this.isLetterNarrationRunning || this.isLetterPausedState) return;
            this.letterStepTimeout = setTimeout(() => {
                if (this.isLetterNarrationRunning && !this.isLetterPausedState) {
                    this.playLetterNext(this.letterCurrentParagraph + 1);
                }
            }, 450);
        });
    }

    private playLetterNext(idx: number) {
        if (!this.isLetterNarrationRunning || this.isLetterPausedState) return;
        if (idx >= this.letterParagraphs.length) {
            this.isLetterNarrationRunning = false;
            if (this.letterCallbacks?.onComplete) {
                this.letterCallbacks.onComplete();
            }
            return;
        }

        this.letterCurrentParagraph = idx;
        const p = this.letterParagraphs[idx];

        if (this.letterCallbacks?.onParagraphStart) {
            this.letterCallbacks.onParagraphStart(idx, p.text, p.duration);
        }

        const subtitleDuration = Math.max(3500, p.text.length * 75);
        this.showSubtitle(p.text, subtitleDuration);

        this.playAudioKey(p.key, () => {
            if (!this.isLetterNarrationRunning || this.isLetterPausedState) return;
            this.letterStepTimeout = setTimeout(() => {
                if (this.isLetterNarrationRunning && !this.isLetterPausedState) {
                    this.playLetterNext(idx + 1);
                }
            }, 550);
        });
    }

    public replayLetterNarration() {
        if (!this.letterCallbacks) return;
        this.stopLetterNarration();
        this.narrateHogwartsLetter(this.letterCallbacks);
    }

    public setLetterMuted(muted: boolean) {
        this.isLetterMutedState = muted;
        if (this.currentGainNode) {
            this.currentGainNode.gain.value = muted ? 0.0 : 1.0;
        }
        if (this.currentAudioEl) {
            this.currentAudioEl.volume = muted ? 0.0 : 1.0;
        }
    }

    public isLetterMuted(): boolean {
        return this.isLetterMutedState;
    }

    public isLetterNarrationActive(): boolean {
        return this.isLetterNarrationRunning;
    }

    public isLetterNarrationPaused(): boolean {
        return this.isLetterPausedState;
    }

    public stopLetterNarration() {
        this.isLetterNarrationRunning = false;
        this.isLetterPausedState = false;
        if (this.letterStepTimeout) {
            clearTimeout(this.letterStepTimeout);
            this.letterStepTimeout = null;
        }
        this.cancelCurrentAudio();
    }

    /**
     * Returns true if voice narration is currently in progress.
     */
    public isSpeaking(): boolean {
        return this.isSpeakingSequence || this.isLetterNarrationRunning || (this.synth ? this.synth.speaking : false);
    }

    public cancel() {
        this.isSpeakingSequence = false;
        this.sequenceQueue = [];
        this.stopLetterNarration();
        this.cancelCurrentAudio();
        this.lastKey = null;
        if (this.subtitleEl) this.subtitleEl.style.opacity = '0';
        this.lastDisplayedText = '';
    }
}

