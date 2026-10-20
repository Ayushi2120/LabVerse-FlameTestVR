import * as THREE from 'three';
import { World } from '@iwsdk/core';
import { AudioEngine } from '../audio/AudioEngine';

// ============================================================
//  LABVERSE PALM MENU — High-Fidelity Photorealistic 3D Assets
//  • Precision Scientific Vernier Spectrometer Cylinder
//  • Anatomically Proportioned Articulated 3D Hand
//  • Master Leather-Bound Compendium with Real Pages & Illustrations
//  • Borosilicate Optical Glass Orb with Holographic Quantum Core
// ============================================================

export type MenuItemTag = 'steps' | 'guide' | 'theory' | 'video';

export interface MenuItem {
    tag: MenuItemTag;
    group: THREE.Group;
    label: THREE.Sprite;
}

// ─────────────────────────────────────────────────────────────
//  SHARED PBR MATERIALS FACTORY
// ─────────────────────────────────────────────────────────────

class AssetMaterials {
    // Metals
    static brushedSteel = new THREE.MeshStandardMaterial({
        color: 0xd8e1e8,
        metalness: 0.95,
        roughness: 0.18,
    });

    static darkTitanium = new THREE.MeshStandardMaterial({
        color: 0x1b2432,
        metalness: 0.92,
        roughness: 0.22,
    });

    static polishedBrass = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        metalness: 0.88,
        roughness: 0.22,
    });

    static knurledBrass = new THREE.MeshStandardMaterial({
        color: 0xb8860b,
        metalness: 0.85,
        roughness: 0.38,
    });

    static darkAnodized = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.7,
        roughness: 0.3,
    });

    // Optical Gemstones & Glass
    static opticalRuby = new THREE.MeshPhysicalMaterial({
        color: 0xd90429,
        metalness: 0.1,
        roughness: 0.05,
        transmission: 0.7,
        ior: 1.76,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        transparent: true,
        opacity: 0.95,
    });

    static opticalGlass = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.0,
        roughness: 0.02,
        transmission: 0.95,
        ior: 1.54,
        thickness: 0.14,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02,
        specularIntensity: 1.0,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
    });

    static sapphireLens = new THREE.MeshPhysicalMaterial({
        color: 0x00e5ff,
        metalness: 0.05,
        roughness: 0.04,
        transmission: 0.85,
        ior: 1.76,
        clearcoat: 1.0,
        transparent: true,
        opacity: 0.9,
    });

    // Organic & Anatomy
    static skinMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xf5caa6,
        roughness: 0.45,
        metalness: 0.02,
        clearcoat: 0.1,
        clearcoatRoughness: 0.35,
        sheen: 0.45,
        sheenColor: new THREE.Color(0xffa894),
    });

    static fingernail = new THREE.MeshStandardMaterial({
        color: 0xffdfd0,
        roughness: 0.2,
        metalness: 0.05,
    });

    // Leather & Bookcraft
    static moroccoLeather = new THREE.MeshStandardMaterial({
        color: 0x142850,
        roughness: 0.34,
        metalness: 0.12,
    });

    static goldLeaf = new THREE.MeshStandardMaterial({
        color: 0xfcd34d,
        metalness: 0.92,
        roughness: 0.18,
    });

    static bookSpineRib = new THREE.MeshStandardMaterial({
        color: 0x0f2042,
        roughness: 0.3,
        metalness: 0.15,
    });

    static gildedPageEdge = new THREE.MeshStandardMaterial({
        color: 0xca8a04,
        metalness: 0.85,
        roughness: 0.3,
    });

    static silkRibbon = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        roughness: 0.5,
        metalness: 0.1,
        side: THREE.DoubleSide,
    });
}

// ─────────────────────────────────────────────────────────────
//  CANVAS HELPERS
// ─────────────────────────────────────────────────────────────

function makeCanvas(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const c = cv.getContext('2d')!;
    draw(c);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

function labelSprite(text: string, color: string): THREE.Sprite {
    const tex = makeCanvas(256, 56, (c) => {
        c.fillStyle = 'rgba(10, 16, 32, 0.92)';
        c.beginPath();
        c.roundRect(0, 0, 256, 56, 12);
        c.fill();
        c.strokeStyle = color;
        c.lineWidth = 3;
        c.beginPath();
        c.roundRect(2, 2, 252, 52, 10);
        c.stroke();
        c.fillStyle = color;
        c.font = 'bold 22px system-ui, sans-serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(text, 128, 28);
    });
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    spr.scale.set(0.10, 0.022, 1);
    return spr;
}

function createCloseBtn(): THREE.Mesh {
    const g = new THREE.CircleGeometry(0.022, 24);
    const m = new THREE.MeshStandardMaterial({ color: 0xff2244, emissive: 0x660011, roughness: 0.3, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(g, m);
    mesh.name = 'PalmMenuCloseBtn';
    mesh.userData.isPalmClose = true;

    // X marks
    const xg = new THREE.PlaneGeometry(0.030, 0.005);
    const xm = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const x1 = new THREE.Mesh(xg, xm); x1.rotation.z = Math.PI / 4; x1.position.z = 0.001;
    const x2 = new THREE.Mesh(xg, xm); x2.rotation.z = -Math.PI / 4; x2.position.z = 0.001;
    mesh.add(x1, x2);
    return mesh;
}

// ─────────────────────────────────────────────────────────────
//  COMPACT 3D ICONS (PALM ANCHORS)
// ─────────────────────────────────────────────────────────────

function buildCylinderIcon(): THREE.Group {
    const g = new THREE.Group();

    // Base mounting flange with chamfer
    const baseFlange = new THREE.Mesh(
        new THREE.CylinderGeometry(0.019, 0.021, 0.005, 32),
        AssetMaterials.polishedBrass
    );
    baseFlange.position.y = -0.022;
    g.add(baseFlange);

    // Main machined dark titanium column
    const cyl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0175, 0.0175, 0.040, 32),
        AssetMaterials.darkTitanium
    );
    g.add(cyl);

    // Milled vertical fluting details
    const fluteGeo = new THREE.BoxGeometry(0.0012, 0.038, 0.0015);
    for (let f = 0; f < 8; f++) {
        const flute = new THREE.Mesh(fluteGeo, AssetMaterials.brushedSteel);
        const ang = (f / 8) * Math.PI * 2;
        flute.position.set(Math.cos(ang) * 0.0178, 0, Math.sin(ang) * 0.0178);
        flute.rotation.y = -ang;
        g.add(flute);
    }

    // Knurled central adjustment band
    const knurlCollar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.019, 0.019, 0.006, 32),
        AssetMaterials.knurledBrass
    );
    g.add(knurlCollar);

    // 4 Indexed Neon Spectrometer Rings with micro-bezels
    const bandColors = [0x00e5ff, 0xffaa00, 0x00ff88, 0xaa55ff];
    for (let i = 0; i < 4; i++) {
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.0182, 0.0022, 12, 32),
            new THREE.MeshStandardMaterial({
                color: bandColors[i],
                emissive: bandColors[i],
                emissiveIntensity: 0.6,
                roughness: 0.2
            })
        );
        ring.position.y = -0.014 + i * 0.0095;
        ring.rotation.x = Math.PI / 2;
        g.add(ring);
    }

    // Top chamfered brass bezel
    const topBezel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.0185, 0.006, 32),
        AssetMaterials.polishedBrass
    );
    topBezel.position.y = 0.022;
    g.add(topBezel);

    // Optical synthetic ruby crystal in center top
    const rubyJewel = new THREE.Mesh(
        new THREE.SphereGeometry(0.006, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
        AssetMaterials.opticalRuby
    );
    rubyJewel.position.y = 0.024;
    g.add(rubyJewel);

    return g;
}

function buildHandIcon(): THREE.Group {
    const g = new THREE.Group();

    // Anatomical palm plate with natural transverse arch
    const palmGeo = new THREE.BoxGeometry(0.026, 0.030, 0.009);
    const palm = new THREE.Mesh(palmGeo, AssetMaterials.skinMaterial);
    g.add(palm);

    // Thenar muscle (fleshy thumb mound)
    const thenar = new THREE.Mesh(
        new THREE.SphereGeometry(0.007, 16, 12),
        AssetMaterials.skinMaterial
    );
    thenar.scale.set(1.1, 1.4, 0.8);
    thenar.position.set(0.011, -0.005, 0.003);
    g.add(thenar);

    // Staggered anatomical fingers with proximal & distal phalanges
    const fingerSpecs = [
        { name: 'Index',  x: -0.009, h: 0.019, r: 0.0028, tilt: -0.06 },
        { name: 'Middle', x: -0.003, h: 0.022, r: 0.0030, tilt: 0.00 },
        { name: 'Ring',   x:  0.003, h: 0.020, r: 0.0028, tilt: 0.04 },
        { name: 'Pinky',  x:  0.009, h: 0.016, r: 0.0025, tilt: 0.10 }
    ];

    fingerSpecs.forEach(f => {
        const fingerGroup = new THREE.Group();
        fingerGroup.position.set(f.x, 0.015, 0);
        fingerGroup.rotation.z = f.tilt;

        // Proximal segment
        const prox = new THREE.Mesh(
            new THREE.CylinderGeometry(f.r, f.r * 1.05, f.h * 0.55, 12),
            AssetMaterials.skinMaterial
        );
        prox.position.y = f.h * 0.275;
        fingerGroup.add(prox);

        // Knuckle
        const knuckle = new THREE.Mesh(
            new THREE.SphereGeometry(f.r * 1.05, 10, 8),
            AssetMaterials.skinMaterial
        );
        knuckle.position.y = f.h * 0.55;
        fingerGroup.add(knuckle);

        // Distal segment with rounded fingertip
        const dist = new THREE.Mesh(
            new THREE.CylinderGeometry(f.r * 0.85, f.r * 1.0, f.h * 0.45, 12),
            AssetMaterials.skinMaterial
        );
        dist.position.y = f.h * 0.775;
        fingerGroup.add(dist);

        const tip = new THREE.Mesh(
            new THREE.SphereGeometry(f.r * 0.85, 10, 8),
            AssetMaterials.skinMaterial
        );
        tip.position.y = f.h;
        fingerGroup.add(tip);

        // Subtle fingernail plate
        const nail = new THREE.Mesh(
            new THREE.PlaneGeometry(f.r * 1.2, f.r * 1.4),
            AssetMaterials.fingernail
        );
        nail.position.set(0, f.h * 0.92, f.r * 0.86);
        fingerGroup.add(nail);

        g.add(fingerGroup);
    });

    // Articulated opposable thumb
    const thumbGroup = new THREE.Group();
    thumbGroup.position.set(0.013, -0.003, 0.002);
    thumbGroup.rotation.z = -Math.PI / 4.2;
    thumbGroup.rotation.y = Math.PI / 6.0;

    const thumbProx = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0032, 0.0036, 0.011, 12),
        AssetMaterials.skinMaterial
    );
    thumbProx.position.y = 0.0055;
    thumbGroup.add(thumbProx);

    const thumbDist = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0028, 0.0032, 0.009, 12),
        AssetMaterials.skinMaterial
    );
    thumbDist.position.y = 0.0145;
    thumbGroup.add(thumbDist);

    const thumbTip = new THREE.Mesh(
        new THREE.SphereGeometry(0.0028, 10, 8),
        AssetMaterials.skinMaterial
    );
    thumbTip.position.y = 0.019;
    thumbGroup.add(thumbTip);

    g.add(thumbGroup);

    return g;
}

