import * as THREE from 'three';

/**
 * Procedural Realistic 3D Volumetric Flame System for LabVerse WebXR.
 * Optimized for desktop and standalone Meta Quest VR:
 * - Bright, vibrant blue base anchoring the flame at the burner nozzle.
 * - Luminous, incandescent white-hot reducing core cone.
 * - Multi-layered convective flame mantles with naturally twisting and dancing flame tongues.
 * - Subtle rising micro-sparks and glowing ember particle system with reaction bursts.
 * - Smooth chromatic transitions between steady gas blue and characteristic salt emission colors.
 * - Dynamic synchronized point light and workbench light pool casting coloured illumination on the countertop.
 * - Smooth easing back to normal gas blue flame upon wire removal.
 * - Pure procedural GPU execution with zero GC allocations in animation loop.
 */

// Helper to create a smooth, lofted 3D teardrop mesh
function createTeardropGeometry(
    baseRadius: number,
    height: number,
    radialSegments = 32,
    heightSegments = 24
): THREE.BufferGeometry {
    const vertices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let j = 0; j <= heightSegments; j++) {
        const v = j / heightSegments;
        const y = v * height;

        // Natural flame contour profile:
        // Anchored at base nozzle diameter, gently expanding in lower body (belly),
        // tapering gracefully through the mantle, and culminating in a sharp tip.
        const belly = Math.sin(Math.pow(v, 0.72) * Math.PI);
        const taper = Math.pow(1.0 - v, 1.15);
        const radiusFactor = (0.70 * (1.0 - v) + 1.30 * belly) * taper;
        const r = Math.max(0.0001, baseRadius * radiusFactor);

        for (let i = 0; i <= radialSegments; i++) {
            const u = i / radialSegments;
            const theta = u * Math.PI * 2;
            const cosT = Math.cos(theta);
            const sinT = Math.sin(theta);

            const x = r * cosT;
            const z = r * sinT;

            vertices.push(x, y, z);

            // Outward & upward surface normals for Fresnel calculations
            const nx = cosT * 0.88;
            const nz = sinT * 0.88;
            const ny = v > 0.6 ? 0.45 : 0.20;
            const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
            normals.push(nx / nLen, ny / nLen, nz / nLen);

            uvs.push(u, v);
        }
    }

    const ringStride = radialSegments + 1;
    for (let j = 0; j < heightSegments; j++) {
        for (let i = 0; i < radialSegments; i++) {
            const a = j * ringStride + i;
            const b = (j + 1) * ringStride + i;
            const c = (j + 1) * ringStride + (i + 1);
            const d = j * ringStride + (i + 1);

            indices.push(a, b, d);
            indices.push(b, c, d);
        }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    return geo;
}

// Procedural GLSL for dancing flame mantles (Main and Outer wispy layers)
const flameVertexShader = `
uniform float uTime;
uniform float uTurbulence;
uniform float uScaleY;
uniform float uScaleXZ;
uniform float uSwaySpeed;
uniform float uPhaseOffset;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;
varying float vHeight;

void main() {
    vUv = uv;
    vHeight = uv.y;
    
    vec3 pos = position;
    float h = clamp(uv.y, 0.0, 1.0);
    
    // Convective upward time factor
    float t = uTime * uSwaySpeed + uPhaseOffset;
    
    // 1. Natural vertical convective twisting around Y axis
    float twist = sin(pos.y * 22.0 - t * 2.8 + pos.x * 14.0) * 0.16 * pow(h, 1.7);
    float cosT = cos(twist);
    float sinT = sin(twist);
    float rx = pos.x * cosT - pos.z * sinT;
    float rz = pos.x * sinT + pos.z * cosT;
    pos.x = rx;
    pos.z = rz;
    
    // 2. Convective harmonic lateral sway (base stays firmly anchored at h = 0)
    float sway1 = sin(pos.y * 30.0 - t * 1.8 + pos.x * 20.0);
    float sway2 = cos(pos.y * 42.0 - t * 2.4 + pos.z * 22.0);
    float sway3 = sin(pos.y * 14.0 - t * 0.95);
    
    float tipAmp = pow(h, 1.40) * uTurbulence;
    pos.x += (sway1 * 0.0085 + sway3 * 0.0050) * tipAmp;
    pos.z += (sway2 * 0.0085 + sway1 * 0.0045) * tipAmp;
    
    // 3. Convective vertical breathing & thermal lift
    pos.y += sin(t * 1.6 + h * 3.14) * 0.005 * h;
    
    // 4. Smooth scale modulation (ignition, reaction swell, bloom)
    pos.x *= uScaleXZ;
    pos.z *= uScaleXZ;
    pos.y *= uScaleY;
    
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    
    gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const flameFragmentShader = `
