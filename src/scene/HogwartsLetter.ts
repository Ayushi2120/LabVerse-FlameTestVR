import * as THREE from 'three';
import { AudioEngine } from '../audio/AudioEngine';
import { MagicalParticleSystem } from './MagicalParticleSystem';

export type LetterState = 'DORMANT' | 'EMERGING' | 'UNFOLDING' | 'READING' | 'CLOSING' | 'DISMISSING' | 'COMPLETED';

export interface LetterCallbacks {
    onOpen?: () => void;
    onDismissed?: () => void;
}

interface LetterControlBtn {
    mesh: THREE.Mesh;
    canvas: HTMLCanvasElement;
    texture: THREE.CanvasTexture;
    action: 'replay' | 'pause' | 'mute' | 'close';
    worldPos: THREE.Vector3;
    label: string;
}

/**
 * HogwartsLetter — Authentic 3D Unfolding Parchment Letter with Crimson Wax Seal.
 * - Genuine 3D multi-panel articulated folding mechanics with realistic paper thickness.
 * - Top and bottom flap hinges with realistic mechanical paper unfolding animation.
 * - 3D crimson wax seal with embossed monogram and specular gleam.
 * - Progressive golden calligraphy handwriting reveal synchronized with English narration.
 * - 3D Interactive controls: Replay, Pause/Resume, Mute, Close (Desktop click & VR poke).
 * - Synchronized Web Audio effects: emergence whoosh, paper rustle, wax seal chime, and stardust dissolve.
 * - Meta Quest VR & Desktop raycasting/poke interaction for reading and gentle dismissal.
 */
export class HogwartsLetter {
    public group: THREE.Group;

    // 3D Articulated Panels
    private centerPanel: THREE.Mesh;
    private topFlapGroup: THREE.Group;
    private topFlapMesh: THREE.Mesh;
    private bottomFlapGroup: THREE.Group;
    private bottomFlapMesh: THREE.Mesh;
    private waxSealGroup: THREE.Group;
    private waxSealMesh: THREE.Mesh;

    // Materials
    private parchmentFrontMaterial: THREE.MeshStandardMaterial;
    private parchmentBackMaterial: THREE.MeshStandardMaterial;
    private waxSealMaterial: THREE.MeshStandardMaterial;
    private sealCrestMaterial: THREE.MeshStandardMaterial;
    private frontCanvas!: HTMLCanvasElement;
    private frontTexture!: THREE.CanvasTexture;

    // Unified Magical Particle Engine
    private particles?: MagicalParticleSystem;

    // 3D Control Bar & Buttons
    private controlBarGroup: THREE.Group;
    private controlButtons: LetterControlBtn[] = [];

    // Progressive Handwriting Reveal
    private revealedParagraphs = 0;
    private textOpacity = 1.0;
    private autoCloseTimer: any = null;

    // State Machine & Timers
    private state: LetterState = 'DORMANT';
    private stateTimer = 0;
    private animTime = 0;
    private hasTriggeredUnfoldSound = false;

    // Motion & Transforms
    private startPos = new THREE.Vector3();
    private targetPos = new THREE.Vector3();
    private currentPos = new THREE.Vector3();
    private readingBobOffset = 0;

    // Subsystems
    private audio: AudioEngine;
    private callbacks: LetterCallbacks;

    // Interaction Hit Testing
    private hitBoxCenter = new THREE.Vector3();
    private hitBoxRadius = 0.24; // 24cm radius around center for easy reading poke/click

    // Scratch Objects
    private static _v1 = new THREE.Vector3();
    private static _btnPos = new THREE.Vector3();

