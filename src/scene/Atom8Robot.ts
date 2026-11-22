/**
 * Atom8Robot.ts — ATOM-8: Cute Original BB-8-Inspired AI Robot Companion for LABVERSE.
 * - Compact platinum/white ceramic body with cyan glowing accents & floating dome head.
 * - Expressive optics with dynamic animated eye canvas (idle, listening, thinking, speaking, happy).
 * - Full AI Chemistry assistant: answers questions, step-by-step experiment guidance, progressive hints.
 * - Interactive 3D Chemistry Quiz mode with 3D pokeable buttons.
 * - Voice speech synthesis, procedural droid sound effects, and voice recognition input.
 * - Complete feature parity across Meta Quest VR (hand tracking poke/raycast) & Desktop (mouse/keys).
 */

import * as THREE from 'three';
import { AudioEngine } from '../audio/AudioEngine';
import { ChemistryKnowledge, QUIZ_QUESTIONS } from '../ai/ChemistryKnowledge';

export type RobotState = 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'HAPPY' | 'QUIZ';

export interface Atom8Callbacks {
    onStepRequested?: () => void;
    onHintRequested?: () => void;
    onQuizCompleted?: (score: number, total: number) => void;
    getCurrentExperimentState?: () => { state: string; saltIndex: number; areGlovesEquipped: boolean };
}

export class Atom8Robot {
    public group: THREE.Group;
    public bodyGroup: THREE.Group;
    public headGroup: THREE.Group;
    public hudGroup: THREE.Group;

    // Materials
    private bodyMaterial: THREE.MeshPhysicalMaterial;
    private cyanGlowMaterial: THREE.MeshStandardMaterial;
    private darkMetalMaterial: THREE.MeshStandardMaterial;
    private eyeLensMaterial: THREE.MeshBasicMaterial;

    // Lights
    private hoverLight: THREE.PointLight;

    // Head components
    private domeMesh: THREE.Mesh;
    private antennaGroup: THREE.Group;
    private eyeMesh: THREE.Mesh;
    private eyeCanvas: HTMLCanvasElement;
    private eyeCtx: CanvasRenderingContext2D;
    private eyeTexture: THREE.CanvasTexture;

    // HUD Display & Buttons
    private hudCanvas: HTMLCanvasElement;
    private hudCtx: CanvasRenderingContext2D;
    private hudTexture: THREE.CanvasTexture;
    private hudMesh: THREE.Mesh;

    // 3D Interactive Button Meshes on HUD
    private hudButtons: {
        id: string;
        mesh: THREE.Mesh;
        label: string;
        bounds: { minX: number; maxX: number; minY: number; maxY: number };
        action: () => void;
    }[] = [];

    // Panel Visibility & Smooth Animated Transition
    public isHUDOpen = false;
    private hudTargetScale = 0.0;
    private hudCurrentScale = 0.0;

    // State & Kinematics
    private currentState: RobotState = 'IDLE';
    private stateTimer = 0;
    private animTime = 0;
    private currentSpeechText = "";
    private isSpeaking = false;

    // Quiz State
    private currentQuizQuestionIndex = 0;
    private quizScore = 0;
    private quizAnswered = false;
    private quizSelectedOption: number | null = null;
    private quizFeedbackText = "";

    // Speech Recognition
    private recognition: any = null;
    private isListeningVoice = false;

    // Audio & Callbacks
    private audio: AudioEngine;
    private callbacks: Atom8Callbacks;

    // Position & Ergonomics: Positioned neatly beside the test-tube rack (x = -0.38m, y = 1.03m, z = -0.98m)
    private basePosition = new THREE.Vector3(-0.38, 1.03, -0.98);

    // Scratch vector for zero-GC calculations
    private static _scratchV = new THREE.Vector3();
    private static _scratchLocalPoke = new THREE.Vector3();

