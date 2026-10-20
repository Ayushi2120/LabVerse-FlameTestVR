import { VoiceEngine } from './VoiceEngine';

export class AudioEngine {
    private ctx: AudioContext | null = null;
    private burnerNoise: AudioBufferSourceNode | null = null;
    private burnerGain: GainNode | null = null;
    public voice: VoiceEngine;

    private hasUnlockedHTML5 = false;

    constructor() {
        this.voice = new VoiceEngine(() => this.getContext());
        const initAudio = () => {
            this.resume();
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('pointerdown', initAudio);
            window.addEventListener('mousedown', initAudio);
            window.addEventListener('keydown', initAudio);
            window.addEventListener('touchstart', initAudio);
            window.addEventListener('touchend', initAudio);
            window.addEventListener('click', initAudio);
            window.addEventListener('selectstart', initAudio);
        }
    }

    public getContext(): AudioContext | null {
        this.ensureContext();
        return this.ctx;
    }

    private unlockHTML5() {
        if (this.hasUnlockedHTML5) return;
        try {
            const silent = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
            const p = silent.play();
            if (p !== undefined) {
                p.then(() => {
                    silent.pause();
                    this.hasUnlockedHTML5 = true;
                }).catch(() => {});
            } else {
                this.hasUnlockedHTML5 = true;
            }
        } catch {
            // ignore
        }
    }

    public async resume(): Promise<void> {
        this.ensureContext();
        if (this.ctx && this.ctx.state === 'suspended') {
            try {
                await this.ctx.resume();
            } catch {
                // ignore
            }
        }
        this.unlockHTML5();
        if (this.voice) {
            this.voice.resume();
        }
    }

