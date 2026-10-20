import * as THREE from 'three';
import type { LaboratoryLighting } from './Lighting';
import type { MagicalParticleSystem } from './MagicalParticleSystem';
import type { AudioEngine } from '../audio/AudioEngine';

export type DimensionState = 'INACTIVE' | 'TRANSITIONING_IN' | 'ACTIVE' | 'TRANSITIONING_OUT';

export interface MagicalDimensionOptions {
    scene: THREE.Scene;
    labLighting?: LaboratoryLighting;
    roomGroup?: THREE.Group;
    furnitureGroup?: THREE.Group;
    particles?: MagicalParticleSystem;
    audio?: AudioEngine;
}

interface FloatingStructure {
    group: THREE.Group;
    baseY: number;
    floatFreq: number;
    floatAmp: number;
    rotSpeed: number;
    phase: number;
}

/**
 * MagicalDimension — Upgraded Celestial Fantasy Realm for the Golden Snitch Easter Egg.
 * - Deep midnight-blue and indigo sky with procedural nebula clouds and 3D twinkling starfield.
 * - Distant celestial architecture: floating ancient monoliths/obelisks at varying heights and depths.
 * - Monumental magical ring: a colossal celestial armillary ring rotating majestically in the distance.
 * - Striking distant focal point: radiant celestial star beacon aligned within the monumental ring.
 * - 8 Grand enchanted obsidian Gothic pillars with golden filigree inlays and vaulted ceiling ribs.
 * - Concentric glowing alchemical & astrological floor rune formations with counter-rotation.
 * - Floating will-o'-the-wisps (points of light) drifting with natural harmonic motion.
 * - Integrated with MagicalParticleSystem for the large 3D expanding transformation spiral.
 * - Reversible environment crossfade system: dims lab lighting, restores 100% cleanly on exit.
 * - Mobile GPU friendly for rock-solid 72/90/120 FPS in Meta Quest VR.
 */
export class MagicalDimension {
    public group: THREE.Group;
    private scene: THREE.Scene;
    private labLighting?: LaboratoryLighting;
    private roomGroup?: THREE.Group;
    private particles?: MagicalParticleSystem;
    private audio?: AudioEngine;

    // State Machine
    private state: DimensionState = 'INACTIVE';
    private transitionProgress = 0.0;
    private transitionDuration = 2.4;
    private onTransitionComplete: (() => void) | null = null;
    private elapsedTime = 0.0;

    // Preserved Lab Environment Settings
    private originalBgColor: THREE.Color | null = null;
    private originalFog: THREE.Fog | THREE.FogExp2 | null = null;
    private magicalBgColor = new THREE.Color(0x02040f);
    private magicalFog = new THREE.Fog(0x030818, 16, 36);

    // 1. Celestial Dome & Starfield
    private celestialDomeMesh!: THREE.Mesh;
    private domeMaterial!: THREE.MeshBasicMaterial;
    private starfieldPoints!: THREE.Points;
    private starPhases: Float32Array = new Float32Array(0);
    private starSpeeds: Float32Array = new Float32Array(0);

    // 2. Monumental Magical Ring (Colossal Celestial Armillary)
    private monumentalRingGroup!: THREE.Group;
    private monumentalRingMesh!: THREE.Mesh;
    private monumentalInnerRingMesh!: THREE.Mesh;
    private monumentalRingMaterials: THREE.Material[] = [];

    // 3. Striking Distant Focal Point (Celestial Astral Beacon)
    private focalBeaconGroup!: THREE.Group;
    private beaconSprite!: THREE.Sprite;
    private beaconOuterSprite!: THREE.Sprite;

    // 4. Large Floating Structures at Different Heights (Monoliths & Obelisks)
    private floatingStructuresGroup!: THREE.Group;
    private floatingStructures: FloatingStructure[] = [];
    private structureMaterials: THREE.Material[] = [];

    // 5. Enchanted Chamber Architecture (8 Gothic Basalt Pillars with Vaulted Ribs)
    private architectureGroup!: THREE.Group;
    private pillarMaterials: THREE.Material[] = [];

    // 6. Glowing Floor Formations (Counter-rotating Runes)
    private floorGroup!: THREE.Group;
    private outerRuneMesh!: THREE.Mesh;
    private middleRuneMesh!: THREE.Mesh;
    private innerRuneMesh!: THREE.Mesh;
    private floorMaterials: THREE.MeshBasicMaterial[] = [];

    // 7. Central Portal Ring
    private portalRingMesh!: THREE.Mesh;

    // 8. Floating Will-o'-the-Wisps (Points of Light)
    private wispsGroup!: THREE.Group;
    private wispData: {
        mesh: THREE.Mesh;
        sprite: THREE.Sprite;
        baseX: number;
        baseY: number;
        baseZ: number;
        freqX: number;
        freqY: number;
        freqZ: number;
        phase: number;
    }[] = [];

    // 9. Ambient Floating Golden Stardust
    private ambientDustPoints!: THREE.Points;
    private dustPositions!: Float32Array;
    private readonly DUST_COUNT = 90;

    // 10. Mystical Dimension Lighting Rig
    private magicalAmbientLight!: THREE.AmbientLight;
    private magicalCenterLight!: THREE.PointLight;
    private magicalRimLight!: THREE.DirectionalLight;