function buildBookIcon(): THREE.Group {
    const g = new THREE.Group();

    // Curved leather spine with 4 raised binding ribs
    const spineGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.038, 16, 1, false, Math.PI * 0.5, Math.PI);
    const spine = new THREE.Mesh(spineGeo, AssetMaterials.moroccoLeather);
    spine.position.set(-0.016, 0, 0);
    g.add(spine);

    for (let r = 0; r < 4; r++) {
        const rib = new THREE.Mesh(
            new THREE.TorusGeometry(0.0065, 0.0009, 8, 16, Math.PI),
            AssetMaterials.goldLeaf
        );
        rib.rotation.y = Math.PI / 2;
        rib.position.set(-0.016, -0.012 + r * 0.008, 0);
        g.add(rib);
    }

    // Heavy hardboard covers with realistic bevel thickness
    const coverGeo = new THREE.BoxGeometry(0.019, 0.039, 0.0025);
    const lCover = new THREE.Mesh(coverGeo, AssetMaterials.moroccoLeather);
    lCover.position.set(-0.024, 0, 0);
    lCover.rotation.y = Math.PI / 11;
    g.add(lCover);

    const rCover = new THREE.Mesh(coverGeo, AssetMaterials.moroccoLeather);
    rCover.position.set(-0.006, 0, 0);
    rCover.rotation.y = -Math.PI / 11;
    g.add(rCover);

    // Embossed gold corner brackets
    const cornerGeo = new THREE.BoxGeometry(0.004, 0.004, 0.003);
    const c1 = new THREE.Mesh(cornerGeo, AssetMaterials.goldLeaf); c1.position.set(-0.001, 0.017, 0.002); rCover.add(c1);
    const c2 = new THREE.Mesh(cornerGeo, AssetMaterials.goldLeaf); c2.position.set(-0.001, -0.017, 0.002); rCover.add(c2);

    // Gilded page block textblock with realistic depth
    const pageBlockGeo = new THREE.BoxGeometry(0.016, 0.036, 0.008);
    const pageBlock = new THREE.Mesh(pageBlockGeo, AssetMaterials.gildedPageEdge);
    pageBlock.position.set(-0.015, 0, 0);
    g.add(pageBlock);

    // Silk bookmark ribbon
    const ribbon = new THREE.Mesh(
        new THREE.BoxGeometry(0.0015, 0.046, 0.0004),
        AssetMaterials.silkRibbon
    );
    ribbon.position.set(-0.014, -0.008, 0.005);
    ribbon.rotation.z = -0.08;
    g.add(ribbon);

    return g;
}

function buildSphereIcon(): THREE.Group {
    const g = new THREE.Group();

    // Borosilicate optical glass orb with genuine physical transmission
    const glassSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.022, 32, 24),
        AssetMaterials.opticalGlass
    );
    g.add(glassSphere);

    // Gimbal outer ring (aerospace titanium with degree markings)
    const gimbalOuter = new THREE.Mesh(
        new THREE.TorusGeometry(0.0225, 0.0018, 8, 36),
        AssetMaterials.darkTitanium
    );
    g.add(gimbalOuter);

    // Gimbal inner ring (polished brass with jewel mounts)
    const gimbalInner = new THREE.Mesh(
        new THREE.TorusGeometry(0.020, 0.0014, 8, 32),
        AssetMaterials.polishedBrass
    );
    gimbalInner.rotation.x = Math.PI / 3;
    g.add(gimbalInner);

    // Glowing quantum plasma core node
    const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.009, 20, 16),
        new THREE.MeshStandardMaterial({
            color: 0x00e5ff,
            emissive: 0x0099ff,
            emissiveIntensity: 1.5,
            roughness: 0.1
        })
    );
    g.add(core);

    // Rotating orbital electron ring
    const orbit = new THREE.Mesh(
        new THREE.TorusGeometry(0.013, 0.0008, 6, 24),
        new THREE.MeshBasicMaterial({ color: 0xaa88ff, transparent: true, opacity: 0.85 })
    );
    orbit.rotation.y = Math.PI / 4;
    g.add(orbit);

    return g;
}

// ─────────────────────────────────────────────────────────────
//  EXPANDED CONTENT 1: EXPERIMENT STEPS (PRECISION TURRET)
// ─────────────────────────────────────────────────────────────

export class StepsExpanded {
    public group: THREE.Group;
    private turretAssembly: THREE.Group;
    private vernierKnob: THREE.Mesh;
    private stepSections: THREE.Mesh[] = [];
    private stepLabel: THREE.Sprite;
    private selectedStep = 0;
    private lastPokeTime = 0;
    private closeMesh: THREE.Mesh;
    private audio: AudioEngine;
    private nextBtn: THREE.Mesh;
    private backBtn: THREE.Mesh;

    public isGrabbed = false;
    private grabOffset = new THREE.Vector3();

    private steps = [
        { title: 'Step 1: Grab Platinum Wire', desc: 'Approach the wire stand.\nClose fist or pinch (thumb + index)\nwithin 18 cm of the handle.' },
        { title: 'Step 2: Dip in Chemical Salt', desc: 'Lower wire loop tip into any of\nthe 5 dishes. Wire tip turns white\nwhen salt is successfully loaded.' },
        { title: 'Step 3: Ignite Bunsen Burner', desc: 'Poke the POWER switch on the\nburner base with right index finger\nor press the L key on desktop.' },
        { title: 'Step 4: Observe Emission Flame', desc: 'Hold salt-loaded wire inside\nthe blue flame cone. Observe the\nelement-specific emission color.' },
        { title: 'Step 5: Release Wire Safely', desc: 'Poke the floating RELEASE WIRE\nbutton above the handle to detach\nit onto the workbench.' },
    ];