    private ensureContext() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
                // Play tiny silent buffer to warm up audio pipeline
                try {
                    const buf = this.ctx.createBuffer(1, 1, 22050);
                    const src = this.ctx.createBufferSource();
                    src.buffer = buf;
                    src.connect(this.ctx.destination);
                    src.start(0);
                } catch {
                    // ignore
                }
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
    }

    public playGrab() {
        this.ensureContext();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    public playDip() {
        this.ensureContext();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(850, this.ctx.currentTime + 0.12);
        
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
    }

    public playBlip() {
        this.ensureContext();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1600, this.ctx.currentTime + 0.05);
        
        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }

    public toggleBurner(isOn: boolean) {
        this.ensureContext();
        if (!this.ctx) return;
        
        if (isOn) {
            // Create white noise
            const bufferSize = this.ctx.sampleRate * 2; 
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            this.burnerNoise = this.ctx.createBufferSource();
            this.burnerNoise.buffer = buffer;
            this.burnerNoise.loop = true;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 1000;

            this.burnerGain = this.ctx.createGain();
            this.burnerGain.gain.setValueAtTime(0, this.ctx.currentTime);
            this.burnerGain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 0.1);

            this.burnerNoise.connect(filter);
            filter.connect(this.burnerGain);
            this.burnerGain.connect(this.ctx.destination);
            
            this.burnerNoise.start();
        } else {
            if (this.burnerGain && this.burnerNoise) {
                this.burnerGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);
                this.burnerNoise.stop(this.ctx.currentTime + 0.1);
                this.burnerNoise = null;
                this.burnerGain = null;
            }
        }
    }

    public playReaction() {
        this.ensureContext();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // Stage 1: Soft ignition whoosh (0s to 0.45s) using lowpass filtered noise
        try {
            const bufferSize = Math.floor(this.ctx.sampleRate * 0.45);
            const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
            }
            const whiteNoise = this.ctx.createBufferSource();
            whiteNoise.buffer = noiseBuffer;
            const whooshFilter = this.ctx.createBiquadFilter();
            whooshFilter.type = 'lowpass';
            whooshFilter.frequency.setValueAtTime(350, now);
            whooshFilter.frequency.exponentialRampToValueAtTime(1400, now + 0.22);
            whooshFilter.frequency.exponentialRampToValueAtTime(300, now + 0.45);

            const whooshGain = this.ctx.createGain();
            whooshGain.gain.setValueAtTime(0, now);
            whooshGain.gain.linearRampToValueAtTime(0.14, now + 0.1);
            whooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

            whiteNoise.connect(whooshFilter);
            whooshFilter.connect(whooshGain);
            whooshGain.connect(this.ctx.destination);
            whiteNoise.start(now);
        } catch {
            // fallback gracefully if buffer creation fails
        }

        // Stage 2: Soft harmonic tonal accent (0.25s to 1.1s)
        const chordFreqs = [392.00, 587.33]; // G4 + D5 (warm perfect fifth)
        chordFreqs.forEach((freq) => {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq * 0.88, now + 0.2);
            osc.frequency.exponentialRampToValueAtTime(freq, now + 0.55);

            gain.gain.setValueAtTime(0, now + 0.2);
            gain.gain.linearRampToValueAtTime(0.08, now + 0.4);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + 0.2);
            osc.stop(now + 1.1);
        });

        // Stage 3: Short finishing crystalline chime (0.95s to 1.8s)
        const chimeFreqs = [1046.50, 1318.51]; // C6 + E6
        chimeFreqs.forEach((freq, idx) => {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + 0.95 + idx * 0.08);

            gain.gain.setValueAtTime(0, now + 0.95 + idx * 0.08);
            gain.gain.linearRampToValueAtTime(0.09, now + 0.95 + idx * 0.08 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0005, now + 1.8);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + 0.95 + idx * 0.08);
            osc.stop(now + 1.8);
        });
    }

    public playCorrect() {
        this.ensureContext();
        if (!this.ctx) return;
        const ctx = this.ctx;
        const notes = [440, 554.37, 659.25, 880];
        const startTime = ctx.currentTime;
        
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            gain.gain.setValueAtTime(0, startTime + i * 0.1);
            gain.gain.linearRampToValueAtTime(0.2, startTime + i * 0.1 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + i * 0.1 + 0.5);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(startTime + i * 0.1);
            osc.stop(startTime + i * 0.1 + 0.5);
        });
    }

    public playWrong() {
        this.ensureContext();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 0.3);
        
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }

    public playEasterEggChime() {
        this.ensureContext();
        if (!this.ctx) return;
        const ctx = this.ctx;
        // Pentatonic crystalline arpeggio: C5 (523.25), E5 (659.25), G5 (783.99), B5 (987.77), E6 (1318.51)
        const notes = [523.25, 659.25, 783.99, 987.77, 1318.51];
        const startTime = ctx.currentTime;
        
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            gain.gain.setValueAtTime(0, startTime + i * 0.08);
            gain.gain.linearRampToValueAtTime(0.18, startTime + i * 0.08 + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + i * 0.08 + 1.2);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(startTime + i * 0.08);
            osc.stop(startTime + i * 0.08 + 1.2);
        });
    }

    /**
     * Golden Snitch Easter Egg Magical Chime.
     * Crystalline, ethereal high-register arpeggio in F# major with soft golden shimmer.
     */
    public playSnitchMagicalChime() {
        this.ensureContext();
        if (!this.ctx) return;
        const ctx = this.ctx;
        // High celestial bell arpeggio: F#6 (1479.98), A#6 (1864.66), C#7 (2217.46), F#7 (2959.96)
        const notes = [1479.98, 1864.66, 2217.46, 2959.96];
        const startTime = ctx.currentTime;

        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime + i * 0.09);

            // Shimmer vibrato
            const lfo = ctx.createOscillator();
            const lfoGain = ctx.createGain();
            lfo.frequency.value = 14; // 14Hz shimmer flutter
            lfoGain.gain.value = 8;
            lfo.connect(osc.frequency);
            lfo.start(startTime + i * 0.09);
            lfo.stop(startTime + i * 0.09 + 1.4);

            gain.gain.setValueAtTime(0, startTime + i * 0.09);
            gain.gain.linearRampToValueAtTime(0.14, startTime + i * 0.09 + 0.025);
            gain.gain.exponentialRampToValueAtTime(0.0005, startTime + i * 0.09 + 1.4);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(startTime + i * 0.09);
            osc.stop(startTime + i * 0.09 + 1.4);
        });
    }

    /**
     * Hogwarts Letter Emergence Sound.
     * Soft, ethereal gliding glissando as the parchment emerges from the Snitch.
     */
    public playLetterEmergeSound() {
        this.ensureContext();
        if (!this.ctx) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc2.type = 'triangle';

        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(784, now + 0.85);

        osc2.frequency.setValueAtTime(480, now);
        osc2.frequency.exponentialRampToValueAtTime(1174, now + 0.85);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(2400, now + 0.6);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

        osc.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc2.start(now);
        osc.stop(now + 0.9);
        osc2.stop(now + 0.9);
    }

    /**
     * Hogwarts Letter 3D Paper Unfolding Rustle.
     * Realistic parchment paper friction and mechanical flap opening rustle.
     */
    public playPaperUnfoldSound() {
        this.ensureContext();
        if (!this.ctx) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;

        try {
            const bufferSize = Math.floor(ctx.sampleRate * 0.45);
            const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                const env = Math.sin((i / bufferSize) * Math.PI) * (0.6 + Math.random() * 0.4);
                output[i] = (Math.random() * 2 - 1) * env;
            }

            const whiteNoise = ctx.createBufferSource();
            whiteNoise.buffer = noiseBuffer;

            const bandpass = ctx.createBiquadFilter();
            bandpass.type = 'bandpass';
            bandpass.frequency.setValueAtTime(2800, now);
            bandpass.frequency.exponentialRampToValueAtTime(3800, now + 0.25);
            bandpass.Q.value = 2.0;

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.15, now + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

            whiteNoise.connect(bandpass);
            bandpass.connect(gain);
            gain.connect(ctx.destination);

            whiteNoise.start(now);
        } catch {
            // graceful fallback
        }
    }

    /**
     * Hogwarts Letter Wax Seal Glint & Message Reveal Sparkle.
     * Delicate, high-register celestial crystalline twinkle.
     */
    public playSparkleSound() {
        this.ensureContext();
        if (!this.ctx) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;

        // Twinkling arpeggio: B6 (1975.53), E7 (2637.02), G#7 (3322.44), B7 (3951.07), E8 (5274.04)
        const notes = [1975.53, 2637.02, 3322.44, 3951.07, 5274.04];

        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.06);

            gain.gain.setValueAtTime(0, now + idx * 0.06);
            gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.06 + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.0005, now + idx * 0.06 + 0.4);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.06);
            osc.stop(now + idx * 0.06 + 0.4);
        });
    }

    /**
     * Soft original magical realm transition sound.
     * Ethereal harmonic swelling pad in D major with celestial filter sweep (Part 5).
     */
    public playMagicalTransitionSound() {
        this.ensureContext();
        if (!this.ctx) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;

        // Ethereal swelling triad: D4 (293.66), A4 (440.00), F#5 (739.99), D6 (1174.66)
        const chord = [293.66, 440.00, 739.99, 1174.66];
        chord.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();

            osc.type = i % 2 === 0 ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(freq * 0.995, now);
            osc.frequency.linearRampToValueAtTime(freq, now + 1.2);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(450, now);
            filter.frequency.exponentialRampToValueAtTime(2600, now + 1.4);
            filter.frequency.exponentialRampToValueAtTime(600, now + 2.4);

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.08, now + 0.9);
            gain.gain.exponentialRampToValueAtTime(0.0005, now + 2.5);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 2.5);
        });
    }

    /**
     * Wax seal opening chime and delicate parchment crackle (Part 5).
     */
    public playWaxSealOpenSound() {
        this.ensureContext();
        if (!this.ctx) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;

        // Delicate crystalline chime: E6 (1318.51), G#6 (1661.22), B6 (1975.53)
        const notes = [1318.51, 1661.22, 1975.53];
        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.05);

            gain.gain.setValueAtTime(0, now + idx * 0.05);
            gain.gain.linearRampToValueAtTime(0.10, now + idx * 0.05 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.6);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.05);
            osc.stop(now + idx * 0.05 + 0.6);
        });
    }

    /**
     * Letter dissolve and disappearance shimmer sound (Part 5).
     * Ascending celestial stardust glissando fading smoothly into silence.
     */
    public playLetterDissolveSound() {
        this.ensureContext();
        if (!this.ctx) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;

        const gliss = [880, 1174.66, 1479.98, 1760, 2217.46];
        gliss.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.08);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + i * 0.08 + 0.5);

            gain.gain.setValueAtTime(0, now + i * 0.08);
            gain.gain.linearRampToValueAtTime(0.07, now + i * 0.08 + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.0005, now + i * 0.08 + 0.7);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + i * 0.08);
            osc.stop(now + i * 0.08 + 0.7);
        });
    }
}