    constructor(options: MagicalDimensionOptions) {
        this.scene = options.scene;
        this.labLighting = options.labLighting;
        this.roomGroup = options.roomGroup;
        this.particles = options.particles;
        this.audio = options.audio;

        this.group = new THREE.Group();
        this.group.name = 'MagicalDimension';
        this.group.visible = false;

        this.buildCelestialDome();
        this.build3DStarfield();
        this.buildMonumentalMagicalRing();
        this.buildDistantFocalPoint();
        this.buildFloatingStructures();
        this.buildChamberArchitecture();
        this.buildFloorRunes();
        this.buildCentralPortal();
        this.buildFloatingWisps();
        this.buildAmbientStardust();
        this.buildLightingRig();

        this.scene.add(this.group);
    }

    public setLabLighting(lighting: LaboratoryLighting) {
        this.labLighting = lighting;
    }

    public setRoomGroup(roomGroup: THREE.Group) {
        this.roomGroup = roomGroup;
    }

    public setParticles(particles: MagicalParticleSystem) {
        this.particles = particles;
    }

    public setAudio(audio: AudioEngine) {
        this.audio = audio;
    }

    // --- 1. CELESTIAL CEILING & PROCEDURAL NEBULA DOME ---
    private buildCelestialDome() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const ctx = canvas.getContext('2d')!;