    constructor(audio: AudioEngine, callbacks: LetterCallbacks = {}, particles?: MagicalParticleSystem) {
        this.audio = audio;
        this.callbacks = callbacks;
        this.particles = particles;

        this.group = new THREE.Group();
        this.group.name = 'HogwartsLetter';
        this.group.visible = false;
        (this.group as any).userData = { isHogwartsLetter: true };

        // --- 1. DYNAMIC HIGH-DPI PARCHMENT CANVAS TEXTURES ---
        this.frontCanvas = document.createElement('canvas');
        this.frontCanvas.width = 2048;
        this.frontCanvas.height = 1600;
        this.renderParchmentTexture(0, 1.0);

        this.frontTexture = new THREE.CanvasTexture(this.frontCanvas);
        this.frontTexture.generateMipmaps = true;
        this.frontTexture.minFilter = THREE.LinearMipmapLinearFilter;
        this.frontTexture.magFilter = THREE.LinearFilter;
        if ((this.frontTexture as any).anisotropy) {
            (this.frontTexture as any).anisotropy = 8;
        }

        const backCanvas = this.createEnvelopeBackCanvas();
        const backTexture = new THREE.CanvasTexture(backCanvas);
        backTexture.generateMipmaps = true;
        backTexture.minFilter = THREE.LinearMipmapLinearFilter;
        backTexture.magFilter = THREE.LinearFilter;

        // Realistic Cream Parchment Materials
        this.parchmentFrontMaterial = new THREE.MeshStandardMaterial({
            map: this.frontTexture,
            color: 0xfbf7ed,
            roughness: 0.82,
            metalness: 0.05,
            side: THREE.DoubleSide
        });

        this.parchmentBackMaterial = new THREE.MeshStandardMaterial({
            map: backTexture,
            color: 0xf5eedb,
            roughness: 0.85,
            metalness: 0.04,
            side: THREE.DoubleSide
        });

        // Crimson Wax Seal Material
        this.waxSealMaterial = new THREE.MeshStandardMaterial({
            color: 0x8a0b0b,
            roughness: 0.32,
            metalness: 0.14
        });

        // Embossed Golden Crest Highlight
        this.sealCrestMaterial = new THREE.MeshStandardMaterial({
            color: 0xd4a017,
            roughness: 0.25,
            metalness: 0.85
        });

        // --- 2. BUILD 3D ARTICULATED FOLDING PANELS ---
        // Main Center Panel (Base sheet carrying middle text)
        const centerGeo = new THREE.BoxGeometry(0.26, 0.13, 0.0016);
        this.centerPanel = new THREE.Mesh(centerGeo, this.parchmentFrontMaterial);
        this.centerPanel.castShadow = true;
        this.centerPanel.receiveShadow = true;
        this.centerPanel.userData = { isHogwartsLetter: true };
        this.group.add(this.centerPanel);

        // Top Flap (Hinged at y = +0.065)
        this.topFlapGroup = new THREE.Group();
        this.topFlapGroup.name = 'TopFlapGroup';
        this.topFlapGroup.position.set(0, 0.065, 0.0009);

        const topGeo = new THREE.BoxGeometry(0.26, 0.105, 0.0016);
        this.topFlapMesh = new THREE.Mesh(topGeo, this.parchmentFrontMaterial);
        this.topFlapMesh.position.set(0, 0.0525, 0);
        this.topFlapMesh.castShadow = true;
        this.topFlapMesh.receiveShadow = true;
        this.topFlapMesh.userData = { isHogwartsLetter: true };
        this.topFlapGroup.add(this.topFlapMesh);
        this.group.add(this.topFlapGroup);

        // Bottom Flap (Hinged at y = -0.065)
        this.bottomFlapGroup = new THREE.Group();
        this.bottomFlapGroup.name = 'BottomFlapGroup';
        this.bottomFlapGroup.position.set(0, -0.065, 0.0009);

        const bottomGeo = new THREE.BoxGeometry(0.26, 0.095, 0.0016);
        this.bottomFlapMesh = new THREE.Mesh(bottomGeo, this.parchmentFrontMaterial);
        this.bottomFlapMesh.position.set(0, -0.0475, 0);
        this.bottomFlapMesh.castShadow = true;
        this.bottomFlapMesh.receiveShadow = true;
        this.bottomFlapMesh.userData = { isHogwartsLetter: true };
        this.bottomFlapGroup.add(this.bottomFlapMesh);
        this.group.add(this.bottomFlapGroup);

        // --- 3. 3D CRIMSON WAX SEAL ---
        this.waxSealGroup = new THREE.Group();
        this.waxSealGroup.name = 'WaxSealGroup';
        this.waxSealGroup.position.set(0, 0.095, 0.0022);

        const sealGeo = new THREE.CylinderGeometry(0.016, 0.018, 0.0035, 24);
        sealGeo.rotateX(Math.PI / 2);
        this.waxSealMesh = new THREE.Mesh(sealGeo, this.waxSealMaterial);
        this.waxSealMesh.castShadow = true;
        this.waxSealMesh.userData = { isHogwartsLetter: true, isWaxSeal: true };
        this.waxSealGroup.add(this.waxSealMesh);

        const rimGeo = new THREE.TorusGeometry(0.0145, 0.0024, 8, 24);
        const rimMesh = new THREE.Mesh(rimGeo, this.waxSealMaterial);
        this.waxSealGroup.add(rimMesh);

        // Embossed 'H' Monogram Crest
        const crestCanvas = document.createElement('canvas');
        crestCanvas.width = 256;
        crestCanvas.height = 256;
        const cctx = crestCanvas.getContext('2d')!;
        cctx.fillStyle = '#8a0b0b';
        cctx.fillRect(0, 0, 256, 256);
        cctx.fillStyle = '#d4a017';
        cctx.font = 'bold 150px "Cinzel", "Georgia", serif';
        cctx.textAlign = 'center';
        cctx.textBaseline = 'middle';
        cctx.fillText('H', 128, 134);

        const crestTex = new THREE.CanvasTexture(crestCanvas);
        const crestGeo = new THREE.PlaneGeometry(0.022, 0.022);
        const crestMat = new THREE.MeshStandardMaterial({
            map: crestTex,
            roughness: 0.35,
            metalness: 0.75
        });
        const crestMesh = new THREE.Mesh(crestGeo, crestMat);
        crestMesh.position.z = 0.002;
        this.waxSealGroup.add(crestMesh);

        this.topFlapGroup.add(this.waxSealGroup);

        // --- 4. 3D INTERACTIVE CONTROL BAR ---
        this.controlBarGroup = new THREE.Group();
        this.controlBarGroup.name = 'LetterControlBar';
        this.controlBarGroup.position.set(0, -0.165, 0.004);
        this.controlBarGroup.visible = false;

        this.buildControlButtons();
        this.group.add(this.controlBarGroup);

        // Start initially closed/folded
        this.setFoldRatio(0.0);
    }