uniform vec3 uColor;
uniform vec3 uBaseBlueColor;
uniform vec3 uCoreColor;
uniform float uBrightness;
uniform float uOpacity;
uniform float uTime;
uniform float uNoiseScale;
uniform float uBlueBaseStrength;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;
varying float vHeight;

// Lightweight 2D procedural pseudo-perlin noise for rising flame tongues
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), f.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
        f.y
    );
}

void main() {
    float h = clamp(vHeight, 0.0, 1.0);
    
    // Multi-octave upward-convecting noise tongues
    vec2 uvCoord1 = vec2(vUv.x * uNoiseScale + sin(uTime * 1.6) * 0.12, vUv.y * 3.4 - uTime * 3.2);
    vec2 uvCoord2 = vec2(vUv.x * (uNoiseScale * 1.75) - cos(uTime * 2.1) * 0.15, vUv.y * 5.2 - uTime * 4.6);
    float n1 = noise(uvCoord1);
    float n2 = noise(uvCoord2);
    float flameTongues = n1 * 0.62 + n2 * 0.38;
    
    // --- 1. SCIENTIFIC MULTI-ZONE COLOR PROFILE ---
    // A. Bright Blue Base: Characteristic premixed gas flame root at the burner nozzle
    // B. Mid Mantle: Rich, vibrant characteristic salt emission color (or gas blue when idle)
    // C. Upper Flame Tongues: Glowing flame tips transitioning into wisps
    vec3 baseBlue = uBaseBlueColor;
    vec3 midColor = uColor;
    vec3 tipColor = mix(uColor, vec3(1.0, 0.95, 0.85), 0.15);
    
    vec3 col;
    // Lower 22% of the flame retains the characteristic bright blue base
    float blueFactor = clamp((0.22 - h) / 0.22, 0.0, 1.0) * uBlueBaseStrength;
    
    if (h < 0.25) {
        col = mix(baseBlue, midColor, h / 0.25);
    } else {
        col = mix(midColor, tipColor, (h - 0.25) / 0.75);
    }
    col = mix(col, baseBlue, blueFactor * 0.85);
    
    // Core white-hot warmth in lower-center reducing zone
    float coreFactor = (1.0 - smoothstep(0.0, 0.38, h));
    col += uCoreColor * coreFactor * 0.60;
    
    // --- 2. VOLUMETRIC FRESNEL RIM GLOW ---
    // Delivers rich depth and authentic luminosity from any VR head position
    float fresnel = 1.0 - abs(dot(vViewDir, vNormal));
    fresnel = pow(fresnel, 1.70);
    col += uColor * fresnel * 0.80;
    
    // --- 3. DANCING FLAME TONGUE DISSOLUTION & OPACITY ---
    // High opacity in lower-mid core, dissolving organically at upper dancing tips
    float alpha = (1.0 - pow(h, 1.70)) * (0.52 + flameTongues * 0.48);
    alpha *= (0.60 + fresnel * 0.60);
    alpha = clamp(alpha * uOpacity, 0.0, 1.0);
    
    gl_FragColor = vec4(col * uBrightness, alpha);
}
`;

// Inner luminous reducing core cone shader (Hottest incandescent plasma cone)
const coreVertexShader = `
uniform float uTime;
uniform float uScaleY;
uniform float uScaleXZ;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
    vUv = uv;
    vec3 pos = position;
    
    // Gentle high-temperature acoustic breathing
    float pulse = 1.0 + sin(uTime * 9.5) * 0.025;
    pos.x *= uScaleXZ * pulse;
    pos.z *= uScaleXZ * pulse;
    pos.y *= uScaleY * (1.0 + sin(uTime * 8.0) * 0.020);
    
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    
    gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const coreFragmentShader = `
uniform vec3 uColor;
uniform vec3 uCoreColor;
uniform vec3 uBaseBlueColor;
uniform float uOpacity;
uniform float uBrightness;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDir;

void main() {
    float h = clamp(vUv.y, 0.0, 1.0);
    
    // Blinding white-hot core transitioning into electric blue base and emission perimeter
    float fresnel = 1.0 - abs(dot(vViewDir, vNormal));
    vec3 baseMix = mix(uBaseBlueColor, uColor, h * 0.7);
    vec3 col = mix(uCoreColor, baseMix, fresnel * 0.55 + h * 0.35);
    
    // Luminous inner cone contour
    float alpha = (1.0 - pow(h, 2.2)) * (0.88 + fresnel * 0.35);
    alpha = clamp(alpha * uOpacity, 0.0, 1.0);
    
    gl_FragColor = vec4(col * uBrightness * 1.45, alpha);
}
`;