        // Deep space cosmic midnight-blue to deep indigo gradient
        const grad = ctx.createLinearGradient(0, 0, 0, 512);
        grad.addColorStop(0, '#02040e');
        grad.addColorStop(0.4, '#050c22');
        grad.addColorStop(0.75, '#081432');
        grad.addColorStop(1, '#0e2048');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1024, 512);

        // Violet & Indigo Nebula clouds with glowing auroral tendrils
        const drawNebula = (cx: number, cy: number, r: number, color1: string, color2: string) => {
            const radGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, r);
            radGrad.addColorStop(0, color1);
            radGrad.addColorStop(0.65, color2);
            radGrad.addColorStop(1, 'rgba(2, 4, 14, 0)');
            ctx.fillStyle = radGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
        };

        drawNebula(260, 160, 260, 'rgba(95, 45, 160, 0.45)', 'rgba(45, 20, 100, 0.16)');
        drawNebula(760, 200, 300, 'rgba(30, 85, 175, 0.50)', 'rgba(15, 50, 110, 0.20)');
        drawNebula(512, 110, 220, 'rgba(215, 165, 55, 0.25)', 'rgba(110, 75, 25, 0.10)'); // Golden cosmic dust lane
        drawNebula(400, 280, 200, 'rgba(20, 130, 170, 0.30)', 'rgba(10, 60, 90, 0.10)');

        // Fine cosmic constellation lines
        ctx.strokeStyle = 'rgba(210, 235, 255, 0.22)';
        ctx.lineWidth = 1.2;
        const stars: [number, number][] = [
            [200, 130], [280, 100], [350, 140], [430, 200],
            [670, 120], [730, 170], [830, 150], [900, 210]
        ];
        for (let i = 0; i < stars.length - 1; i += 2) {
            ctx.beginPath();
            ctx.moveTo(stars[i][0], stars[i][1]);
            ctx.lineTo(stars[i + 1][0], stars[i + 1][1]);
            ctx.stroke();
        }

        const domeTexture = new THREE.CanvasTexture(canvas);
        domeTexture.wrapS = THREE.RepeatWrapping;
        domeTexture.repeat.set(1, 1);

        const domeGeo = new THREE.SphereGeometry(28, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.54);
        this.domeMaterial = new THREE.MeshBasicMaterial({
            map: domeTexture,
            side: THREE.BackSide,
            transparent: true,
            opacity: 0.0,
            depthWrite: false
        });

        this.celestialDomeMesh = new THREE.Mesh(domeGeo, this.domeMaterial);
        this.celestialDomeMesh.position.set(0, 0, -0.6);
        this.group.add(this.celestialDomeMesh);
    }

    // --- 2. 3D CELESTIAL TWINKLING STARFIELD ---
    private build3DStarfield() {
        const starCount = 380;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        this.starPhases = new Float32Array(starCount);
        this.starSpeeds = new Float32Array(starCount);

        const colWhite = new THREE.Color(0xfbfdff);
        const colGold = new THREE.Color(0xffe699);
        const colCyan = new THREE.Color(0xaae0ff);

        for (let i = 0; i < starCount; i++) {
            const radius = 19 + Math.random() * 8;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * (Math.PI * 0.46);

            positions[i * 3 + 0] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = Math.max(1.8, radius * Math.cos(phi));
            positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta) - 0.6;

            const rChoice = Math.random();
            const col = rChoice > 0.6 ? colGold : (rChoice > 0.3 ? colWhite : colCyan);
            colors[i * 3 + 0] = col.r;
            colors[i * 3 + 1] = col.g;
            colors[i * 3 + 2] = col.b;

            this.starPhases[i] = Math.random() * Math.PI * 2;
            this.starSpeeds[i] = 1.0 + Math.random() * 2.5;
        }

        const starGeo = new THREE.BufferGeometry();
        starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const starMat = new THREE.PointsMaterial({
            size: 0.18,
            vertexColors: true,
            transparent: true,
            opacity: 0.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.starfieldPoints = new THREE.Points(starGeo, starMat);
        this.group.add(this.starfieldPoints);
    }

    // --- 3. MONUMENTAL MAGICAL RING (COLOSSAL CELESTIAL ARMILLARY) ---
    private buildMonumentalMagicalRing() {
        this.monumentalRingGroup = new THREE.Group();
        this.monumentalRingGroup.name = 'MonumentalMagicalRing';
        // Positioned majestically in the distant horizon
        this.monumentalRingGroup.position.set(0, 4.0, -7.2);

        // Burnished celestial gold with subtle emissive shimmer
        const goldRingMat = new THREE.MeshStandardMaterial({
            color: 0xd4af37,
            emissive: 0x4a3208,
            roughness: 0.28,
            metalness: 0.88,
            transparent: true,
            opacity: 0.0
        });
        this.monumentalRingMaterials.push(goldRingMat);

        const astralMat = new THREE.MeshStandardMaterial({
            color: 0x1c2b4a,
            emissive: 0x0f1c36,
            roughness: 0.35,
            metalness: 0.75,
            transparent: true,
            opacity: 0.0
        });
        this.monumentalRingMaterials.push(astralMat);

        // Main Colossal Outer Ring (Radius: 4.2m)
        const outerTorusGeo = new THREE.TorusGeometry(4.2, 0.11, 16, 64);
        this.monumentalRingMesh = new THREE.Mesh(outerTorusGeo, goldRingMat);
        this.monumentalRingGroup.add(this.monumentalRingMesh);

        // Concentric Inner Astrolabe Ring (Radius: 3.5m)
        const innerTorusGeo = new THREE.TorusGeometry(3.5, 0.06, 12, 48);
        this.monumentalInnerRingMesh = new THREE.Mesh(innerTorusGeo, astralMat);
        this.monumentalRingGroup.add(this.monumentalInnerRingMesh);

        // 12 Radiating Astral Armillary Spokes
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const spokeGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.7, 8);
            const spokeMesh = new THREE.Mesh(spokeGeo, goldRingMat);
            spokeMesh.position.set(
                Math.cos(angle) * 3.85,
                Math.sin(angle) * 3.85,
                0
            );
            spokeMesh.rotation.z = angle + Math.PI / 2;
            this.monumentalRingGroup.add(spokeMesh);
        }

        // 8 Astrological Glyph Nodes around outer perimeter
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const nodeGeo = new THREE.SphereGeometry(0.09, 12, 12);
            const nodeMesh = new THREE.Mesh(nodeGeo, goldRingMat);
            nodeMesh.position.set(
                Math.cos(angle) * 4.2,
                Math.sin(angle) * 4.2,
                0
            );
            this.monumentalRingGroup.add(nodeMesh);
        }

        this.group.add(this.monumentalRingGroup);
    }

    // --- 4. STRIKING DISTANT FOCAL POINT (CELESTIAL ASTRAL BEACON) ---
    private buildDistantFocalPoint() {
        this.focalBeaconGroup = new THREE.Group();
        this.focalBeaconGroup.name = 'CelestialAstralBeacon';
        // Placed dead center inside the monumental ring in the deep horizon
        this.focalBeaconGroup.position.set(0, 4.0, -7.5);

        // Radiant star canvas texture
        const starCanvas = document.createElement('canvas');
        starCanvas.width = 256;
        starCanvas.height = 256;
        const sCtx = starCanvas.getContext('2d')!;

        const sGrad = sCtx.createRadialGradient(128, 128, 4, 128, 128, 128);
        sGrad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');     // Brilliant core
        sGrad.addColorStop(0.2, 'rgba(255, 240, 180, 0.95)');    // Champagne gold
        sGrad.addColorStop(0.5, 'rgba(120, 200, 255, 0.45)');    // Ethereal celestial cyan
        sGrad.addColorStop(0.8, 'rgba(70, 110, 220, 0.15)');     // Indigo corona
        sGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
        sCtx.fillStyle = sGrad;
        sCtx.fillRect(0, 0, 256, 256);

        const starTex = new THREE.CanvasTexture(starCanvas);

        // Inner radiant star billboard
        const spriteMat = new THREE.SpriteMaterial({
            map: starTex,
            color: 0xffffff,
            transparent: true,
            opacity: 0.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        this.beaconSprite = new THREE.Sprite(spriteMat);
        this.beaconSprite.scale.set(1.4, 1.4, 1.4);
        this.focalBeaconGroup.add(this.beaconSprite);

        // Outer soft glowing aura
        const outerSpriteMat = new THREE.SpriteMaterial({
            map: starTex,
            color: 0xa8d4ff,
            transparent: true,
            opacity: 0.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        this.beaconOuterSprite = new THREE.Sprite(outerSpriteMat);
        this.beaconOuterSprite.scale.set(3.2, 3.2, 3.2);
        this.focalBeaconGroup.add(this.beaconOuterSprite);

        this.group.add(this.focalBeaconGroup);
    }

    // --- 5. LARGE FLOATING STRUCTURES (MONOLITHS & OBELISKS) ---
    private buildFloatingStructures() {
        this.floatingStructuresGroup = new THREE.Group();
        this.floatingStructuresGroup.name = 'FloatingStructures';

        const basaltMat = new THREE.MeshStandardMaterial({
            color: 0x151b26,
            roughness: 0.45,
            metalness: 0.35,
            transparent: true,
            opacity: 0.0
        });
        this.structureMaterials.push(basaltMat);

        const runicGoldMat = new THREE.MeshStandardMaterial({
            color: 0xd4af37,
            emissive: 0x4a3508,
            roughness: 0.22,
            metalness: 0.90,
            transparent: true,
            opacity: 0.0
        });
        this.structureMaterials.push(runicGoldMat);

        // 6 Ancient Floating Monoliths arranged at varied heights and distances
        const monolithConfigs = [
            { x: -5.2, y: 2.8, z: -5.8, h: 3.4, r: 0.45, freq: 0.7, amp: 0.18, rotSpeed: 0.03 },
            { x: 5.4, y: 3.2, z: -5.5, h: 3.8, r: 0.48, freq: 0.8, amp: 0.20, rotSpeed: -0.025 },
            { x: -7.6, y: 1.8, z: -2.8, h: 4.2, r: 0.52, freq: 0.6, amp: 0.15, rotSpeed: 0.02 },
            { x: 7.8, y: 2.2, z: -2.6, h: 4.0, r: 0.50, freq: 0.75, amp: 0.17, rotSpeed: -0.035 },
            { x: -3.8, y: 4.6, z: -8.5, h: 4.8, r: 0.55, freq: 0.5, amp: 0.22, rotSpeed: 0.015 },
            { x: 4.0, y: 4.8, z: -8.2, h: 4.6, r: 0.54, freq: 0.65, amp: 0.19, rotSpeed: -0.02 }
        ];

        monolithConfigs.forEach((cfg, idx) => {
            const structureGrp = new THREE.Group();
            structureGrp.position.set(cfg.x, cfg.y, cfg.z);

            // Hexagonal Tapered Obelisk
            const obeliskGeo = new THREE.CylinderGeometry(cfg.r * 0.65, cfg.r, cfg.h, 6);
            const obeliskMesh = new THREE.Mesh(obeliskGeo, basaltMat);
            structureGrp.add(obeliskMesh);

            // Pointed Pyramidion Cap at top
            const capGeo = new THREE.ConeGeometry(cfg.r * 0.65, 0.65, 6);
            const capMesh = new THREE.Mesh(capGeo, runicGoldMat);
            capMesh.position.y = cfg.h / 2 + 0.325;
            structureGrp.add(capMesh);

            // Glowing Inlaid Gold Rings
            for (const offset of [-cfg.h * 0.28, 0, cfg.h * 0.28]) {
                const ringGeo = new THREE.TorusGeometry(cfg.r * 0.92, 0.022, 6, 18);
                ringGeo.rotateX(Math.PI / 2);
                const ringMesh = new THREE.Mesh(ringGeo, runicGoldMat);
                ringMesh.position.y = offset;
                structureGrp.add(ringMesh);
            }

            this.floatingStructuresGroup.add(structureGrp);

            this.floatingStructures.push({
                group: structureGrp,
                baseY: cfg.y,
                floatFreq: cfg.freq,
                floatAmp: cfg.amp,
                rotSpeed: cfg.rotSpeed,
                phase: (idx / monolithConfigs.length) * Math.PI * 2
            });
        });

        this.group.add(this.floatingStructuresGroup);
    }

    // --- 6. ENCHANTED CHAMBER ARCHITECTURE (8 GOTHIC PILLARS) ---
    private buildChamberArchitecture() {
        this.architectureGroup = new THREE.Group();
        this.architectureGroup.name = 'ChamberArchitecture';

        const stoneMat = new THREE.MeshStandardMaterial({
            color: 0x161d28,
            roughness: 0.52,
            metalness: 0.28,
            transparent: true,
            opacity: 0.0
        });
        this.pillarMaterials.push(stoneMat);

        const goldMat = new THREE.MeshStandardMaterial({
            color: 0xd4af37,
            emissive: 0x3d2806,
            metalness: 0.88,
            roughness: 0.20,
            transparent: true,
            opacity: 0.0
        });
        this.pillarMaterials.push(goldMat);

        const pillarRadius = 7.5;
        const pillarHeight = 7.6;
        const pillarCount = 8;

        for (let i = 0; i < pillarCount; i++) {
            const angle = (i / pillarCount) * Math.PI * 2;
            const px = Math.cos(angle) * pillarRadius;
            const pz = Math.sin(angle) * pillarRadius - 0.6;

            const pillarGroup = new THREE.Group();
            pillarGroup.position.set(px, 0, pz);

            // Pillar Base
            const baseGeo = new THREE.CylinderGeometry(0.48, 0.55, 0.45, 8);
            const baseMesh = new THREE.Mesh(baseGeo, stoneMat);
            baseMesh.position.y = 0.225;
            pillarGroup.add(baseMesh);

            // Fluted Column Shaft
            const shaftGeo = new THREE.CylinderGeometry(0.32, 0.36, pillarHeight, 16);
            const shaftMesh = new THREE.Mesh(shaftGeo, stoneMat);
            shaftMesh.position.y = pillarHeight / 2 + 0.45;
            pillarGroup.add(shaftMesh);

            // Gold Trim Filigree Rings
            for (const ringY of [1.6, 3.6, 5.6]) {
                const ringGeo = new THREE.TorusGeometry(0.35, 0.024, 8, 20);
                ringGeo.rotateX(Math.PI / 2);
                const ringMesh = new THREE.Mesh(ringGeo, goldMat);
                ringMesh.position.y = ringY;
                pillarGroup.add(ringMesh);
            }

            // Ornate Capital at top
            const capGeo = new THREE.CylinderGeometry(0.55, 0.34, 0.6, 8);
            const capMesh = new THREE.Mesh(capGeo, stoneMat);
            capMesh.position.y = pillarHeight + 0.75;
            pillarGroup.add(capMesh);

            // Vaulted Arch Rib reaching toward celestial ceiling
            const curve = new THREE.QuadraticBezierCurve3(
                new THREE.Vector3(0, pillarHeight + 1.0, 0),
                new THREE.Vector3(-px * 0.42, pillarHeight + 2.5, -pz * 0.42),
                new THREE.Vector3(-px * 0.76, pillarHeight + 1.9, -pz * 0.76)
            );
            const ribGeo = new THREE.TubeGeometry(curve, 14, 0.08, 6, false);
            const ribMesh = new THREE.Mesh(ribGeo, stoneMat);
            pillarGroup.add(ribMesh);

            this.architectureGroup.add(pillarGroup);
        }

        this.group.add(this.architectureGroup);
    }

    // --- 7. GLOWING FLOOR RUNES & CONCENTRIC CIRCLES ---
    private buildFloorRunes() {
        this.floorGroup = new THREE.Group();
        this.floorGroup.name = 'MagicalFloorGroup';

        // Polished obsidian dark floor base disc
        const baseFloorGeo = new THREE.CircleGeometry(6.8, 48);
        baseFloorGeo.rotateX(-Math.PI / 2);
        const baseFloorMat = new THREE.MeshStandardMaterial({
            color: 0x060a12,
            roughness: 0.14,
            metalness: 0.45,
            transparent: true,
            opacity: 0.0
        });
        this.floorMaterials.push(baseFloorMat as any);
        const baseFloor = new THREE.Mesh(baseFloorGeo, baseFloorMat);
        baseFloor.position.set(0, 0.002, -0.6);
        this.floorGroup.add(baseFloor);

        const createRuneTexture = (drawFn: (ctx: CanvasRenderingContext2D, size: number) => void) => {
            const size = 1024;
            const c = document.createElement('canvas');
            c.width = size;
            c.height = size;
            const ctx = c.getContext('2d')!;
            drawFn(ctx, size);
            const tex = new THREE.CanvasTexture(c);
            tex.colorSpace = THREE.SRGBColorSpace;
            return tex;
        };

        // Outer Ring: Celestial Astrology & Ancient Glyphs (radius 5.8m)
        const outerTex = createRuneTexture((ctx, s) => {
            const center = s / 2;
            const r = s * 0.44;
            ctx.strokeStyle = '#e6b800';
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.arc(center, center, r, 0, Math.PI * 2);
            ctx.stroke();

            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(center, center, r * 0.94, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = '#ffdf66';
            ctx.font = 'bold 36px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const glyphs = ['✦', '⚡', '☉', '☽', '☿', '♀', '♂', '♃', '♄', '⚝', '✧', '🜂', '🜁', '🜃', '🜄', '⚕'];
            for (let i = 0; i < 16; i++) {
                const angle = (i / 16) * Math.PI * 2;
                const gx = center + Math.cos(angle) * (r * 0.97);
                const gy = center + Math.sin(angle) * (r * 0.97);
                ctx.save();
                ctx.translate(gx, gy);
                ctx.rotate(angle + Math.PI / 2);
                ctx.fillText(glyphs[i], 0, 0);
                ctx.restore();
            }
        });

        const outerGeo = new THREE.PlaneGeometry(11.8, 11.8);
        outerGeo.rotateX(-Math.PI / 2);
        const outerMat = new THREE.MeshBasicMaterial({
            map: outerTex,
            transparent: true,
            opacity: 0.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        this.floorMaterials.push(outerMat);
        this.outerRuneMesh = new THREE.Mesh(outerGeo, outerMat);
        this.outerRuneMesh.position.set(0, 0.003, -0.6);
        this.floorGroup.add(this.outerRuneMesh);

        // Middle Ring: Sacred Geometry Hexagram (radius 3.8m)
        const middleTex = createRuneTexture((ctx, s) => {
            const center = s / 2;
            const r = s * 0.38;
            ctx.strokeStyle = '#c49746';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(center, center, r, 0, Math.PI * 2);
            ctx.stroke();

            for (let t = 0; t < 2; t++) {
                ctx.beginPath();
                for (let i = 0; i < 3; i++) {
                    const angle = (i / 3) * Math.PI * 2 + (t * Math.PI) / 3;
                    const x = center + Math.cos(angle) * r;
                    const y = center + Math.sin(angle) * r;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.stroke();
            }

            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(center + Math.cos(angle) * (r * 0.6), center + Math.sin(angle) * (r * 0.6));
                ctx.lineTo(center + Math.cos(angle) * r, center + Math.sin(angle) * r);
                ctx.stroke();
            }
        });

        const middleGeo = new THREE.PlaneGeometry(8.2, 8.2);
        middleGeo.rotateX(-Math.PI / 2);
        const middleMat = new THREE.MeshBasicMaterial({
            map: middleTex,
            transparent: true,
            opacity: 0.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        this.floorMaterials.push(middleMat);
        this.middleRuneMesh = new THREE.Mesh(middleGeo, middleMat);
        this.middleRuneMesh.position.set(0, 0.004, -0.6);
        this.floorGroup.add(this.middleRuneMesh);

        // Inner Ring: Keepers of Curiosity Sigil & Sunburst (radius 2.0m)
        const innerTex = createRuneTexture((ctx, s) => {
            const center = s / 2;
            const r = s * 0.35;
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.arc(center, center, r, 0, Math.PI * 2);
            ctx.stroke();

            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(center, center, r * 0.7, 0, Math.PI * 2);
            ctx.stroke();

            for (let i = 0; i < 24; i++) {
                const angle = (i / 24) * Math.PI * 2;
                const r1 = i % 2 === 0 ? r * 0.72 : r * 0.82;
                ctx.beginPath();
                ctx.moveTo(center + Math.cos(angle) * r1, center + Math.sin(angle) * r1);
                ctx.lineTo(center + Math.cos(angle) * (r * 0.98), center + Math.sin(angle) * (r * 0.98));
                ctx.stroke();
            }
        });

        const innerGeo = new THREE.PlaneGeometry(4.4, 4.4);
        innerGeo.rotateX(-Math.PI / 2);
        const innerMat = new THREE.MeshBasicMaterial({
            map: innerTex,
            transparent: true,
            opacity: 0.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        this.floorMaterials.push(innerMat);
        this.innerRuneMesh = new THREE.Mesh(innerGeo, innerMat);
        this.innerRuneMesh.position.set(0, 0.005, -0.6);
        this.floorGroup.add(this.innerRuneMesh);

        this.group.add(this.floorGroup);
    }

    // --- 8. CENTRAL PORTAL RING ---
    private buildCentralPortal() {
        const ringGeo = new THREE.RingGeometry(0.35, 0.48, 36);
        ringGeo.rotateX(-Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xffd700,
            transparent: true,
            opacity: 0.0,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        this.floorMaterials.push(ringMat);
        this.portalRingMesh = new THREE.Mesh(ringGeo, ringMat);
        this.portalRingMesh.position.set(0.12, 0.006, -0.55);
        this.group.add(this.portalRingMesh);
    }

    // --- 9. FLOATING WILL-O'-THE-WISPS ---
    private buildFloatingWisps() {
        this.wispsGroup = new THREE.Group();
        this.wispsGroup.name = 'FloatingWispsGroup';

        const haloCanvas = document.createElement('canvas');
        haloCanvas.width = 128;
        haloCanvas.height = 128;
        const hCtx = haloCanvas.getContext('2d')!;
        const hGrad = hCtx.createRadialGradient(64, 64, 4, 64, 64, 64);
        hGrad.addColorStop(0, 'rgba(255, 230, 140, 1.0)');
        hGrad.addColorStop(0.35, 'rgba(255, 200, 70, 0.45)');
        hGrad.addColorStop(0.7, 'rgba(100, 180, 255, 0.15)');
        hGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        hCtx.fillStyle = hGrad;
        hCtx.fillRect(0, 0, 128, 128);

        const haloTexture = new THREE.CanvasTexture(haloCanvas);

        const wispConfigs = [
            { x: -1.6, y: 1.6, z: -1.2, freqX: 0.8, freqY: 1.2, freqZ: 0.7 },
            { x: 1.8, y: 1.9, z: -1.1, freqX: 0.9, freqY: 1.1, freqZ: 0.8 },
            { x: -2.4, y: 2.3, z: 0.4, freqX: 0.7, freqY: 1.3, freqZ: 0.9 },
            { x: 2.2, y: 2.1, z: 0.5, freqX: 1.1, freqY: 0.8, freqZ: 1.0 },
            { x: -0.9, y: 2.6, z: -2.0, freqX: 0.6, freqY: 1.0, freqZ: 0.8 },
            { x: 1.1, y: 2.5, z: -1.9, freqX: 1.0, freqY: 0.9, freqZ: 0.6 },
            { x: -2.8, y: 1.4, z: -0.8, freqX: 0.8, freqY: 1.4, freqZ: 0.7 },
            { x: 2.7, y: 1.5, z: -0.7, freqX: 0.7, freqY: 1.1, freqZ: 1.1 }
        ];

        for (let i = 0; i < wispConfigs.length; i++) {
            const cfg = wispConfigs[i];

            const coreGeo = new THREE.SphereGeometry(0.022, 12, 12);
            const coreMat = new THREE.MeshBasicMaterial({
                color: 0xfffae6,
                transparent: true,
                opacity: 0.0
            });
            const coreMesh = new THREE.Mesh(coreGeo, coreMat);
            coreMesh.position.set(cfg.x, cfg.y, cfg.z);

            const spriteMat = new THREE.SpriteMaterial({
                map: haloTexture,
                color: 0xffffff,
                transparent: true,
                opacity: 0.0,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            const sprite = new THREE.Sprite(spriteMat);
            sprite.scale.set(0.35, 0.35, 0.35);
            coreMesh.add(sprite);

            this.wispsGroup.add(coreMesh);

            this.wispData.push({
                mesh: coreMesh,
                sprite,
                baseX: cfg.x,
                baseY: cfg.y,
                baseZ: cfg.z,
                freqX: cfg.freqX,
                freqY: cfg.freqY,
                freqZ: cfg.freqZ,
                phase: (i / wispConfigs.length) * Math.PI * 2
            });
        }

        this.group.add(this.wispsGroup);
    }

    // --- 10. AMBIENT FLOATING GOLDEN STARDUST ---
    private buildAmbientStardust() {
        const count = this.DUST_COUNT;
        this.dustPositions = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            this.dustPositions[i * 3 + 0] = (Math.random() - 0.5) * 5.5;
            this.dustPositions[i * 3 + 1] = 0.6 + Math.random() * 2.4;
            this.dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 4.8 - 0.6;
        }

        const dustGeo = new THREE.BufferGeometry();
        dustGeo.setAttribute('position', new THREE.BufferAttribute(this.dustPositions, 3));

        const dustMat = new THREE.PointsMaterial({
            color: 0xffdf70,
            size: 0.018,
            transparent: true,
            opacity: 0.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.ambientDustPoints = new THREE.Points(dustGeo, dustMat);
        this.group.add(this.ambientDustPoints);
    }

    // --- 11. MYSTICAL DIMENSION LIGHTING RIG ---
    private buildLightingRig() {
        this.magicalAmbientLight = new THREE.AmbientLight(0x101a38, 0.0);
        this.group.add(this.magicalAmbientLight);

        this.magicalCenterLight = new THREE.PointLight(0xffdf80, 0.0, 8.5, 1.2);
        this.magicalCenterLight.position.set(0.12, 2.3, -0.55);
        this.group.add(this.magicalCenterLight);

        this.magicalRimLight = new THREE.DirectionalLight(0x4477ee, 0.0);
        this.magicalRimLight.position.set(0, 7.5, 2.0);
        this.magicalRimLight.target.position.set(0, 1.2, -0.6);
        this.group.add(this.magicalRimLight);
        this.group.add(this.magicalRimLight.target);
    }

    // =========================================================================
    // TRANSITION CONTROLLER: SMOOTH & REVERSIBLE
    // =========================================================================

    public transitionIn(duration = 2.4, onComplete?: () => void) {
        if (this.state === 'ACTIVE' || this.state === 'TRANSITIONING_IN') return;

        this.state = 'TRANSITIONING_IN';
        this.transitionProgress = 0.0;
        this.transitionDuration = Math.max(0.5, duration);
        this.onTransitionComplete = onComplete || null;
        this.group.visible = true;

        // Play soft original magical transition sound (Part 5)
        if (this.audio) {
            this.audio.playMagicalTransitionSound();
        }

        // Trigger Effect B: Monumental 3D golden particle spiral expanding outward
        if (this.particles) {
            this.particles.triggerTransformationSpiral(new THREE.Vector3(0.12, 1.35, -0.55));
        }

        // Preserve lab settings
        if (this.scene.background instanceof THREE.Color) {
            this.originalBgColor = this.scene.background.clone();
        } else {
            this.originalBgColor = new THREE.Color(0xf2f5f8);
        }

        if (this.scene.fog) {
            this.originalFog = this.scene.fog.clone();
        }
    }

    public transitionOut(duration = 2.2, onComplete?: () => void) {
        if (this.state === 'INACTIVE' || this.state === 'TRANSITIONING_OUT') return;

        this.state = 'TRANSITIONING_OUT';
        this.transitionProgress = 1.0;
        this.transitionDuration = Math.max(0.5, duration);
        this.onTransitionComplete = onComplete || null;

        if (this.roomGroup) {
            this.roomGroup.visible = true;
        }
    }

    public isActive(): boolean {
        return this.state !== 'INACTIVE';
    }

    public update(delta: number) {
        if (this.state === 'INACTIVE') return;

        this.elapsedTime += delta;

        if (this.state === 'TRANSITIONING_IN') {
            this.transitionProgress += delta / this.transitionDuration;
            if (this.transitionProgress >= 1.0) {
                this.transitionProgress = 1.0;
                this.state = 'ACTIVE';
                // Conceal lab walls and ceiling for pure fantasy immersion
                if (this.roomGroup) {
                    this.roomGroup.visible = false;
                }
                if (this.onTransitionComplete) {
                    const cb = this.onTransitionComplete;
                    this.onTransitionComplete = null;
                    cb();
                }
            }
            this.applyProgress(this.transitionProgress);
        } else if (this.state === 'TRANSITIONING_OUT') {
            this.transitionProgress -= delta / this.transitionDuration;
            if (this.transitionProgress <= 0.0) {
                this.transitionProgress = 0.0;
                this.state = 'INACTIVE';
                this.group.visible = false;
                this.restoreOriginalLab();
                if (this.onTransitionComplete) {
                    const cb = this.onTransitionComplete;
                    this.onTransitionComplete = null;
                    cb();
                }
            } else {
                this.applyProgress(this.transitionProgress);
            }
        }

        this.animateEnvironment(delta);
    }

    private applyProgress(progress: number) {
        const p = THREE.MathUtils.clamp(progress, 0.0, 1.0);
        const ease = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;

        if (this.labLighting) {
            this.labLighting.setDimFactor(1.0 - ease * 0.94);
        }

        if (this.originalBgColor && this.scene.background instanceof THREE.Color) {
            this.scene.background.lerpColors(this.originalBgColor, this.magicalBgColor, ease);
        }
        if (this.originalFog && this.scene.fog instanceof THREE.Fog && this.originalFog instanceof THREE.Fog) {
            this.scene.fog.color.lerpColors(this.originalFog.color, this.magicalFog.color, ease);
            this.scene.fog.near = THREE.MathUtils.lerp(this.originalFog.near, this.magicalFog.near, ease);
            this.scene.fog.far = THREE.MathUtils.lerp(this.originalFog.far, this.magicalFog.far, ease);
        }

        // Lighting
        this.magicalAmbientLight.intensity = 0.65 * ease;
        this.magicalCenterLight.intensity = 2.2 * ease;
        this.magicalRimLight.intensity = 0.60 * ease;

        // Dome & Starfield
        this.domeMaterial.opacity = ease * 0.96;
        (this.starfieldPoints.material as THREE.PointsMaterial).opacity = ease * 0.92;

        // Monumental Ring & Astral Beacon
        for (const mat of this.monumentalRingMaterials) {
            mat.opacity = ease;
        }
        this.beaconSprite.material.opacity = ease * 0.95;
        this.beaconOuterSprite.material.opacity = ease * 0.85;

        // Floating Monolith Structures
        for (const mat of this.structureMaterials) {
            mat.opacity = ease;
        }

        // Pillars & Architecture
        for (const mat of this.pillarMaterials) {
            mat.opacity = ease;
        }

        // Floor Runes
        for (const mat of this.floorMaterials) {
            mat.opacity = ease;
        }

        // Wisps
        for (const wisp of this.wispData) {
            (wisp.mesh.material as THREE.MeshBasicMaterial).opacity = ease * 0.95;
            wisp.sprite.material.opacity = ease * 0.85;
        }

        // Ambient Stardust
        (this.ambientDustPoints.material as THREE.PointsMaterial).opacity = ease * 0.80;
    }

    private animateEnvironment(delta: number) {
        const t = this.elapsedTime;

        // 1. Monumental Ring Continuous Celestial Rotation
        if (this.monumentalRingGroup) {
            this.monumentalRingMesh.rotation.z += delta * 0.045;
            this.monumentalInnerRingMesh.rotation.z -= delta * 0.035;
        }

        // 2. Astral Beacon Pulsing Glow
        if (this.beaconSprite) {
            const pulse = 1.35 + Math.sin(t * 1.8) * 0.15;
            this.beaconSprite.scale.set(pulse, pulse, pulse);
            const outerPulse = 3.0 + Math.sin(t * 1.4 + 1.0) * 0.35;
            this.beaconOuterSprite.scale.set(outerPulse, outerPulse, outerPulse);
        }

        // 3. Floating Monoliths Harmonic Vertical Drift & Gentle Rotation
        for (const str of this.floatingStructures) {
            str.group.position.y = str.baseY + Math.sin(t * str.floatFreq + str.phase) * str.floatAmp;
            str.group.rotation.y += delta * str.rotSpeed;
        }

        // 4. Concentric Floor Rune Counter-Rotations & Golden Breathing Pulse
        if (this.outerRuneMesh) {
            this.outerRuneMesh.rotation.z += delta * 0.032;
        }
        if (this.middleRuneMesh) {
            this.middleRuneMesh.rotation.z -= delta * 0.024;
        }
        if (this.innerRuneMesh) {
            this.innerRuneMesh.rotation.z += delta * 0.042;
            const pulse = 0.75 + Math.sin(t * 2.0) * 0.25;
            (this.innerRuneMesh.material as THREE.MeshBasicMaterial).opacity = this.transitionProgress * pulse;
        }

        // 5. Twinkling 3D Starfield
        if (this.starfieldPoints) {
            const geo = this.starfieldPoints.geometry;
            const colors = geo.attributes.color.array as Float32Array;
            for (let i = 0; i < this.starPhases.length; i++) {
                const twinkle = 0.55 + Math.sin(t * this.starSpeeds[i] + this.starPhases[i]) * 0.45;
                colors[i * 3 + 0] = Math.min(1.0, colors[i * 3 + 0] * (0.8 + twinkle * 0.2));
            }
            geo.attributes.color.needsUpdate = true;
        }

        // 6. Floating Will-o'-the-Wisps Natural Harmonic Drift
        for (const wisp of this.wispData) {
            const dx = Math.sin(t * wisp.freqX + wisp.phase) * 0.35;
            const dy = Math.cos(t * wisp.freqY + wisp.phase) * 0.18;
            const dz = Math.sin(t * wisp.freqZ + wisp.phase * 1.5) * 0.30;

            wisp.mesh.position.set(
                wisp.baseX + dx,
                wisp.baseY + dy,
                wisp.baseZ + dz
            );

            const haloScale = 0.32 + Math.sin(t * 3.0 + wisp.phase) * 0.06;
            wisp.sprite.scale.set(haloScale, haloScale, haloScale);
        }

        // 7. Ambient Stardust Drift
        if (this.ambientDustPoints) {
            const dPos = this.dustPositions;
            for (let i = 0; i < this.DUST_COUNT; i++) {
                dPos[i * 3 + 1] += delta * 0.04;
                dPos[i * 3 + 0] += Math.sin(t * 0.5 + i) * delta * 0.02;
                if (dPos[i * 3 + 1] > 2.8) {
                    dPos[i * 3 + 1] = 0.5;
                }
            }
            this.ambientDustPoints.geometry.attributes.position.needsUpdate = true;
        }
    }

    public restoreOriginalLab() {
        if (this.labLighting) {
            this.labLighting.restore();
        }

        if (this.roomGroup) {
            this.roomGroup.visible = true;
        }

        if (this.originalBgColor && this.scene.background instanceof THREE.Color) {
            this.scene.background.copy(this.originalBgColor);
        }

        if (this.originalFog) {
            this.scene.fog = this.originalFog.clone();
        }

        this.group.visible = false;
        this.state = 'INACTIVE';
    }

    public dispose() {
        this.restoreOriginalLab();
        this.scene.remove(this.group);
        this.celestialDomeMesh.geometry.dispose();
        this.domeMaterial.dispose();
        this.starfieldPoints.geometry.dispose();
        (this.starfieldPoints.material as THREE.Material).dispose();

        for (const mat of this.monumentalRingMaterials) mat.dispose();
        for (const mat of this.structureMaterials) mat.dispose();
        for (const mat of this.pillarMaterials) mat.dispose();
        for (const mat of this.floorMaterials) mat.dispose();

        this.portalRingMesh.geometry.dispose();
        this.ambientDustPoints.geometry.dispose();
        (this.ambientDustPoints.material as THREE.Material).dispose();
    }
}