    /**
     * Builds 3D interactive capsule buttons below the unfolded letter.
     */
    private buildControlButtons() {
        const btnDefs: { action: 'replay' | 'pause' | 'mute' | 'close'; label: string; x: number }[] = [
            { action: 'replay', label: '↺ Replay', x: -0.09 },
            { action: 'pause', label: '❚❚ Pause', x: -0.03 },
            { action: 'mute', label: '🔇 Mute', x: 0.03 },
            { action: 'close', label: '✕ Close', x: 0.09 }
        ];

        for (const def of btnDefs) {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 96;
            this.renderButtonCanvas(canvas, def.label, false);

            const tex = new THREE.CanvasTexture(canvas);
            const mat = new THREE.MeshStandardMaterial({
                map: tex,
                roughness: 0.35,
                metalness: 0.45,
                transparent: true,
                opacity: 0.95
            });

            const geo = new THREE.BoxGeometry(0.052, 0.022, 0.0035);
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(def.x, 0, 0);
            mesh.userData = {
                isHogwartsLetter: true,
                isLetterControl: true,
                letterControlAction: def.action
            };

            this.controlBarGroup.add(mesh);

            this.controlButtons.push({
                mesh,
                canvas,
                texture: tex,
                action: def.action,
                worldPos: new THREE.Vector3(),
                label: def.label
            });
        }
    }

