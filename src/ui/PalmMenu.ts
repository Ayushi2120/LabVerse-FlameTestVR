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

export type MenuItemTag = 'steps' | 'guide' | 'theory' | 'video' | 'observations' | 'experiments';

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

function buildObservationIcon(): THREE.Group {
    const g = new THREE.Group();

    // Clipboard backing board (machined dark titanium)
    const board = new THREE.Mesh(
        new THREE.BoxGeometry(0.030, 0.040, 0.0022),
        AssetMaterials.darkTitanium
    );
    g.add(board);

    // Beveled brass binder clamp on top
    const clamp = new THREE.Mesh(
        new THREE.BoxGeometry(0.018, 0.006, 0.004),
        AssetMaterials.polishedBrass
    );
    clamp.position.set(0, 0.018, 0.002);
    g.add(clamp);

    // Holographic luminescent data grid display surface
    const gridMat = new THREE.MeshStandardMaterial({
        color: 0x0a192f,
        emissive: 0x00e5ff,
        emissiveIntensity: 0.45,
        roughness: 0.2,
        metalness: 0.8
    });
    const grid = new THREE.Mesh(new THREE.PlaneGeometry(0.026, 0.032), gridMat);
    grid.position.set(0, -0.002, 0.0013);
    g.add(grid);

    // Miniature horizontal ledger rules
    const lineMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    for (let i = 0; i < 4; i++) {
        const line = new THREE.Mesh(new THREE.PlaneGeometry(0.020, 0.001), lineMat);
        line.position.set(0, 0.009 - i * 0.006, 0.0016);
        g.add(line);
    }

    // Little glowing LED indicator dot on clamp
    const led = new THREE.Mesh(
        new THREE.SphereGeometry(0.0016, 12, 10),
        new THREE.MeshBasicMaterial({ color: 0x00ff88 })
    );
    led.position.set(0.006, 0.018, 0.0042);
    g.add(led);

    return g;
}

function buildExperimentsIcon(): THREE.Group {
    const g = new THREE.Group();

    // Borosilicate Erlenmeyer Conical Flask
    const bodyGeo = new THREE.CylinderGeometry(0.006, 0.018, 0.026, 24);
    const bodyMesh = new THREE.Mesh(bodyGeo, AssetMaterials.opticalGlass);
    bodyMesh.position.y = -0.004;
    g.add(bodyMesh);

    // Cylindrical neck with beaded rim
    const neck = new THREE.Mesh(
        new THREE.CylinderGeometry(0.005, 0.005, 0.014, 20),
        AssetMaterials.opticalGlass
    );
    neck.position.y = 0.013;
    g.add(neck);

    const rim = new THREE.Mesh(
        new THREE.TorusGeometry(0.0056, 0.0012, 8, 20),
        AssetMaterials.polishedBrass
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.020;
    g.add(rim);

    // Luminescent quantum chemical fluid inside flask
    const liquid = new THREE.Mesh(
        new THREE.CylinderGeometry(0.005, 0.016, 0.014, 20),
        new THREE.MeshStandardMaterial({
            color: 0x00e5ff,
            emissive: 0x0088cc,
            emissiveIntensity: 1.4,
            roughness: 0.1,
            metalness: 0.2,
            transparent: true,
            opacity: 0.88
        })
    );
    liquid.position.y = -0.009;
    g.add(liquid);

    // Tilted orbital discovery rings
    const ring1 = new THREE.Mesh(
        new THREE.TorusGeometry(0.021, 0.001, 8, 28),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 })
    );
    ring1.rotation.x = Math.PI / 3;
    ring1.rotation.y = Math.PI / 6;
    g.add(ring1);

    const ring2 = new THREE.Mesh(
        new THREE.TorusGeometry(0.019, 0.0008, 6, 24),
        new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.75 })
    );
    ring2.rotation.x = -Math.PI / 4;
    ring2.rotation.z = Math.PI / 4;
    g.add(ring2);

    return g;
}