    constructor(scene: THREE.Scene, audio: AudioEngine) {
        this.audio = audio;
        this.group = new THREE.Group();
        this.group.name = 'StepsExpandedGroup';
        this.group.visible = false;

        this.turretAssembly = new THREE.Group();
        this.turretAssembly.position.set(-0.06, 0, 0);
        this.group.add(this.turretAssembly);

        // Cast-iron / titanium base pedestal with 6 hex socket cap screws
        const baseFlange = new THREE.Mesh(
            new THREE.CylinderGeometry(0.105, 0.115, 0.022, 48),
            AssetMaterials.darkTitanium
        );
        baseFlange.position.y = -0.12;
        this.turretAssembly.add(baseFlange);

        // 6 perimeter stainless hex bolts
        for (let b = 0; b < 6; b++) {
            const bolt = new THREE.Mesh(
                new THREE.CylinderGeometry(0.005, 0.005, 0.005, 6),
                AssetMaterials.brushedSteel
            );
            const a = (b / 6) * Math.PI * 2;
            bolt.position.set(Math.cos(a) * 0.098, -0.108, Math.sin(a) * 0.098);
            this.turretAssembly.add(bolt);
        }

        // Lower Vernier barrel with etched millimeter graduation marks
        const vernierCanvas = makeCanvas(512, 128, c => {
            c.fillStyle = '#1e2638';
            c.fillRect(0, 0, 512, 128);
            c.strokeStyle = '#00e5ff';
            c.lineWidth = 2;
            for (let x = 0; x <= 512; x += 16) {
                const isMajor = x % 64 === 0;
                c.beginPath();
                c.moveTo(x, 128);
                c.lineTo(x, isMajor ? 64 : 96);
                c.stroke();
                if (isMajor) {
                    c.fillStyle = '#00e5ff';
                    c.font = 'bold 20px monospace';
                    c.fillText(`${x / 16}`, x - 8, 52);
                }
            }
        });
        const vernierMat = new THREE.MeshStandardMaterial({
            map: vernierCanvas,
            metalness: 0.85,
            roughness: 0.25
        });
        const vernierBarrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.092, 0.092, 0.038, 48),
            vernierMat
        );
        vernierBarrel.position.y = -0.09;
        this.turretAssembly.add(vernierBarrel);

        // Central Stepped Rotary Turret (5 Indexing Stages)
        const stageColors = [0x00e5ff, 0xffaa00, 0x00ff88, 0xaa55ff, 0xff3366];
        for (let s = 0; s < 5; s++) {
            const stageGroup = new THREE.Group();
            stageGroup.position.y = -0.06 + s * 0.042;

            // Milled brass collar
            const collar = new THREE.Mesh(
                new THREE.CylinderGeometry(0.090, 0.090, 0.038, 48),
                AssetMaterials.darkTitanium
            );
            stageGroup.add(collar);

            // Step number badge plate
            const badgeCanvas = makeCanvas(128, 64, c => {
                c.fillStyle = '#0f172a';
                c.fillRect(0, 0, 128, 64);
                c.strokeStyle = '#d4af37';
                c.lineWidth = 2;
                c.strokeRect(2, 2, 124, 60);
                c.fillStyle = '#ffffff';
                c.font = 'bold 24px monospace';
                c.textAlign = 'center';
                c.fillText(`STEP 0${s + 1}`, 64, 38);
            });
            const badgeMesh = new THREE.Mesh(
                new THREE.PlaneGeometry(0.042, 0.021),
                new THREE.MeshBasicMaterial({ map: badgeCanvas })
            );
            badgeMesh.position.set(0, 0, 0.091);
            stageGroup.add(badgeMesh);

            // Fiber-optic illuminated ring with depth
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(0.092, 0.0035, 12, 48),
                new THREE.MeshStandardMaterial({
                    color: stageColors[s],
                    emissive: stageColors[s],
                    emissiveIntensity: 0.7,
                    roughness: 0.15
                })
            );
            ring.rotation.x = Math.PI / 2;
            ring.userData.stepIndex = s;
            ring.userData.isStepRing = true;
            this.stepSections.push(ring);
            stageGroup.add(ring);

            this.turretAssembly.add(stageGroup);
        }

        // Top Optical Eyepiece Bezel
        const topBezel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.075, 0.092, 0.022, 48),
            AssetMaterials.polishedBrass
        );
        topBezel.position.y = 0.16;
        this.turretAssembly.add(topBezel);

        // Convex optical sapphire lens on top with illuminated reticle
        const reticleCanvas = makeCanvas(256, 256, c => {
            c.fillStyle = 'rgba(0, 229, 255, 0.1)';
            c.fillRect(0, 0, 256, 256);
            c.strokeStyle = '#00e5ff';
            c.lineWidth = 3;
            c.beginPath();
            c.arc(128, 128, 110, 0, Math.PI * 2);
            c.arc(128, 128, 60, 0, Math.PI * 2);
            c.moveTo(128, 0); c.lineTo(128, 256);
            c.moveTo(0, 128); c.lineTo(256, 128);
            c.stroke();
        });
        const lensMesh = new THREE.Mesh(
            new THREE.CircleGeometry(0.065, 32),
            new THREE.MeshBasicMaterial({ map: reticleCanvas, transparent: true, side: THREE.DoubleSide })
        );
        lensMesh.rotation.x = -Math.PI / 2;
        lensMesh.position.y = 0.172;
        this.turretAssembly.add(lensMesh);

        // Top knurled micrometer thimble adjustment knob
        this.vernierKnob = new THREE.Mesh(
            new THREE.CylinderGeometry(0.045, 0.045, 0.020, 36),
            AssetMaterials.knurledBrass
        );
        this.vernierKnob.position.y = 0.185;
        this.turretAssembly.add(this.vernierKnob);

        // Step Information Display Card
        const labelTex = makeCanvas(512, 280, () => {});
        this.stepLabel = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTex, transparent: true }));
        this.stepLabel.scale.set(0.32, 0.175, 1);
        this.stepLabel.position.set(0.24, 0.02, 0);
        this.group.add(this.stepLabel);

        // Next / Back Scientific Console Buttons
        const btnGeo = new THREE.BoxGeometry(0.075, 0.034, 0.016);
        const btnMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.25 });

        this.nextBtn = new THREE.Mesh(btnGeo, btnMat.clone());
        this.nextBtn.name = 'StepsNextBtn';
        this.nextBtn.userData.isStepsNext = true;
        this.nextBtn.position.set(0.28, -0.10, 0);
        this.group.add(this.nextBtn);

        const nextLabel = new THREE.Sprite(new THREE.SpriteMaterial({
            map: makeCanvas(128, 48, c => {
                c.fillStyle = '#00e5ff';
                c.font = 'bold 24px sans-serif';
                c.textAlign = 'center';
                c.textBaseline = 'middle';
                c.fillText('NEXT ▶', 64, 24);
            }), transparent: true
        }));
        nextLabel.scale.set(0.068, 0.024, 1);
        nextLabel.position.z = 0.01;
        this.nextBtn.add(nextLabel);

        this.backBtn = new THREE.Mesh(btnGeo, btnMat.clone());
        this.backBtn.name = 'StepsBackBtn';
        this.backBtn.userData.isStepsBack = true;
        this.backBtn.position.set(0.19, -0.10, 0);
        this.group.add(this.backBtn);

        const backLabel = new THREE.Sprite(new THREE.SpriteMaterial({
            map: makeCanvas(128, 48, c => {
                c.fillStyle = '#ffffff';
                c.font = 'bold 24px sans-serif';
                c.textAlign = 'center';
                c.textBaseline = 'middle';
                c.fillText('◀ BACK', 64, 24);
            }), transparent: true
        }));
        backLabel.scale.set(0.068, 0.024, 1);
        backLabel.position.z = 0.01;
        this.backBtn.add(backLabel);

        // Title Header Banner
        const titleSprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: makeCanvas(440, 64, c => {
                c.fillStyle = '#00e5ff';
                c.font = 'bold 26px sans-serif';
                c.textAlign = 'center';
                c.textBaseline = 'middle';
                c.fillText('🔬 EXPERIMENT PROCEDURE', 220, 32);
            }), transparent: true
        }));
        titleSprite.scale.set(0.28, 0.042, 1);
        titleSprite.position.set(0.12, 0.17, 0);
        this.group.add(titleSprite);

        // Close button
        this.closeMesh = createCloseBtn();
        this.closeMesh.position.set(0.38, 0.17, 0.01);
        this.group.add(this.closeMesh);

        scene.add(this.group);
        this.renderStepText();
    }

    private renderStepText() {
        const step = this.steps[this.selectedStep];
        const canvas = (this.stepLabel.material.map as THREE.CanvasTexture).image as HTMLCanvasElement;
        const c = canvas.getContext('2d')!;
        c.clearRect(0, 0, 512, 280);

        // High-tech glassmorphic card with glowing border
        c.fillStyle = 'rgba(10, 16, 32, 0.94)';
        c.beginPath();
        c.roundRect(4, 4, 504, 272, 16);
        c.fill();
        c.strokeStyle = '#00e5ff';
        c.lineWidth = 3;
        c.beginPath();
        c.roundRect(4, 4, 504, 272, 16);
        c.stroke();

        // Step number indicator badge
        c.fillStyle = '#00e5ff';
        c.font = 'bold 24px sans-serif';
        c.textAlign = 'left';
        c.fillText(step.title, 24, 42);

        c.fillStyle = '#94a3b8';
        c.font = '16px monospace';
        c.fillText(`STAGE ${this.selectedStep + 1} / 5`, 380, 42);

        // Divider rule
        c.strokeStyle = 'rgba(0, 229, 255, 0.35)';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(24, 58); c.lineTo(488, 58);
        c.stroke();

        // Step explanation text
        c.fillStyle = '#f8fafc';
        c.font = '21px sans-serif';
        const lines = step.desc.split('\n');
        lines.forEach((l, i) => {
            c.fillText(l, 24, 102 + i * 38);
        });

        // Step progress dots
        for (let s = 0; s < 5; s++) {
            c.fillStyle = s === this.selectedStep ? '#00e5ff' : 'rgba(255, 255, 255, 0.2)';
            c.beginPath();
            c.arc(40 + s * 24, 248, 6, 0, Math.PI * 2);
            c.fill();
        }

        (this.stepLabel.material.map as THREE.CanvasTexture).needsUpdate = true;
    }

    public update(delta: number) {
        if (!this.group.visible) return;
        this.turretAssembly.rotation.y += delta * 0.35;
        this.vernierKnob.rotation.y += delta * 0.8;

        // Pulse active step ring
        const activeRing = this.stepSections[this.selectedStep];
        if (activeRing) {
            const mat = activeRing.material as THREE.MeshStandardMaterial;
            mat.emissiveIntensity = 0.8 + Math.sin(Date.now() * 0.006) * 0.4;
        }
    }

    public show(pos: THREE.Vector3, lookAtPos: THREE.Vector3) {
        this.group.position.copy(pos);
        this.group.lookAt(lookAtPos);
        this.group.visible = true;
        this.isGrabbed = false;
        this.renderStepText();
    }

    public hide() {
        this.group.visible = false;
        this.isGrabbed = false;
    }

    public isVisible() {
        return this.group.visible;
    }

    public checkPoke(pokePos: THREE.Vector3): boolean {
        if (!this.group.visible) return false;
        const now = Date.now();
        if (now - this.lastPokeTime < 350) return false;

        const closeWorld = new THREE.Vector3();
        this.closeMesh.getWorldPosition(closeWorld);
        if (pokePos.distanceTo(closeWorld) < 0.08) {
            this.lastPokeTime = now;
            this.audio.playBlip();
            this.hide();
            return true;
        }

        const nextWorld = new THREE.Vector3();
        this.nextBtn.getWorldPosition(nextWorld);
        if (pokePos.distanceTo(nextWorld) < 0.08) {
            this.lastPokeTime = now;
            this.selectedStep = (this.selectedStep + 1) % this.steps.length;
            this.audio.playBlip();
            this.renderStepText();
            return true;
        }

        const backWorld = new THREE.Vector3();
        this.backBtn.getWorldPosition(backWorld);
        if (pokePos.distanceTo(backWorld) < 0.08) {
            this.lastPokeTime = now;
            this.selectedStep = (this.selectedStep - 1 + this.steps.length) % this.steps.length;
            this.audio.playBlip();
            this.renderStepText();
            return true;
        }

        for (const ring of this.stepSections) {
            const rPos = new THREE.Vector3();
            ring.getWorldPosition(rPos);
            if (pokePos.distanceTo(rPos) < 0.08) {
                this.lastPokeTime = now;
                this.selectedStep = ring.userData.stepIndex;
                this.audio.playBlip();
                this.renderStepText();
                return true;
            }
        }

        return false;
    }

    public checkGrab(handPos: THREE.Vector3, isPinchingOrFist: boolean) {
        if (!this.group.visible) return;
        const center = new THREE.Vector3();
        this.group.getWorldPosition(center);

        if (isPinchingOrFist) {
            if (!this.isGrabbed) {
                if (handPos.distanceTo(center) < 0.28) {
                    this.isGrabbed = true;
                    this.grabOffset.copy(this.group.position).sub(handPos);
                    this.audio.playGrab();
                }
            } else {
                this.group.position.copy(handPos).add(this.grabOffset);
            }
        } else {
            this.isGrabbed = false;
        }
    }
}

// ─────────────────────────────────────────────────────────────
//  EXPANDED CONTENT 2: INTERACTION GUIDE (ANATOMICAL 3D HAND)
// ─────────────────────────────────────────────────────────────

interface ArticulatedFinger {
    mcp: THREE.Group;
    pip: THREE.Group;
    dip: THREE.Group;
    targetAngles: { mcp: number; pip: number; dip: number };
}

export class GuideExpanded {
    public group: THREE.Group;
    private handRig: THREE.Group;
    private fingers: ArticulatedFinger[] = [];
    private thumbRig: { cmc: THREE.Group; ip: THREE.Group; targetAngle: number } | null = null;
    private infoLabel: THREE.Sprite;
    private closeMesh: THREE.Mesh;
    private selectedGesture = 0;
    private lastPokeTime = 0;
    private audio: AudioEngine;
    private nextBtn: THREE.Mesh;
    private backBtn: THREE.Mesh;
    private animTime = 0;

    public isGrabbed = false;
    private grabOffset = new THREE.Vector3();

    private gestures = [
        { name: 'GRAB WIRE', desc: 'Approach wire handle (<18cm).\nClose fist or pinch thumb+index\nto pick up and carry the wire.', color: '#00e5ff' },
        { name: 'RELEASE WIRE', desc: 'Poke the floating RELEASE\nWIRE option above the wire\nto safely detach it on desk.', color: '#00ff88' },
        { name: 'DIP IN SALT', desc: 'Lower wire loop tip into any\nchemical dish. Wire turns white\nwhen sample is collected.', color: '#ffaa00' },
        { name: 'POKE SWITCH', desc: 'Extend right index finger\nand physically touch burner\npower switch or 3D buttons.', color: '#aa55ff' },
        { name: 'PALM MENU', desc: 'Raise open LEFT palm facing\nUP to reveal 4 genuine 3D\nlearning interface objects.', color: '#ff6688' },
    ];