    private renderButtonCanvas(canvas: HTMLCanvasElement, label: string, isHovered = false) {
        const ctx = canvas.getContext('2d')!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background rounded pill
        ctx.fillStyle = isHovered ? 'rgba(35, 25, 12, 0.95)' : 'rgba(18, 14, 8, 0.88)';
        ctx.strokeStyle = isHovered ? '#ffd700' : '#c49746';
        ctx.lineWidth = isHovered ? 6 : 3;

        const r = 24;
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(canvas.width - r, 0);
        ctx.quadraticCurveTo(canvas.width, 0, canvas.width, r);
        ctx.lineTo(canvas.width, canvas.height - r);
        ctx.quadraticCurveTo(canvas.width, canvas.height, canvas.width - r, canvas.height);
        ctx.lineTo(r, canvas.height);
        ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Label typography
        ctx.fillStyle = isHovered ? '#ffffff' : '#f5e4bd';
        ctx.font = 'bold 36px "Cinzel", "Georgia", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, canvas.width / 2, canvas.height / 2 + 2);
    }

    private updateButtonLabel(action: 'replay' | 'pause' | 'mute' | 'close', newLabel: string) {
        const btn = this.controlButtons.find(b => b.action === action);
        if (btn) {
            btn.label = newLabel;
            this.renderButtonCanvas(btn.canvas, newLabel, false);
            btn.texture.needsUpdate = true;
        }
    }

    /**
     * Dynamically renders the authentic aged parchment texture and reveals
     * golden calligraphy paragraphs progressively synchronized with narration.
     */
    private renderParchmentTexture(revealedCount: number, opacity: number) {
        const ctx = this.frontCanvas.getContext('2d')!;
        ctx.clearRect(0, 0, 2048, 1600);

        // 1. Aged Parchment Base Gradient
        const grad = ctx.createRadialGradient(1024, 800, 150, 1024, 800, 1200);
        grad.addColorStop(0, '#fef9ee');
        grad.addColorStop(0.55, '#f7f0dc');
        grad.addColorStop(0.85, '#ede1c4');
        grad.addColorStop(1, '#dfceaa');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 2048, 1600);

        // 2. Faint tea-stain mottling
        ctx.fillStyle = 'rgba(160, 120, 70, 0.035)';
        for (let i = 0; i < 40; i++) {
            const rx = Math.random() * 2048;
            const ry = Math.random() * 1600;
            const rw = 80 + Math.random() * 300;
            ctx.beginPath();
            ctx.arc(rx, ry, rw, 0, Math.PI * 2);
            ctx.fill();
        }

        // 3. Ornate Double Burgundy & Gold Filigree Border
        ctx.strokeStyle = '#6e2b14';
        ctx.lineWidth = 10;
        ctx.strokeRect(90, 90, 1868, 1420);

        ctx.strokeStyle = '#c49746';
        ctx.lineWidth = 4;
        ctx.strokeRect(110, 110, 1828, 1380);