    constructor(audio: AudioEngine, callbacks: Atom8Callbacks = {}) {
        this.audio = audio;
        this.callbacks = callbacks;

        this.group = new THREE.Group();
        this.group.name = "Atom8Robot";
        this.group.position.copy(this.basePosition);
        this.group.rotation.y = 0.37; // Angled ~21 degrees towards user standing at central workstation (0, 0, 0)
        this.group.scale.set(0.75, 0.75, 0.75); // Scaled down uniformly to 75% for cute compact companion proportions
        (this.group as any).userData = { isAtom8Robot: true };

        // --- 1. MATERIALS ---
        // Polished White/Platinum Ceramic Shell (Cute futuristic droid finish)
        this.bodyMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xf8fafc,
            roughness: 0.16,
            metalness: 0.22,
            clearcoat: 0.88,
            clearcoatRoughness: 0.12,
            reflectivity: 0.9
        });

        // Glowing Cyan Accents (#00e5ff)
        this.cyanGlowMaterial = new THREE.MeshStandardMaterial({
            color: 0x00e5ff,
            emissive: 0x00e5ff,
            emissiveIntensity: 0.95,
            roughness: 0.2,
            metalness: 0.4
        });

        // Dark Titanium Mechanical Trim
        this.darkMetalMaterial = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            metalness: 0.85,
            roughness: 0.25
        });

        // --- 2. LOWER COMPACT BODY (BB-8 Inspired Sphere Chassis) ---
        this.bodyGroup = new THREE.Group();
        this.bodyGroup.name = "Atom8BodyGroup";

        // Spherical main body (11cm radius)
        const bodyGeo = new THREE.SphereGeometry(0.11, 32, 32);
        const bodyMesh = new THREE.Mesh(bodyGeo, this.bodyMaterial);
        bodyMesh.castShadow = true;
        bodyMesh.receiveShadow = true;
        bodyMesh.userData = { isRobotBody: true, isAtom8Robot: true };
        this.bodyGroup.add(bodyMesh);

        // Segmented Cyan Orbital Ring Trims on Body
        const ringGeo1 = new THREE.TorusGeometry(0.1105, 0.0035, 8, 36);
        const ring1 = new THREE.Mesh(ringGeo1, this.cyanGlowMaterial);
        ring1.rotation.x = Math.PI / 4;
        ring1.rotation.y = Math.PI / 6;
        this.bodyGroup.add(ring1);

        const ringGeo2 = new THREE.TorusGeometry(0.1105, 0.0035, 8, 36);
        const ring2 = new THREE.Mesh(ringGeo2, this.cyanGlowMaterial);
        ring2.rotation.x = -Math.PI / 4;
        ring2.rotation.z = Math.PI / 5;
        this.bodyGroup.add(ring2);

        // Central Equatorial Gyro Ring with Cyan Indicator Dots
        const gyroRingGeo = new THREE.TorusGeometry(0.111, 0.004, 8, 48);
        const gyroRing = new THREE.Mesh(gyroRingGeo, this.darkMetalMaterial);
        this.bodyGroup.add(gyroRing);

        for (let i = 0; i < 6; i++) {
            const dotGeo = new THREE.SphereGeometry(0.004, 12, 12);
            const dot = new THREE.Mesh(dotGeo, this.cyanGlowMaterial);
            const angle = (i / 6) * Math.PI * 2;
            dot.position.set(Math.cos(angle) * 0.112, 0, Math.sin(angle) * 0.112);
            this.bodyGroup.add(dot);
        }

        // Base Magnetic Levitation Emitter Ring
        const thrusterGeo = new THREE.CylinderGeometry(0.045, 0.055, 0.015, 24);
        const thruster = new THREE.Mesh(thrusterGeo, this.darkMetalMaterial);
        thruster.position.y = -0.108;
        this.bodyGroup.add(thruster);

        const levGlowGeo = new THREE.TorusGeometry(0.048, 0.003, 8, 24);
        const levGlow = new THREE.Mesh(levGlowGeo, this.cyanGlowMaterial);
        levGlow.rotation.x = Math.PI / 2;
        levGlow.position.y = -0.112;
        this.bodyGroup.add(levGlow);

        // Gentle Ambient Levitation Light
        this.hoverLight = new THREE.PointLight(0x00e5ff, 0.85, 1.2);
        this.hoverLight.position.set(0, -0.12, 0);
        this.bodyGroup.add(this.hoverLight);

        this.group.add(this.bodyGroup);

        // --- 3. ARTICULATED MAGNETIC DOME HEAD ---
        this.headGroup = new THREE.Group();
        this.headGroup.name = "Atom8HeadGroup";
        this.headGroup.position.set(0, 0.125, 0); // Perched smoothly atop spherical body

        // Magnetic Base Ring Collar on Head
        const headCollarGeo = new THREE.CylinderGeometry(0.082, 0.085, 0.012, 32);
        const headCollar = new THREE.Mesh(headCollarGeo, this.darkMetalMaterial);
        headCollar.position.y = 0.006;
        this.headGroup.add(headCollar);

        // Dome Hemisphere (radius 8.8cm)
        const domeGeo = new THREE.SphereGeometry(0.088, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        this.domeMesh = new THREE.Mesh(domeGeo, this.bodyMaterial);
        this.domeMesh.castShadow = true;
        this.headGroup.add(this.domeMesh);

        // Cyan Head Accent Band
        const headBandGeo = new THREE.CylinderGeometry(0.0882, 0.0882, 0.006, 32, 1, true);
        const headBand = new THREE.Mesh(headBandGeo, this.cyanGlowMaterial);
        headBand.position.y = 0.035;
        this.headGroup.add(headBand);

        // Articulated Micro-Antenna with Glowing Beacon Tip
        this.antennaGroup = new THREE.Group();
        this.antennaGroup.position.set(0.032, 0.082, -0.015);

        const antShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.0018, 0.0022, 0.05, 8), this.darkMetalMaterial);
        antShaft.position.y = 0.025;
        this.antennaGroup.add(antShaft);

        const antTip = new THREE.Mesh(new THREE.SphereGeometry(0.0035, 12, 12), this.cyanGlowMaterial);
        antTip.position.y = 0.052;
        this.antennaGroup.add(antTip);

        this.headGroup.add(this.antennaGroup);

        // Secondary Telemetry Sensor Port (Tiny round sensor with amber LED)
        const sensorGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.006, 16);
        sensorGeo.rotateX(Math.PI / 2);
        const sensorMesh = new THREE.Mesh(sensorGeo, this.darkMetalMaterial);
        sensorMesh.position.set(-0.035, 0.042, 0.076);
        this.headGroup.add(sensorMesh);

        const sensorLedGeo = new THREE.SphereGeometry(0.0035, 12, 12);
        const sensorLed = new THREE.Mesh(sensorLedGeo, new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
        sensorLed.position.set(-0.035, 0.042, 0.08);
        this.headGroup.add(sensorLed);

        // --- 4. LARGE EXPRESSIVE EYE / HOLOGRAPHIC OPTICAL SCANNER ---
        this.eyeCanvas = document.createElement('canvas');
        this.eyeCanvas.width = 256;
        this.eyeCanvas.height = 256;
        this.eyeCtx = this.eyeCanvas.getContext('2d')!;
        this.eyeTexture = new THREE.CanvasTexture(this.eyeCanvas);
        this.eyeTexture.colorSpace = THREE.SRGBColorSpace;

        const eyeBezelGeo = new THREE.CylinderGeometry(0.028, 0.031, 0.008, 24);
        eyeBezelGeo.rotateX(Math.PI / 2);
        const eyeBezel = new THREE.Mesh(eyeBezelGeo, this.darkMetalMaterial);
        eyeBezel.position.set(0.018, 0.048, 0.078);
        this.headGroup.add(eyeBezel);

        const eyeGeo = new THREE.CircleGeometry(0.026, 32);
        this.eyeLensMaterial = new THREE.MeshBasicMaterial({
            map: this.eyeTexture,
            transparent: true,
            side: THREE.DoubleSide
        });
        this.eyeMesh = new THREE.Mesh(eyeGeo, this.eyeLensMaterial);
        this.eyeMesh.position.set(0.018, 0.048, 0.083);
        this.headGroup.add(this.eyeMesh);

        this.group.add(this.headGroup);

        // --- 5. 3D HOLOGRAPHIC INTERACTIVE HUD & SPEECH DISPLAY ---
        this.hudGroup = new THREE.Group();
        this.hudGroup.name = "Atom8HUDGroup";
        this.hudGroup.position.set(0, 0.32, 0.02); // Positioned comfortably above head
        this.hudGroup.rotation.x = -0.15; // Tilted slightly up towards user's eyes

        this.hudCanvas = document.createElement('canvas');
        this.hudCanvas.width = 768;
        this.hudCanvas.height = 480;
        this.hudCtx = this.hudCanvas.getContext('2d')!;
        this.hudTexture = new THREE.CanvasTexture(this.hudCanvas);
        this.hudTexture.colorSpace = THREE.SRGBColorSpace;

        const hudPlaneGeo = new THREE.PlaneGeometry(0.48, 0.30);
        const hudMat = new THREE.MeshBasicMaterial({
            map: this.hudTexture,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        this.hudMesh = new THREE.Mesh(hudPlaneGeo, hudMat);
        this.hudMesh.name = "Atom8HUDMesh";
        this.hudMesh.userData = { isAtom8HUD: true };
        this.hudGroup.add(this.hudMesh);

        // Holographic projector frame trim
        const frameMat = new THREE.MeshStandardMaterial({
            color: 0x00e5ff,
            emissive: 0x00aacc,
            emissiveIntensity: 0.6,
            roughness: 0.3,
            metalness: 0.7
        });
        const topBar = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.005, 0.004), frameMat);
        topBar.position.y = 0.15;
        this.hudGroup.add(topBar);

        const btmBar = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.005, 0.004), frameMat);
        btmBar.position.y = -0.15;
        this.hudGroup.add(btmBar);

        this.group.add(this.hudGroup);

        // AI panel is completely hidden by default
        this.hudGroup.visible = false;
        this.hudGroup.scale.set(0.001, 0.001, 0.001);
        this.isHUDOpen = false;
        this.hudTargetScale = 0.0;
        this.hudCurrentScale = 0.0;

        // Setup 3D buttons on the HUD
        this.setupHUDButtons();

        // Initialize Eye & HUD visuals
        this.renderEyeExpression('idle');
        this.updateHUDDisplay();

        // Initialize Speech Recognition if supported
        this.initSpeechRecognition();

        // Default prompt for when panel opens (zero speech on open)
        this.currentSpeechText = "Hello scientist! Choose an option below or ask me a Chemistry question:";
        this.updateHUDDisplay();
    }

    /**
     * AI Panel Visibility State & Control.
     */
    public isPanelOpen(): boolean {
        return this.isHUDOpen;
    }

    public openPanel() {
        if (this.isHUDOpen) return;
        this.isHUDOpen = true;
        this.hudTargetScale = 1.0;
        this.hudGroup.visible = true;
        this.audio.playBlip();
        this.updateHUDDisplay();
        // Crucial requirement: Do NOT trigger AI responses or robot voice simply because the panel opens!
    }

    public closePanel() {
        if (!this.isHUDOpen) return;
        this.isHUDOpen = false;
        this.hudTargetScale = 0.0;
        if (this.isSpeaking && typeof window !== 'undefined' && 'speechSynthesis' in window) {
            try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
            this.isSpeaking = false;
        }
        if (this.currentState === 'QUIZ') {
            this.currentState = 'IDLE';
        }
        this.setState('IDLE');
        this.audio.playBlip();
    }

    public togglePanel() {
        if (this.isHUDOpen) {
            this.closePanel();
        } else {
            this.openPanel();
        }
    }

    /**
     * Build 3D interactive hit-boxes for HUD actions.
     */
    private setupHUDButtons() {
        this.hudButtons = [];

        if (this.currentState === 'QUIZ') {
            // Quiz Mode Buttons: [Option A], [Option B], [Option C], [Option D], [Next / Finish]
            const optY = [0.03, -0.02, -0.07, -0.12];
            const q = QUIZ_QUESTIONS[this.currentQuizQuestionIndex];

            for (let i = 0; i < 4; i++) {
                const btnMesh = new THREE.Mesh(
                    new THREE.PlaneGeometry(0.42, 0.038),
                    new THREE.MeshBasicMaterial({ visible: false })
                );
                btnMesh.position.set(0, optY[i], 0.005);
                btnMesh.userData = { isQuizOption: true, optionIndex: i };
                this.hudGroup.add(btnMesh);

                this.hudButtons.push({
                    id: `quiz_opt_${i}`,
                    mesh: btnMesh,
                    label: q ? q.options[i] : `Option ${i}`,
                    bounds: { minX: -0.21, maxX: 0.21, minY: optY[i] - 0.02, maxY: optY[i] + 0.02 },
                    action: () => this.handleQuizAnswer(i)
                });
            }

            // Next / Retry Button
            const nextMesh = new THREE.Mesh(
                new THREE.PlaneGeometry(0.18, 0.035),
                new THREE.MeshBasicMaterial({ visible: false })
            );
            nextMesh.position.set(0.12, -0.13, 0.005);
            nextMesh.userData = { isQuizNext: true };
            this.hudGroup.add(nextMesh);

            this.hudButtons.push({
                id: 'quiz_next',
                mesh: nextMesh,
                label: this.quizAnswered ? (this.currentQuizQuestionIndex < QUIZ_QUESTIONS.length - 1 ? "Next ➡️" : "Finish 🎉") : "Skip",
                bounds: { minX: 0.03, maxX: 0.21, minY: -0.15, maxY: -0.11 },
                action: () => this.handleQuizNext()
            });

            // Exit Quiz Button
            const exitMesh = new THREE.Mesh(
                new THREE.PlaneGeometry(0.14, 0.035),
                new THREE.MeshBasicMaterial({ visible: false })
            );
            exitMesh.position.set(-0.14, -0.13, 0.005);
            exitMesh.userData = { isQuizExit: true };
            this.hudGroup.add(exitMesh);

            this.hudButtons.push({
                id: 'quiz_exit',
                mesh: exitMesh,
                label: "Exit Quiz",
                bounds: { minX: -0.21, maxX: -0.07, minY: -0.15, maxY: -0.11 },
                action: () => this.exitQuizMode()
            });
            // Close Button [✕] at top-right in Quiz Mode
            const quizCloseMesh = new THREE.Mesh(
                new THREE.PlaneGeometry(0.045, 0.045),
                new THREE.MeshBasicMaterial({ visible: false })
            );
            quizCloseMesh.position.set(0.20, 0.12, 0.005);
            quizCloseMesh.userData = { isAtom8Button: true, buttonId: 'btn_close' };
            this.hudGroup.add(quizCloseMesh);

            this.hudButtons.push({
                id: 'btn_close',
                mesh: quizCloseMesh,
                label: "✕",
                bounds: { minX: 0.17, maxX: 0.23, minY: 0.09, maxY: 0.15 },
                action: () => this.closePanel()
            });
        } else {
            // Standard Navigation & Assistant Buttons
            // [ 💬 Next Step ]  [ 💡 Hint ]  [ 🧪 Flame Test ]  [ ❓ Quiz Mode ]  [ 🎤 Voice Ask ]
            const btnConfigs = [
                { id: 'btn_step', label: "💬 Next Step", x: -0.16, y: -0.06, w: 0.14, h: 0.045, action: () => this.handleRequestStep() },
                { id: 'btn_hint', label: "💡 Give Hint", x: 0.00, y: -0.06, w: 0.14, h: 0.045, action: () => this.handleRequestHint() },
                { id: 'btn_flame', label: "🧪 Flame Test", x: 0.16, y: -0.06, w: 0.14, h: 0.045, action: () => this.handleExplainFlame() },
                { id: 'btn_quiz', label: "❓ Chemistry Quiz", x: -0.10, y: -0.115, w: 0.18, h: 0.042, action: () => this.startQuizMode() },
                { id: 'btn_voice', label: "🎤 Voice Ask", x: 0.10, y: -0.115, w: 0.18, h: 0.042, action: () => this.toggleVoiceListening() }
            ];

            btnConfigs.forEach(cfg => {
                const btnMesh = new THREE.Mesh(
                    new THREE.PlaneGeometry(cfg.w, cfg.h),
                    new THREE.MeshBasicMaterial({ visible: false })
                );
                btnMesh.position.set(cfg.x, cfg.y, 0.005);
                btnMesh.userData = { isAtom8Button: true, buttonId: cfg.id };
                this.hudGroup.add(btnMesh);

                this.hudButtons.push({
                    id: cfg.id,
                    mesh: btnMesh,
                    label: cfg.label,
                    bounds: { minX: cfg.x - cfg.w / 2, maxX: cfg.x + cfg.w / 2, minY: cfg.y - cfg.h / 2, maxY: cfg.y + cfg.h / 2 },
                    action: cfg.action
                });
            });

            // Close Button [✕] at top-right in Standard Mode
            const closeMesh = new THREE.Mesh(
                new THREE.PlaneGeometry(0.045, 0.045),
                new THREE.MeshBasicMaterial({ visible: false })
            );
            closeMesh.position.set(0.20, 0.12, 0.005);
            closeMesh.userData = { isAtom8Button: true, buttonId: 'btn_close' };
            this.hudGroup.add(closeMesh);

            this.hudButtons.push({
                id: 'btn_close',
                mesh: closeMesh,
                label: "✕",
                bounds: { minX: 0.17, maxX: 0.23, minY: 0.09, maxY: 0.15 },
                action: () => this.closePanel()
            });
        }
    }

    /**
     * Web Speech API Speech Recognition for Voice-based Question Answering.
     */
    private initSpeechRecognition() {
        if (typeof window === 'undefined') return;
        const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRec) {
            try {
                this.recognition = new SpeechRec();
                this.recognition.continuous = false;
                this.recognition.interimResults = false;
                this.recognition.lang = 'en-US';

                this.recognition.onstart = () => {
                    this.isListeningVoice = true;
                    this.setState('LISTENING');
                    this.audio.playDroidChirp('question');
                    this.currentSpeechText = "Listening for your Chemistry question...";
                    this.updateHUDDisplay();
                };

                this.recognition.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript;
                    this.processUserQuery(transcript);
                };

                this.recognition.onerror = () => {
                    this.isListeningVoice = false;
                    this.setState('IDLE');
                    this.updateHUDDisplay();
                };

                this.recognition.onend = () => {
                    this.isListeningVoice = false;
                    if (this.currentState === 'LISTENING') {
                        this.setState('IDLE');
                    }
                };
            } catch {
                // Speech recognition unavailable or blocked
            }
        }
    }

    /**
     * Process student query (from voice recognition or topic button).
     */
    public processUserQuery(query: string) {
        this.setState('THINKING');
        this.audio.playDroidChirp('thinking');
        this.currentSpeechText = `Thinking: "${query}"...`;
        this.updateHUDDisplay();

        setTimeout(() => {
            const exp = this.callbacks.getCurrentExperimentState ? this.callbacks.getCurrentExperimentState() : { state: 'GLOVES_NEEDED', saltIndex: 0, areGlovesEquipped: false };
            const answer = ChemistryKnowledge.answerQuestion(query, exp.state, exp.saltIndex);

            this.speak(answer.reply, answer.emotion);
        }, 600);
    }

    /**
     * Speak response with synthesized voice and procedural droid chirps.
     */
    public speak(text: string, emotion: 'speaking' | 'happy' | 'thinking' | 'question' = 'speaking') {
        // Stop any running experiment narration so it never overlaps with ATOM-8
        this.audio.stopAllNarration();

        this.currentSpeechText = text;
        this.isSpeaking = true;
        this.setState(emotion === 'happy' ? 'HAPPY' : 'SPEAKING');

        // Play appropriate droid sound
        this.audio.playDroidChirp(emotion);

        // Update 3D Holographic Display
        this.updateHUDDisplay();

        // Web Speech API Synthesis with cute high-pitch robotic voice
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            try {
                window.speechSynthesis.cancel();
                const utter = new SpeechSynthesisUtterance(text);
                utter.rate = 1.05;
                utter.pitch = 1.25; // Adorable sci-fi robotic voice
                utter.volume = 0.9;

                // Pick friendly high-quality English voice if available
                const voices = window.speechSynthesis.getVoices();
                const robotVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Zira')));
                if (robotVoice) utter.voice = robotVoice;

                utter.onend = () => {
                    this.isSpeaking = false;
                    if (this.currentState !== 'QUIZ') {
                        this.setState('IDLE');
                    }
                };
                utter.onerror = () => {
                    this.isSpeaking = false;
                    if (this.currentState !== 'QUIZ') {
                        this.setState('IDLE');
                    }
                };

                window.speechSynthesis.speak(utter);
            } catch {
                // Speech synthesis fallback
                setTimeout(() => {
                    this.isSpeaking = false;
                    if (this.currentState !== 'QUIZ') this.setState('IDLE');
                }, Math.max(2500, text.length * 55));
            }
        } else {
            setTimeout(() => {
                this.isSpeaking = false;
                if (this.currentState !== 'QUIZ') this.setState('IDLE');
            }, Math.max(2500, text.length * 55));
        }
    }

    /**
     * Renders dynamic expressive optical lens expressions onto CanvasTexture.
     */
    private renderEyeExpression(mode: 'idle' | 'listening' | 'thinking' | 'speaking' | 'happy') {
        const ctx = this.eyeCtx;
        const w = this.eyeCanvas.width;
        const h = this.eyeCanvas.height;
        const cx = w / 2;
        const cy = h / 2;

        ctx.clearRect(0, 0, w, h);

        // Dark digital lens backdrop
        const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 120);
        grad.addColorStop(0, '#051b2c');
        grad.addColorStop(1, '#020b14');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, 120, 0, Math.PI * 2);
        ctx.fill();

        // High-tech Cyan Grid Lines
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 105, 0, Math.PI * 2);
        ctx.stroke();

        switch (mode) {
            case 'happy': {
                // Adorable Joyful Curved Arc Eyes ( ^ _ ^ )
                ctx.strokeStyle = '#00ffff';
                ctx.lineWidth = 14;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.arc(cx, cy + 18, 55, Math.PI * 1.15, Math.PI * 1.85);
                ctx.stroke();

                // Sparkle accents
                ctx.fillStyle = '#fef08a';
                ctx.beginPath();
                ctx.arc(cx - 38, cy - 38, 7, 0, Math.PI * 2);
                ctx.arc(cx + 38, cy - 38, 7, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
            case 'listening': {
                // Concentric Sonar Pulse Rings
                const pulse = (Math.sin(this.animTime * 6) + 1) * 0.5;
                ctx.strokeStyle = '#38bdf8';
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.arc(cx, cy, 35 + pulse * 45, 0, Math.PI * 2);
                ctx.stroke();

                ctx.fillStyle = '#00ffff';
                ctx.beginPath();
                ctx.arc(cx, cy, 20, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
            case 'thinking': {
                // Rotating Electron Orbits
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(this.animTime * 4);

                ctx.strokeStyle = '#00e5ff';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.ellipse(0, 0, 75, 30, Math.PI / 4, 0, Math.PI * 2);
                ctx.stroke();

                ctx.beginPath();
                ctx.ellipse(0, 0, 75, 30, -Math.PI / 4, 0, Math.PI * 2);
                ctx.stroke();

                // Orbiting electrons
                ctx.fillStyle = '#38bdf8';
                ctx.beginPath();
                ctx.arc(50, 20, 7, 0, Math.PI * 2);
                ctx.arc(-50, -20, 7, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();

                // Nucleus
                ctx.fillStyle = '#f8fafc';
                ctx.beginPath();
                ctx.arc(cx, cy, 14, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
            case 'speaking': {
                // Dynamic Vocalizer Soundwave Equalizer Bars
                const bars = 7;
                const barWidth = 12;
                const spacing = 8;
                const totalW = bars * barWidth + (bars - 1) * spacing;
                const startX = cx - totalW / 2;

                ctx.fillStyle = '#00ffff';
                for (let i = 0; i < bars; i++) {
                    const hFactor = Math.abs(Math.sin(this.animTime * 8 + i * 1.2));
                    const bH = 20 + hFactor * 80;
                    ctx.fillRect(startX + i * (barWidth + spacing), cy - bH / 2, barWidth, bH);
                }
                break;
            }
            case 'idle':
            default: {
                // Calm Glowing Cyan Pupil with Breathing Iris
                const breath = Math.sin(this.animTime * 2.5) * 4;
                const irisGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 55 + breath);
                irisGrad.addColorStop(0, '#ffffff');
                irisGrad.addColorStop(0.35, '#00e5ff');
                irisGrad.addColorStop(0.85, '#0284c7');
                irisGrad.addColorStop(1, 'transparent');

                ctx.fillStyle = irisGrad;
                ctx.beginPath();
                ctx.arc(cx, cy, 55 + breath, 0, Math.PI * 2);
                ctx.fill();

                // Pupil highlight reflection
                ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
                ctx.beginPath();
                ctx.arc(cx - 18, cy - 18, 9, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
        }

        this.eyeTexture.needsUpdate = true;
    }

    /**
     * Render crisp 3D Holographic Canvas HUD (Dialogue, Buttons, Quiz).
     */
    public updateHUDDisplay() {
        const ctx = this.hudCtx;
        const w = this.hudCanvas.width;
        const h = this.hudCanvas.height;

        ctx.clearRect(0, 0, w, h);

        // Futuristic Glassmorphism Panel
        ctx.fillStyle = 'rgba(10, 16, 28, 0.88)';
        ctx.beginPath();
        ctx.roundRect(16, 16, w - 32, h - 32, 24);
        ctx.fill();

        // Cyan Glowing Border Trim
        ctx.strokeStyle = this.currentState === 'HAPPY' ? '#f59e0b' : '#00e5ff';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Top Header
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 22px "Inter", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('🤖 ATOM-8 • AI CHEMISTRY COMPANION', 42, 54);

        // Status Pill
        const statusText = this.isSpeaking ? 'SPEAKING 🔊' : this.isListeningVoice ? 'LISTENING 🎤' : this.currentState === 'QUIZ' ? 'QUIZ MODE 📝' : 'ACTIVE ⚡';
        ctx.fillStyle = this.isSpeaking ? '#10b981' : this.isListeningVoice ? '#ec4899' : '#0284c7';
        ctx.beginPath();
        ctx.roundRect(w - 245, 32, 135, 30, 15);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(statusText, w - 177, 52);

        // Close Button [✕] in Top Right Corner
        ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
        ctx.beginPath();
        ctx.arc(w - 55, 47, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✕', w - 55, 54);

        // Divider Line
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(36, 74);
        ctx.lineTo(w - 36, 74);
        ctx.stroke();

        if (this.currentState === 'QUIZ') {
            // Render Quiz UI
            const q = QUIZ_QUESTIONS[this.currentQuizQuestionIndex];
            if (q) {
                // Question Header
                ctx.fillStyle = '#fbbf24';
                ctx.font = 'bold 20px "Inter", sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(`Question ${this.currentQuizQuestionIndex + 1} of ${QUIZ_QUESTIONS.length} • Score: ${this.quizScore}`, 42, 105);

                // Question Text (Word Wrapped)
                ctx.fillStyle = '#ffffff';
                ctx.font = '600 22px "Inter", sans-serif';
                this.wrapText(ctx, q.question, 42, 138, w - 84, 28);

                // 4 Choice Option Cards
                const optLetters = ['A', 'B', 'C', 'D'];
                const cardY = [210, 260, 310, 360];

                for (let i = 0; i < 4; i++) {
                    const isSelected = this.quizSelectedOption === i;
                    const isCorrect = i === q.correctIndex;

                    let cardBg = 'rgba(30, 41, 59, 0.8)';
                    let cardBorder = 'rgba(56, 189, 248, 0.4)';
                    if (this.quizAnswered) {
                        if (isCorrect) {
                            cardBg = 'rgba(16, 185, 129, 0.35)';
                            cardBorder = '#10b981';
                        } else if (isSelected) {
                            cardBg = 'rgba(239, 68, 68, 0.35)';
                            cardBorder = '#ef4444';
                        }
                    } else if (isSelected) {
                        cardBg = 'rgba(2, 132, 199, 0.4)';
                        cardBorder = '#38bdf8';
                    }

                    ctx.fillStyle = cardBg;
                    ctx.beginPath();
                    ctx.roundRect(40, cardY[i] - 18, w - 80, 42, 10);
                    ctx.fill();

                    ctx.strokeStyle = cardBorder;
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    // Option Letter
                    ctx.fillStyle = isCorrect && this.quizAnswered ? '#10b981' : '#38bdf8';
                    ctx.font = 'bold 20px "Inter", sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText(`${optLetters[i]}.`, 54, cardY[i] + 9);

                    // Option Text
                    ctx.fillStyle = '#f1f5f9';
                    ctx.font = '500 18px "Inter", sans-serif';
                    ctx.fillText(q.options[i], 86, cardY[i] + 9);
                }

                // Feedback Banner if answered
                if (this.quizAnswered) {
                    ctx.fillStyle = this.quizSelectedOption === q.correctIndex ? '#34d399' : '#f87171';
                    ctx.font = '600 17px "Inter", sans-serif';
                    ctx.textAlign = 'left';
                    ctx.fillText(this.quizFeedbackText, 42, 428);
                }

                // Next Button & Exit Button at bottom
                // Next / Finish
                ctx.fillStyle = this.quizAnswered ? '#0284c7' : 'rgba(51, 65, 85, 0.8)';
                ctx.beginPath();
                ctx.roundRect(w - 240, 412, 195, 40, 10);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 18px "Inter", sans-serif';
                ctx.textAlign = 'center';
                const nextLabel = this.quizAnswered ? (this.currentQuizQuestionIndex < QUIZ_QUESTIONS.length - 1 ? 'Next Question ➡️' : 'Complete Quiz 🎉') : 'Skip ⏩';
                ctx.fillText(nextLabel, w - 142, 438);

                // Exit
                ctx.fillStyle = '#475569';
                ctx.beginPath();
                ctx.roundRect(42, 412, 120, 40, 10);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 16px "Inter", sans-serif';
                ctx.fillText('Exit Quiz', 102, 437);
            }
        } else {
            // Standard Dialogue Bubble & Actions
            ctx.fillStyle = '#f8fafc';
            ctx.font = '500 24px "Inter", sans-serif';
            ctx.textAlign = 'left';
            this.wrapText(ctx, this.currentSpeechText, 42, 115, w - 84, 32);

            // Action Buttons Row 1: [ 💬 Next Step ]  [ 💡 Give Hint ]  [ 🧪 Flame Test ]
            const row1 = [
                { label: '💬 Next Step', x: 42, w: 215, bg: '#0284c7' },
                { label: '💡 Give Hint', x: 275, w: 215, bg: '#d97706' },
                { label: '🧪 Flame Test', x: 508, w: 215, bg: '#7c3aed' }
            ];

            row1.forEach(btn => {
                ctx.fillStyle = btn.bg;
                ctx.beginPath();
                ctx.roundRect(btn.x, 310, btn.w, 54, 12);
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 20px "Inter", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(btn.label, btn.x + btn.w / 2, 344);
            });

            // Action Buttons Row 2: [ ❓ Chemistry Quiz ]  [ 🎤 Voice Ask ]
            const row2 = [
                { label: '❓ Chemistry Quiz', x: 100, w: 260, bg: '#059669' },
                { label: this.isListeningVoice ? '🔴 Listening...' : '🎤 Voice Ask', x: 400, w: 260, bg: this.isListeningVoice ? '#dc2626' : '#2563eb' }
            ];

            row2.forEach(btn => {
                ctx.fillStyle = btn.bg;
                ctx.beginPath();
                ctx.roundRect(btn.x, 382, btn.w, 56, 12);
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 20px "Inter", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(btn.label, btn.x + btn.w / 2, 417);
            });
        }

        this.hudTexture.needsUpdate = true;
    }

    private wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
        const words = text.split(' ');
        let line = '';
        let currentY = y;

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, currentY);
                line = words[n] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, currentY);
    }

    /**
     * Handlers for interactive actions.
     */
    public handleRequestStep() {
        const exp = this.callbacks.getCurrentExperimentState ? this.callbacks.getCurrentExperimentState() : { state: 'GLOVES_NEEDED', saltIndex: 0, areGlovesEquipped: false };
        const guidance = ChemistryKnowledge.getStepGuidance(exp.state, exp.saltIndex, exp.areGlovesEquipped);
        this.speak(`${guidance.title}: ${guidance.text}`, 'speaking');
    }

    public handleRequestHint() {
        const exp = this.callbacks.getCurrentExperimentState ? this.callbacks.getCurrentExperimentState() : { state: 'GLOVES_NEEDED', saltIndex: 0, areGlovesEquipped: false };
        const hint = ChemistryKnowledge.getProgressiveHint(exp.saltIndex, 1);
        this.speak(`Here is a helpful hint: ${hint}`, 'thinking');
    }

    public handleExplainFlame() {
        this.speak("In a flame test, thermal energy excites metal valence electrons to higher energy levels. When they relax back to ground state, they release distinct wavelengths: ΔE = hc/λ!", 'happy');
    }

    public toggleVoiceListening() {
        if (this.isListeningVoice) {
            if (this.recognition) this.recognition.stop();
            this.isListeningVoice = false;
            this.setState('IDLE');
        } else {
            if (this.recognition) {
                try {
                    this.recognition.start();
                } catch {
                    // Start error fallback
                }
            } else {
                this.speak("Voice recognition is active! You can ask: 'What is my next step?', 'Why is copper green?', or 'Give me a hint'!", 'question');
            }
        }
    }

    public startQuizMode() {
        this.currentState = 'QUIZ';
        this.currentQuizQuestionIndex = 0;
        this.quizScore = 0;
        this.quizAnswered = false;
        this.quizSelectedOption = null;
        this.quizFeedbackText = "";

        // Re-setup buttons for Quiz Mode
        this.setupHUDButtons();
        this.speak("Starting Chemistry Quiz! Poke or click the best answer for each question!", 'happy');
    }

    public exitQuizMode() {
        this.currentState = 'IDLE';
        this.currentSpeechText = "Quiz exited! Feel free to ask more chemistry questions or continue the practical.";
        this.setupHUDButtons();
        this.updateHUDDisplay();
        this.audio.playDroidChirp('welcome');
    }

    private handleQuizAnswer(optIndex: number) {
        if (this.quizAnswered) return;
        const q = QUIZ_QUESTIONS[this.currentQuizQuestionIndex];
        if (!q) return;

        this.quizAnswered = true;
        this.quizSelectedOption = optIndex;

        if (optIndex === q.correctIndex) {
            this.quizScore++;
            this.quizFeedbackText = `Correct! 🎉 ${q.explanation}`;
            this.audio.playDroidChirp('correct');
            this.setState('HAPPY');
        } else {
            this.quizFeedbackText = `Incorrect. 💡 Correct: ${q.options[q.correctIndex]}. ${q.explanation}`;
            this.audio.playDroidChirp('wrong');
            this.setState('THINKING');
        }

        this.setupHUDButtons();
        this.updateHUDDisplay();
    }

    private handleQuizNext() {
        if (this.currentQuizQuestionIndex < QUIZ_QUESTIONS.length - 1) {
            this.currentQuizQuestionIndex++;
            this.quizAnswered = false;
            this.quizSelectedOption = null;
            this.quizFeedbackText = "";
            this.setupHUDButtons();
            this.updateHUDDisplay();
            this.audio.playDroidChirp('question');
        } else {
            // Quiz Complete
            const finalScore = this.quizScore;
            const total = QUIZ_QUESTIONS.length;
            this.speak(`Quiz Complete! 🎉 You scored ${finalScore} out of ${total}! Excellent work, scientist!`, 'happy');
            if (this.callbacks.onQuizCompleted) {
                this.callbacks.onQuizCompleted(finalScore, total);
            }
            setTimeout(() => this.exitQuizMode(), 4000);
        }
    }

    /**
     * Welcomes students with joyful animations and cheerful droid chirps.
     */
    public welcomeStudent() {
        this.speak("Beep-boop! Welcome to LABVERSE Chemistry! I'm ATOM-8, your companion droid. Equip your safety gloves to begin!", 'happy');
    }

    /**
     * Set robot emotional and operational state.
     */
    public setState(state: RobotState) {
        this.currentState = state;
        this.stateTimer = 0;
        this.renderEyeExpression(
            state === 'HAPPY' ? 'happy' :
            state === 'LISTENING' ? 'listening' :
            state === 'THINKING' ? 'thinking' :
            state === 'SPEAKING' ? 'speaking' : 'idle'
        );
        this.updateHUDDisplay();
    }

    /**
     * Interaction Hit Detection for VR Finger Poke (Meta Quest hand tracking).
     */
    public checkPokeAndInteract(pokePos: THREE.Vector3): boolean {
        const robotWorldPos = Atom8Robot._scratchV;
        this.group.getWorldPosition(robotWorldPos);
        const distToRobot = pokePos.distanceTo(robotWorldPos);

        // 1. If panel is closed, near-field deliberate poke on robot body opens the AI panel smoothly
        if (!this.isHUDOpen) {
            if (distToRobot < 0.16) {
                this.openPanel();
                return true;
            }
            return false;
        }

        // 2. If panel is open, touching robot body acts as dismiss gesture
        if (distToRobot < 0.13) {
            this.closePanel();
            return true;
        }

        // 3. Check Poke on 3D HUD Buttons (Close button, action buttons, quiz options)
        const localPoke = Atom8Robot._scratchLocalPoke.copy(pokePos);
        this.hudGroup.worldToLocal(localPoke);

        // Check if within HUD plane bounds (z within 5cm)
        if (Math.abs(localPoke.z) < 0.05) {
            for (const btn of this.hudButtons) {
                if (
                    localPoke.x >= btn.bounds.minX &&
                    localPoke.x <= btn.bounds.maxX &&
                    localPoke.y >= btn.bounds.minY &&
                    localPoke.y <= btn.bounds.maxY
                ) {
                    this.audio.playBlip();
                    btn.action();
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Desktop Mouse Click or VR Controller Raycast Interaction.
     */
    public handleClick(hitObject: THREE.Object3D): boolean {
        let cur: THREE.Object3D | null = hitObject;

        // If panel is closed, clicking anywhere on the robot body opens the AI panel smoothly
        if (!this.isHUDOpen) {
            while (cur) {
                if (cur === this.bodyGroup || cur.userData?.isRobotBody || cur.userData?.isAtom8Robot || cur === this.group) {
                    this.openPanel();
                    return true;
                }
                cur = cur.parent;
            }
            return false;
        }

        // If panel is open, handle close button, action buttons, or clicking robot body to dismiss
        while (cur) {
            // Check Close button or Exit button
            if (cur.userData?.buttonId === 'btn_close' || cur.userData?.isQuizExit) {
                this.closePanel();
                return true;
            }

            // Check HUD Button Mesh
            for (const btn of this.hudButtons) {
                if (cur === btn.mesh || cur.userData?.buttonId === btn.id) {
                    this.audio.playBlip();
                    btn.action();
                    return true;
                }
            }

            // Check Quiz Option Mesh
            if (cur.userData?.isQuizOption !== undefined) {
                const optIdx = cur.userData.optionIndex;
                this.handleQuizAnswer(optIdx);
                return true;
            }

            if (cur.userData?.isQuizNext) {
                this.handleQuizNext();
                return true;
            }

            // Clicking robot body while open dismisses/closes panel
            if (cur === this.bodyGroup || cur.userData?.isRobotBody) {
                this.closePanel();
                return true;
            }

            cur = cur.parent;
        }

        return false;
    }

    /**
     * Check if a 3D object belongs to ATOM-8 or its components.
     */
    public isHitByObject(obj: THREE.Object3D): boolean {
        let cur: THREE.Object3D | null = obj;
        while (cur) {
            if (cur === this.group || cur.userData?.isAtom8Robot || cur.userData?.isAtom8HUD || cur.name === 'Atom8Robot') {
                return true;
            }
            cur = cur.parent;
        }
        return false;
    }

    /**
     * Per-frame Kinematics & Animation Loop (Zero GC).
     */
    public update(delta: number, userHeadPos?: THREE.Vector3) {
        this.animTime += delta;
        this.stateTimer += delta;

        // 1. Natural Sinusoidal Hovering Float
        const hoverOffset = Math.sin(this.animTime * 2.4) * 0.012;
        this.group.position.y = this.basePosition.y + hoverOffset;

        // Subtle body pitch & roll harmonic sway
        this.bodyGroup.rotation.z = Math.sin(this.animTime * 1.8) * 0.035;
        this.bodyGroup.rotation.x = Math.cos(this.animTime * 1.4) * 0.025;

        // Levitation point light breathing
        this.hoverLight.intensity = 0.75 + Math.sin(this.animTime * 4.0) * 0.2;

        // 2. Head Kinematics & Tracking
        if (this.currentState === 'HAPPY') {
            // Joyful 360 degree spin
            this.headGroup.rotation.y += delta * 6.0;
            this.headGroup.rotation.z = Math.sin(this.animTime * 12) * 0.12;
        } else if (this.currentState === 'LISTENING') {
            // Inquisitive Puppy-like side tilt
            this.headGroup.rotation.z = THREE.MathUtils.lerp(this.headGroup.rotation.z, 0.28, delta * 5);
            this.headGroup.rotation.x = THREE.MathUtils.lerp(this.headGroup.rotation.x, -0.12, delta * 5);
        } else if (this.currentState === 'THINKING') {
            // Upward thoughtful tilt with slight head roll
            this.headGroup.rotation.x = THREE.MathUtils.lerp(this.headGroup.rotation.x, -0.22, delta * 4);
            this.headGroup.rotation.z = Math.sin(this.animTime * 6) * 0.08;
        } else if (this.currentState === 'SPEAKING') {
            // Speech nodding & expressive gesturing
            this.headGroup.rotation.x = Math.sin(this.animTime * 9) * 0.08;
            this.headGroup.rotation.z = Math.sin(this.animTime * 4) * 0.05;
        } else {
            // IDLE: Curious head tracking looking towards student's head or looking around
            if (userHeadPos) {
                const headWorldPos = Atom8Robot._scratchV;
                this.headGroup.getWorldPosition(headWorldPos);
                const dx = userHeadPos.x - headWorldPos.x;
                const dz = userHeadPos.z - headWorldPos.z;
                const targetYaw = Math.atan2(dx, dz) - this.group.rotation.y;

                this.headGroup.rotation.y = THREE.MathUtils.lerp(this.headGroup.rotation.y, targetYaw, delta * 3);
                this.headGroup.rotation.x = THREE.MathUtils.lerp(this.headGroup.rotation.x, 0, delta * 3);
                this.headGroup.rotation.z = THREE.MathUtils.lerp(this.headGroup.rotation.z, 0, delta * 3);
            } else {
                this.headGroup.rotation.y = Math.sin(this.animTime * 0.8) * 0.25;
            }
        }

        // 3. Eye Expression Updates
        if (this.currentState === 'THINKING' || this.currentState === 'SPEAKING' || this.currentState === 'LISTENING') {
            this.renderEyeExpression(
                this.currentState === 'LISTENING' ? 'listening' :
                this.currentState === 'THINKING' ? 'thinking' : 'speaking'
            );
        } else if (this.stateTimer % 3 < 0.1) {
            // Periodic idle refresh
            this.renderEyeExpression('idle');
        }

        // 4. Smooth Animated Scaling for HUD Panel (Open / Close transition)
        this.hudCurrentScale = THREE.MathUtils.lerp(this.hudCurrentScale, this.hudTargetScale, delta * 12);
        this.hudGroup.scale.setScalar(this.hudCurrentScale);
        if (this.hudCurrentScale < 0.015 && !this.isHUDOpen) {
            this.hudGroup.visible = false;
        }
    }
}