    constructor(scene: THREE.Scene, audio: AudioEngine) {
        this.audio = audio;
        this.group = new THREE.Group();
        this.group.name = 'GuideExpandedGroup';
        this.group.visible = false;

        this.handRig = new THREE.Group();
        this.handRig.position.set(-0.10, -0.01, 0);
        this.group.add(this.handRig);

        this.buildAnatomicalHandRig();

        // Text card
        const labelTex = makeCanvas(512, 280, () => {});
        this.infoLabel = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTex, transparent: true }));
        this.infoLabel.scale.set(0.32, 0.175, 1);
        this.infoLabel.position.set(0.20, 0.02, 0);
        this.group.add(this.infoLabel);

        // Next / Back buttons
        const btnGeo = new THREE.BoxGeometry(0.075, 0.034, 0.016);
        const btnMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.25 });

        this.nextBtn = new THREE.Mesh(btnGeo, btnMat.clone());
        this.nextBtn.name = 'GuideNextBtn';
        this.nextBtn.position.set(0.24, -0.10, 0);
        this.group.add(this.nextBtn);

        const nextLabel = new THREE.Sprite(new THREE.SpriteMaterial({
            map: makeCanvas(128, 48, c => {
                c.fillStyle = '#00ff88';
                c.font = 'bold 24px sans-serif';
                c.textAlign = 'center';
                c.textBaseline = 'middle';
                c.fillText('NEXT ▶', 64, 24);
            }), transparent: true
        }));
        nextLabel.scale.set(0.068, 0.024, 1);
        nextLabel.position.z = 0.01;
        this.nextBtn.add(nextLabel);

        this.backBtn = new THREE.Mesh(btnGeo, btnMat.clone());
        this.backBtn.name = 'GuideBackBtn';
        this.backBtn.position.set(0.15, -0.10, 0);
        this.group.add(this.backBtn);

        const backLabel = new THREE.Sprite(new THREE.SpriteMaterial({
            map: makeCanvas(128, 48, c => {
                c.fillStyle = '#ffffff';
                c.font = 'bold 24px sans-serif';
                c.textAlign = 'center';
                c.textBaseline = 'middle';
                c.fillText('◀ BACK', 64, 24);
            }), transparent: true
        }));
        backLabel.scale.set(0.068, 0.024, 1);
        backLabel.position.z = 0.01;
        this.backBtn.add(backLabel);

        // Title Header Banner
        const titleSprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: makeCanvas(440, 64, c => {
                c.fillStyle = '#00ff88';
                c.font = 'bold 26px sans-serif';
                c.textAlign = 'center';
                c.textBaseline = 'middle';
                c.fillText('🖐️ INTERACTION GESTURE GUIDE', 220, 32);
            }), transparent: true
        }));
        titleSprite.scale.set(0.28, 0.042, 1);
        titleSprite.position.set(0.12, 0.17, 0);
        this.group.add(titleSprite);

        // Close button
        this.closeMesh = createCloseBtn();
        this.closeMesh.position.set(0.36, 0.17, 0.01);
        this.group.add(this.closeMesh);

        scene.add(this.group);
        this.renderGestureText();
    }

    private buildAnatomicalHandRig() {
        // Tapered forearm & carpal wrist collar
        const wristCollar = new THREE.Mesh(
            new THREE.CylinderGeometry(0.034, 0.038, 0.035, 24),
            AssetMaterials.skinMaterial
        );
        wristCollar.position.y = -0.065;
        this.handRig.add(wristCollar);

        // Anatomically shaped palm body with arched palmar hollow
        const palmMain = new THREE.Mesh(
            new THREE.BoxGeometry(0.076, 0.082, 0.022),
            AssetMaterials.skinMaterial
        );
        this.handRig.add(palmMain);

        // Thenar muscle mound (fleshy thumb base prominence)
        const thenarMound = new THREE.Mesh(
            new THREE.SphereGeometry(0.020, 16, 16),
            AssetMaterials.skinMaterial
        );
        thenarMound.scale.set(1.2, 1.5, 0.85);
        thenarMound.position.set(0.030, -0.015, 0.008);
        this.handRig.add(thenarMound);

        // Hypothenar muscle mound (fleshy pinky cushion)
        const hypothenarMound = new THREE.Mesh(
            new THREE.SphereGeometry(0.016, 16, 16),
            AssetMaterials.skinMaterial
        );
        hypothenarMound.scale.set(0.9, 1.4, 0.8);
        hypothenarMound.position.set(-0.028, -0.015, 0.006);
        this.handRig.add(hypothenarMound);

        // 4 Articulated Segmented Fingers (Index, Middle, Ring, Pinky)
        const fingerConfigs = [
            { name: 'Index',  x: -0.025, len: 0.068, rad: 0.0068, splay: -0.06 },
            { name: 'Middle', x: -0.008, len: 0.076, rad: 0.0072, splay: 0.00 },
            { name: 'Ring',   x:  0.009, len: 0.071, rad: 0.0068, splay: 0.04 },
            { name: 'Pinky',  x:  0.026, len: 0.056, rad: 0.0060, splay: 0.09 }
        ];

        this.fingers = [];

        fingerConfigs.forEach(cfg => {
            // MCP Knuckle Joint
            const mcp = new THREE.Group();
            mcp.position.set(cfg.x, 0.041, 0);
            mcp.rotation.z = cfg.splay;
            this.handRig.add(mcp);

            // Knuckle bulge
            const knuckle = new THREE.Mesh(
                new THREE.SphereGeometry(cfg.rad * 1.1, 12, 10),
                AssetMaterials.skinMaterial
            );
            mcp.add(knuckle);

            // Proximal Phalanx
            const proxLen = cfg.len * 0.44;
            const prox = new THREE.Mesh(
                new THREE.CylinderGeometry(cfg.rad * 0.95, cfg.rad * 1.05, proxLen, 16),
                AssetMaterials.skinMaterial
            );
            prox.position.y = proxLen * 0.5;
            mcp.add(prox);

            // PIP Joint
            const pip = new THREE.Group();
            pip.position.y = proxLen;
            mcp.add(pip);

            const pipBulge = new THREE.Mesh(
                new THREE.SphereGeometry(cfg.rad * 0.95, 12, 10),
                AssetMaterials.skinMaterial
            );
            pip.add(pipBulge);

            // Middle Phalanx
            const midLen = cfg.len * 0.32;
            const mid = new THREE.Mesh(
                new THREE.CylinderGeometry(cfg.rad * 0.85, cfg.rad * 0.95, midLen, 16),
                AssetMaterials.skinMaterial
            );
            mid.position.y = midLen * 0.5;
            pip.add(mid);

            // DIP Joint
            const dip = new THREE.Group();
            dip.position.y = midLen;
            pip.add(dip);

            const dipBulge = new THREE.Mesh(
                new THREE.SphereGeometry(cfg.rad * 0.85, 12, 10),
                AssetMaterials.skinMaterial
            );
            dip.add(dipBulge);

            // Distal Phalanx with rounded fingertip pad
            const distLen = cfg.len * 0.24;
            const dist = new THREE.Mesh(
                new THREE.CylinderGeometry(cfg.rad * 0.72, cfg.rad * 0.85, distLen, 16),
                AssetMaterials.skinMaterial
            );
            dist.position.y = distLen * 0.5;
            dip.add(dist);

            const pad = new THREE.Mesh(
                new THREE.SphereGeometry(cfg.rad * 0.75, 12, 10),
                AssetMaterials.skinMaterial
            );
            pad.position.y = distLen;
            dip.add(pad);

            // Glossy fingernail plate
            const nail = new THREE.Mesh(
                new THREE.PlaneGeometry(cfg.rad * 1.3, distLen * 0.65),
                AssetMaterials.fingernail
            );
            nail.position.set(0, distLen * 0.7, cfg.rad * 0.75);
            dip.add(nail);

            this.fingers.push({
                mcp,
                pip,
                dip,
                targetAngles: { mcp: 0, pip: 0, dip: 0 }
            });
        });

        // Articulated Opposable Thumb Rig
        const cmc = new THREE.Group();
        cmc.position.set(0.036, -0.010, 0.005);
        cmc.rotation.z = -Math.PI / 4.0;
        cmc.rotation.y = Math.PI / 4.5;
        this.handRig.add(cmc);

        const thumbProxLen = 0.032;
        const thumbProx = new THREE.Mesh(
            new THREE.CylinderGeometry(0.0078, 0.0088, thumbProxLen, 16),
            AssetMaterials.skinMaterial
        );
        thumbProx.position.y = thumbProxLen * 0.5;
        cmc.add(thumbProx);

        const ip = new THREE.Group();
        ip.position.y = thumbProxLen;
        cmc.add(ip);

        const thumbDistLen = 0.024;
        const thumbDist = new THREE.Mesh(
            new THREE.CylinderGeometry(0.0068, 0.0078, thumbDistLen, 16),
            AssetMaterials.skinMaterial
        );
        thumbDist.position.y = thumbDistLen * 0.5;
        ip.add(thumbDist);

        const thumbPad = new THREE.Mesh(
            new THREE.SphereGeometry(0.0072, 12, 10),
            AssetMaterials.skinMaterial
        );
        thumbPad.position.y = thumbDistLen;
        ip.add(thumbPad);

        const thumbNail = new THREE.Mesh(
            new THREE.PlaneGeometry(0.009, 0.014),
            AssetMaterials.fingernail
        );
        thumbNail.position.set(0, thumbDistLen * 0.7, 0.007);
        ip.add(thumbNail);

        this.thumbRig = { cmc, ip, targetAngle: 0 };
    }

    private renderGestureText() {
        const g = this.gestures[this.selectedGesture];
        const canvas = (this.infoLabel.material.map as THREE.CanvasTexture).image as HTMLCanvasElement;
        const c = canvas.getContext('2d')!;
        c.clearRect(0, 0, 512, 280);

        c.fillStyle = 'rgba(10, 16, 32, 0.94)';
        c.beginPath();
        c.roundRect(4, 4, 504, 272, 16);
        c.fill();
        c.strokeStyle = g.color;
        c.lineWidth = 3;
        c.beginPath();
        c.roundRect(4, 4, 504, 272, 16);
        c.stroke();

        c.fillStyle = g.color;
        c.font = 'bold 24px sans-serif';
        c.textAlign = 'left';
        c.fillText(g.name, 24, 42);

        c.fillStyle = '#94a3b8';
        c.font = '16px monospace';
        c.fillText(`POSE ${this.selectedGesture + 1} / 5`, 380, 42);

        c.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(24, 58); c.lineTo(488, 58);
        c.stroke();

        c.fillStyle = '#f8fafc';
        c.font = '21px sans-serif';
        const lines = g.desc.split('\n');
        lines.forEach((l, i) => {
            c.fillText(l, 24, 102 + i * 38);
        });

        // Gesture indicators
        for (let s = 0; s < 5; s++) {
            c.fillStyle = s === this.selectedGesture ? g.color : 'rgba(255, 255, 255, 0.2)';
            c.beginPath();
            c.arc(40 + s * 24, 248, 6, 0, Math.PI * 2);
            c.fill();
        }

        (this.infoLabel.material.map as THREE.CanvasTexture).needsUpdate = true;
    }

    public update(delta: number) {
        if (!this.group.visible) return;
        this.animTime += delta;

        // Smooth breathing micro-motion
        this.handRig.position.y = -0.01 + Math.sin(this.animTime * 1.5) * 0.003;

        // Procedural Anatomical Joint Articulation for Active Pose
        const cycle = Math.sin(this.animTime * 2.5);

        switch (this.selectedGesture) {
            case 0: // GRAB WIRE — Natural grasping power grip
                this.fingers.forEach((f, idx) => {
                    const curl = 0.8 + Math.max(0, cycle) * 0.45;
                    f.mcp.rotation.x = curl * (0.85 + idx * 0.05);
                    f.pip.rotation.x = curl * 1.1;
                    f.dip.rotation.x = curl * 0.7;
                });
                if (this.thumbRig) {
                    this.thumbRig.cmc.rotation.x = 0.7 + Math.max(0, cycle) * 0.3;
                    this.thumbRig.ip.rotation.x = 0.8;
                }
                break;

            case 1: // RELEASE WIRE — Open relaxed hand
                this.fingers.forEach(f => {
                    f.mcp.rotation.x = 0.05 + Math.sin(this.animTime * 1.8) * 0.05;
                    f.pip.rotation.x = 0.08;
                    f.dip.rotation.x = 0.05;
                });
                if (this.thumbRig) {
                    this.thumbRig.cmc.rotation.x = 0.1;
                    this.thumbRig.ip.rotation.x = 0.05;
                }
                break;

            case 2: // DIP IN SALT — Precision pinch grip (thumb meets index)
                this.fingers.forEach((f, idx) => {
                    if (idx === 0) { // Index touches thumb
                        f.mcp.rotation.x = 0.75;
                        f.pip.rotation.x = 0.9;
                        f.dip.rotation.x = 0.5;
                    } else { // Others curl gracefully away
                        f.mcp.rotation.x = 0.9 + idx * 0.1;
                        f.pip.rotation.x = 1.1;
                        f.dip.rotation.x = 0.8;
                    }
                });
                if (this.thumbRig) {
                    this.thumbRig.cmc.rotation.x = 0.85;
                    this.thumbRig.ip.rotation.x = 0.75;
                }
                break;

            case 3: // POKE SWITCH — Index firmly extended, others curled into palm
                this.fingers.forEach((f, idx) => {
                    if (idx === 0) { // Index extended with natural subtle curve
                        f.mcp.rotation.x = 0.05 + cycle * 0.08;
                        f.pip.rotation.x = 0.08;
                        f.dip.rotation.x = 0.05;
                    } else { // Curled into fist
                        f.mcp.rotation.x = 1.25;
                        f.pip.rotation.x = 1.35;
                        f.dip.rotation.x = 0.9;
                    }
                });
                if (this.thumbRig) {
                    this.thumbRig.cmc.rotation.x = 1.0;
                    this.thumbRig.ip.rotation.x = 0.9;
                }
                break;

            case 4: // PALM MENU — Palm open facing user/camera
                this.fingers.forEach((f, idx) => {
                    f.mcp.rotation.x = -0.15 + Math.sin(this.animTime * 1.5 + idx * 0.3) * 0.04;
                    f.pip.rotation.x = 0.05;
                    f.dip.rotation.x = 0.02;
                });
                if (this.thumbRig) {
                    this.thumbRig.cmc.rotation.x = -0.1;
                    this.thumbRig.ip.rotation.x = 0.05;
                }
                break;
        }
    }

    public show(pos: THREE.Vector3, lookAtPos: THREE.Vector3) {
        this.group.position.copy(pos);
        this.group.lookAt(lookAtPos);
        this.group.visible = true;
        this.isGrabbed = false;
        this.renderGestureText();
    }

    public hide() {
        this.group.visible = false;
        this.isGrabbed = false;
    }

    public isVisible() {
        return this.group.visible;
    }

    public checkPoke(pokePos: THREE.Vector3): boolean {
        if (!this.group.visible) return false;
        const now = Date.now();
        if (now - this.lastPokeTime < 350) return false;

        const closeWorld = new THREE.Vector3();
        this.closeMesh.getWorldPosition(closeWorld);
        if (pokePos.distanceTo(closeWorld) < 0.08) {
            this.lastPokeTime = now;
            this.audio.playBlip();
            this.hide();
            return true;
        }

        const nextWorld = new THREE.Vector3();
        this.nextBtn.getWorldPosition(nextWorld);
        if (pokePos.distanceTo(nextWorld) < 0.08) {
            this.lastPokeTime = now;
            this.selectedGesture = (this.selectedGesture + 1) % this.gestures.length;
            this.audio.playBlip();
            this.renderGestureText();
            return true;
        }

        const backWorld = new THREE.Vector3();
        this.backBtn.getWorldPosition(backWorld);
        if (pokePos.distanceTo(backWorld) < 0.08) {
            this.lastPokeTime = now;
            this.selectedGesture = (this.selectedGesture - 1 + this.gestures.length) % this.gestures.length;
            this.audio.playBlip();
            this.renderGestureText();
            return true;
        }

        return false;
    }

    public checkGrab(handPos: THREE.Vector3, isPinchingOrFist: boolean) {
        if (!this.group.visible) return;
        const center = new THREE.Vector3();
        this.group.getWorldPosition(center);

        if (isPinchingOrFist) {
            if (!this.isGrabbed) {
                if (handPos.distanceTo(center) < 0.28) {
                    this.isGrabbed = true;
                    this.grabOffset.copy(this.group.position).sub(handPos);
                    this.audio.playGrab();
                }
            } else {
                this.group.position.copy(handPos).add(this.grabOffset);
            }
        } else {
            this.isGrabbed = false;
        }
    }
}