function buildWristButtonMesh(): THREE.Group {
    const g = new THREE.Group();
    g.name = 'WristButtonMeshGroup';

    // Outer smartwatch bezel / titanium chassis
    const chassis = new THREE.Mesh(
        new THREE.CylinderGeometry(0.021, 0.023, 0.006, 32),
        AssetMaterials.darkTitanium
    );
    chassis.rotation.x = Math.PI / 2;
    g.add(chassis);

    // Knurled decorative brass bezel ring
    const bezel = new THREE.Mesh(
        new THREE.TorusGeometry(0.021, 0.0015, 12, 32),
        AssetMaterials.knurledBrass
    );
    g.add(bezel);

    // Dark dial face
    const dialFace = new THREE.Mesh(
        new THREE.CircleGeometry(0.0195, 32),
        new THREE.MeshStandardMaterial({
            color: 0x060d17,
            roughness: 0.2,
            metalness: 0.8
        })
    );
    dialFace.position.z = 0.0032;
    g.add(dialFace);

    // Illuminated holographic core emblem (pulsing cyan ring)
    const coreRing = new THREE.Mesh(
        new THREE.RingGeometry(0.008, 0.014, 24),
        new THREE.MeshBasicMaterial({
            color: 0x00e5ff,
            side: THREE.DoubleSide
        })
    );
    coreRing.position.z = 0.0034;
    g.add(coreRing);

    // Center jewel emitter
    const centerJewel = new THREE.Mesh(
        new THREE.SphereGeometry(0.004, 16, 12),
        new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00e5ff,
            emissiveIntensity: 1.5,
            roughness: 0.1
        })
    );
    centerJewel.position.z = 0.004;
    g.add(centerJewel);

    // Convex sapphire crystal cover
    const sapphireCover = new THREE.Mesh(
        new THREE.SphereGeometry(0.020, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.25),
        AssetMaterials.sapphireLens
    );
    sapphireCover.position.z = -0.014;
    sapphireCover.rotation.x = Math.PI;
    g.add(sapphireCover);

    // Floating text label sprite
    const spr = labelSprite('⚡ MENU', '#00e5ff');
    spr.scale.set(0.055, 0.014, 1);
    spr.position.set(0, 0.030, 0.004);
    g.add(spr);

    g.userData.isWristButton = true;
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

    public handleClick(hitObj: THREE.Object3D, _point?: THREE.Vector3): boolean {
        if (!this.group.visible) return false;
        let cur: THREE.Object3D | null = hitObj;
        while (cur) {
            if (cur === this.closeMesh || cur.userData?.isPalmClose) {
                this.audio.playBlip();
                this.hide();
                return true;
            }
            if (cur === this.nextBtn || cur.userData?.isStepsNext) {
                this.selectedStep = (this.selectedStep + 1) % this.steps.length;
                this.audio.playBlip();
                this.renderStepText();
                return true;
            }
            if (cur === this.backBtn || cur.userData?.isStepsBack) {
                this.selectedStep = (this.selectedStep - 1 + this.steps.length) % this.steps.length;
                this.audio.playBlip();
                this.renderStepText();
                return true;
            }
            cur = cur.parent;
        }
        return false;
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

    public handleClick(hitObj: THREE.Object3D, _point?: THREE.Vector3): boolean {
        if (!this.group.visible) return false;
        let cur: THREE.Object3D | null = hitObj;
        while (cur) {
            if (cur === this.closeMesh || cur.userData?.isPalmClose) {
                this.audio.playBlip();
                this.hide();
                return true;
            }
            if (cur === this.nextBtn || cur.userData?.isGuideNext) {
                this.selectedGesture = (this.selectedGesture + 1) % this.gestures.length;
                this.audio.playBlip();
                this.renderGestureText();
                return true;
            }
            if (cur === this.backBtn || cur.userData?.isGuideBack) {
                this.selectedGesture = (this.selectedGesture - 1 + this.gestures.length) % this.gestures.length;
                this.audio.playBlip();
                this.renderGestureText();
                return true;
            }
            cur = cur.parent;
        }
        return false;
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

    public handleClick(hitObj: THREE.Object3D, _point?: THREE.Vector3): boolean {
        if (!this.group.visible) return false;
        let cur: THREE.Object3D | null = hitObj;
        while (cur) {
            if (cur === this.closeMesh || cur.userData?.isPalmClose) {
                this.audio.playBlip();
                this.hide();
                return true;
            }
            if (cur === this.nextBtn || cur.userData?.isBookNext) {
                if (this.currentPage < this.pages.length - 1 && !this.isFlipping) {
                    this.isFlipping = true;
                    this.flipDirection = 'next';
                    this.flipProgress = 0;
                    this.turningPageGroup.visible = true;
                    this.audio.playBlip();
                }
                return true;
            }
            if (cur === this.prevBtn || cur.userData?.isBookPrev) {
                if (this.currentPage > 0 && !this.isFlipping) {
                    this.isFlipping = true;
                    this.flipDirection = 'prev';
                    this.flipProgress = 0;
                    this.turningPageGroup.visible = true;
                    this.audio.playBlip();
                }
                return true;
            }
            cur = cur.parent;
        }
        return false;
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

    public handleClick(hitObj: THREE.Object3D, _point?: THREE.Vector3): boolean {
        if (!this.group.visible) return false;
        let cur: THREE.Object3D | null = hitObj;
        while (cur) {
            if (cur === this.closeMesh || cur.userData?.isPalmClose) {
                this.audio.playBlip();
                this.hide();
                return true;
            }
            if (cur === this.playBtn) {
                this.isPlaying = !this.isPlaying;
                this.audio.playBlip();
                this.renderScreen();
                return true;
            }
            cur = cur.parent;
        }
        return false;
    }
}

// ─────────────────────────────────────────────────────────────
//  EXPANDED CONTENT 5: OBSERVATION TABLE (LIVE CATION LEDGER)
// ─────────────────────────────────────────────────────────────

export class ObservationExpanded {
    public group: THREE.Group;
    private audio: AudioEngine;
    private closeMesh: THREE.Mesh;
    private refreshBtn: THREE.Mesh;
    private boardMesh: THREE.Mesh;
    private canvas: HTMLCanvasElement;
    private canvasTexture: THREE.CanvasTexture;

    private isGrabbed = false;
    private grabOffset = new THREE.Vector3();
    private lastPokeTime = 0;

    // Live observations from LabBook3D
    private observationsMap: Map<string, any> = new Map();

    private readonly defaultSalts = [
        { letter: 'A', name: 'Lithium Chloride', formula: 'LiCl', flameColor: 0xe60033, flameHex: '#e60033', flameName: 'Crimson Red' },
        { letter: 'B', name: 'Sodium Chloride', formula: 'NaCl', flameColor: 0xffb700, flameHex: '#ffb700', flameName: 'Intense Yellow-Orange' },
        { letter: 'C', name: 'Potassium Chloride', formula: 'KCl', flameColor: 0xc896ff, flameHex: '#c896ff', flameName: 'Lilac / Pale Violet' },
        { letter: 'D', name: 'Calcium Chloride', formula: 'CaCl₂', flameColor: 0xff4500, flameHex: '#ff4500', flameName: 'Brick Red-Orange' },
        { letter: 'E', name: 'Strontium Chloride', formula: 'SrCl₂', flameColor: 0xff1a1a, flameHex: '#ff1a1a', flameName: 'Deep Scarlet' },
        { letter: 'F', name: 'Copper(II) Sulfate', formula: 'CuSO₄', flameColor: 0x00ffcc, flameHex: '#00ffcc', flameName: 'Emerald Blue-Green' },
    ];

    constructor(scene: THREE.Scene, audio: AudioEngine) {
        this.audio = audio;
        this.group = new THREE.Group();
        this.group.name = 'ObservationExpanded';
        this.group.visible = false;

        // Titanium back chassis
        const frameGeo = new THREE.BoxGeometry(0.63, 0.45, 0.008);
        const frameMat = AssetMaterials.darkTitanium;
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.z = -0.005;
        this.group.add(frame);

        // Cyan glowing border
        const borderGeo = new THREE.BoxGeometry(0.636, 0.456, 0.004);
        const borderMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, wireframe: true });
        const border = new THREE.Mesh(borderGeo, borderMat);
        border.position.z = -0.003;
        this.group.add(border);

        // Top grab bar
        const grabBarGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.52, 16);
        grabBarGeo.rotateZ(Math.PI / 2);
        const grabBarMat = AssetMaterials.brushedSteel;
        const grabBar = new THREE.Mesh(grabBarGeo, grabBarMat);
        grabBar.position.set(0, 0.215, 0.005);
        this.group.add(grabBar);

        // High resolution 2D Canvas for table
        this.canvas = document.createElement('canvas');
        this.canvas.width = 1024;
        this.canvas.height = 720;
        this.canvasTexture = new THREE.CanvasTexture(this.canvas);
        this.canvasTexture.colorSpace = THREE.SRGBColorSpace;

        const boardGeo = new THREE.PlaneGeometry(0.61, 0.43);
        const boardMat = new THREE.MeshBasicMaterial({ map: this.canvasTexture, transparent: true });
        this.boardMesh = new THREE.Mesh(boardGeo, boardMat);
        this.boardMesh.name = 'ObservationBoardMesh';
        this.boardMesh.position.z = 0.002;
        this.boardMesh.userData.isObservationPanel = true;
        this.group.add(this.boardMesh);

        // Close Button [X]
        this.closeMesh = createCloseBtn();
        this.closeMesh.position.set(0.285, 0.195, 0.008);
        this.closeMesh.userData.isObsClose = true;
        this.group.add(this.closeMesh);

        // Refresh Button
        const rfGeo = new THREE.BoxGeometry(0.065, 0.024, 0.006);
        const rfMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.7 });
        this.refreshBtn = new THREE.Mesh(rfGeo, rfMat);
        this.refreshBtn.position.set(0.21, 0.195, 0.008);
        this.refreshBtn.userData.isObsRefresh = true;

        const rfSpr = labelSprite('REFRESH ⟳', '#38bdf8');
        rfSpr.scale.set(0.06, 0.02, 1);
        rfSpr.position.z = 0.005;
        this.refreshBtn.add(rfSpr);
        this.group.add(this.refreshBtn);

        scene.add(this.group);
        this.renderTable();
    }

    public setObservations(obs: Map<string, any>) {
        if (!obs) return;
        this.observationsMap = obs;
        if (this.group.visible) {
            this.renderTable();
        }
    }

    private renderTable() {
        const c = this.canvas.getContext('2d')!;
        c.clearRect(0, 0, 1024, 720);

        // Glassmorphic background
        c.fillStyle = 'rgba(10, 18, 36, 0.95)';
        c.beginPath();
        c.roundRect(8, 8, 1008, 704, 18);
        c.fill();

        c.strokeStyle = '#00e5ff';
        c.lineWidth = 3;
        c.beginPath();
        c.roundRect(8, 8, 1008, 704, 18);
        c.stroke();

        // Header Title
        c.fillStyle = '#00e5ff';
        c.font = 'bold 30px "Inter", system-ui, sans-serif';
        c.textAlign = 'left';
        c.fillText('🔬 EXPERIMENT OBSERVATION LEDGER', 36, 52);

        c.fillStyle = '#94a3b8';
        c.font = '16px "Inter", system-ui, sans-serif';
        c.fillText('Atomic Emission Spectroscopy • Qualitative Metal Cation Identification', 36, 80);

        // Divider rule
        c.strokeStyle = 'rgba(0, 229, 255, 0.35)';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(36, 96);
        c.lineTo(988, 96);
        c.stroke();

        // Table Column Headers
        c.fillStyle = 'rgba(15, 30, 58, 0.85)';
        c.fillRect(36, 108, 952, 44);
        c.strokeStyle = 'rgba(0, 229, 255, 0.25)';
        c.strokeRect(36, 108, 952, 44);

        c.fillStyle = '#38bdf8';
        c.font = 'bold 15px "Inter", monospace';
        c.textAlign = 'left';
        c.fillText('VIAL', 56, 136);
        c.fillText('SALT / COMPOUND', 140, 136);
        c.fillText('FORMULA', 380, 136);
        c.fillText('FLAME EMISSION SPECTRUM', 530, 136);
        c.fillText('STATUS', 840, 136);

        let completedCount = 0;

        // Render 6 Rows
        this.defaultSalts.forEach((def, i) => {
            const y = 162 + i * 72;
            const isTested = this.observationsMap && this.observationsMap.has(def.letter);
            const obs = isTested ? this.observationsMap.get(def.letter) : null;
            if (isTested) completedCount++;

            // Row background zebra
            c.fillStyle = i % 2 === 0 ? 'rgba(16, 28, 52, 0.65)' : 'rgba(12, 22, 42, 0.65)';
            c.fillRect(36, y, 952, 64);
            c.strokeStyle = isTested ? 'rgba(0, 255, 136, 0.25)' : 'rgba(255, 255, 255, 0.08)';
            c.strokeRect(36, y, 952, 64);

            // Vial Badge
            c.fillStyle = isTested ? '#0284c7' : '#334155';
            c.beginPath();
            c.arc(72, y + 32, 18, 0, Math.PI * 2);
            c.fill();
            c.strokeStyle = isTested ? '#38bdf8' : '#64748b';
            c.lineWidth = 2;
            c.stroke();

            c.fillStyle = '#ffffff';
            c.font = 'bold 18px "Inter", sans-serif';
            c.textAlign = 'center';
            c.fillText(def.letter, 72, y + 38);

            // Salt Identifier
            c.textAlign = 'left';
            c.fillStyle = isTested ? '#f8fafc' : '#94a3b8';
            c.font = isTested ? 'bold 18px "Inter", sans-serif' : '17px "Inter", sans-serif';
            c.fillText(isTested ? (obs.name || def.name) : `Mystery Salt ${def.letter}`, 140, y + 38);

            // Chemical Formula
            c.fillStyle = isTested ? '#38bdf8' : '#64748b';
            c.font = '16px monospace';
            c.fillText(isTested ? (obs.formula || def.formula) : 'Unknown (M⁺Cl⁻)', 380, y + 38);

            // Flame Color Swatch & Description
            const flameColorHex = isTested ? (obs.flameColor ? '#' + Number(obs.flameColor).toString(16).padStart(6, '0') : def.flameHex) : '#475569';
            c.fillStyle = flameColorHex;
            c.beginPath();
            c.arc(546, y + 32, 12, 0, Math.PI * 2);
            c.fill();
            c.strokeStyle = isTested ? '#ffffff' : '#64748b';
            c.lineWidth = 2;
            c.stroke();

            // Swatch glow if tested
            if (isTested) {
                c.shadowColor = flameColorHex;
                c.shadowBlur = 12;
                c.beginPath();
                c.arc(546, y + 32, 12, 0, Math.PI * 2);
                c.stroke();
                c.shadowBlur = 0;
            }

            c.fillStyle = isTested ? '#f1f5f9' : '#64748b';
            c.font = '16px "Inter", sans-serif';
            c.fillText(isTested ? (obs.flameName || def.flameName) : 'Awaiting Flame Test...', 572, y + 38);

            // Status Pill
            if (isTested) {
                c.fillStyle = 'rgba(0, 255, 136, 0.16)';
                c.beginPath();
                c.roundRect(830, y + 16, 136, 32, 8);
                c.fill();
                c.strokeStyle = '#00ff88';
                c.lineWidth = 1.5;
                c.stroke();

                c.fillStyle = '#00ff88';
                c.font = 'bold 13px "Inter", sans-serif';
                c.textAlign = 'center';
                c.fillText('CONFIRMED ✓', 898, y + 37);
            } else {
                c.fillStyle = 'rgba(245, 158, 11, 0.14)';
                c.beginPath();
                c.roundRect(830, y + 16, 136, 32, 8);
                c.fill();
                c.strokeStyle = '#f59e0b';
                c.lineWidth = 1.5;
                c.stroke();

                c.fillStyle = '#f59e0b';
                c.font = 'bold 13px "Inter", sans-serif';
                c.textAlign = 'center';
                c.fillText('PENDING ⏳', 898, y + 37);
            }
        });

        // Footer Summary
        c.strokeStyle = 'rgba(0, 229, 255, 0.35)';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(36, 610);
        c.lineTo(988, 610);
        c.stroke();

        c.fillStyle = '#00e5ff';
        c.font = 'bold 16px "Inter", sans-serif';
        c.textAlign = 'left';
        c.fillText(`STATUS: ${completedCount} / 6 SALTS TESTED`, 36, 642);

        c.fillStyle = '#94a3b8';
        c.font = '14px "Inter", sans-serif';
        c.fillText('Procedure: Dip loop into 6M HCl, collect salt powder, and insert into burner oxidation zone.', 36, 672);

        c.textAlign = 'right';
        c.fillStyle = '#38bdf8';
        c.font = '14px "Inter", sans-serif';
        c.fillText('Tip: Observations update automatically in real-time as you test.', 988, 656);

        this.canvasTexture.needsUpdate = true;
    }

    public update(_delta: number) {}

    public show(pos: THREE.Vector3, lookAtPos: THREE.Vector3) {
        this.group.position.copy(pos);
        this.group.lookAt(lookAtPos);
        this.group.visible = true;
        this.isGrabbed = false;
        this.renderTable();
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
        if (now - this.lastPokeTime < 320) return false;

        const closePos = new THREE.Vector3();
        this.closeMesh.getWorldPosition(closePos);
        if (pokePos.distanceTo(closePos) < 0.08) {
            this.lastPokeTime = now;
            this.audio.playBlip();
            this.hide();
            return true;
        }

        const rfPos = new THREE.Vector3();
        this.refreshBtn.getWorldPosition(rfPos);
        if (pokePos.distanceTo(rfPos) < 0.08) {
            this.lastPokeTime = now;
            this.audio.playBlip();
            this.renderTable();
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
                if (handPos.distanceTo(center) < 0.35) {
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

    public handleClick(hitObj: THREE.Object3D, point?: THREE.Vector3): boolean {
        if (!this.group.visible) return false;

        let cur: THREE.Object3D | null = hitObj;
        while (cur) {
            if (cur === this.closeMesh || cur.userData?.isObsClose) {
                this.audio.playBlip();
                this.hide();
                return true;
            }
            if (cur === this.refreshBtn || cur.userData?.isObsRefresh) {
                this.audio.playBlip();
                this.renderTable();
                return true;
            }
            if (cur === this.boardMesh || cur.userData?.isObservationPanel) {
                if (point) {
                    const localPt = this.boardMesh.worldToLocal(point.clone());
                    if (localPt.x > 0.22 && localPt.y > 0.16) {
                        this.audio.playBlip();
                        this.hide();
                        return true;
                    }
                    if (localPt.x > 0.15 && localPt.y > 0.16) {
                        this.audio.playBlip();
                        this.renderTable();
                        return true;
                    }
                }
                this.audio.playBlip();
                this.renderTable();
                return true;
            }
            cur = cur.parent;
        }
        return false;
    }
}

// ─────────────────────────────────────────────────────────────
//  EXPANDED CONTENT 6: EXPERIMENTS DIRECTORY (TOPIC SELECTOR)
// ─────────────────────────────────────────────────────────────

export interface ExperimentTopic {
    id: string;
    name: string;
    subject: string;
    status: 'ACTIVE' | 'AVAILABLE' | 'PLANNED';
    statusText: string;
    description: string;
    objectives: string[];
    equipment: string[];
    isAvailable: boolean;
    url?: string;
}

export class ExperimentsExpanded {
    public group: THREE.Group;
    private audio: AudioEngine;
    private closeMesh: THREE.Mesh;
    private boardMesh: THREE.Mesh;
    private canvas: HTMLCanvasElement;
    private canvasTexture: THREE.CanvasTexture;

    private isGrabbed = false;
    private grabOffset = new THREE.Vector3();
    private lastPokeTime = 0;

    private selectedIndex = 0;
    private confirmModal: 'restart' | 'switch_litmus' | null = null;
    private onRestartCallback: (() => void) | null = null;

    private readonly topics: ExperimentTopic[] = [
        {
            id: 'flame',
            name: 'Flame Test: Metal Cations',
            subject: 'Chemistry // Atomic Emission Spectroscopy',
            status: 'ACTIVE',
            statusText: 'ACTIVE WORKBENCH',
            description: 'Observe characteristic flame emission wavelengths produced when metal salts are vaporized in a high-temperature Bunsen flame.',
            objectives: [
                '• Identify unknown alkali & alkaline earth metal ions via spectral emission lines.',
                '• Understand Bohr atomic transitions: thermal energy excitation and photon emission ΔE = hc/λ.',
                '• Practice aseptic laboratory techniques and platinum wire cleaning with 6M hydrochloric acid.'
            ],
            equipment: ['Bunsen Burner', 'Platinum Wire Loop', '6M HCl Beaker', '6 Mystery Metal Salts (LiCl, NaCl, KCl, CaCl₂, SrCl₂, CuSO₄)', '3D Lab Book'],
            isAvailable: true
        },
        {
            id: 'litmus',
            name: 'Litmus Paper Acid-Base Test',
            subject: 'Chemistry // Acid-Base Indicators',
            status: 'AVAILABLE',
            statusText: 'AVAILABLE IN PROJECT',
            description: 'Examine chemical solutions using red and blue litmus test strips to determine acid-base properties and proton exchange equilibria.',
            objectives: [
                '• Differentiate acidic (pH < 7) and basic (pH > 7) solutions using colorimetric litmus indicators.',
                '• Understand conjugate acid-base reactions and indicator chromophore structure changes.',
                '• Classify unknown household and chemical reagents in a virtual wet laboratory.'
            ],
            equipment: ['Red Litmus Strips', 'Blue Litmus Strips', 'Liquid Pipette Dropper', 'Chemical Reagent Vials', 'Reaction Spot Plate'],
            isAvailable: true,
            url: './litmus.html'
        },
        {
            id: 'titration',
            name: 'Acid-Base Volumetric Titration',
            subject: 'Chemistry // Quantitative Stoichiometry',
            status: 'PLANNED',
            statusText: '🔒 IN DEVELOPMENT',
            description: 'Determine the exact molar concentration of an unknown hydrochloric acid solution using precision burette titration against standardized sodium hydroxide.',
            objectives: [
                '• Read burette volume with meniscus parallax correction to ±0.05 mL precision.',
                '• Detect equivalence point pH transition using phenolphthalein indicator.',
                '• Apply stoichiometric molar ratio equations to calculate unknown solution concentration.'
            ],
            equipment: ['50mL Precision Glass Burette', 'Erlenmeyer Flask', 'Magnetic Stirrer', 'Phenolphthalein Indicator', '0.100M Standardized NaOH Titrant'],
            isAvailable: false
        },
        {
            id: 'circuits',
            name: "Ohm's Law & Circuit Lab",
            subject: 'Physics // Electromagnetism & Circuits',
            status: 'PLANNED',
            statusText: '🔒 IN DEVELOPMENT',
            description: 'Assemble complete electrical circuits with variable DC power supply, ammeter, voltmeter, and resistive components to verify Ohm’s Law (V = IR).',
            objectives: [
                '• Wire parallel and series resistor circuits using breadboard and test leads.',
                '• Measure voltage drop and current flow simultaneously across varied resistance values.',
                '• Plot voltage vs current graphs to determine circuit resistance slope.'
            ],
            equipment: ['Regulated DC Power Supply', 'Digital Multimeter / Ammeter', 'Precision Resistor Bank', 'Connecting Banana Leads', 'Voltmeter'],
            isAvailable: false
        },
        {
            id: 'microscopy',
            name: 'Optical Cell Microscopy',
            subject: 'Biology // Cytology & Cellular Structure',
            status: 'PLANNED',
            statusText: '🔒 IN DEVELOPMENT',
            description: 'Prepare stained wet-mount glass slides and observe eukaryotic plant and animal cellular structures under high-power optical compound microscopy.',
            objectives: [
                '• Prepare stained thin-section specimen slides with coverslips without trapping air bubbles.',
                '• Master coarse and fine focus adjustments across 10x, 40x, and 100x oil immersion objectives.',
                '• Distinguish cell membranes, cell walls, nuclei, and chloroplasts in onion epidermis vs cheek cells.'
            ],
            equipment: ['Binocular Compound Microscope', 'Glass Slides & Coverslips', 'Methylene Blue & Iodine Stain', 'Specimen Forceps', 'Cellular Samples'],
            isAvailable: false
        }
    ];

    constructor(scene: THREE.Scene, audio: AudioEngine) {
        this.audio = audio;
        this.group = new THREE.Group();
        this.group.name = 'ExperimentsExpanded';
        this.group.visible = false;

        // Titanium back chassis
        const frameGeo = new THREE.BoxGeometry(0.71, 0.48, 0.008);
        const frameMat = AssetMaterials.darkTitanium;
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.z = -0.005;
        this.group.add(frame);

        // Cyan glowing border
        const borderGeo = new THREE.BoxGeometry(0.716, 0.486, 0.004);
        const borderMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true });
        const border = new THREE.Mesh(borderGeo, borderMat);
        border.position.z = -0.003;
        this.group.add(border);

        // Top grab bar
        const grabBarGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.58, 16);
        grabBarGeo.rotateZ(Math.PI / 2);
        const grabBarMat = AssetMaterials.brushedSteel;
        const grabBar = new THREE.Mesh(grabBarGeo, grabBarMat);
        grabBar.position.set(0, 0.23, 0.005);
        this.group.add(grabBar);

        // High resolution Canvas for 2-column UI
        this.canvas = document.createElement('canvas');
        this.canvas.width = 1152;
        this.canvas.height = 768;
        this.canvasTexture = new THREE.CanvasTexture(this.canvas);
        this.canvasTexture.colorSpace = THREE.SRGBColorSpace;

        const boardGeo = new THREE.PlaneGeometry(0.69, 0.46);
        const boardMat = new THREE.MeshBasicMaterial({ map: this.canvasTexture, transparent: true });
        this.boardMesh = new THREE.Mesh(boardGeo, boardMat);
        this.boardMesh.name = 'ExperimentsBoardMesh';
        this.boardMesh.position.z = 0.002;
        this.boardMesh.userData.isExperimentsPanel = true;
        this.group.add(this.boardMesh);

        // Close Button [X]
        this.closeMesh = createCloseBtn();
        this.closeMesh.position.set(0.325, 0.21, 0.008);
        this.closeMesh.userData.isExpClose = true;
        this.group.add(this.closeMesh);

        scene.add(this.group);
        this.renderDirectory();
    }

    public setOnRestartCallback(cb: () => void) {
        this.onRestartCallback = cb;
    }

    private renderDirectory() {
        const c = this.canvas.getContext('2d')!;
        c.clearRect(0, 0, 1152, 768);

        // Glassmorphic background
        c.fillStyle = 'rgba(8, 14, 28, 0.96)';
        c.beginPath();
        c.roundRect(8, 8, 1136, 752, 18);
        c.fill();

        c.strokeStyle = '#38bdf8';
        c.lineWidth = 3;
        c.beginPath();
        c.roundRect(8, 8, 1136, 752, 18);
        c.stroke();

        // Header Title
        c.fillStyle = '#38bdf8';
        c.font = 'bold 30px "Inter", system-ui, sans-serif';
        c.textAlign = 'left';
        c.fillText('🔬 LABVERSE // EXPERIMENT DIRECTORY', 36, 52);

        c.fillStyle = '#94a3b8';
        c.font = '16px "Inter", system-ui, sans-serif';
        c.fillText('Virtual Science Curriculum • Select a topic to inspect or start laboratory session', 36, 80);

        // Divider rule
        c.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(36, 96);
        c.lineTo(1116, 96);
        c.stroke();

        // Vertical column separator
        c.strokeStyle = 'rgba(56, 189, 248, 0.25)';
        c.beginPath();
        c.moveTo(456, 108);
        c.lineTo(456, 730);
        c.stroke();

        // LEFT COLUMN: TOPIC LIST
        c.fillStyle = '#94a3b8';
        c.font = 'bold 14px monospace';
        c.fillText('CURRICULUM MODULES (5)', 36, 126);

        this.topics.forEach((t, i) => {
            const y = 142 + i * 114;
            const isSelected = i === this.selectedIndex;

            // Card background
            if (isSelected) {
                c.fillStyle = 'rgba(14, 116, 144, 0.35)';
                c.beginPath();
                c.roundRect(36, y, 400, 102, 12);
                c.fill();
                c.strokeStyle = '#38bdf8';
                c.lineWidth = 2.5;
                c.stroke();
            } else {
                c.fillStyle = 'rgba(15, 23, 42, 0.65)';
                c.beginPath();
                c.roundRect(36, y, 400, 102, 12);
                c.fill();
                c.strokeStyle = 'rgba(255, 255, 255, 0.08)';
                c.lineWidth = 1;
                c.stroke();
            }

            // Subject pill
            c.fillStyle = t.status === 'ACTIVE' ? '#00ff88' : t.status === 'AVAILABLE' ? '#38bdf8' : '#64748b';
            c.font = 'bold 11px monospace';
            c.fillText(t.subject.toUpperCase(), 52, y + 26);

            // Topic Name
            c.fillStyle = isSelected ? '#ffffff' : '#e2e8f0';
            c.font = isSelected ? 'bold 17px "Inter", sans-serif' : '16px "Inter", sans-serif';
            c.fillText(t.name, 52, y + 54);

            // Status Badge
            if (t.status === 'ACTIVE') {
                c.fillStyle = 'rgba(0, 255, 136, 0.16)';
                c.beginPath();
                c.roundRect(52, y + 66, 110, 24, 6);
                c.fill();
                c.strokeStyle = '#00ff88';
                c.lineWidth = 1;
                c.stroke();
                c.fillStyle = '#00ff88';
                c.font = 'bold 11px "Inter", sans-serif';
                c.fillText('● ACTIVE NOW', 64, y + 82);
            } else if (t.status === 'AVAILABLE') {
                c.fillStyle = 'rgba(56, 189, 248, 0.16)';
                c.beginPath();
                c.roundRect(52, y + 66, 110, 24, 6);
                c.fill();
                c.strokeStyle = '#38bdf8';
                c.lineWidth = 1;
                c.stroke();
                c.fillStyle = '#38bdf8';
                c.font = 'bold 11px "Inter", sans-serif';
                c.fillText('AVAILABLE ▶', 64, y + 82);
            } else {
                c.fillStyle = 'rgba(100, 116, 139, 0.14)';
                c.beginPath();
                c.roundRect(52, y + 66, 110, 24, 6);
                c.fill();
                c.strokeStyle = '#64748b';
                c.lineWidth = 1;
                c.stroke();
                c.fillStyle = '#94a3b8';
                c.font = 'bold 11px "Inter", sans-serif';
                c.fillText('🔒 PLANNED', 64, y + 82);
            }
        });

        // RIGHT COLUMN: TOPIC DETAILS
        const sel = this.topics[this.selectedIndex];
        c.fillStyle = sel.status === 'ACTIVE' ? '#00ff88' : sel.status === 'AVAILABLE' ? '#38bdf8' : '#94a3b8';
        c.font = 'bold 13px monospace';
        c.fillText(sel.subject.toUpperCase(), 480, 130);

        c.fillStyle = '#ffffff';
        c.font = 'bold 26px "Inter", sans-serif';
        c.fillText(sel.name, 480, 168);

        // Status banner
        c.fillStyle = 'rgba(15, 30, 58, 0.85)';
        c.beginPath();
        c.roundRect(480, 186, 630, 36, 8);
        c.fill();
        c.strokeStyle = sel.status === 'ACTIVE' ? '#00ff88' : sel.status === 'AVAILABLE' ? '#38bdf8' : '#64748b';
        c.lineWidth = 1;
        c.stroke();

        c.fillStyle = sel.status === 'ACTIVE' ? '#00ff88' : sel.status === 'AVAILABLE' ? '#38bdf8' : '#94a3b8';
        c.font = 'bold 13px monospace';
        c.fillText(`STATUS: ${sel.statusText}`, 498, 209);

        // Description
        c.fillStyle = '#94a3b8';
        c.font = 'bold 14px monospace';
        c.fillText('OVERVIEW', 480, 252);

        c.fillStyle = '#e2e8f0';
        c.font = '16px "Inter", sans-serif';
        const descWords = sel.description.split(' ');
        let curLine = '';
        let lineY = 278;
        descWords.forEach(w => {
            const testLine = curLine ? `${curLine} ${w}` : w;
            if (c.measureText(testLine).width > 620) {
                c.fillText(curLine, 480, lineY);
                curLine = w;
                lineY += 26;
            } else {
                curLine = testLine;
            }
        });
        if (curLine) c.fillText(curLine, 480, lineY);

        // Learning Objectives
        lineY += 36;
        c.fillStyle = '#38bdf8';
        c.font = 'bold 14px monospace';
        c.fillText('LEARNING OBJECTIVES', 480, lineY);

        lineY += 24;
        c.fillStyle = '#cbd5e1';
        c.font = '15px "Inter", sans-serif';
        sel.objectives.forEach(obj => {
            const objWords = obj.split(' ');
            let objLine = '';
            objWords.forEach(ow => {
                const testObj = objLine ? `${objLine} ${ow}` : ow;
                if (c.measureText(testObj).width > 620) {
                    c.fillText(objLine, 480, lineY);
                    objLine = '    ' + ow;
                    lineY += 24;
                } else {
                    objLine = testObj;
                }
            });
            if (objLine) {
                c.fillText(objLine, 480, lineY);
                lineY += 28;
            }
        });

        // Action Buttons at Bottom Right
        if (sel.id === 'flame') {
            // Button 1: Resume Lab
            c.fillStyle = '#0284c7';
            c.beginPath();
            c.roundRect(480, 672, 280, 52, 10);
            c.fill();
            c.strokeStyle = '#38bdf8';
            c.lineWidth = 2;
            c.stroke();

            c.fillStyle = '#ffffff';
            c.font = 'bold 16px "Inter", sans-serif';
            c.textAlign = 'center';
            c.fillText('RESUME WORKBENCH', 620, 704);

            // Button 2: Restart Lab
            c.fillStyle = 'rgba(239, 68, 68, 0.16)';
            c.beginPath();
            c.roundRect(780, 672, 280, 52, 10);
            c.fill();
            c.strokeStyle = '#ef4444';
            c.lineWidth = 2;
            c.stroke();

            c.fillStyle = '#ef4444';
            c.font = 'bold 16px "Inter", sans-serif';
            c.fillText('RESTART EXPERIMENT ⟳', 920, 704);
            c.textAlign = 'left';
        } else if (sel.id === 'litmus') {
            c.fillStyle = '#0284c7';
            c.beginPath();
            c.roundRect(480, 672, 400, 52, 10);
            c.fill();
            c.strokeStyle = '#38bdf8';
            c.lineWidth = 2;
            c.stroke();

            c.fillStyle = '#ffffff';
            c.font = 'bold 16px "Inter", sans-serif';
            c.textAlign = 'center';
            c.fillText('START LITMUS EXPERIMENT ▶', 680, 704);
            c.textAlign = 'left';
        } else {
            // Planned experiments are locked
            c.fillStyle = 'rgba(30, 41, 59, 0.7)';
            c.beginPath();
            c.roundRect(480, 672, 440, 52, 10);
            c.fill();
            c.strokeStyle = '#475569';
            c.lineWidth = 1.5;
            c.stroke();

            c.fillStyle = '#94a3b8';
            c.font = 'bold 15px "Inter", sans-serif';
            c.textAlign = 'center';
            c.fillText('🔒 LOCKED — PLANNED IN ROADMAP', 700, 704);
            c.textAlign = 'left';
        }

        // CONFIRMATION MODAL OVERLAY
        if (this.confirmModal) {
            c.fillStyle = 'rgba(5, 10, 20, 0.88)';
            c.fillRect(0, 0, 1152, 768);

            // Modal card
            c.fillStyle = 'rgba(15, 23, 42, 0.98)';
            c.beginPath();
            c.roundRect(326, 220, 500, 320, 16);
            c.fill();

            c.strokeStyle = this.confirmModal === 'restart' ? '#ef4444' : '#38bdf8';
            c.lineWidth = 3;
            c.stroke();

            c.fillStyle = this.confirmModal === 'restart' ? '#ef4444' : '#38bdf8';
            c.font = 'bold 24px "Inter", sans-serif';
            c.textAlign = 'center';
            c.fillText(this.confirmModal === 'restart' ? 'CONFIRM LAB RESTART' : 'CONFIRM TOPIC SWITCH', 576, 276);

            c.fillStyle = '#cbd5e1';
            c.font = '16px "Inter", sans-serif';
            if (this.confirmModal === 'restart') {
                c.fillText('Are you sure you want to restart the Flame Test?', 576, 330);
                c.fillText('All collected observation data will be cleared.', 576, 360);
                c.fillText('Your current Bunsen burner and tools will be reset.', 576, 390);
            } else {
                c.fillText('Switch to the Litmus Paper Acid-Base Experiment?', 576, 330);
                c.fillText('You will be navigated to the Litmus laboratory session.', 576, 360);
                c.fillText('Flame Test status will remain preserved in your history.', 576, 390);
            }

            // Confirm Button
            c.fillStyle = this.confirmModal === 'restart' ? '#dc2626' : '#0284c7';
            c.beginPath();
            c.roundRect(360, 440, 200, 48, 8);
            c.fill();
            c.strokeStyle = this.confirmModal === 'restart' ? '#f87171' : '#38bdf8';
            c.lineWidth = 2;
            c.stroke();

            c.fillStyle = '#ffffff';
            c.font = 'bold 16px "Inter", sans-serif';
            c.fillText(this.confirmModal === 'restart' ? 'RESTART NOW' : 'SWITCH LAB ▶', 460, 470);

            // Cancel Button
            c.fillStyle = '#334155';
            c.beginPath();
            c.roundRect(592, 440, 200, 48, 8);
            c.fill();
            c.strokeStyle = '#64748b';
            c.lineWidth = 1.5;
            c.stroke();

            c.fillStyle = '#e2e8f0';
            c.font = 'bold 16px "Inter", sans-serif';
            c.fillText('CANCEL', 692, 470);
            c.textAlign = 'left';
        }

        this.canvasTexture.needsUpdate = true;
    }

    public update(_delta: number) {}

    public show(pos: THREE.Vector3, lookAtPos: THREE.Vector3) {
        this.group.position.copy(pos);
        this.group.lookAt(lookAtPos);
        this.group.visible = true;
        this.isGrabbed = false;
        this.confirmModal = null;
        this.renderDirectory();
    }

    public hide() {
        this.group.visible = false;
        this.isGrabbed = false;
        this.confirmModal = null;
    }

    public isVisible() {
        return this.group.visible;
    }

    public checkPoke(pokePos: THREE.Vector3): boolean {
        if (!this.group.visible) return false;
        const now = Date.now();
        if (now - this.lastPokeTime < 320) return false;

        const closePos = new THREE.Vector3();
        this.closeMesh.getWorldPosition(closePos);
        if (pokePos.distanceTo(closePos) < 0.08) {
            this.lastPokeTime = now;
            this.audio.playBlip();
            this.hide();
            return true;
        }

        const localPt = this.boardMesh.worldToLocal(pokePos.clone());
        if (Math.abs(localPt.x) <= 0.35 && Math.abs(localPt.y) <= 0.235) {
            this.lastPokeTime = now;
            const cx = ((localPt.x + 0.345) / 0.69) * 1152;
            const cy = ((-localPt.y + 0.23) / 0.46) * 768;
            return this.handleCanvasClick(cx, cy);
        }

        return false;
    }

    public checkGrab(handPos: THREE.Vector3, isPinchingOrFist: boolean) {
        if (!this.group.visible) return;
        const center = new THREE.Vector3();
        this.group.getWorldPosition(center);

        if (isPinchingOrFist) {
            if (!this.isGrabbed) {
                if (handPos.distanceTo(center) < 0.38) {
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

    public handleClick(hitObj: THREE.Object3D, point?: THREE.Vector3): boolean {
        if (!this.group.visible) return false;

        let cur: THREE.Object3D | null = hitObj;
        while (cur) {
            if (cur === this.closeMesh || cur.userData?.isExpClose) {
                this.audio.playBlip();
                this.hide();
                return true;
            }
            if (cur === this.boardMesh || cur.userData?.isExperimentsPanel) {
                if (point) {
                    const localPt = this.boardMesh.worldToLocal(point.clone());
                    const cx = ((localPt.x + 0.345) / 0.69) * 1152;
                    const cy = ((-localPt.y + 0.23) / 0.46) * 768;
                    return this.handleCanvasClick(cx, cy);
                }
                return true;
            }
            cur = cur.parent;
        }
        return false;
    }

    private handleCanvasClick(cx: number, cy: number): boolean {
        this.audio.playBlip();

        // 1. If Confirmation Modal is open
        if (this.confirmModal) {
            // Confirm button (360, 440, 200, 48)
            if (cx >= 360 && cx <= 560 && cy >= 440 && cy <= 488) {
                if (this.confirmModal === 'restart') {
                    this.confirmModal = null;
                    if (this.onRestartCallback) this.onRestartCallback();
                    this.hide();
                } else if (this.confirmModal === 'switch_litmus') {
                    window.location.href = './litmus.html';
                }
                return true;
            }
            // Cancel button (592, 440, 200, 48)
            if (cx >= 592 && cx <= 792 && cy >= 440 && cy <= 488) {
                this.confirmModal = null;
                this.renderDirectory();
                return true;
            }
            return true;
        }

        // 2. Left column topic items
        if (cx >= 36 && cx <= 436) {
            for (let i = 0; i < this.topics.length; i++) {
                const y = 142 + i * 114;
                if (cy >= y && cy <= y + 102) {
                    this.selectedIndex = i;
                    this.renderDirectory();
                    return true;
                }
            }
        }

        // 3. Right column actions
        const sel = this.topics[this.selectedIndex];
        if (sel.id === 'flame') {
            // Resume (480, 672, 280, 52)
            if (cx >= 480 && cx <= 760 && cy >= 672 && cy <= 724) {
                this.hide();
                return true;
            }
            // Restart (780, 672, 280, 52)
            if (cx >= 780 && cx <= 1060 && cy >= 672 && cy <= 724) {
                this.confirmModal = 'restart';
                this.renderDirectory();
                return true;
            }
        } else if (sel.id === 'litmus') {
            // Start Litmus (480, 672, 400, 52)
            if (cx >= 480 && cx <= 880 && cy >= 672 && cy <= 724) {
                this.confirmModal = 'switch_litmus';
                this.renderDirectory();
                return true;
            }
        }

        return true;
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
    private lastPokeTime = 0;

    // 3D Wrist Button Elements
    public wristButton: THREE.Group;
    private isWristLooking = false;
    private wristLookCounter = 0;
    private wristAwayCounter = 0;
    private wristBtnScale = 0;
    private closeMesh!: THREE.Mesh;

    // Expanded 3D Panels (6 Options)
    public stepsExp: StepsExpanded;
    public guideExp: GuideExpanded;
    public bookExp: BookExpanded;
    public videoExp: VideoExpanded;
    public obsExp: ObservationExpanded;
    public expExp: ExperimentsExpanded;

    private scaleAnim = 0;
    private animTime = 0;

    constructor(scene: THREE.Scene, world: World, audio: AudioEngine) {
        this.scene = scene;
        this.world = world;
        this.audio = audio;

        // Build 3D wrist button
        this.wristButton = buildWristButtonMesh();
        this.wristButton.visible = false;
        this.wristButton.scale.set(0, 0, 0);
        this.scene.add(this.wristButton);

        // Build compact wrist holographic menu group
        this.palmGroup = new THREE.Group();
        this.palmGroup.name = 'PalmMenuCompact';
        this.palmGroup.visible = false;
        this.scene.add(this.palmGroup);

        // Build expanded 3D panels
        this.stepsExp = new StepsExpanded(scene, audio);
        this.guideExp = new GuideExpanded(scene, audio);
        this.bookExp = new BookExpanded(scene, audio);
        this.videoExp = new VideoExpanded(scene, audio);
        this.obsExp = new ObservationExpanded(scene, audio);
        this.expExp = new ExperimentsExpanded(scene, audio);

        this.buildCompactItems();
    }

    public setOnRestartCallback(cb: () => void) {
        this.expExp.setOnRestartCallback(cb);
    }

    public setObservations(obs: Map<string, any>) {
        this.obsExp.setObservations(obs);
    }

    private buildCompactItems() {
        // Holographic Backing Plaque (Translucent sci-fi frosted glass)
        const plaqueGeo = new THREE.PlaneGeometry(0.24, 0.27);
        const plaqueMat = new THREE.MeshPhysicalMaterial({
            color: 0x060f1e,
            transmission: 0.85,
            roughness: 0.22,
            metalness: 0.1,
            transparent: true,
            opacity: 0.88,
            side: THREE.DoubleSide
        });
        const plaque = new THREE.Mesh(plaqueGeo, plaqueMat);
        plaque.name = 'WristMenuBackPlaque';
        plaque.userData.isWristMenuBacking = true;
        this.palmGroup.add(plaque);

        // Cybernetic rim border
        const borderGeo = new THREE.BoxGeometry(0.244, 0.274, 0.003);
        const borderMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, wireframe: true });
        const border = new THREE.Mesh(borderGeo, borderMat);
        border.position.z = -0.002;
        this.palmGroup.add(border);

        // Title Header Banner
        const titleSpr = labelSprite('LABVERSE // 3D MENU', '#00e5ff');
        titleSpr.scale.set(0.14, 0.024, 1);
        titleSpr.position.set(-0.025, 0.115, 0.005);
        this.palmGroup.add(titleSpr);

        // Close Button [X] at top-right of wrist menu plaque
        this.closeMesh = createCloseBtn();
        this.closeMesh.scale.setScalar(0.75);
        this.closeMesh.position.set(0.096, 0.115, 0.006);
        this.closeMesh.userData.isPalmClose = true;
        this.palmGroup.add(this.closeMesh);

        // 6 Options Grid (2 columns x 3 rows)
        const items: { tag: MenuItemTag; iconFn: () => THREE.Group; label: string; color: string; offset: THREE.Vector3 }[] = [
            // Row 1 (y = +0.058)
            { tag: 'steps',        iconFn: buildCylinderIcon,    label: '1. STEPS',    color: '#00e5ff', offset: new THREE.Vector3(-0.055, 0.058, 0.006) },
            { tag: 'guide',        iconFn: buildHandIcon,        label: '2. GUIDE',    color: '#00ff88', offset: new THREE.Vector3(0.055, 0.058, 0.006) },
            // Row 2 (y = -0.002)
            { tag: 'theory',       iconFn: buildBookIcon,        label: '3. THEORY',   color: '#d4af37', offset: new THREE.Vector3(-0.055, -0.002, 0.006) },
            { tag: 'video',        iconFn: buildSphereIcon,      label: '4. VIDEO',    color: '#aa88ff', offset: new THREE.Vector3(0.055, -0.002, 0.006) },
            // Row 3 (y = -0.062)
            { tag: 'observations', iconFn: buildObservationIcon, label: '5. OBSERVE',  color: '#f59e0b', offset: new THREE.Vector3(-0.055, -0.062, 0.006) },
            { tag: 'experiments',  iconFn: buildExperimentsIcon, label: '6. TOPICS',   color: '#38bdf8', offset: new THREE.Vector3(0.055, -0.062, 0.006) },
        ];

        items.forEach(({ tag, iconFn, label, color, offset }) => {
            const iconGroup = iconFn();
            iconGroup.position.copy(offset);
            iconGroup.name = `PalmIcon_${tag}`;
            iconGroup.userData.palmTag = tag;
            iconGroup.userData.isPalmIcon = true;
            this.palmGroup.add(iconGroup);

            const spr = labelSprite(label, color);
            spr.position.copy(offset).add(new THREE.Vector3(0, -0.024, 0.002));
            this.palmGroup.add(spr);

            this.menuItems.push({ tag, group: iconGroup, label: spr });
        });
    }

    // Scratch vectors for zero GC per-frame allocations
    private static _scratchWPos = new THREE.Vector3();
    private static _scratchWQuat = new THREE.Quaternion();
    private static _scratchCamPos = new THREE.Vector3();
    private static _scratchCamDir = new THREE.Vector3();
    private static _scratchToWrist = new THREE.Vector3();
    private static _scratchTargetPos = new THREE.Vector3();
    private static _scratchRightIdxPos = new THREE.Vector3();

    public update(delta: number) {
        this.animTime += delta;

        // Update all 6 expanded content animations
        this.stepsExp.update(delta);
        this.guideExp.update(delta);
        this.bookExp.update(delta);
        this.videoExp.update(delta);
        this.obsExp.update(delta);
        this.expExp.update(delta);

        const renderer = (this.world as any).renderer;
        if (!renderer?.xr?.isPresenting) {
            return;
        }

        // 1. VR Hand Tracking: Left Wrist Detection
        let leftWristFound = false;
        const leftWristPos = PalmMenu._scratchWPos;
        const leftWristQuat = PalmMenu._scratchWQuat;

        // Iterate hands to find left hand (handedness === 'left' or index 0)
        for (let h = 0; h < 2; h++) {
            const hand = renderer.xr.getHand ? renderer.xr.getHand(h) : null;
            if (!hand || !(hand as any).joints) continue;

            const handedness = (hand as any).handedness;
            const isLeft = handedness === 'left' || (handedness !== 'right' && h === 0);
            if (!isLeft) continue;

            const joints = (hand as any).joints;
            const wrist = joints['wrist'] || joints[0];
            if (wrist) {
                wrist.getWorldPosition(leftWristPos);
                wrist.getWorldQuaternion(leftWristQuat);
                if (leftWristPos.lengthSq() > 0.01) {
                    leftWristFound = true;
                    break;
                }
            }
        }

        // 2. Gaze Detection: Is the student looking at their left wrist?
        const camPos = PalmMenu._scratchCamPos;
        const camDir = PalmMenu._scratchCamDir;
        if (this.world.camera) {
            (this.world.camera as any).getWorldPosition(camPos);
            (this.world.camera as any).getWorldDirection(camDir);
        }

        let isLookingAtWristNow = false;
        if (leftWristFound) {
            const toWrist = PalmMenu._scratchToWrist.copy(leftWristPos).sub(camPos);
            const dist = toWrist.length();
            toWrist.normalize();

            const gazeDot = camDir.dot(toWrist);
            // Gaze cone: dot > 0.68 (~47°), comfortable distance 0.15m-0.75m, wrist raised above y = 0.55m
            if (gazeDot > 0.68 && dist >= 0.15 && dist <= 0.75 && leftWristPos.y > 0.55) {
                isLookingAtWristNow = true;
            }
        }

        // Hysteresis Filter: Prevents flickering from micro-movements
        if (isLookingAtWristNow) {
            this.wristLookCounter = Math.min(6, this.wristLookCounter + 1);
            this.wristAwayCounter = 0;
            if (this.wristLookCounter >= 3) {
                this.isWristLooking = true;
            }
        } else {
            this.wristAwayCounter = Math.min(20, this.wristAwayCounter + 1);
            if (this.wristAwayCounter >= 12) {
                this.wristLookCounter = Math.max(0, this.wristLookCounter - 1);
                if (this.wristLookCounter <= 1) {
                    this.isWristLooking = false;
                }
            }
        }

        // 3. Wrist Button Visibility & Positioning
        const targetBtnScale = this.isWristLooking ? 1.0 : 0.0;
        this.wristBtnScale = THREE.MathUtils.lerp(this.wristBtnScale, targetBtnScale, 0.22);
        this.wristButton.scale.setScalar(this.wristBtnScale);
        this.wristButton.visible = this.wristBtnScale > 0.02;

        if (leftWristFound && this.wristButton.visible) {
            // Position on dorsal surface of left wrist (~0.024m offset)
            const dorsalOffset = new THREE.Vector3(0, 0.024, 0).applyQuaternion(leftWristQuat);
            this.wristButton.position.copy(leftWristPos).add(dorsalOffset);
            this.wristButton.lookAt(camPos);
        }

        // 4. Right Hand Fingertip Tracking for Wrist Button & Menu Interaction
        let rightIndexTipPos: THREE.Vector3 | null = null;
        let rightPinchingOrFist = false;

        for (let h = 0; h < 2; h++) {
            const hand = renderer.xr.getHand ? renderer.xr.getHand(h) : null;
            if (!hand || !(hand as any).joints) continue;

            const handedness = (hand as any).handedness;
            const isRight = handedness === 'right' || (handedness !== 'left' && h === 1);
            if (!isRight) continue;

            const joints = (hand as any).joints;
            const idxTip = joints['index-finger-tip'] || joints[9] || joints[8];
            const thumbTip = joints['thumb-tip'] || joints[4];
            const wrist = joints['wrist'] || joints[0];

            if (idxTip) {
                const pos = PalmMenu._scratchRightIdxPos;
                idxTip.getWorldPosition(pos);
                if (pos.lengthSq() > 0.01) {
                    rightIndexTipPos = pos;
                }
            }

            if (rightIndexTipPos && thumbTip) {
                const tPos = new THREE.Vector3();
                thumbTip.getWorldPosition(tPos);
                if (tPos.distanceTo(rightIndexTipPos) < 0.05) {
                    rightPinchingOrFist = true;
                }
            }
            if (rightIndexTipPos && wrist) {
                const wPos = new THREE.Vector3();
                wrist.getWorldPosition(wPos);
                if (rightIndexTipPos.distanceTo(wPos) < 0.10) {
                    rightPinchingOrFist = true;
                }
            }
            break;
        }

        // Fallback for VR controller pointer if finger joints are not present
        if (!rightIndexTipPos) {
            for (let c = 0; c < 2; c++) {
                const ctrl = renderer.xr.getController ? renderer.xr.getController(c) : null;
                if (ctrl && ctrl.position.lengthSq() > 0.01) {
                    ctrl.updateMatrixWorld(true);
                    const ctrlPos = new THREE.Vector3();
                    const ctrlQuat = new THREE.Quaternion();
                    ctrl.getWorldPosition(ctrlPos);
                    ctrl.getWorldQuaternion(ctrlQuat);
                    rightIndexTipPos = ctrlPos.add(new THREE.Vector3(0, 0, -0.08).applyQuaternion(ctrlQuat));
                    break;
                }
            }
        }

        // 5. Right Fingertip Poke on 3D Wrist Button -> Toggle Menu
        if (rightIndexTipPos && this.wristButton.visible) {
            const now = Date.now();
            if (now - this.lastPokeTime > 350) {
                const btnPos = new THREE.Vector3();
                this.wristButton.getWorldPosition(btnPos);
                if (rightIndexTipPos.distanceTo(btnPos) < 0.048) {
                    this.lastPokeTime = now;
                    this.audio.playBlip();
                    this.toggleOpen();
                }
            }
        }

        // 6. Anchor Floating Holographic Menu to Left Wrist
        if (this.isPalmOpen && leftWristFound) {
            const dorsalOffset = new THREE.Vector3(0, 0.095, 0).applyQuaternion(leftWristQuat);
            const targetMenuPos = PalmMenu._scratchTargetPos.copy(leftWristPos).add(dorsalOffset);
            this.palmGroup.position.lerp(targetMenuPos, 0.25);
            this.palmGroup.lookAt(camPos);
        }

        // Auto-Collapse when looking away from wrist (unless an expanded panel is active or interacting)
        const isAnyPanelVisible = this.stepsExp.isVisible() || this.guideExp.isVisible() ||
                                  this.bookExp.isVisible() || this.videoExp.isVisible() ||
                                  this.obsExp.isVisible() || this.expExp.isVisible();

        let isInteractingWithMenu = false;
        if (rightIndexTipPos && this.palmGroup.visible) {
            const menuCenter = new THREE.Vector3();
            this.palmGroup.getWorldPosition(menuCenter);
            if (rightIndexTipPos.distanceTo(menuCenter) < 0.22) {
                isInteractingWithMenu = true;
            }
        }

        if (this.isPalmOpen && !this.isWristLooking && !isAnyPanelVisible && !isInteractingWithMenu) {
            if (this.wristAwayCounter >= 16) {
                this.closePalmMenu();
            }
        }

        // Menu scale animation
        const targetScale = this.isPalmOpen ? 1.0 : 0.0;
        this.scaleAnim = THREE.MathUtils.lerp(this.scaleAnim, targetScale, 0.22);
        this.palmGroup.scale.setScalar(this.scaleAnim);
        if (this.scaleAnim < 0.02) this.palmGroup.visible = false;

        // Hover bob animations for compact icons
        if (this.isPalmOpen) {
            this.menuItems.forEach((item, i) => {
                item.group.rotation.y = this.animTime * 0.8 + i * (Math.PI / 3);
            });
        }

        // 7. Process Finger Poke & Grabbing on Menu and All 6 Expanded Panels
        if (rightIndexTipPos) {
            if (this.isPalmOpen && this.palmGroup.visible) {
                this.checkCompactPoke(rightIndexTipPos);
            }
            this.stepsExp.checkPoke(rightIndexTipPos);
            this.guideExp.checkPoke(rightIndexTipPos);
            this.bookExp.checkPoke(rightIndexTipPos);
            this.videoExp.checkPoke(rightIndexTipPos);
            this.obsExp.checkPoke(rightIndexTipPos);
            this.expExp.checkPoke(rightIndexTipPos);

            // Hand grab and repositioning for 3D panels
            this.stepsExp.checkGrab(rightIndexTipPos, rightPinchingOrFist);
            this.guideExp.checkGrab(rightIndexTipPos, rightPinchingOrFist);
            this.bookExp.checkGrab(rightIndexTipPos, rightPinchingOrFist);
            this.videoExp.checkGrab(rightIndexTipPos, rightPinchingOrFist);
            this.obsExp.checkGrab(rightIndexTipPos, rightPinchingOrFist);
            this.expExp.checkGrab(rightIndexTipPos, rightPinchingOrFist);
        }
    }

    private checkCompactPoke(pokePos: THREE.Vector3) {
        const now = Date.now();
        if (now - this.lastPokeTime < 350) return;

        // Check close button [X]
        const closePos = new THREE.Vector3();
        this.closeMesh.getWorldPosition(closePos);
        if (pokePos.distanceTo(closePos) < 0.045) {
            this.lastPokeTime = now;
            this.audio.playBlip();
            this.closePalmMenu();
            return;
        }

        // Check 6 menu items
        for (const item of this.menuItems) {
            const iPos = new THREE.Vector3();
            item.group.getWorldPosition(iPos);
            if (pokePos.distanceTo(iPos) < 0.055) {
                this.lastPokeTime = now;
                this.audio.playBlip();
                this.openExpanded(item.tag);
                return;
            }
        }
    }

    public openExpanded(tag: MenuItemTag) {
        this.closeAllExpanded();

        // Position comfortably in front of student at arm reach (~0.55m)
        const camPos = new THREE.Vector3();
        const camDir = new THREE.Vector3();
        if (this.world.camera) {
            (this.world.camera as any).getWorldPosition(camPos);
            (this.world.camera as any).getWorldDirection(camDir);
        }

        const targetPos = camPos.clone().add(camDir.clone().multiplyScalar(0.55));
        targetPos.y = Math.max(1.15, Math.min(1.45, targetPos.y));

        switch (tag) {
            case 'steps':        this.stepsExp.show(targetPos, camPos); break;
            case 'guide':        this.guideExp.show(targetPos, camPos); break;
            case 'theory':       this.bookExp.show(targetPos, camPos); break;
            case 'video':        this.videoExp.show(targetPos, camPos); break;
            case 'observations': this.obsExp.show(targetPos, camPos); break;
            case 'experiments':  this.expExp.show(targetPos, camPos); break;
        }
    }

    public closeAllExpanded() {
        this.stepsExp.hide();
        this.guideExp.hide();
        this.bookExp.hide();
        this.videoExp.hide();
        this.obsExp.hide();
        this.expExp.hide();
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
                pos.y -= 0.08;
                this.palmGroup.position.copy(pos);
                this.palmGroup.lookAt(camPos);
            }
        }
    }

    public getGroup(): THREE.Group {
        return this.palmGroup;
    }

    public checkPokeAndInteract(pokePos: THREE.Vector3, _isTouching: boolean = true): boolean {
        let hit = false;
        hit = hit || this.stepsExp.checkPoke(pokePos);
        hit = hit || this.guideExp.checkPoke(pokePos);
        hit = hit || this.bookExp.checkPoke(pokePos);
        hit = hit || this.videoExp.checkPoke(pokePos);
        hit = hit || this.obsExp.checkPoke(pokePos);
        hit = hit || this.expExp.checkPoke(pokePos);

        // Check wrist button poke
        if (!hit && this.wristButton.visible) {
            const btnPos = new THREE.Vector3();
            this.wristButton.getWorldPosition(btnPos);
            if (pokePos.distanceTo(btnPos) < 0.048) {
                this.audio.playBlip();
                this.toggleOpen();
                return true;
            }
        }

        // Check compact wrist menu poke
        if (!hit && this.isPalmOpen && this.palmGroup.visible) {
            const now = Date.now();
            if (now - this.lastPokeTime > 320) {
                const closePos = new THREE.Vector3();
                this.closeMesh.getWorldPosition(closePos);
                if (pokePos.distanceTo(closePos) < 0.045) {
                    this.lastPokeTime = now;
                    this.audio.playBlip();
                    this.closePalmMenu();
                    return true;
                }

                for (const item of this.menuItems) {
                    const iPos = new THREE.Vector3();
                    item.group.getWorldPosition(iPos);
                    if (pokePos.distanceTo(iPos) < 0.055) {
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

    public handleClick(hitObj: THREE.Object3D, point?: THREE.Vector3): boolean {
        // 1. Check expanded panels
        if (this.stepsExp.isVisible() && this.stepsExp.handleClick(hitObj, point)) return true;
        if (this.guideExp.isVisible() && this.guideExp.handleClick(hitObj, point)) return true;
        if (this.bookExp.isVisible() && this.bookExp.handleClick(hitObj, point)) return true;
        if (this.videoExp.isVisible() && this.videoExp.handleClick(hitObj, point)) return true;
        if (this.obsExp.isVisible() && this.obsExp.handleClick(hitObj, point)) return true;
        if (this.expExp.isVisible() && this.expExp.handleClick(hitObj, point)) return true;

        // 2. Check wrist button click
        let cur: THREE.Object3D | null = hitObj;
        while (cur) {
            if (cur === this.wristButton || cur.userData?.isWristButton || cur.name === 'WristButtonMeshGroup') {
                this.audio.playBlip();
                this.toggleOpen();
                return true;
            }
            if (cur === this.closeMesh || cur.userData?.isPalmClose) {
                this.audio.playBlip();
                this.closePalmMenu();
                return true;
            }
            if (cur.userData?.palmTag) {
                this.audio.playBlip();
                this.openExpanded(cur.userData.palmTag);
                return true;
            }
            cur = cur.parent;
        }

        return false;
    }
}