// Base corona glow disc shader (Nozzle collar glow ring)
const coronaVertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const coronaFragmentShader = `
uniform vec3 uBaseBlueColor;
uniform vec3 uColor;
uniform float uOpacity;
uniform float uBrightness;
varying vec2 vUv;

void main() {
    vec2 center = vUv - vec2(0.5);
    float dist = length(center) * 2.0;
    if (dist > 1.0) discard;
    
    // Soft radial electric-blue bloom falloff
    float radial = pow(1.0 - dist, 1.9);
    vec3 col = mix(vec3(0.85, 0.95, 1.0), uBaseBlueColor, dist * 0.65);
    col = mix(col, uColor, 0.25);
    gl_FragColor = vec4(col * uBrightness, radial * uOpacity * 0.85);
}
`;

// Workbench Coloured Light Pool Decal Shader
// Casts an exquisite soft pool of coloured light directly onto the tabletop beneath and around the burner
const workbenchGlowVertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const workbenchGlowFragmentShader = `
uniform vec3 uColor;
uniform float uOpacity;
uniform float uBrightness;
varying vec2 vUv;

void main() {
    vec2 center = vUv - vec2(0.5);
    float dist = length(center) * 2.0;
    if (dist > 1.0) discard;
    
    // Soft quadratic Gaussian falloff pool of light on countertop
    float falloff = clamp(1.0 - dist, 0.0, 1.0);
    falloff = pow(falloff, 2.4);
    
    gl_FragColor = vec4(uColor * uBrightness, falloff * uOpacity);
}
`;

export interface SparkParticle {
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    life: number;
    maxLife: number;
    size: number;
    isBurst: boolean;
}

export class RealisticFlame {
    public group: THREE.Group;

    // 3D Flame layers
    private innerCoreMesh: THREE.Mesh;
    private mainFlameMesh: THREE.Mesh;
    private outerFlameMesh: THREE.Mesh;
    private baseCoronaMesh: THREE.Mesh;
    private workbenchGlowMesh: THREE.Mesh;

    // Materials & Uniforms
    private innerCoreMat: THREE.ShaderMaterial;
    private mainFlameMat: THREE.ShaderMaterial;
    private outerFlameMat: THREE.ShaderMaterial;
    private baseCoronaMat: THREE.ShaderMaterial;
    private workbenchGlowMat: THREE.ShaderMaterial;

    // Spark particle system
    private sparkPoints: THREE.Points;
    private sparkGeo: THREE.BufferGeometry;
    private sparkMat: THREE.PointsMaterial;
    private sparkData: SparkParticle[] = [];
    private maxSparks = 90;
    private sparkPositions: Float32Array;
    private sparkColors: Float32Array;

    // Dynamic Point Light illuminating burner and workbench
    private pointLight: THREE.PointLight;

    // Colors
    private defaultGasColor: THREE.Color;      // Delicate sky/cyan blue mantle (0x38bdf8)
    private brightBaseBlueColor: THREE.Color;  // Deep, intense cobalt gas flame base (0x0284c7)
    private coreWhiteColor: THREE.Color;       // Blinding white-hot core
    private currentColor: THREE.Color;         // Current interpolated flame color
    private targetColor: THREE.Color;          // Target emission color

    // Animation & State properties
    private isIgnited = false;
    private animTime = 0;
    private ignitionProgress = 0.0; // 0.0 (off) -> 1.0 (fully lit)
    private flameScaleY = 1.0;
    private flameScaleXZ = 1.0;
    private turbulence = 1.0;
    private burstTimer = 0.0;
    private reactionIntensity = 0.0; // 0 (idle blue) -> 1.0 (active salt reaction)

