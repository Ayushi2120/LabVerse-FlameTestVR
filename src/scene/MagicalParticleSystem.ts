import * as THREE from 'three';

/**
 * Creates a high-definition radial glow canvas texture for champagne-gold particles.
 * Features a pure white radiant core, warm champagne-gold midtones, and smooth quadratic falloff.
 */
export function createMagicalParticleTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');     // Brilliant radiant white core
    grad.addColorStop(0.25, 'rgba(255, 238, 170, 0.95)');   // Warm champagne gold
    grad.addColorStop(0.55, 'rgba(235, 185, 70, 0.60)');    // Ethereal stardust gold
    grad.addColorStop(0.85, 'rgba(180, 120, 25, 0.18)');    // Amber coronal halo
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');            // Fully transparent border

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.generateMipmaps = true;
    return tex;
}

export interface ParticleSlot {
    active: boolean;
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    life: number;
    maxLife: number;
    size: number;
    r: number;
    g: number;
    b: number;
    drag: number;
    gravity: number;
    spiralAngle?: number;
    spiralRadius?: number;
    spiralSpeed?: number;
    spiralRise?: number;
    targetX?: number;
    targetY?: number;
    targetZ?: number;
}

/**
 * MagicalParticleSystem — Unified, High-Performance GPU Particle Engine for LABVERSE.
 * Implements the 6 required distinct golden magical particle effects:
 * A. SNITCH CATCH: Concentric radial burst of sparkling golden motes with natural drag & lift.
 * A2. SNITCH TRAIL: Delicate fluttering sparks trailing in world space behind the Snitch.
 * B. ENVIRONMENT TRANSFORMATION: Grand 3D expanding Fibonacci spiral of celestial stardust.
 * C. LETTER APPEARANCE: Inward gathering vortex concentrating energy around the emergence ring.
 * D. LETTER OPENING: Sparkling crystalline burst erupting around the wax seal.
 * E. LETTER WRITING: Smooth calligraphy trail tracing across the progressive parchment text.
 * F. LETTER DISAPPEARANCE: Golden dissolve vortex lifting and dispersing the parchment into aether.
 *
 * Fully optimized for Meta Quest VR & Desktop:
 * - Single draw call via custom ShaderMaterial with per-particle alpha, size, and color.
 * - Zero GC allocations inside render frames.
 * - Additive blending with depthWrite: false (zero clipping/z-fighting).
 */
export class MagicalParticleSystem {
    public group: THREE.Group;
    private maxParticles = 600;
    private pool: ParticleSlot[] = [];

    // GPU Buffers
    private geometry: THREE.BufferGeometry;
    private material: THREE.ShaderMaterial;
    private points: THREE.Points;

    private posArray: Float32Array;
    private alphaArray: Float32Array;
    private sizeArray: Float32Array;
    private colorArray: Float32Array;

    // Writing trail animation state
    private writingActive = false;
    private writingStart = new THREE.Vector3();
    private writingEnd = new THREE.Vector3();
    private writingProgress = 0;
    private writingDuration = 1.0;
    private writingTimer = 0;
    private hadActiveLastFrame = false;

    // Reusable scratch objects
    private static _scratchV1 = new THREE.Vector3();