// ─────────────────────────────────────────────────────────────
//  EXPANDED CONTENT 3: THEORY BOOK (PHOTOREALISTIC COMPENDIUM)
// ─────────────────────────────────────────────────────────────

export class BookExpanded {
    public group: THREE.Group;
    private leftCanvas: HTMLCanvasElement;
    private rightCanvas: HTMLCanvasElement;
    private leftTex: THREE.CanvasTexture;
    private rightTex: THREE.CanvasTexture;
    private leftPageMesh: THREE.Mesh;
    private rightPageMesh: THREE.Mesh;

    private turningPageGroup: THREE.Group;
    private turningPageMesh: THREE.Mesh;
    private turnCanvas: HTMLCanvasElement;
    private turnTex: THREE.CanvasTexture;

    private closeMesh: THREE.Mesh;
    private nextBtn: THREE.Mesh;
    private prevBtn: THREE.Mesh;
    private audio: AudioEngine;

    private currentPage = 0;
    private isFlipping = false;
    private flipProgress = 0;
    private flipDirection: 'next' | 'prev' = 'next';
    private lastPokeTime = 0;

    public isGrabbed = false;
    private grabOffset = new THREE.Vector3();

    private pages = [
        {
            left: {
                title: 'Quantum Atomic Theory',
                lines: [
                    'When metal salts are introduced into',
                    'a high-temperature flame, thermal',
                    'energy vaporizes the compound.',
                    '',
                    'Electrons in the metal cations are',
                    'promoted from ground state orbitals',
                    'to higher energy excited shells,',
                    'absorbing discrete quantum packets ΔE.',
                ]
            },
            right: {
                title: 'Photon Emission Spectra',
                lines: [
                    'Excited states are unstable. Within',
                    'nanoseconds, electrons relax back',
                    'to lower energy orbitals.',
                    '',
                    'Energy is released as photons of light:',
                    'Wavelength: λ = h · c / ΔE',
                    '',
                    'Because each element has unique electron',
                    'shell spacing, emitted wavelengths',
                    'form an unmistakable spectral fingerprint.',
                ]
            }
        },
        {
            left: {
                title: 'Characteristic Flame Colors',
                lines: [
                    '• Sodium (Na⁺): 589 nm (Intense Yellow)',
                    '  Dominant D-line emission, highly visible.',
                    '',
                    '• Potassium (K⁺): 404 nm (Pale Lilac)',
                    '  Subtle violet hue, easily masked.',
                    '',
                    '• Copper (Cu²⁺): 510–522 nm (Emerald Blue-Green)',
                    '  Brilliant green glow from halide transitions.',
                ]
            },
            right: {
                title: 'Alkaline Earth Metals',
                lines: [
                    '• Calcium (Ca²⁺): 622 nm (Brick Red)',
                    '  Strong band emission in orange-red spectrum.',
                    '',
                    '• Strontium (Sr²⁺): 668 nm (Crimson Red)',
                    '  Deep red used in emergency flare optics.',
                    '',
                    '• Barium (Ba²⁺): 553 nm (Apple Green)',
                    '  Distinctive green flame colorant in fireworks.',
                ]
            }
        },
        {
            left: {
                title: 'Experimental Protocol',
                lines: [
                    '1. Clean loop in non-luminous flame.',
                    '2. Dip loop into chemical salt sample.',
                    '3. Hold salt in outer oxidizing flame cone.',
                    '4. Record emission color immediately.',
                    '',
                    'Why Platinum Wire?',
                    'Platinum possesses an extraordinarily high',
                    'melting point (1768°C) and emits no color',
                    'of its own to distort observations.',
                ]
            },
            right: {
                title: 'Scientific Applications',
                lines: [
                    '• Stellar Astrophysics:',
                    '  Determining stellar chemical compositions.',
                    '',
                    '• Forensic Toxicology:',
                    '  Identifying unknown inorganic toxins.',
                    '',
                    '• Pyrotechnic Engineering:',
                    '  Formulating precise fireworks chemistry.',
                ]
            }
        }
    ];

    constructor(scene: THREE.Scene, audio: AudioEngine) {
        this.audio = audio;
        this.group = new THREE.Group();
        this.group.name = 'BookExpandedGroup';
        this.group.visible = false;

        // Curved leather hollow spine
        const spineGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.28, 24, 1, false, Math.PI * 0.45, Math.PI * 1.1);
        const spine = new THREE.Mesh(spineGeo, AssetMaterials.moroccoLeather);
        spine.position.set(0, 0, -0.016);
        this.group.add(spine);

        // 5 Raised leather cords / gold binding ribs on spine
        for (let r = 0; r < 5; r++) {
            const rib = new THREE.Mesh(
                new THREE.TorusGeometry(0.0165, 0.0018, 8, 24, Math.PI * 1.1),
                AssetMaterials.goldLeaf
            );
            rib.rotation.y = Math.PI * 0.95;
            rib.position.set(0, -0.10 + r * 0.05, -0.016);
            this.group.add(rib);
        }

        // Heavy hardboard covers with realistic leatherette bevels
        const coverGeo = new THREE.BoxGeometry(0.185, 0.275, 0.008);
        const leftCover = new THREE.Mesh(coverGeo, AssetMaterials.moroccoLeather);
        leftCover.position.set(-0.098, 0, -0.014);
        leftCover.rotation.y = 0.09;
        this.group.add(leftCover);

        const rightCover = new THREE.Mesh(coverGeo, AssetMaterials.moroccoLeather);
        rightCover.position.set(0.098, 0, -0.014);
        rightCover.rotation.y = -0.09;
        this.group.add(rightCover);

        // Ornate gold filigree corner protectors
        const cornerGeo = new THREE.BoxGeometry(0.016, 0.016, 0.010);
        const cL1 = new THREE.Mesh(cornerGeo, AssetMaterials.goldLeaf); cL1.position.set(-0.084, 0.128, 0.001); leftCover.add(cL1);
        const cL2 = new THREE.Mesh(cornerGeo, AssetMaterials.goldLeaf); cL2.position.set(-0.084, -0.128, 0.001); leftCover.add(cL2);
        const cR1 = new THREE.Mesh(cornerGeo, AssetMaterials.goldLeaf); cR1.position.set(0.084, 0.128, 0.001); rightCover.add(cR1);
        const cR2 = new THREE.Mesh(cornerGeo, AssetMaterials.goldLeaf); cR2.position.set(0.084, -0.128, 0.001); rightCover.add(cR2);

        // Stratified Gilded Textblock Edges
        const textBlockLeft = new THREE.Mesh(
            new THREE.BoxGeometry(0.170, 0.252, 0.018),
            AssetMaterials.gildedPageEdge
        );
        textBlockLeft.position.set(-0.092, 0, -0.008);
        textBlockLeft.rotation.y = 0.09;
        this.group.add(textBlockLeft);

        const textBlockRight = new THREE.Mesh(
            new THREE.BoxGeometry(0.170, 0.252, 0.018),
            AssetMaterials.gildedPageEdge
        );
        textBlockRight.position.set(0.092, 0, -0.008);
        textBlockRight.rotation.y = -0.09;
        this.group.add(textBlockRight);