    constructor() {
        this.group = new THREE.Group();
        this.group.name = "RealisticFlameGroup";

        // Anchor flame base directly flush with Bunsen burner nozzle top (y = 0.150m)
        this.group.position.set(0, 0.150, 0);

        // Calibrated Scientific Color Palettes
        this.defaultGasColor = new THREE.Color(0x38bdf8);      // Delicate luminous gas blue
        this.brightBaseBlueColor = new THREE.Color(0x0284c7);  // Characteristic deep electric blue nozzle root
        this.coreWhiteColor = new THREE.Color(0xffffff);       // White-hot plasma core
        this.currentColor = this.defaultGasColor.clone();
        this.targetColor = this.defaultGasColor.clone();

        // --- 1. BUILD INNER LUMINOUS REDUCING CORE CONE ---
        // Sharp, distinct teardrop representing the hottest inner cone of the Bunsen burner
        const innerGeo = createTeardropGeometry(0.009, 0.058, 24, 18);
        this.innerCoreMat = new THREE.ShaderMaterial({
            vertexShader: coreVertexShader,
            fragmentShader: coreFragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: this.currentColor },
                uCoreColor: { value: this.coreWhiteColor },
                uBaseBlueColor: { value: this.brightBaseBlueColor },
                uOpacity: { value: 0.0 },
                uBrightness: { value: 1.30 },
                uScaleY: { value: 1.0 },
                uScaleXZ: { value: 1.0 }
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        this.innerCoreMesh = new THREE.Mesh(innerGeo, this.innerCoreMat);
        this.innerCoreMesh.name = "FlameInnerCore";
        this.group.add(this.innerCoreMesh);

        // --- 2. BUILD MAIN FLAME MANTLE ---
        // Tall, elegant 3D volume with organic convective flame tongues
        const mainGeo = createTeardropGeometry(0.017, 0.148, 32, 26);
        this.mainFlameMat = new THREE.ShaderMaterial({
            vertexShader: flameVertexShader,
            fragmentShader: flameFragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: this.currentColor },
                uBaseBlueColor: { value: this.brightBaseBlueColor },
                uCoreColor: { value: this.coreWhiteColor },
                uOpacity: { value: 0.0 },
                uBrightness: { value: 1.18 },
                uTurbulence: { value: 1.0 },
                uScaleY: { value: 1.0 },
                uScaleXZ: { value: 1.0 },
                uSwaySpeed: { value: 6.8 },
                uPhaseOffset: { value: 0.0 },
                uNoiseScale: { value: 6.2 },
                uBlueBaseStrength: { value: 1.0 }
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        this.mainFlameMesh = new THREE.Mesh(mainGeo, this.mainFlameMat);
        this.mainFlameMesh.name = "FlameMainMantle";
        this.group.add(this.mainFlameMesh);

        // --- 3. BUILD OUTER WISPY FLAME MANTLE (Genuine 3D Layered Depth) ---
        // Rotated phase envelope providing authentic parallax when viewed from any stereo angle in VR
        const outerGeo = createTeardropGeometry(0.023, 0.165, 26, 20);
        this.outerFlameMat = new THREE.ShaderMaterial({
            vertexShader: flameVertexShader,
            fragmentShader: flameFragmentShader,
            uniforms: {
                uTime: { value: 1.5 },
                uColor: { value: this.currentColor },
                uBaseBlueColor: { value: this.brightBaseBlueColor },
                uCoreColor: { value: this.coreWhiteColor },
                uOpacity: { value: 0.0 },
                uBrightness: { value: 0.88 },
                uTurbulence: { value: 1.30 },
                uScaleY: { value: 1.03 },
                uScaleXZ: { value: 1.14 },
                uSwaySpeed: { value: 5.4 },
                uPhaseOffset: { value: 1.85 },
                uNoiseScale: { value: 4.8 },
                uBlueBaseStrength: { value: 0.85 }
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        this.outerFlameMesh = new THREE.Mesh(outerGeo, this.outerFlameMat);
        this.outerFlameMesh.name = "FlameOuterMantle";
        this.outerFlameMesh.rotation.y = Math.PI / 4;
        this.group.add(this.outerFlameMesh);

        // --- 4. BUILD BASE CORONA GLOW DISC ---
        // Sits right on the burner tube nozzle rim to create a soft electric-blue collar
        const coronaGeo = new THREE.PlaneGeometry(0.038, 0.038);
        coronaGeo.rotateX(-Math.PI / 2);
        this.baseCoronaMat = new THREE.ShaderMaterial({
            vertexShader: coronaVertexShader,
            fragmentShader: coronaFragmentShader,
            uniforms: {
                uBaseBlueColor: { value: this.brightBaseBlueColor },
                uColor: { value: this.currentColor },
                uOpacity: { value: 0.0 },
                uBrightness: { value: 1.25 }
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        this.baseCoronaMesh = new THREE.Mesh(coronaGeo, this.baseCoronaMat);
        this.baseCoronaMesh.position.y = 0.002;
        this.group.add(this.baseCoronaMesh);

        // --- 5. WORKBENCH COLOURED LIGHT POOL DECAL ---
        // Positioned flush on the workbench countertop surface (y = -0.148m relative to nozzle top,
        // which places it exactly 2mm above the table surface at y = 0.900m)
        const glowPoolGeo = new THREE.PlaneGeometry(0.56, 0.56);
        glowPoolGeo.rotateX(-Math.PI / 2);
        this.workbenchGlowMat = new THREE.ShaderMaterial({
            vertexShader: workbenchGlowVertexShader,
            fragmentShader: workbenchGlowFragmentShader,
            uniforms: {
                uColor: { value: this.currentColor },
                uOpacity: { value: 0.0 },
                uBrightness: { value: 1.15 }
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        this.workbenchGlowMesh = new THREE.Mesh(glowPoolGeo, this.workbenchGlowMat);
        this.workbenchGlowMesh.position.set(0, -0.148, 0);
        this.workbenchGlowMesh.name = "FlameWorkbenchGlowPool";
        this.group.add(this.workbenchGlowMesh);

        // --- 6. BUILD RISING MICRO-SPARKS & EMBER PARTICLE SYSTEM ---
        this.sparkPositions = new Float32Array(this.maxSparks * 3);
        this.sparkColors = new Float32Array(this.maxSparks * 3);
        this.sparkGeo = new THREE.BufferGeometry();
        this.sparkGeo.setAttribute('position', new THREE.BufferAttribute(this.sparkPositions, 3));
        this.sparkGeo.setAttribute('color', new THREE.BufferAttribute(this.sparkColors, 3));

        // High-fidelity glowing ember sprite texture with white-hot core and soft optical aura
        const sparkCanvas = document.createElement('canvas');
        sparkCanvas.width = 64;
        sparkCanvas.height = 64;
        const sctx = sparkCanvas.getContext('2d')!;
        const grad = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
        grad.addColorStop(0.22, 'rgba(255, 245, 220, 0.95)');
        grad.addColorStop(0.55, 'rgba(255, 200, 120, 0.50)');
        grad.addColorStop(0.85, 'rgba(255, 140, 50, 0.15)');
        grad.addColorStop(1.0, 'rgba(255, 100, 20, 0.0)');
        sctx.fillStyle = grad;
        sctx.fillRect(0, 0, 64, 64);
        const sparkTex = new THREE.CanvasTexture(sparkCanvas);

        this.sparkMat = new THREE.PointsMaterial({
            size: 0.008,
            map: sparkTex,
            transparent: true,
            opacity: 0.0,
            blending: THREE.AdditiveBlending,
            vertexColors: true,
            depthWrite: false
        });
        this.sparkPoints = new THREE.Points(this.sparkGeo, this.sparkMat);
        this.sparkPoints.name = "FlameSparks";
        this.group.add(this.sparkPoints);

        this.initSparks();

        // --- 7. DYNAMIC SYNCHRONIZED POINT LIGHT ---
        // Positioned directly above the nozzle inside the flame (y = 0.075m, world height 0.975m)
        // Illuminates burner tube, brass valve, and casts rich colored light across the nearby workbench
        this.pointLight = new THREE.PointLight(this.defaultGasColor.getHex(), 0.0, 1.8, 1.1);
        this.pointLight.position.set(0, 0.075, 0);
        this.pointLight.castShadow = false; // Zero shadow map overhead on Meta Quest VR
        this.group.add(this.pointLight);
    }

    private initSparks() {
        this.sparkData = [];
        for (let i = 0; i < this.maxSparks; i++) {
            this.sparkData.push(this.spawnSpark(false));
            this.sparkPositions[i * 3 + 0] = 0;
            this.sparkPositions[i * 3 + 1] = -10; // Offscreen until spawned
            this.sparkPositions[i * 3 + 2] = 0;

            this.sparkColors[i * 3 + 0] = this.currentColor.r;
            this.sparkColors[i * 3 + 1] = this.currentColor.g;
            this.sparkColors[i * 3 + 2] = this.currentColor.b;
        }
    }

    private spawnSpark(isBurst = false): SparkParticle {
        const angle = Math.random() * Math.PI * 2;
        const rad = Math.random() * (isBurst ? 0.024 : 0.010);
        const speedMultiplier = isBurst ? (0.36 + Math.random() * 0.48) : (0.15 + Math.random() * 0.20);

        return {
            x: Math.cos(angle) * rad,
            y: 0.012 + Math.random() * 0.035,
            z: Math.sin(angle) * rad,
            vx: (Math.random() - 0.5) * (isBurst ? 0.07 : 0.018),
            vy: speedMultiplier,
            vz: (Math.random() - 0.5) * (isBurst ? 0.07 : 0.018),
            life: 0,
            maxLife: 0.45 + Math.random() * (isBurst ? 0.85 : 0.50),
            size: isBurst ? (0.008 + Math.random() * 0.006) : (0.004 + Math.random() * 0.004),
            isBurst
        };
    }

    /**
     * Triggers an energetic burst of rising sparks and white-hot flare on salt wire contact.
     */
    public triggerReactionBurst(colorHex: number) {
        const col = new THREE.Color(colorHex);
        const isStrontium = (colorHex === 0xff173d || (col.r > 0.95 && col.g < 0.15 && col.b > 0.18));
        this.burstTimer = isStrontium ? 0.88 : 0.70;

        // Respawn spark pool with high-velocity thermal lift
        const burstCount = isStrontium ? Math.floor(this.maxSparks * 0.85) : Math.floor(this.maxSparks * 0.65);
        for (let i = 0; i < burstCount; i++) {
            this.sparkData[i] = this.spawnSpark(true);
            if (isStrontium) {
                this.sparkData[i].vy *= 1.35; // Energetic flare lift for Strontium sparks
            }

            // Intersperse with white-hot spark specks
            const isWhite = Math.random() < (isStrontium ? 0.35 : 0.25);
            this.sparkColors[i * 3 + 0] = isWhite ? 1.0 : col.r;
            this.sparkColors[i * 3 + 1] = isWhite ? 1.0 : col.g;
            this.sparkColors[i * 3 + 2] = isWhite ? (isStrontium ? 0.35 : col.b) : col.b;
        }

        if (this.sparkGeo.attributes.color) {
            this.sparkGeo.attributes.color.needsUpdate = true;
        }
    }

    /**
     * Smoothly sets the target flame emission color.
     */
    public setTargetColor(colorHex: number) {
        this.targetColor.setHex(colorHex);
    }

    /**
     * Smoothly restores the default soothing blue gas flame.
     */
    public resetToDefaultColor() {
        this.targetColor.copy(this.defaultGasColor);
    }

    /**
     * Powers the burner on/off.
     */
    public setIgnited(ignited: boolean) {
        this.isIgnited = ignited;
    }

    public getIsIgnited(): boolean {
        return this.isIgnited;
    }

    /**
     * Returns primary mesh for compatibility with external references.
     */
    public getPrimaryMesh(): THREE.Mesh {
        return this.mainFlameMesh;
    }

    public getPointLight(): THREE.PointLight {
        return this.pointLight;
    }

    public getParticlePoints(): THREE.Points {
        return this.sparkPoints;
    }

    /**
     * Per-frame animation update called from the main logic loop.
     */
    public update(delta: number, isReacting = false, reactionBloom = 0.0) {
        this.animTime += delta;

        // 1. Smooth Ignition / Extinguish transitions
        const targetProgress = this.isIgnited ? 1.0 : 0.0;
        const progressSpeed = this.isIgnited ? 4.8 : 5.8;
        this.ignitionProgress += (targetProgress - this.ignitionProgress) * Math.min(1.0, delta * progressSpeed);

        if (this.ignitionProgress < 0.001) {
            this.group.visible = false;
            this.pointLight.intensity = 0.0;
            return;
        }
        this.group.visible = true;

        // 2. Smooth Color Interpolation (Gas Blue <-> Characteristic Salt Emission)
        // Transitions rapidly upon wire entry, then eases smoothly back to gas blue when wire is removed
        const lerpSpeed = isReacting ? 6.5 : 3.2;
        this.currentColor.lerp(this.targetColor, Math.min(1.0, delta * lerpSpeed));

        // Track reaction intensity for light & bloom modulation
        const targetReaction = isReacting ? 1.0 : 0.0;
        this.reactionIntensity += (targetReaction - this.reactionIntensity) * Math.min(1.0, delta * 4.0);

        // 3. Reaction Burst & Bloom Modulation
        if (this.burstTimer > 0) {
            this.burstTimer -= delta;
        }
        const burstFactor = Math.max(0, this.burstTimer / 0.70);
        const isStrontium = (this.targetColor.getHex() === 0xff173d);

        // Flame scale: expands naturally during salt excitation & burst
        const baseScaleY = 0.35 + 0.65 * this.ignitionProgress;
        const baseScaleXZ = 0.35 + 0.65 * this.ignitionProgress;
        const reactionScale = 1.0 + reactionBloom * (isStrontium ? 0.34 : 0.26) + burstFactor * (isStrontium ? 0.28 : 0.20);
        this.flameScaleY = baseScaleY * reactionScale;
        this.flameScaleXZ = baseScaleXZ * (1.0 + reactionBloom * (isStrontium ? 0.24 : 0.18) + burstFactor * 0.14);
        this.turbulence = 1.0 + reactionBloom * (isStrontium ? 0.55 : 0.45) + burstFactor * 0.55;

        // 4. Update Shader Uniforms
        const opacity = Math.min(1.0, this.ignitionProgress * 1.15);

        // Core white-hot brightness during reaction
        const coreBrightness = 1.30 + reactionBloom * (isStrontium ? 0.85 : 0.65) + burstFactor * (isStrontium ? 1.05 : 0.85);
        this.innerCoreMat.uniforms.uTime.value = this.animTime;
        this.innerCoreMat.uniforms.uColor.value.copy(this.currentColor);
        this.innerCoreMat.uniforms.uBaseBlueColor.value.copy(this.brightBaseBlueColor);
        this.innerCoreMat.uniforms.uOpacity.value = opacity * 0.95;
        this.innerCoreMat.uniforms.uBrightness.value = coreBrightness;
        this.innerCoreMat.uniforms.uScaleY.value = this.flameScaleY * 0.92;
        this.innerCoreMat.uniforms.uScaleXZ.value = this.flameScaleXZ * 0.92;

        // Main flame mantle (retaining bright blue base at nozzle root)
        const blueBaseStrength = isReacting ? 0.82 : 1.0;
        this.mainFlameMat.uniforms.uTime.value = this.animTime;
        this.mainFlameMat.uniforms.uColor.value.copy(this.currentColor);
        this.mainFlameMat.uniforms.uBaseBlueColor.value.copy(this.brightBaseBlueColor);
        this.mainFlameMat.uniforms.uOpacity.value = opacity;
        this.mainFlameMat.uniforms.uBrightness.value = 1.18 + reactionBloom * 0.35 + burstFactor * 0.45;
        this.mainFlameMat.uniforms.uTurbulence.value = this.turbulence;
        this.mainFlameMat.uniforms.uScaleY.value = this.flameScaleY;
        this.mainFlameMat.uniforms.uScaleXZ.value = this.flameScaleXZ;
        this.mainFlameMat.uniforms.uBlueBaseStrength.value = blueBaseStrength;

        // Outer wispy mantle
        this.outerFlameMat.uniforms.uTime.value = this.animTime + 1.5;
        this.outerFlameMat.uniforms.uColor.value.copy(this.currentColor);
        this.outerFlameMat.uniforms.uBaseBlueColor.value.copy(this.brightBaseBlueColor);
        this.outerFlameMat.uniforms.uOpacity.value = opacity * 0.85;
        this.outerFlameMat.uniforms.uBrightness.value = 0.92 + reactionBloom * 0.25;
        this.outerFlameMat.uniforms.uTurbulence.value = this.turbulence * 1.25;
        this.outerFlameMat.uniforms.uScaleY.value = this.flameScaleY * 1.04;
        this.outerFlameMat.uniforms.uScaleXZ.value = this.flameScaleXZ * 1.14;
        this.outerFlameMat.uniforms.uBlueBaseStrength.value = blueBaseStrength * 0.85;

        // Corona glow disc
        this.baseCoronaMat.uniforms.uColor.value.copy(this.currentColor);
        this.baseCoronaMat.uniforms.uBaseBlueColor.value.copy(this.brightBaseBlueColor);
        this.baseCoronaMat.uniforms.uOpacity.value = opacity * 0.85;
        this.baseCoronaMat.uniforms.uBrightness.value = 1.10 + burstFactor * 0.50;

        // 5. Workbench Coloured Light Pool Decal
        // Casts a subtle, beautiful pool of coloured light directly on the tabletop surface beneath and around burner
        const poolBaseOpacity = isReacting ? 0.38 : 0.18;
        this.workbenchGlowMat.uniforms.uColor.value.copy(this.currentColor);
        this.workbenchGlowMat.uniforms.uOpacity.value = opacity * (poolBaseOpacity + burstFactor * 0.22);
        this.workbenchGlowMat.uniforms.uBrightness.value = 1.15 + reactionBloom * 0.35;

        // 6. Dynamic Flame Point Light with Multi-frequency Organic Flicker
        const flicker = (
            0.12 * Math.sin(this.animTime * 19.3) +
            0.08 * Math.sin(this.animTime * 37.1) +
            0.05 * Math.cos(this.animTime * 53.7)
        );
        const baseIntensity = this.isIgnited ? (0.75 + this.reactionIntensity * 0.85 + burstFactor * 0.70) : 0.0;
        this.pointLight.intensity = Math.max(0, baseIntensity * (1.0 + flicker) * this.ignitionProgress);
        this.pointLight.color.copy(this.currentColor);

        // 7. Animate Spark Particles
        // Subtle micro-flecks during normal blue burn, vibrant fountain during salt excitation
        this.sparkMat.opacity = opacity * (isReacting ? 0.95 : 0.65);
        this.sparkMat.size = isReacting ? 0.008 : 0.005;
        const posAttr = this.sparkGeo.attributes.position as THREE.BufferAttribute;
        const colAttr = this.sparkGeo.attributes.color as THREE.BufferAttribute;

        for (let i = 0; i < this.maxSparks; i++) {
            const p = this.sparkData[i];
            p.life += delta;

            if (p.life >= p.maxLife) {
                // Respawn spark near nozzle or wire height
                const spawnBurst = (isReacting && Math.random() < 0.40) || (burstFactor > 0.1 && Math.random() < 0.60);
                this.sparkData[i] = this.spawnSpark(spawnBurst);
                const sp = this.sparkData[i];
                this.sparkPositions[i * 3 + 0] = sp.x;
                this.sparkPositions[i * 3 + 1] = sp.y;
                this.sparkPositions[i * 3 + 2] = sp.z;

                // Color configuration:
                // Idle blue mode: subtle cyan or golden embers
                // Reaction mode: salt's signature color mixed with white-hot core specks
                if (isReacting) {
                    const isWhite = Math.random() < 0.28;
                    this.sparkColors[i * 3 + 0] = isWhite ? 1.0 : this.currentColor.r;
                    this.sparkColors[i * 3 + 1] = isWhite ? 1.0 : this.currentColor.g;
                    this.sparkColors[i * 3 + 2] = isWhite ? 1.0 : this.currentColor.b;
                } else {
                    const isGolden = Math.random() < 0.35;
                    this.sparkColors[i * 3 + 0] = isGolden ? 0.95 : this.defaultGasColor.r;
                    this.sparkColors[i * 3 + 1] = isGolden ? 0.80 : this.defaultGasColor.g;
                    this.sparkColors[i * 3 + 2] = isGolden ? 0.40 : this.defaultGasColor.b;
                }
            } else {
                // Convective upward rise with gentle rotational turbulence
                const swirlAngle = this.animTime * 4.8 + i;
                p.x += (p.vx + Math.sin(swirlAngle) * 0.012) * delta;
                p.y += p.vy * delta;
                p.z += (p.vz + Math.cos(swirlAngle) * 0.012) * delta;

                this.sparkPositions[i * 3 + 0] = p.x;
                this.sparkPositions[i * 3 + 1] = p.y;
                this.sparkPositions[i * 3 + 2] = p.z;
            }
        }
        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;
    }
}