    constructor() {
        this.group = new THREE.Group();
        this.group.name = 'MagicalParticleSystem';

        this.posArray = new Float32Array(this.maxParticles * 3);
        this.alphaArray = new Float32Array(this.maxParticles);
        this.sizeArray = new Float32Array(this.maxParticles);
        this.colorArray = new Float32Array(this.maxParticles * 3);

        for (let i = 0; i < this.maxParticles; i++) {
            this.pool.push({
                active: false,
                x: 0, y: -999, z: 0,
                vx: 0, vy: 0, vz: 0,
                life: 0, maxLife: 1,
                size: 0.02,
                r: 1.0, g: 0.88, b: 0.5,
                drag: 0.96,
                gravity: -0.05
            });
            this.posArray[i * 3 + 1] = -999;
            this.alphaArray[i] = 0.0;
            this.sizeArray[i] = 0.0;
            this.colorArray[i * 3 + 0] = 1.0;
            this.colorArray[i * 3 + 1] = 0.88;
            this.colorArray[i * 3 + 2] = 0.5;
        }

        this.geometry = new THREE.BufferGeometry();
        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.posArray, 3));
        this.geometry.setAttribute('aAlpha', new THREE.BufferAttribute(this.alphaArray, 1));
        this.geometry.setAttribute('aSize', new THREE.BufferAttribute(this.sizeArray, 1));
        this.geometry.setAttribute('aColor', new THREE.BufferAttribute(this.colorArray, 3));

        const tex = createMagicalParticleTexture();

        this.material = new THREE.ShaderMaterial({
            uniforms: {
                pointTexture: { value: tex }
            },
            vertexShader: `
                attribute float aAlpha;
                attribute float aSize;
                attribute vec3 aColor;
                varying float vAlpha;
                varying vec3 vColor;
                void main() {
                    vAlpha = aAlpha;
                    vColor = aColor;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    // Safe perspective size attenuation for VR & Desktop
                    float viewDist = max(-mvPosition.z, 0.05);
                    gl_PointSize = clamp(aSize * (280.0 / viewDist), 1.0, 120.0);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform sampler2D pointTexture;
                varying float vAlpha;
                varying vec3 vColor;
                void main() {
                    if (vAlpha <= 0.005) discard;
                    vec4 texColor = texture2D(pointTexture, gl_PointCoord);
                    gl_FragColor = vec4(vColor * texColor.rgb, texColor.a * vAlpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.points = new THREE.Points(this.geometry, this.material);
        this.points.frustumCulled = false;
        this.group.add(this.points);
    }

    private allocateSlot(): ParticleSlot | null {
        for (let i = 0; i < this.maxParticles; i++) {
            if (!this.pool[i].active) {
                return this.pool[i];
            }
        }
        return null;
    }

    // =========================================================================
    // EFFECT A: SNITCH CATCH BURST
    // Radial burst of champagne-gold particles emerging from Snitch body surface
    // =========================================================================
    public triggerSnitchCatchBurst(center: THREE.Vector3, count = 85) {
        for (let i = 0; i < count; i++) {
            const p = this.allocateSlot();
            if (!p) break;

            const u = Math.random();
            const v = Math.random();
            const theta = u * 2.0 * Math.PI;
            const phi = Math.acos(2.0 * v - 1.0);
            const dirX = Math.sin(phi) * Math.cos(theta);
            const dirY = Math.sin(phi) * Math.sin(theta);
            const dirZ = Math.cos(phi);

            // Spawn right outside the 2.4cm Snitch body
            const spawnRadius = 0.026 + Math.random() * 0.025;
            p.x = center.x + dirX * spawnRadius;
            p.y = center.y + dirY * spawnRadius;
            p.z = center.z + dirZ * spawnRadius;

            const speed = 0.35 + Math.random() * 0.55;
            p.vx = dirX * speed;
            p.vy = dirY * speed + 0.12; // gentle upward buoyancy
            p.vz = dirZ * speed;

            p.drag = 0.94;
            p.gravity = -0.04;
            p.maxLife = 1.4 + Math.random() * 0.8;
            p.life = p.maxLife;
            p.size = 0.032 + Math.random() * 0.038;

            // Champagne gold spectrum
            const rChoice = Math.random();
            if (rChoice > 0.6) {
                p.r = 1.0; p.g = 0.96; p.b = 0.75; // Brilliant pale champagne
            } else if (rChoice > 0.3) {
                p.r = 1.0; p.g = 0.84; p.b = 0.35; // Rich golden luster
            } else {
                p.r = 0.95; p.g = 0.72; p.b = 0.22; // Amber sparkle
            }

            p.active = true;
        }
    }

    // =========================================================================
    // EFFECT A2: SNITCH FLIGHT TRAIL
    // Delicate fluttering sparks left behind in world space during flight
    // =========================================================================
    public emitSnitchTrail(worldPos: THREE.Vector3, count = 2) {
        for (let i = 0; i < count; i++) {
            const p = this.allocateSlot();
            if (!p) break;

            p.x = worldPos.x + (Math.random() - 0.5) * 0.035;
            p.y = worldPos.y + (Math.random() - 0.5) * 0.025;
            p.z = worldPos.z + (Math.random() - 0.5) * 0.035;

            p.vx = (Math.random() - 0.5) * 0.05;
            p.vy = -0.02 - Math.random() * 0.03;
            p.vz = (Math.random() - 0.5) * 0.05;

            p.drag = 0.98;
            p.gravity = -0.02;
            p.maxLife = 0.55 + Math.random() * 0.45;
            p.life = p.maxLife;
            p.size = 0.020 + Math.random() * 0.018;

            p.r = 1.0; p.g = 0.90; p.b = 0.45;
            p.active = true;
        }
    }

    // =========================================================================
    // EFFECT B: ENVIRONMENT TRANSFORMATION SPIRAL
    // Majestic 3D expanding Fibonacci spiral of celestial stardust
    // =========================================================================
    public triggerTransformationSpiral(center: THREE.Vector3, count = 150) {
        for (let i = 0; i < count; i++) {
            const p = this.allocateSlot();
            if (!p) break;

            const progress = i / count;
            const angle = progress * Math.PI * 10; // 5 full revolutions
            const radius = 0.3 + progress * 4.2;   // Expands out to 4.5m
            const height = 0.2 + progress * 2.8;   // Ascends up to 3.0m

            p.x = center.x + Math.cos(angle) * 0.2;
            p.y = center.y + 0.1;
            p.z = center.z + Math.sin(angle) * 0.2;

            p.spiralAngle = angle;
            p.spiralRadius = radius;
            p.spiralRise = height;
            p.spiralSpeed = 1.8 + Math.random() * 1.2;

            p.vx = Math.cos(angle) * (0.8 + progress * 1.2);
            p.vy = 0.4 + Math.random() * 0.6;
            p.vz = Math.sin(angle) * (0.8 + progress * 1.2);

            p.drag = 0.97;
            p.gravity = 0.02; // anti-gravity float
            p.maxLife = 2.4 + Math.random() * 0.8;
            p.life = p.maxLife;
            p.size = 0.035 + Math.random() * 0.045;

            // Celestial gold-to-starlight gradient
            if (i % 3 === 0) {
                p.r = 1.0; p.g = 0.98; p.b = 0.85; // Astral white-gold
            } else if (i % 3 === 1) {
                p.r = 1.0; p.g = 0.85; p.b = 0.32; // Warm gold
            } else {
                p.r = 0.75; p.g = 0.90; p.b = 1.0;  // Ethereal celestial cyan tint
            }

            p.active = true;
        }
    }

    // =========================================================================
    // EFFECT C: LETTER APPEARANCE GATHERING
    // Inward converging vortex concentrating magical energy before parchment emerges
    // =========================================================================
    public triggerLetterGather(targetPos: THREE.Vector3, count = 65) {
        for (let i = 0; i < count; i++) {
            const p = this.allocateSlot();
            if (!p) break;

            const u = Math.random();
            const v = Math.random();
            const theta = u * 2.0 * Math.PI;
            const phi = Math.acos(2.0 * v - 1.0);
            const gatherDist = 0.45 + Math.random() * 0.45;

            p.x = targetPos.x + Math.sin(phi) * Math.cos(theta) * gatherDist;
            p.y = targetPos.y + Math.sin(phi) * Math.sin(theta) * gatherDist;
            p.z = targetPos.z + Math.cos(phi) * gatherDist;

            p.targetX = targetPos.x;
            p.targetY = targetPos.y;
            p.targetZ = targetPos.z;

            // Inward velocity towards target
            const speed = 0.55 + Math.random() * 0.45;
            p.vx = (targetPos.x - p.x) * speed;
            p.vy = (targetPos.y - p.y) * speed;
            p.vz = (targetPos.z - p.z) * speed;

            p.drag = 0.98;
            p.gravity = 0;
            p.maxLife = 1.2 + Math.random() * 0.5;
            p.life = p.maxLife;
            p.size = 0.028 + Math.random() * 0.032;

            p.r = 1.0; p.g = 0.92; p.b = 0.55;
            p.active = true;
        }
    }

    // =========================================================================
    // EFFECT D: WAX SEAL OPENING SPARKLE BURST
    // Crystalline burst specifically around the crimson wax seal position
    // =========================================================================
    public triggerWaxSealSparkle(sealWorldPos: THREE.Vector3, count = 48) {
        for (let i = 0; i < count; i++) {
            const p = this.allocateSlot();
            if (!p) break;

            const angle = Math.random() * Math.PI * 2;
            const dist = 0.012 + Math.random() * 0.028;

            p.x = sealWorldPos.x + Math.cos(angle) * dist;
            p.y = sealWorldPos.y + Math.sin(angle) * dist;
            p.z = sealWorldPos.z + 0.008 + (Math.random() - 0.5) * 0.015;

            const speed = 0.22 + Math.random() * 0.35;
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed + 0.08;
            p.vz = 0.08 + Math.random() * 0.15; // Burst forward away from paper

            p.drag = 0.94;
            p.gravity = -0.06;
            p.maxLife = 1.1 + Math.random() * 0.6;
            p.life = p.maxLife;
            p.size = 0.026 + Math.random() * 0.028;

            p.r = 1.0; p.g = 0.88; p.b = 0.40;
            p.active = true;
        }
    }

    // =========================================================================
    // EFFECT E: LETTER WRITING TRAIL
    // Progressively traces across the current sentence from left to right
    // =========================================================================
    public startWritingTrail(startPos: THREE.Vector3, endPos: THREE.Vector3, duration = 3.5) {
        this.writingActive = true;
        this.writingStart.copy(startPos);
        this.writingEnd.copy(endPos);
        this.writingDuration = Math.max(0.5, duration);
        this.writingTimer = 0;
        this.writingProgress = 0;
    }

    public stopWritingTrail() {
        this.writingActive = false;
    }

    private updateWritingTrailStep(delta: number) {
        if (!this.writingActive) return;

        this.writingTimer += delta;
        this.writingProgress = Math.min(1.0, this.writingTimer / this.writingDuration);

        MagicalParticleSystem._scratchV1.lerpVectors(this.writingStart, this.writingEnd, this.writingProgress);

        // Emit 2 delicate calligraphy sparks at current pen tip
        for (let i = 0; i < 2; i++) {
            const p = this.allocateSlot();
            if (!p) break;

            p.x = MagicalParticleSystem._scratchV1.x + (Math.random() - 0.5) * 0.008;
            p.y = MagicalParticleSystem._scratchV1.y + (Math.random() - 0.5) * 0.006;
            p.z = MagicalParticleSystem._scratchV1.z + 0.004 + Math.random() * 0.006;

            p.vx = (Math.random() - 0.5) * 0.03;
            p.vy = -0.01 - Math.random() * 0.02;
            p.vz = 0.01 + Math.random() * 0.02;

            p.drag = 0.96;
            p.gravity = -0.03;
            p.maxLife = 0.65 + Math.random() * 0.45;
            p.life = p.maxLife;
            p.size = 0.018 + Math.random() * 0.016;

            p.r = 1.0; p.g = 0.86; p.b = 0.35;
            p.active = true;
        }

        if (this.writingProgress >= 1.0) {
            this.writingActive = false;
        }
    }

    // =========================================================================
    // EFFECT F: LETTER DISAPPEARANCE DISSOLVE
    // Letter dissolves into golden particles that briefly swirl before fading
    // =========================================================================
    public triggerLetterDissolve(center: THREE.Vector3, width = 0.26, height = 0.32, count = 130) {
        for (let i = 0; i < count; i++) {
            const p = this.allocateSlot();
            if (!p) break;

            // Distribute across letter surface area
            const localX = (Math.random() - 0.5) * width;
            const localY = (Math.random() - 0.5) * height;
            const localZ = (Math.random() - 0.5) * 0.015;

            p.x = center.x + localX;
            p.y = center.y + localY;
            p.z = center.z + localZ;

            // Upward swirling dissolution vortex
            const angle = Math.atan2(localY, localX) + Math.PI / 2;
            const swirl = 0.25 + Math.random() * 0.35;
            p.vx = Math.cos(angle) * swirl + (Math.random() - 0.5) * 0.15;
            p.vy = 0.28 + Math.random() * 0.42; // Floating upward towards ceiling
            p.vz = Math.sin(angle) * swirl + (Math.random() - 0.5) * 0.15;

            p.drag = 0.96;
            p.gravity = 0.02;
            p.maxLife = 1.8 + Math.random() * 0.9;
            p.life = p.maxLife;
            p.size = 0.032 + Math.random() * 0.038;

            if (Math.random() > 0.4) {
                p.r = 1.0; p.g = 0.92; p.b = 0.60;
            } else {
                p.r = 1.0; p.g = 0.82; p.b = 0.30;
            }

            p.active = true;
        }
    }

    // =========================================================================
    // MAIN UPDATE LOOP
    // Zero GC allocation per-frame simulation
    // =========================================================================
    public update(delta: number) {
        this.updateWritingTrailStep(delta);

        let hasActive = false;
        const pos = this.posArray;
        const alpha = this.alphaArray;
        const size = this.sizeArray;
        const col = this.colorArray;

        for (let i = 0; i < this.maxParticles; i++) {
            const p = this.pool[i];
            if (!p.active) {
                alpha[i] = 0.0;
                continue;
            }

            hasActive = true;
            p.life -= delta;

            if (p.life <= 0) {
                p.active = false;
                alpha[i] = 0.0;
                size[i] = 0.0;
                pos[i * 3 + 1] = -999;
                continue;
            }

            // Dynamics
            p.vx *= Math.pow(p.drag, delta * 60);
            p.vy *= Math.pow(p.drag, delta * 60);
            p.vz *= Math.pow(p.drag, delta * 60);
            p.vy += p.gravity * delta;

            // Inward target attraction if set (Effect C)
            if (p.targetX !== undefined) {
                const tx = p.targetX - p.x;
                const ty = p.targetY! - p.y;
                const tz = p.targetZ! - p.z;
                p.vx += tx * delta * 4.5;
                p.vy += ty * delta * 4.5;
                p.vz += tz * delta * 4.5;
            }

            p.x += p.vx * delta;
            p.y += p.vy * delta;
            p.z += p.vz * delta;

            const lifeRatio = Math.max(0.0, p.life / p.maxLife);
            // Smooth ease out fade
            const smoothFade = Math.sin(lifeRatio * Math.PI * 0.5);

            pos[i * 3 + 0] = p.x;
            pos[i * 3 + 1] = p.y;
            pos[i * 3 + 2] = p.z;
            alpha[i] = smoothFade * 0.95;
            size[i] = p.size * (0.4 + smoothFade * 0.6);
            col[i * 3 + 0] = p.r;
            col[i * 3 + 1] = p.g;
            col[i * 3 + 2] = p.b;
        }

        if (hasActive || this.hadActiveLastFrame) {
            this.geometry.attributes.position.needsUpdate = true;
            this.geometry.attributes.aAlpha.needsUpdate = true;
            this.geometry.attributes.aSize.needsUpdate = true;
            this.geometry.attributes.aColor.needsUpdate = true;
        }
        this.hadActiveLastFrame = hasActive;
    }

    public dispose() {
        this.geometry.dispose();
        this.material.dispose();
    }
}