        // Reading Page Surfaces (High-DPI Canvas)
        this.leftCanvas = document.createElement('canvas'); this.leftCanvas.width = 512; this.leftCanvas.height = 768;
        this.leftTex = new THREE.CanvasTexture(this.leftCanvas);
        this.leftTex.colorSpace = THREE.SRGBColorSpace;
        this.leftPageMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(0.172, 0.254),
            new THREE.MeshBasicMaterial({ map: this.leftTex })
        );
        this.leftPageMesh.position.set(-0.094, 0, 0.002);
        this.leftPageMesh.rotation.y = 0.09;
        this.group.add(this.leftPageMesh);

        this.rightCanvas = document.createElement('canvas'); this.rightCanvas.width = 512; this.rightCanvas.height = 768;
        this.rightTex = new THREE.CanvasTexture(this.rightCanvas);
        this.rightTex.colorSpace = THREE.SRGBColorSpace;
        this.rightPageMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(0.172, 0.254),
            new THREE.MeshBasicMaterial({ map: this.rightTex })
        );
        this.rightPageMesh.position.set(0.094, 0, 0.002);
        this.rightPageMesh.rotation.y = -0.09;
        this.group.add(this.rightPageMesh);

        // Curved Turning Page Assembly
        this.turningPageGroup = new THREE.Group();
        this.turningPageGroup.position.set(0, 0, 0.004);
        this.turnCanvas = document.createElement('canvas'); this.turnCanvas.width = 512; this.turnCanvas.height = 768;
        this.turnTex = new THREE.CanvasTexture(this.turnCanvas);
        this.turnTex.colorSpace = THREE.SRGBColorSpace;
        this.turningPageMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(0.172, 0.254),
            new THREE.MeshBasicMaterial({ map: this.turnTex, side: THREE.DoubleSide })
        );
        this.turningPageMesh.position.set(0.086, 0, 0);
        this.turningPageGroup.add(this.turningPageMesh);
        this.turningPageGroup.visible = false;
        this.group.add(this.turningPageGroup);

        // Silk Bookmark Ribbon
        const ribbon = new THREE.Mesh(
            new THREE.BoxGeometry(0.010, 0.32, 0.001),
            AssetMaterials.silkRibbon
        );
        ribbon.position.set(0, -0.04, 0.006);
        ribbon.rotation.z = -0.06;
        this.group.add(ribbon);

        // Brass Clasp Navigation Buttons
        const claspGeo = new THREE.BoxGeometry(0.076, 0.034, 0.016);
        this.nextBtn = new THREE.Mesh(claspGeo, AssetMaterials.polishedBrass);
        this.nextBtn.position.set(0.13, -0.17, 0.01);
        this.group.add(this.nextBtn);

        const nextSpr = new THREE.Sprite(new THREE.SpriteMaterial({
            map: makeCanvas(128, 48, c => {
                c.fillStyle = '#0f172a';
                c.font = 'bold 24px serif';
                c.textAlign = 'center';
                c.textBaseline = 'middle';
                c.fillText('NEXT ▶', 64, 24);
            }), transparent: true
        }));
        nextSpr.scale.set(0.070, 0.026, 1);
        nextSpr.position.z = 0.01;
        this.nextBtn.add(nextSpr);

        this.prevBtn = new THREE.Mesh(claspGeo, AssetMaterials.polishedBrass);
        this.prevBtn.position.set(-0.13, -0.17, 0.01);
        this.group.add(this.prevBtn);

        const prevSpr = new THREE.Sprite(new THREE.SpriteMaterial({
            map: makeCanvas(128, 48, c => {
                c.fillStyle = '#0f172a';
                c.font = 'bold 24px serif';
                c.textAlign = 'center';
                c.textBaseline = 'middle';
                c.fillText('◀ PREV', 64, 24);
            }), transparent: true
        }));
        prevSpr.scale.set(0.070, 0.026, 1);
        prevSpr.position.z = 0.01;
        this.prevBtn.add(prevSpr);

        // Close button
        this.closeMesh = createCloseBtn();
        this.closeMesh.position.set(0.21, 0.17, 0.02);
        this.group.add(this.closeMesh);

        scene.add(this.group);
        this.renderPages();
    }

    private drawPageToCanvas(canvas: HTMLCanvasElement, title: string, lines: string[], pageNum: number, isRightPage: boolean) {
        const c = canvas.getContext('2d')!;
        // Aged ivory parchment background
        c.fillStyle = '#fdfbf7';
        c.fillRect(0, 0, 512, 768);

        // Delicate watermark border
        c.strokeStyle = '#e7dece';
        c.lineWidth = 3;
        c.strokeRect(18, 18, 476, 732);
        c.strokeStyle = '#d4af37';
        c.lineWidth = 1;
        c.strokeRect(24, 24, 464, 720);

        // Chapter Header
        c.fillStyle = '#1e3a5f';
        c.font = 'bold 28px Georgia, serif';
        c.textAlign = 'center';
        c.fillText(title, 256, 72);

        // Ornate Gold Divider
        c.strokeStyle = '#d4af37';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(80, 90); c.lineTo(432, 90);
        c.stroke();

        // Scientific Diagram Drawing
        if (!isRightPage && pageNum === 1) {
            // Bohr Model Diagram
            c.strokeStyle = '#3b82f6';
            c.lineWidth = 1.5;
            for (let r = 25; r <= 65; r += 20) {
                c.beginPath();
                c.arc(256, 420, r, 0, Math.PI * 2);
                c.stroke();
            }
            c.fillStyle = '#ef4444';
            c.beginPath();
            c.arc(256, 420, 8, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = '#1e3a5f';
            c.font = 'italic 16px serif';
            c.fillText('Nucleus & Quantized Shells (n=1, 2, 3)', 256, 505);
        } else if (isRightPage && pageNum === 2) {
            // Spectrum Rainbow Bar
            const grad = c.createLinearGradient(60, 0, 452, 0);
            grad.addColorStop(0.00, '#8b5cf6'); // 400nm
            grad.addColorStop(0.25, '#3b82f6'); // 480nm
            grad.addColorStop(0.45, '#10b981'); // 530nm
            grad.addColorStop(0.70, '#f59e0b'); // 590nm
            grad.addColorStop(1.00, '#ef4444'); // 680nm
            c.fillStyle = grad;
            c.fillRect(60, 390, 392, 28);
            c.strokeStyle = '#1e293b';
            c.lineWidth = 2;
            c.strokeRect(60, 390, 392, 28);

            // Wavelength labels
            c.fillStyle = '#475569';
            c.font = '14px monospace';
            c.fillText('400 nm', 60, 436);
            c.fillText('550 nm', 256, 436);
            c.fillText('700 nm', 430, 436);
        }

        // Body Text
        c.fillStyle = '#1e293b';
        c.font = '21px Georgia, serif';
        c.textAlign = 'left';
        lines.forEach((line, idx) => {
            c.fillText(line, 42, 132 + idx * 34);
        });

        // Page Number
        c.fillStyle = '#64748b';
        c.font = 'italic 17px Georgia, serif';
        c.textAlign = 'center';
        c.fillText(`— ${pageNum} —`, 256, 715);
    }

    private renderPages() {
        const p = this.pages[this.currentPage];
        this.drawPageToCanvas(this.leftCanvas, p.left.title, p.left.lines, this.currentPage * 2 + 1, false);
        this.drawPageToCanvas(this.rightCanvas, p.right.title, p.right.lines, this.currentPage * 2 + 2, true);
        this.leftTex.needsUpdate = true;
        this.rightTex.needsUpdate = true;
    }

    public update(delta: number) {
        if (!this.group.visible) return;

        if (this.isFlipping) {
            this.flipProgress += delta * 2.2;
            if (this.flipProgress >= 1) {
                this.flipProgress = 0;
                this.isFlipping = false;
                this.turningPageGroup.visible = false;
                if (this.flipDirection === 'next') {
                    this.currentPage = Math.min(this.pages.length - 1, this.currentPage + 1);
                } else {
                    this.currentPage = Math.max(0, this.currentPage - 1);
                }
                this.renderPages();
            } else {
                const angle = this.flipDirection === 'next'
                    ? -this.flipProgress * Math.PI
                    : -(1 - this.flipProgress) * Math.PI;
                this.turningPageGroup.rotation.y = angle;
            }
        }
    }

    public show(pos: THREE.Vector3, lookAtPos: THREE.Vector3) {
        this.group.position.copy(pos);
        this.group.lookAt(lookAtPos);
        this.group.visible = true;
        this.isGrabbed = false;
        this.isFlipping = false;
        this.turningPageGroup.visible = false;
        this.renderPages();
    }

    public hide() {
        this.group.visible = false;
        this.isGrabbed = false;
    }

    public isVisible() {
        return this.group.visible;
    }

    public checkPoke(pokePos: THREE.Vector3): boolean {
        if (!this.group.visible) return false;
        const now = Date.now();
        if (now - this.lastPokeTime < 350) return false;

        const closeWorld = new THREE.Vector3();
        this.closeMesh.getWorldPosition(closeWorld);
        if (pokePos.distanceTo(closeWorld) < 0.08) {
            this.lastPokeTime = now;
            this.audio.playBlip();
            this.hide();
            return true;
        }

        const nextWorld = new THREE.Vector3();
        this.nextBtn.getWorldPosition(nextWorld);
        if (pokePos.distanceTo(nextWorld) < 0.08) {
            this.lastPokeTime = now;
            if (this.currentPage < this.pages.length - 1 && !this.isFlipping) {
                this.isFlipping = true;
                this.flipDirection = 'next';
                this.flipProgress = 0;
                this.turningPageGroup.visible = true;
                this.audio.playBlip();
            }
            return true;
        }

        const prevWorld = new THREE.Vector3();
        this.prevBtn.getWorldPosition(prevWorld);
        if (pokePos.distanceTo(prevWorld) < 0.08) {
            this.lastPokeTime = now;
            if (this.currentPage > 0 && !this.isFlipping) {
                this.isFlipping = true;
                this.flipDirection = 'prev';
                this.flipProgress = 0;
                this.turningPageGroup.visible = true;
                this.audio.playBlip();
            }
            return true;
        }

        return false;
    }

    public checkGrab(handPos: THREE.Vector3, isPinchingOrFist: boolean) {
        if (!this.group.visible) return;
        const center = new THREE.Vector3();
        this.group.getWorldPosition(center);

        if (isPinchingOrFist) {
            if (!this.isGrabbed) {
                if (handPos.distanceTo(center) < 0.28) {
                    this.isGrabbed = true;
                    this.grabOffset.copy(this.group.position).sub(handPos);
                    this.audio.playGrab();
                }
            } else {
                this.group.position.copy(handPos).add(this.grabOffset);
            }
        } else {
            this.isGrabbed = false;
        }
    }
}

// ─────────────────────────────────────────────────────────────
//  EXPANDED CONTENT 4: VIDEO (OPTICAL GLASS HOLOGRAPHIC ORB)
// ─────────────────────────────────────────────────────────────

export class VideoExpanded {
    public group: THREE.Group;
    private closeMesh: THREE.Mesh;
    private screenMesh: THREE.Mesh;
    private screenTex: THREE.CanvasTexture;
    private playBtn: THREE.Mesh;
    private isPlaying = true;
    private videoTime = 0;
    private gimbalOuter: THREE.Mesh;
    private gimbalInner: THREE.Mesh;
    private coreEmitter: THREE.Mesh;
    private lastPokeTime = 0;
    private audio: AudioEngine;

    public isGrabbed = false;
    private grabOffset = new THREE.Vector3();