        // Corner Florets
        const drawCornerKnot = (x: number, y: number) => {
            ctx.fillStyle = '#6e2b14';
            ctx.beginPath();
            ctx.arc(x, y, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#c49746';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(x, y, 22, 0, Math.PI * 2);
            ctx.stroke();
        };
        drawCornerKnot(110, 110);
        drawCornerKnot(1938, 110);
        drawCornerKnot(110, 1490);
        drawCornerKnot(1938, 1490);

        // 4. Hogwarts-inspired Top Emblem Flourish
        ctx.fillStyle = '#6e2b14';
        ctx.textAlign = 'center';
        ctx.font = 'bold 38px "Cinzel", "Georgia", "Baskerville", serif';
        ctx.letterSpacing = '6px';
        ctx.fillText('✦   L A B V E R S E   ✦', 1024, 175);

        ctx.strokeStyle = '#c49746';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(720, 198);
        ctx.lineTo(1328, 198);
        ctx.stroke();

        if (revealedCount <= 0 || opacity <= 0.01) {
            return;
        }

        // 5. PROGRESSIVE CALLIGRAPHIC TEXT WITH GOLDEN LUSTER
        ctx.save();
        ctx.globalAlpha = opacity;

        // Paragraph 0: Salutation Header
        if (revealedCount >= 1) {
            ctx.fillStyle = '#3a180b';
            ctx.textAlign = 'left';
            ctx.font = 'italic bold 58px "Cinzel", "Georgia", serif';
            ctx.shadowBlur = 8;
            ctx.shadowColor = 'rgba(212, 175, 55, 0.45)';
            ctx.fillText('To the Curious Seeker,', 220, 290);
        }

        // Paragraph 1: Magic finds those
        if (revealedCount >= 2) {
            ctx.fillStyle = '#261208';
            ctx.font = '500 46px "Baskerville", "Georgia", serif';
            ctx.shadowBlur = 5;
            ctx.shadowColor = 'rgba(212, 175, 55, 0.35)';
            ctx.fillText('A little magic finds those who dare to explore.', 220, 395);
        }

        // Paragraph 2: Keep eyes open
        if (revealedCount >= 3) {
            ctx.fillStyle = '#261208';
            ctx.font = '500 46px "Baskerville", "Georgia", serif';
            ctx.fillText('Keep your eyes open, your mind curious, and your', 220, 495);
            ctx.fillText('discoveries close to your heart.', 220, 555);
        }

        // Paragraph 3: Hidden in plain sight
        if (revealedCount >= 4) {
            ctx.fillStyle = '#261208';
            ctx.font = '500 46px "Baskerville", "Georgia", serif';
            ctx.fillText('The most extraordinary secrets are often hidden', 220, 660);
            ctx.fillText('in plain sight.', 220, 720);
        }

        // Paragraph 4: Continue exploring
        if (revealedCount >= 5) {
            ctx.fillStyle = '#261208';
            ctx.font = '500 46px "Baskerville", "Georgia", serif';
            ctx.fillText('Continue exploring, for every great discovery begins with', 220, 825);
            ctx.fillText('a single moment of curiosity.', 220, 885);
        }

        // Paragraph 5: Sign-off
        if (revealedCount >= 6) {
            ctx.fillStyle = '#3a180b';
            ctx.font = 'italic 50px "Cinzel", "Georgia", serif';
            ctx.fillText('Yours in wonder,', 220, 1070);

            ctx.font = 'bold 50px "Cinzel", "Georgia", serif';
            ctx.fillStyle = '#6e2b14';
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(255, 215, 0, 0.55)';
            ctx.fillText('The Keepers of Curiosity', 220, 1145);

            // Delicate Bottom Quill Flourish
            ctx.fillStyle = '#c49746';
            ctx.textAlign = 'right';
            ctx.font = '40px sans-serif';
            ctx.fillText('✧   ✦   ✧', 1840, 1420);
        }

        ctx.restore();
    }

    private updateParchmentTexture() {
        this.renderParchmentTexture(this.revealedParagraphs, this.textOpacity);
        if (this.frontTexture) {
            this.frontTexture.needsUpdate = true;
        }
    }

    /**
     * Renders the folded vintage envelope exterior with calligraphy address.
     */
    private createEnvelopeBackCanvas(): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 768;
        const ctx = canvas.getContext('2d')!;

