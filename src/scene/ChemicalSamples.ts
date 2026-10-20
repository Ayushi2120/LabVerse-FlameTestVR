import * as THREE from 'three';
import { MaterialLibrary } from '../materials/MaterialLibrary';

export interface SaltSampleData {
    mesh: THREE.Mesh;
    powderColor: number;
    flameColor: number;
    name: string;
    formula: string;
    flameName: string;
    info: string;
    standPosition: THREE.Vector3;
    letter: string;
    mysteryName: string;
    isRevealed: boolean;
    revealOnPlaque: () => void;
    resetPlaque: () => void;
}

export function createChemicalSamples(materials: MaterialLibrary): THREE.Group {
    const group = new THREE.Group();
    group.name = "ChemicalSamplesGroup";

    // 6 Mystery flame-test salts with fixed scientific identities matching reference standards
    const samples = [
        { 
            letter: "A",
            mysteryName: "Mystery Salt A",
            name: "Lithium Chloride", 
            formula: "LiCl",
            powderColor: 0xfafafa, 
            flameColor: 0xe11d48, // Crimson carmine red
            flameName: "Crimson Red",
            accentColor: "#e11d48",
            info: "Lithium ions produce a characteristic crimson red emission at 671 nm in a flame test. Commonly used in heat-resistant ceramics and batteries." 
        },
        { 
            letter: "B",
            mysteryName: "Mystery Salt B",
            name: "Sodium Chloride", 
            formula: "NaCl",
            powderColor: 0xffffff, 
            flameColor: 0xffb700, // Intense golden yellow
            flameName: "Golden Yellow",
            accentColor: "#ffb700",
            info: "Sodium ions produce a characteristic intense golden yellow emission in a flame test due to the strong 589 nm D-line doublet. Commonly known as table salt." 
        },
        { 
            letter: "C",
            mysteryName: "Mystery Salt C",
            name: "Potassium Chloride", 
            formula: "KCl",
            powderColor: 0xf5f0fa, 
            flameColor: 0xa855f7, // Pale lilac / violet
            flameName: "Pale Lilac / Violet",
            accentColor: "#a855f7",
            info: "Potassium ions produce a characteristic pale lilac/violet emission at 404 nm in a flame test. Widely used in fertilizers and medicine." 
        },
        { 
            letter: "D",
            mysteryName: "Mystery Salt D",
            name: "Calcium Chloride", 
            formula: "CaCl₂",
            powderColor: 0xf8f5ee, 
            flameColor: 0xf97316, // Orange-red / brick red
            flameName: "Brick Red / Orange-Red",
            accentColor: "#f97316",
            info: "Calcium ions produce a characteristic orange-red / brick red emission at 622 nm in a flame test. Widely used as a drying and de-icing agent." 
        },
        { 
            letter: "E",
            mysteryName: "Mystery Salt E",
            name: "Copper(II) Chloride", 
            formula: "CuCl₂",
            powderColor: 0x9be0c8, // Light powder tint
            flameColor: 0x00f5d4, // Vivid blue-green / turquoise
            flameName: "Blue-Green",
            accentColor: "#00f5d4",
            info: "Copper(II) ions produce a characteristic blue-green emission at 510 nm in a flame test. Extensively used in pyrotechnics and chemical catalysts." 
        },
        { 
            letter: "F",
            mysteryName: "Mystery Salt F",
            name: "Strontium Chloride", 
            formula: "SrCl₂",
            powderColor: 0xffffff, // Crystalline white salt
            flameColor: 0xff173d, // Intense brilliant scarlet / crimson red
            flameName: "Scarlet / Crimson Red",
            accentColor: "#ff173d",
            info: "Strontium ions produce a characteristic intense scarlet / crimson red emission in a flame test, with dominant emission bands at 606 nm and 660–680 nm. Extensively utilized in road flares, fireworks, and advanced optical atomic clocks." 
        }
    ];

    // Arc layout on the workbench (table top at y = 0.90)
    // Physical separation of ~13 cm prevents accidental adjacent dipping and eliminates overlap with wire rack
    const standPositions = [
        new THREE.Vector3(-0.78, 0.90, -0.65), // Salt A (LiCl)
        new THREE.Vector3(-0.65, 0.90, -0.70), // Salt B (NaCl)
        new THREE.Vector3(-0.52, 0.90, -0.74), // Salt C (KCl)
        new THREE.Vector3(-0.39, 0.90, -0.74), // Salt D (CaCl₂)
        new THREE.Vector3(-0.27, 0.90, -0.70), // Salt E (CuCl₂)
        new THREE.Vector3(-0.15, 0.90, -0.65)  // Salt F (SrCl₂)
    ];

    // Shared reusable geometries to minimize draw calls and GPU memory on Meta Quest
    const standPedestalGeo = new THREE.CylinderGeometry(0.046, 0.050, 0.020, 24);
    const dishBodyGeo = new THREE.CylinderGeometry(0.036, 0.032, 0.012, 24);
    const dishRimGeo = new THREE.TorusGeometry(0.035, 0.0025, 8, 24);
    dishRimGeo.rotateX(Math.PI / 2);

    const standPedestalMat = new THREE.MeshStandardMaterial({
        color: 0x1f2937, // Sleek slate graphite pedestal
        metalness: 0.5,
        roughness: 0.35
    });

    // Neutral consistent trim ring for all mystery stands — zero flame color spoilers
    const neutralTrimMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        metalness: 0.7,
        roughness: 0.3
    });

    const dishCeramicMat = new THREE.MeshStandardMaterial({
        color: 0xf4f6f8,
        metalness: 0.1,
        roughness: 0.2
    });

    const saltSamplesData: SaltSampleData[] = [];

    samples.forEach((sample, index) => {
        const standPos = standPositions[index];
        const standGroup = new THREE.Group();
        standGroup.position.copy(standPos);

        // 1. Individual 3D Stand Pedestal
        const pedestal = new THREE.Mesh(standPedestalGeo, standPedestalMat);
        pedestal.position.y = 0.010;
        pedestal.receiveShadow = true;
        standGroup.add(pedestal);

        // Neutral Trim Ring (consistent across all stands)
        const trimRing = new THREE.Mesh(new THREE.CylinderGeometry(0.047, 0.047, 0.003, 24), neutralTrimMat);
        trimRing.position.y = 0.019;
        standGroup.add(trimRing);

        // 2. Realistic Container (Watch Glass / Shallow Dish)
        const dish = new THREE.Mesh(dishBodyGeo, dishCeramicMat);
        dish.position.y = 0.025;
        dish.receiveShadow = true;
        standGroup.add(dish);

        const dishRim = new THREE.Mesh(dishRimGeo, dishCeramicMat);
        dishRim.position.y = 0.031;
        standGroup.add(dishRim);

        // 3. Visible Salt Crystals / Powder Mound
        const saltGeo = new THREE.SphereGeometry(0.028, 12, 10);
        const positions = saltGeo.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const y = positions.getY(i);
            if (y < 0) {
                positions.setY(i, 0);
            } else {
                positions.setY(i, y * 0.42);
                positions.setX(i, positions.getX(i) * 0.88);
                positions.setZ(i, positions.getZ(i) * 0.88);
            }
        }
        saltGeo.computeVertexNormals();

        const saltMat = materials.getChemicalMaterial(sample.powderColor);
        const saltMesh = new THREE.Mesh(saltGeo, saltMat);
        saltMesh.position.y = 0.028;
        saltMesh.userData = {
            isSaltSample: true,
            sampleIndex: index,
            letter: sample.letter,
            mysteryName: sample.mysteryName,
            name: sample.name,
            formula: sample.formula
        };
        standGroup.add(saltMesh);

        // 4. Dedicated 3D Angled Nameplate Label Mounted to Stand Front
        // Neutral mystery challenge design initially: NO formulas, NO names, NO flame colors
        const canvas = document.createElement('canvas');
        canvas.width = 384;
        canvas.height = 128;
        const ctx = canvas.getContext('2d')!;

        const drawNeutralPlaque = () => {
            // Dark graphite slate background
            ctx.fillStyle = '#0a101d';
            ctx.fillRect(0, 0, 384, 128);

            // Neutral cyan border
            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = 6;
            ctx.strokeRect(3, 3, 378, 122);

            // Header stripe
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(8, 8, 368, 6);

            // Mystery identifier
            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 38px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(sample.mysteryName.toUpperCase(), 192, 48);

            // Neutral subtitle
            ctx.fillStyle = '#cbd5e1';
            ctx.font = 'bold 22px sans-serif';
            ctx.fillText("Unknown Compound", 192, 85);

            // Prompt
            ctx.fillStyle = '#94a3b8';
            ctx.font = 'italic 18px sans-serif';
            ctx.fillText("Test in flame to identify", 192, 110);
        };

        const drawRevealedPlaque = () => {
            // Dark background with revealed flame color accent
            ctx.fillStyle = '#0a101d';
            ctx.fillRect(0, 0, 384, 128);

            // Border matching the confirmed flame emission color
            ctx.strokeStyle = sample.accentColor;
            ctx.lineWidth = 6;
            ctx.strokeRect(3, 3, 378, 122);

            ctx.fillStyle = sample.accentColor;
            ctx.fillRect(8, 8, 368, 6);

            // Identified Chemical Formula
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 40px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`IDENTIFIED: ${sample.formula}`, 192, 45);

            // Chemical Name
            ctx.fillStyle = '#cbd5e1';
            ctx.font = 'bold 22px sans-serif';
            ctx.fillText(sample.name, 192, 82);

            // Flame color badge
            ctx.fillStyle = sample.accentColor;
            ctx.font = 'bold 19px sans-serif';
            ctx.fillText(`Flame: ${sample.flameName}`, 192, 108);
        };

        drawNeutralPlaque();

        const labelTex = new THREE.CanvasTexture(canvas);
        labelTex.colorSpace = THREE.SRGBColorSpace;

        const labelPlaqueGeo = new THREE.BoxGeometry(0.096, 0.038, 0.005);
        const labelFaceMat = new THREE.MeshBasicMaterial({ map: labelTex });
        const labelBodyMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.6, roughness: 0.3 });
        const labelPlaque = new THREE.Mesh(labelPlaqueGeo, [
            labelBodyMat, labelBodyMat, labelBodyMat, labelBodyMat, labelFaceMat, labelBodyMat
        ]);

        // Angle the label at ~35 degrees toward user's eye level
        labelPlaque.position.set(0, 0.022, 0.052);
        labelPlaque.rotation.x = -Math.PI / 5;
        standGroup.add(labelPlaque);

        group.add(standGroup);

        const sampleEntry: SaltSampleData = {
            mesh: saltMesh,
            powderColor: sample.powderColor,
            flameColor: sample.flameColor,
            name: sample.name,
            formula: sample.formula,
            flameName: sample.flameName,
            info: sample.info,
            standPosition: standPos,
            letter: sample.letter,
            mysteryName: sample.mysteryName,
            isRevealed: false,
            revealOnPlaque: () => {
                sampleEntry.isRevealed = true;
                drawRevealedPlaque();
                labelTex.needsUpdate = true;
            },
            resetPlaque: () => {
                sampleEntry.isRevealed = false;
                drawNeutralPlaque();
                labelTex.needsUpdate = true;
            }
        };

        saltSamplesData.push(sampleEntry);
    });

    group.userData.saltSamples = saltSamplesData;
    return group;
}