    constructor(scene: THREE.Scene, audio: AudioEngine) {
        this.audio = audio;
        this.group = new THREE.Group();
        this.group.name = 'VideoExpandedGroup';
        this.group.visible = false;

        // Borosilicate Optical Glass Enclosure (volumetric transmission & refraction)
        const outerGlass = new THREE.Mesh(
            new THREE.SphereGeometry(0.185, 48, 36),
            AssetMaterials.opticalGlass
        );
        this.group.add(outerGlass);

        // Machined Titanium Retaining Equator Bezel
        const equatorBezel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.190, 0.190, 0.008, 48, 1, true),
            AssetMaterials.darkTitanium
        );
        this.group.add(equatorBezel);

        // Outer Gimbal Ring (Aerospace titanium with bearing blocks)
        this.gimbalOuter = new THREE.Mesh(
            new THREE.TorusGeometry(0.205, 0.004, 12, 64),
            AssetMaterials.darkTitanium
        );
        this.group.add(this.gimbalOuter);

        // Inner Gimbal Ring (Mirror-polished brass with ruby bearings)
        this.gimbalInner = new THREE.Mesh(
            new THREE.TorusGeometry(0.225, 0.0035, 12, 64),
            AssetMaterials.polishedBrass
        );
        this.gimbalInner.rotation.x = Math.PI / 3;
        this.group.add(this.gimbalInner);

        // 4 Synthetic ruby jewel pivot studs
        for (let j = 0; j < 4; j++) {
            const ruby = new THREE.Mesh(
                new THREE.SphereGeometry(0.005, 12, 10),
                AssetMaterials.opticalRuby
            );
            const a = (j / 4) * Math.PI * 2;
            ruby.position.set(Math.cos(a) * 0.205, Math.sin(a) * 0.205, 0);
            this.gimbalOuter.add(ruby);
        }

        // Internal Quantum Core Emitter
        this.coreEmitter = new THREE.Mesh(
            new THREE.SphereGeometry(0.025, 24, 20),
            new THREE.MeshStandardMaterial({
                color: 0x00e5ff,
                emissive: 0x0088ff,
                emissiveIntensity: 1.8,
                roughness: 0.1
            })
        );
        this.group.add(this.coreEmitter);

        // Curved Holographic Projection Screen
        const screenGeo = new THREE.SphereGeometry(0.165, 36, 24, 0, Math.PI * 1.3, Math.PI * 0.18, Math.PI * 0.64);
        const screenCv = document.createElement('canvas'); screenCv.width = 512; screenCv.height = 512;
        this.screenTex = new THREE.CanvasTexture(screenCv);
        this.screenTex.colorSpace = THREE.SRGBColorSpace;
        this.screenMesh = new THREE.Mesh(
            screenGeo,
            new THREE.MeshBasicMaterial({ map: this.screenTex, side: THREE.BackSide, transparent: true })
        );
        this.group.add(this.screenMesh);

        // Machined Aluminum Rotary Play/Pause Button
        const playBezelGeo = new THREE.CylinderGeometry(0.034, 0.034, 0.014, 32);
        const playBezel = new THREE.Mesh(playBezelGeo, AssetMaterials.polishedBrass);
        playBezel.rotation.x = Math.PI / 2;
        playBezel.position.set(0, 0, 0.190);
        this.group.add(playBezel);

        // Central Sapphire Lens button face
        const playLensGeo = new THREE.CylinderGeometry(0.026, 0.026, 0.005, 32);
        this.playBtn = new THREE.Mesh(playLensGeo, AssetMaterials.sapphireLens);
        this.playBtn.name = 'VideoPlayBtn';
        this.playBtn.rotation.x = Math.PI / 2;
        this.playBtn.position.set(0, 0, 0.198);
        this.group.add(this.playBtn);

        // Play / Pause Icon Sprite on button
        const playIconSpr = new THREE.Sprite(new THREE.SpriteMaterial({
            map: makeCanvas(64, 64, c => {
                c.fillStyle = '#ffffff';
                c.beginPath();
                c.moveTo(22, 14); c.lineTo(48, 32); c.lineTo(22, 50);
                c.closePath();
                c.fill();
            }), transparent: true
        }));
        playIconSpr.scale.set(0.028, 0.028, 1);
        playIconSpr.position.set(0, 0, 0.004);
        this.playBtn.add(playIconSpr);

        // Telemetry readout banner below orb
        const infoTex = makeCanvas(440, 88, c => {
            c.fillStyle = 'rgba(10, 16, 32, 0.92)';
            c.beginPath();
            c.roundRect(0, 0, 440, 88, 12);
            c.fill();
            c.strokeStyle = '#00e5ff';
            c.lineWidth = 2;
            c.beginPath();
            c.roundRect(2, 2, 436, 84, 10);
            c.stroke();
            c.fillStyle = '#00e5ff';
            c.font = 'bold 20px sans-serif';
            c.textAlign = 'center';
            c.fillText('QUANTUM FLAME SPECTROSCOPY', 220, 32);
            c.fillStyle = '#94a3b8';
            c.font = '15px monospace';
            c.fillText('REAL-TIME PHOTON EMISSION DYNAMICS', 220, 62);
        });
        const infoSpr = new THREE.Sprite(new THREE.SpriteMaterial({ map: infoTex, transparent: true }));
        infoSpr.scale.set(0.25, 0.05, 1);
        infoSpr.position.set(0, -0.24, 0);
        this.group.add(infoSpr);

        // Close button
        this.closeMesh = createCloseBtn();
        this.closeMesh.position.set(0.22, 0.22, 0.02);
        this.group.add(this.closeMesh);

        scene.add(this.group);
        this.renderScreen();
    }

    private renderScreen() {
        const cv = (this.screenTex.image as HTMLCanvasElement);
        const c = cv.getContext('2d')!;
        const t = this.videoTime;

        c.fillStyle = '#050a14';
        c.fillRect(0, 0, 512, 512);

        // Radial quantum plasma glow
        const hue = (t * 45) % 360;
        const grad = c.createRadialGradient(256, 290, 10, 256, 300, 150);
        grad.addColorStop(0, `hsla(${hue}, 100%, 85%, 1)`);
        grad.addColorStop(0.35, `hsla(${(hue + 25) % 360}, 95%, 55%, 0.85)`);
        grad.addColorStop(0.7, `hsla(${(hue + 60) % 360}, 90%, 35%, 0.4)`);
        grad.addColorStop(1, 'transparent');
        c.fillStyle = grad;
        c.beginPath();
        c.arc(256, 300, 150, 0, Math.PI * 2);
        c.fill();

        // Burner nozzle silhouette
        c.fillStyle = '#1e293b';
        c.fillRect(236, 420, 40, 92);

        // Spectrometer gridlines
        c.strokeStyle = 'rgba(0, 229, 255, 0.25)';
        c.lineWidth = 1;
        for (let y = 80; y <= 400; y += 40) {
            c.beginPath(); c.moveTo(40, y); c.lineTo(472, y); c.stroke();
        }

        // Live telemetry text
        c.fillStyle = '#00e5ff';
        c.font = 'bold 20px monospace';
        c.textAlign = 'center';
        c.fillText(`STATUS: ${this.isPlaying ? '▶ SIMULATION ACTIVE' : '⏸ PAUSED'}`, 256, 46);

        c.font = '15px monospace';
        c.fillStyle = '#ffffff';
        c.fillText(`WAVELENGTH: ${Math.floor(400 + ((hue / 360) * 300))} nm  |  FLUX: 98.4%`, 256, 74);

        this.screenTex.needsUpdate = true;
    }

    public update(delta: number) {
        if (!this.group.visible) return;

        this.gimbalOuter.rotation.z += delta * 0.35;
        this.gimbalInner.rotation.y += delta * 0.55;
        this.coreEmitter.rotation.y += delta * 1.2;

        if (this.isPlaying) {
            this.videoTime += delta;
            this.renderScreen();
        }
    }

    public show(pos: THREE.Vector3, lookAtPos: THREE.Vector3) {
        this.group.position.copy(pos);
        this.group.lookAt(lookAtPos);
        this.group.visible = true;
        this.isGrabbed = false;
        this.renderScreen();
    }

    public hide() {
        this.group.visible = false;
        this.isGrabbed = false;
    }

    public isVisible() {
        return this.group.visible;
    }

    public checkPoke(pokePos: THREE.Vector3): boolean {
        if (!this.group.visible) return false;
        const now = Date.now();
        if (now - this.lastPokeTime < 350) return false;

        const closeWorld = new THREE.Vector3();
        this.closeMesh.getWorldPosition(closeWorld);
        if (pokePos.distanceTo(closeWorld) < 0.08) {
            this.lastPokeTime = now;
            this.audio.playBlip();
            this.hide();
            return true;
        }

        const playWorld = new THREE.Vector3();
        this.playBtn.getWorldPosition(playWorld);
        if (pokePos.distanceTo(playWorld) < 0.08) {
            this.lastPokeTime = now;
            this.isPlaying = !this.isPlaying;
            this.audio.playBlip();
            this.renderScreen();
            return true;
        }

        return false;
    }

    public checkGrab(handPos: THREE.Vector3, isPinchingOrFist: boolean) {
        if (!this.group.visible) return;
        const center = new THREE.Vector3();
        this.group.getWorldPosition(center);

        if (isPinchingOrFist) {
            if (!this.isGrabbed) {
                if (handPos.distanceTo(center) < 0.28) {
                    this.isGrabbed = true;
                    this.grabOffset.copy(this.group.position).sub(handPos);
                    this.audio.playGrab();
                }
            } else {
                this.group.position.copy(handPos).add(this.grabOffset);
            }
        } else {
            this.isGrabbed = false;
        }
    }
}

// ─────────────────────────────────────────────────────────────
//  PALM MENU CONTROLLER (TRACKED LEFT PALM ANCHOR & POKE)
// ─────────────────────────────────────────────────────────────

export class PalmMenu {
    private scene: THREE.Scene;
    private world: World;
    private audio: AudioEngine;

    private palmGroup: THREE.Group;
    private menuItems: MenuItem[] = [];
    private isPalmOpen = false;
    private palmStabilityCounter = 0;
    private readonly OPEN_FRAMES = 4;
    private readonly CLOSE_FRAMES = 3;
    private closeCounter = 0;

    private lastPokeTime = 0;

    // Expanded 3D Panels
    public stepsExp: StepsExpanded;
    public guideExp: GuideExpanded;
    public bookExp: BookExpanded;
    public videoExp: VideoExpanded;

    private scaleAnim = 0;
    private animTime = 0;

    constructor(scene: THREE.Scene, world: World, audio: AudioEngine) {
        this.scene = scene;
        this.world = world;
        this.audio = audio;

        // Build compact palm group
        this.palmGroup = new THREE.Group();
        this.palmGroup.name = 'PalmMenuCompact';
        this.palmGroup.visible = false;
        this.scene.add(this.palmGroup);

        // Build expanded content objects
        this.stepsExp = new StepsExpanded(scene, audio);
        this.guideExp = new GuideExpanded(scene, audio);
        this.bookExp = new BookExpanded(scene, audio);
        this.videoExp = new VideoExpanded(scene, audio);

        this.buildCompactItems();
    }

    private buildCompactItems() {
        const items: { tag: MenuItemTag; iconFn: () => THREE.Group; label: string; color: string; offset: THREE.Vector3 }[] = [
            { tag: 'steps', iconFn: buildCylinderIcon, label: 'STEPS', color: '#00e5ff', offset: new THREE.Vector3(-0.055, 0.055, 0) },
            { tag: 'guide', iconFn: buildHandIcon,     label: 'GUIDE', color: '#00ff88', offset: new THREE.Vector3(0.055, 0.055, 0) },
            { tag: 'theory', iconFn: buildBookIcon,    label: 'THEORY', color: '#d4af37', offset: new THREE.Vector3(-0.055, 0.01, 0) },
            { tag: 'video',  iconFn: buildSphereIcon,  label: 'VIDEO',  color: '#aa88ff', offset: new THREE.Vector3(0.055, 0.01, 0) },
        ];

        items.forEach(({ tag, iconFn, label, color, offset }) => {
            const iconGroup = iconFn();
            iconGroup.position.copy(offset);
            iconGroup.name = `PalmIcon_${tag}`;
            iconGroup.userData.palmTag = tag;
            this.palmGroup.add(iconGroup);

            const spr = labelSprite(label, color);
            spr.position.copy(offset).add(new THREE.Vector3(0, -0.026, 0));
            this.palmGroup.add(spr);

            this.menuItems.push({ tag, group: iconGroup, label: spr });
        });
    }

        // Scratch vectors for zero-allocation per-frame tracking
    private static _scratchWPos = new THREE.Vector3();
    private static _scratchIdxPos = new THREE.Vector3();
    private static _scratchMidPos = new THREE.Vector3();
    private static _scratchPkyPos = new THREE.Vector3();
    private static _scratchMkPos = new THREE.Vector3();
    private static _scratchIkPos = new THREE.Vector3();
    private static _scratchPkPos = new THREE.Vector3();
    private static _scratchCamPos = new THREE.Vector3();
    private static _scratchToCam = new THREE.Vector3();
    private static _scratchTargetPos = new THREE.Vector3();