        const grad = ctx.createLinearGradient(0, 0, 1024, 768);
        grad.addColorStop(0, '#f6eed9');
        grad.addColorStop(0.5, '#ede1c4');
        grad.addColorStop(1, '#e3d2af');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1024, 768);

        ctx.fillStyle = '#4a2512';
        ctx.textAlign = 'center';
        ctx.font = 'italic 34px "Cinzel", "Georgia", serif';
        ctx.fillText('For The Seeker', 512, 340);
        ctx.font = '26px "Georgia", serif';
        ctx.fillStyle = '#5c351e';
        ctx.fillText('Laboratory Bench No. 7', 512, 395);
        ctx.font = 'italic 24px "Georgia", serif';
        ctx.fillText('LABVERSE Chemistry Laboratory', 512, 440);

        return canvas;
    }

    /**
     * Smoothly sets the 3D folding ratio of the letter panels.
     * ratio = 0.0: Fully closed & sealed with wax seal.
     * ratio = 1.0: Fully unfolded, open parchment ready for reading.
     */
    private setFoldRatio(ratio: number) {
        const r = THREE.MathUtils.clamp(ratio, 0.0, 1.0);

        // Top Flap: folds down from Math.PI (closed) to -0.06 rad (open)
        this.topFlapGroup.rotation.x = (1.0 - r) * Math.PI - (r * 0.06);

        // Bottom Flap: folds up from -Math.PI (closed) to +0.04 rad (open)
        this.bottomFlapGroup.rotation.x = -(1.0 - r) * Math.PI + (r * 0.04);
    }

    /**
     * Emerges the sealed letter from beneath the caught Golden Snitch.
     */
    public emerge(snitchWorldPos: THREE.Vector3, playerHeadPos?: THREE.Vector3) {
        this.state = 'EMERGING';
        this.stateTimer = 0;
        this.animTime = 0;
        this.hasTriggeredUnfoldSound = false;
        this.revealedParagraphs = 0;
        this.textOpacity = 1.0;
        this.updateParchmentTexture();

        // Start directly underneath the Snitch body
        this.startPos.copy(snitchWorldPos);
        this.startPos.y -= 0.035;
        this.currentPos.copy(this.startPos);

        // Target: float smoothly directly in front of student's eyes
        if (playerHeadPos) {
            this.targetPos.copy(playerHeadPos);
            this.targetPos.z -= 0.58;
            this.targetPos.y = Math.max(1.22, playerHeadPos.y - 0.06);
            this.targetPos.x += 0.02;
        } else {
            this.targetPos.set(0.12, 1.34, -0.48);
        }

        this.setFoldRatio(0.0);
        this.group.scale.set(0.15, 0.15, 0.15);
        this.group.position.copy(this.currentPos);
        this.group.visible = true;
        this.controlBarGroup.visible = false;

        this.audio.playLetterEmergeSound();
    }

    public isActive(): boolean {
        return this.state !== 'DORMANT' && this.state !== 'COMPLETED';
    }

    public update(delta: number, playerHeadPos?: THREE.Vector3) {
        if (this.state === 'DORMANT' || this.state === 'COMPLETED') return;

        this.stateTimer += delta;
        this.animTime += delta;

        // Look toward player naturally
        if (playerHeadPos) {
            HogwartsLetter._v1.copy(playerHeadPos);
            HogwartsLetter._v1.y += 0.08;
            this.group.lookAt(HogwartsLetter._v1);
        }

        switch (this.state) {
            case 'EMERGING':
                this.updateEmerging(delta);
                break;
            case 'UNFOLDING':
                this.updateUnfolding(delta);
                break;
            case 'READING':
                this.updateReading(delta);
                break;
            case 'CLOSING':
                this.updateClosing(delta);
                break;
            case 'DISMISSING':
                this.updateDismissing(delta);
                break;
        }

        this.group.getWorldPosition(this.hitBoxCenter);
    }

    private updateEmerging(_delta: number) {
        const t = Math.min(1.0, this.stateTimer / 1.4);
        const ease = 1.0 - Math.pow(1.0 - t, 3);

        this.currentPos.lerpVectors(this.startPos, this.targetPos, ease);
        this.group.position.copy(this.currentPos);

        const currentScale = 0.15 + ease * 0.85;
        this.group.scale.set(currentScale, currentScale, currentScale);
        this.group.rotation.z = (1.0 - ease) * 0.45;

        if (this.stateTimer >= 1.4) {
            this.state = 'UNFOLDING';
            this.stateTimer = 0;
        }
    }

    private updateUnfolding(_delta: number) {
        const t = Math.min(1.0, this.stateTimer / 1.35);
        const ease = Math.sin(t * Math.PI * 0.5);

        this.setFoldRatio(ease);

        if (!this.hasTriggeredUnfoldSound && t > 0.15) {
            this.hasTriggeredUnfoldSound = true;
            this.audio.playPaperUnfoldSound();
            // Effect D: Radiant golden sparkle burst around wax seal when it opens
            this.waxSealMesh.getWorldPosition(HogwartsLetter._v1);
            if (this.particles) {
                this.particles.triggerWaxSealSparkle(HogwartsLetter._v1);
            }
            this.audio.playWaxSealOpenSound();
        }

        if (this.stateTimer >= 1.35) {
            this.setFoldRatio(1.0);
            this.state = 'READING';
            this.stateTimer = 0;
            this.controlBarGroup.visible = true;

            // Start synchronized narration
            this.startNarrationSequence();

            if (this.callbacks.onOpen) {
                this.callbacks.onOpen();
            }
        }
    }

    private startNarrationSequence() {
        this.revealedParagraphs = 0;
        this.textOpacity = 1.0;
        this.updateParchmentTexture();

        this.audio.voice.narrateHogwartsLetter({
            onParagraphStart: (idx: number, _text: string, durationSec = 3.5) => {
                this.revealedParagraphs = idx + 1;
                this.updateParchmentTexture();

                // Effect E: Subtle golden writing trail following progressive handwriting
                if (this.particles) {
                    const lineYOffsets = [0.075, 0.040, 0.005, -0.030, -0.065, -0.105];
                    const lineY = lineYOffsets[Math.min(idx, lineYOffsets.length - 1)];

                    const startLocal = new THREE.Vector3(-0.095, lineY, 0.006);
                    const endLocal = new THREE.Vector3(0.095, lineY, 0.006);
                    startLocal.applyMatrix4(this.group.matrixWorld);
                    endLocal.applyMatrix4(this.group.matrixWorld);

                    this.particles.startWritingTrail(startLocal, endLocal, durationSec);
                }
            },
            onComplete: () => {
                // Ensure all paragraphs are fully displayed
                this.revealedParagraphs = 6;
                this.updateParchmentTexture();

                // Generous 7.5s reading time before gentle auto-fold
                if (this.autoCloseTimer) clearTimeout(this.autoCloseTimer);
                this.autoCloseTimer = setTimeout(() => {
                    if (this.state === 'READING') {
                        this.closeAndDismiss();
                    }
                }, 7500);
            }
        });
    }

    private updateReading(_delta: number) {
        this.readingBobOffset = Math.sin(this.animTime * 2.2) * 0.0035;
        this.group.position.y = this.targetPos.y + this.readingBobOffset;
    }

    private updateClosing(_delta: number) {
        const t = Math.min(1.0, this.stateTimer / 1.1);

        // Fade golden handwriting out during first half
        this.textOpacity = Math.max(0.0, 1.0 - t * 2.2);
        this.updateParchmentTexture();

        // Fold flaps back together during second half
        const foldProgress = Math.max(0.0, (t - 0.25) / 0.75);
        const ease = foldProgress * foldProgress * (3.0 - 2.0 * foldProgress);
        this.setFoldRatio(1.0 - ease);

        if (this.stateTimer >= 1.1) {
            this.state = 'DISMISSING';
            this.stateTimer = 0;
        }
    }

    private updateDismissing(_delta: number) {
        const t = Math.min(1.0, this.stateTimer / 0.75);
        const scale = Math.max(0.001, 1.0 - t);
        this.group.scale.set(scale, scale, scale);

        if (this.stateTimer >= 0.75) {
            this.hide();
            if (this.callbacks.onDismissed) {
                this.callbacks.onDismissed();
            }
        }
    }

    // --- INTERACTIVE CONTROLS ---

    public replay() {
        if (this.autoCloseTimer) clearTimeout(this.autoCloseTimer);
        this.updateButtonLabel('pause', '❚❚ Pause');
        this.startNarrationSequence();
    }

    public togglePause() {
        if (this.audio.voice.isLetterNarrationPaused()) {
            this.audio.voice.resumeLetterNarration();
            this.updateButtonLabel('pause', '❚❚ Pause');
        } else {
            this.audio.voice.pauseLetterNarration();
            this.updateButtonLabel('pause', '▶ Resume');
            if (this.autoCloseTimer) clearTimeout(this.autoCloseTimer);
        }
    }

    public toggleMute() {
        const isMuted = !this.audio.voice.isLetterMuted();
        this.audio.voice.setLetterMuted(isMuted);
        this.updateButtonLabel('mute', isMuted ? '🔊 Unmute' : '🔇 Mute');
    }

    public closeAndDismiss() {
        if (this.state === 'CLOSING' || this.state === 'DISMISSING' || this.state === 'COMPLETED' || this.state === 'DORMANT') {
            return;
        }
        if (this.autoCloseTimer) clearTimeout(this.autoCloseTimer);
        this.audio.voice.stopLetterNarration();
        this.particles?.stopWritingTrail();
        this.controlBarGroup.visible = false;
        this.state = 'CLOSING';
        this.stateTimer = 0;

        // Effect F: Letter dissolves into sparkling golden particles swirling upward
        this.group.getWorldPosition(this.hitBoxCenter);
        if (this.particles) {
            this.particles.triggerLetterDissolve(this.hitBoxCenter, 0.26, 0.30);
        }
        this.audio.playLetterDissolveSound();
        this.audio.playPaperUnfoldSound();
    }

    public interact(hitObj?: THREE.Object3D): boolean {
        // 1. Check if an interactive control button was clicked
        if (hitObj) {
            let cur: THREE.Object3D | null = hitObj;
            while (cur && cur !== this.group) {
                if (cur.userData?.isLetterControl) {
                    const action = cur.userData.letterControlAction;
                    if (action === 'replay') this.replay();
                    else if (action === 'pause') this.togglePause();
                    else if (action === 'mute') this.toggleMute();
                    else if (action === 'close') this.closeAndDismiss();
                    return true;
                }
                cur = cur.parent;
            }
        }

        // 2. Default letter click behavior
        if (this.state === 'READING') {
            this.closeAndDismiss();
            return true;
        } else if (this.state === 'EMERGING') {
            this.state = 'UNFOLDING';
            this.stateTimer = 0;
            return true;
        }
        return false;
    }

    public checkPokeAndInteract(pokeWorldPos: THREE.Vector3): boolean {
        if (!this.isActive() || this.state === 'CLOSING' || this.state === 'DISMISSING') {
            return false;
        }

        // 1. Check near-field poke on individual control buttons (within 3.8cm)
        if (this.state === 'READING') {
            for (const btn of this.controlButtons) {
                btn.mesh.getWorldPosition(HogwartsLetter._btnPos);
                if (pokeWorldPos.distanceTo(HogwartsLetter._btnPos) <= 0.038) {
                    if (btn.action === 'replay') this.replay();
                    else if (btn.action === 'pause') this.togglePause();
                    else if (btn.action === 'mute') this.toggleMute();
                    else if (btn.action === 'close') this.closeAndDismiss();
                    return true;
                }
            }
        }

        // 2. Check poke on main letter body
        this.group.getWorldPosition(this.hitBoxCenter);
        if (pokeWorldPos.distanceTo(this.hitBoxCenter) <= this.hitBoxRadius) {
            return this.interact();
        }
        return false;
    }

    public isHitByObject(hitObj: THREE.Object3D): boolean {
        let cur: THREE.Object3D | null = hitObj;
        while (cur) {
            if (cur === this.group || cur.userData?.isHogwartsLetter) {
                return true;
            }
            cur = cur.parent;
        }
        return false;
    }

    public hide() {
        this.state = 'DORMANT';
        this.stateTimer = 0;
        this.group.visible = false;
        this.controlBarGroup.visible = false;
        if (this.autoCloseTimer) clearTimeout(this.autoCloseTimer);
        this.audio.voice.stopLetterNarration();
        this.particles?.stopWritingTrail();
    }

    public dispose() {
        this.hide();
        this.centerPanel.geometry.dispose();
        this.topFlapMesh.geometry.dispose();
        this.bottomFlapMesh.geometry.dispose();
        this.waxSealMesh.geometry.dispose();
        this.parchmentFrontMaterial.dispose();
        this.parchmentBackMaterial.dispose();
        this.waxSealMaterial.dispose();
        this.sealCrestMaterial.dispose();
    }
}