    public update(delta: number) {
        this.animTime += delta;

        // Update expanded content animations
        this.stepsExp.update(delta);
        this.guideExp.update(delta);
        this.bookExp.update(delta);
        this.videoExp.update(delta);

        const renderer = (this.world as any).renderer;
        if (!renderer?.xr?.isPresenting) {
            return;
        }

        let anchorPalmCenter: THREE.Vector3 | null = null;
        let anchorPalmNormal: THREE.Vector3 | null = null;
        let isOpenAndRaised = false;
        let activeInteractingHand: any = null;

        // 1. Process both hands to detect open palm on either hand
        for (let h = 0; h < 2; h++) {
            const hand = renderer.xr.getHand ? renderer.xr.getHand(h) : null;
            if (!hand || !(hand as any).joints) continue;

            const joints = (hand as any).joints;
            const wrist = joints['wrist'] || joints[0];
            const idxTip = joints['index-finger-tip'] || joints[9] || joints[8];
            const midTip = joints['middle-finger-tip'] || joints[14];
            const pkyTip = joints['pinky-finger-tip'] || joints[24];

            const midKnuckle = joints['middle-finger-metacarpal'] || joints['middle-finger-phalanx-proximal'] || joints[11];
            const idxKnuckle = joints['index-finger-metacarpal'] || joints['index-finger-phalanx-proximal'] || joints[6];
            const pkyKnuckle = joints['pinky-finger-metacarpal'] || joints['pinky-finger-phalanx-proximal'] || joints[21];

            if (wrist) {
                const wPos = PalmMenu._scratchWPos;
                wrist.getWorldPosition(wPos);

                if (wPos.lengthSq() > 0.01 && wPos.y > 0.60) {
                    const idxPos = PalmMenu._scratchIdxPos;
                    const midPos = PalmMenu._scratchMidPos;
                    const pkyPos = PalmMenu._scratchPkyPos;

                    if (idxTip) idxTip.getWorldPosition(idxPos); else idxPos.set(0, 0, 0);
                    if (midTip) midTip.getWorldPosition(midPos); else midPos.set(0, 0, 0);
                    if (pkyTip) pkyTip.getWorldPosition(pkyPos); else pkyPos.set(0, 0, 0);

                    const dIdx = idxPos.lengthSq() > 0.01 ? wPos.distanceTo(idxPos) : 0.11;
                    const dMid = midPos.lengthSq() > 0.01 ? wPos.distanceTo(midPos) : 0.11;
                    const dPky = pkyPos.lengthSq() > 0.01 ? wPos.distanceTo(pkyPos) : 0.09;

                    // Anatomical threshold: > 7.5cm for natural, unstrained open palm
                    const fingersExtended = dIdx > 0.075 && dMid > 0.075 && dPky > 0.070;

                    const mkPos = PalmMenu._scratchMkPos;
                    const ikPos = PalmMenu._scratchIkPos;
                    const pkPos = PalmMenu._scratchPkPos;

                    if (midKnuckle) midKnuckle.getWorldPosition(mkPos); else mkPos.copy(midPos);
                    if (idxKnuckle) idxKnuckle.getWorldPosition(ikPos); else ikPos.copy(idxPos);
                    if (pkyKnuckle) pkyKnuckle.getWorldPosition(pkPos); else pkPos.copy(pkyPos);

                    const palmCenter = wPos.clone().add(mkPos).multiplyScalar(0.5);
                    const vForward = mkPos.clone().sub(wPos).normalize();
                    const vAcross = pkPos.clone().sub(ikPos).normalize();
                    const palmNormal = new THREE.Vector3().crossVectors(vAcross, vForward).normalize();

                    const camPos = PalmMenu._scratchCamPos;
                    if (this.world.camera) (this.world.camera as any).getWorldPosition(camPos);
                    const toCam = PalmMenu._scratchToCam.copy(camPos).sub(palmCenter).normalize();

                    const palmFacingUpOrCam = palmNormal.y > 0.12 || palmNormal.dot(toCam) > 0.20;

                    if (fingersExtended && palmFacingUpOrCam) {
                        isOpenAndRaised = true;
                        anchorPalmCenter = palmCenter;
                        anchorPalmNormal = palmNormal;
                        activeInteractingHand = renderer.xr.getHand ? renderer.xr.getHand(1 - h) : null;
                        break;
                    }
                }
            }
        }

        // 2. Process Interacting Hand for Finger Poke & Grabbing
        let interactingTipPos: THREE.Vector3 | null = null;
        let interactingPinchingOrFist = false;

        const pokeHand = activeInteractingHand || (renderer.xr.getHand ? renderer.xr.getHand(1) : null);
        if (pokeHand && (pokeHand as any).joints) {
            const joints = (pokeHand as any).joints;
            const rIdxTip = joints['index-finger-tip'] || joints[9] || joints[8];
            const rThumbTip = joints['thumb-tip'] || joints[4];
            const rWrist = joints['wrist'] || joints[0];

            if (rIdxTip) {
                const pos = new THREE.Vector3();
                rIdxTip.getWorldPosition(pos);
                if (pos.lengthSq() > 0.01) {
                    interactingTipPos = pos;
                }
            }

            if (rThumbTip && interactingTipPos) {
                const thumbPos = new THREE.Vector3();
                rThumbTip.getWorldPosition(thumbPos);
                if (thumbPos.distanceTo(interactingTipPos) < 0.05) {
                    interactingPinchingOrFist = true;
                }
            }

            if (rWrist && interactingTipPos) {
                const wPos = new THREE.Vector3();
                rWrist.getWorldPosition(wPos);
                if (interactingTipPos.distanceTo(wPos) < 0.10) {
                    interactingPinchingOrFist = true;
                }
            }
        }

        // Fallback for VR controllers if joints are not available
        if (!interactingTipPos) {
            for (let c = 0; c < 2; c++) {
                const ctrl = renderer.xr.getController ? renderer.xr.getController(c) : null;
                if (ctrl && ctrl.position.lengthSq() > 0.01) {
                    ctrl.updateMatrixWorld(true);
                    const ctrlPos = new THREE.Vector3();
                    const ctrlQuat = new THREE.Quaternion();
                    ctrl.getWorldPosition(ctrlPos);
                    ctrl.getWorldQuaternion(ctrlQuat);
                    interactingTipPos = ctrlPos.clone().add(new THREE.Vector3(0, 0, -0.10).applyQuaternion(ctrlQuat));
                    break;
                }
            }
        }

        // 3. Palm Menu Open / Close Stability State Machine
        if (isOpenAndRaised) {
            this.palmStabilityCounter = Math.min(this.OPEN_FRAMES, this.palmStabilityCounter + 1);
            this.closeCounter = 0;
        } else {
            this.closeCounter = Math.min(this.CLOSE_FRAMES, this.closeCounter + 1);
            if (this.closeCounter >= this.CLOSE_FRAMES) {
                this.palmStabilityCounter = 0;
            }
        }

        if (this.palmStabilityCounter >= this.OPEN_FRAMES) {
            if (!this.isPalmOpen) this.openPalmMenu();
        } else if (this.closeCounter >= this.CLOSE_FRAMES && this.isPalmOpen) {
            this.closePalmMenu();
        }

        // 4. Anchor Palm Menu above Active Palm
        if (this.isPalmOpen && anchorPalmCenter && anchorPalmNormal) {
            const targetPos = PalmMenu._scratchTargetPos.copy(anchorPalmCenter).addScaledVector(anchorPalmNormal, 0.08);
            this.palmGroup.position.lerp(targetPos, 0.28);

            if (this.world.camera) {
                const camPos = PalmMenu._scratchCamPos;
                (this.world.camera as any).getWorldPosition(camPos);
                this.palmGroup.lookAt(camPos);
            }
        }

        // Scale animation
        const targetScale = this.isPalmOpen ? 1.0 : 0.0;
        this.scaleAnim = THREE.MathUtils.lerp(this.scaleAnim, targetScale, 0.22);
        this.palmGroup.scale.setScalar(this.scaleAnim);
        if (this.scaleAnim < 0.02) this.palmGroup.visible = false;

        // Hover bob animations for compact icons
        if (this.isPalmOpen) {
            this.menuItems.forEach((item, i) => {
                item.group.rotation.y = this.animTime * 0.8 + i * (Math.PI / 2);
            });
        }

        // 5. Interacting Hand Finger Poke Interactions
        if (interactingTipPos) {
            if (this.isPalmOpen && this.palmGroup.visible) {
                this.checkCompactPoke(interactingTipPos);
            }
            this.stepsExp.checkPoke(interactingTipPos);
            this.guideExp.checkPoke(interactingTipPos);
            this.bookExp.checkPoke(interactingTipPos);
            this.videoExp.checkPoke(interactingTipPos);

            // 6. Hand Grab & Repositioning for expanded 3D panels
            this.stepsExp.checkGrab(interactingTipPos, interactingPinchingOrFist);
            this.guideExp.checkGrab(interactingTipPos, interactingPinchingOrFist);
            this.bookExp.checkGrab(interactingTipPos, interactingPinchingOrFist);
            this.videoExp.checkGrab(interactingTipPos, interactingPinchingOrFist);
        }
    }

    private checkCompactPoke(pokePos: THREE.Vector3) {
        const now = Date.now();
        if (now - this.lastPokeTime < 350) return;

        for (const item of this.menuItems) {
            const iPos = new THREE.Vector3();
            item.group.getWorldPosition(iPos);
            if (pokePos.distanceTo(iPos) < 0.075) {
                this.lastPokeTime = now;
                this.audio.playBlip();
                this.openExpanded(item.tag);
                return;
            }
        }
    }

    public openExpanded(tag: MenuItemTag) {
        this.closeAllExpanded();

        // Position comfortably in front of VR camera at arm reach (0.55m)
        const camPos = new THREE.Vector3();
        const camDir = new THREE.Vector3();
        if (this.world.camera) {
            (this.world.camera as any).getWorldPosition(camPos);
            (this.world.camera as any).getWorldDirection(camDir);
        }

        const targetPos = camPos.clone().add(camDir.clone().multiplyScalar(0.55));
        targetPos.y = Math.max(1.15, Math.min(1.45, targetPos.y));

        switch (tag) {
            case 'steps': this.stepsExp.show(targetPos, camPos); break;
            case 'guide': this.guideExp.show(targetPos, camPos); break;
            case 'theory': this.bookExp.show(targetPos, camPos); break;
            case 'video':  this.videoExp.show(targetPos, camPos); break;
        }
    }

    public closeAllExpanded() {
        this.stepsExp.hide();
        this.guideExp.hide();
        this.bookExp.hide();
        this.videoExp.hide();
    }

    private openPalmMenu() {
        if (this.isPalmOpen) return;
        this.isPalmOpen = true;
        this.palmGroup.visible = true;
        this.audio.playBlip();
    }

    private closePalmMenu() {
        if (!this.isPalmOpen) return;
        this.isPalmOpen = false;
    }

    public toggleOpen() {
        if (this.isPalmOpen) {
            this.closePalmMenu();
            this.closeAllExpanded();
        } else {
            this.openPalmMenu();
            this.scaleAnim = 1.0;
            this.palmGroup.scale.set(1, 1, 1);
            if (this.world.camera) {
                const camPos = new THREE.Vector3();
                const camDir = new THREE.Vector3();
                (this.world.camera as any).getWorldPosition(camPos);
                (this.world.camera as any).getWorldDirection(camDir);
                const pos = camPos.clone().add(camDir.multiplyScalar(0.5));
                pos.y -= 0.1;
                this.palmGroup.position.copy(pos);
                this.palmGroup.lookAt(camPos);
            }
        }
    }

    public getGroup(): THREE.Group {
        return this.palmGroup;
    }

    public checkPokeAndInteract(pokePos: THREE.Vector3, _isTouching: boolean): boolean {
        let hit = false;
        hit = hit || this.stepsExp.checkPoke(pokePos);
        hit = hit || this.guideExp.checkPoke(pokePos);
        hit = hit || this.bookExp.checkPoke(pokePos);
        hit = hit || this.videoExp.checkPoke(pokePos);

        if (!hit && this.isPalmOpen && this.palmGroup.visible) {
            const now = Date.now();
            if (now - this.lastPokeTime > 350) {
                for (const item of this.menuItems) {
                    const iPos = new THREE.Vector3();
                    item.group.getWorldPosition(iPos);
                    if (pokePos.distanceTo(iPos) < 0.075) {
                        this.lastPokeTime = now;
                        this.audio.playBlip();
                        this.openExpanded(item.tag);
                        hit = true;
                        break;
                    }
                }
            }
        }
        return hit;
    }
}
