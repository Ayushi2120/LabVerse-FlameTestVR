import * as THREE from 'three';
import { MaterialLibrary } from '../../materials/MaterialLibrary';

export function createGlassware(materials: MaterialLibrary): THREE.Group {
    const group = new THREE.Group();

    // Helper to generate scale markings texture for cylinders / beakers
    const createGraduationTexture = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 512;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        ctx.fillRect(0, 0, 128, 512);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px sans-serif';

        for (let i = 0; i <= 10; i++) {
            const y = 460 - i * 40;
            ctx.beginPath();
            ctx.moveTo(10, y);
            ctx.lineTo(i % 5 === 0 ? 50 : 30, y);
            ctx.stroke();

            if (i % 2 === 0) {
                ctx.fillText(`${i * 10}ml`, 58, y + 8);
            }
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    };

    const gradTex = createGraduationTexture();
    const gradMat = new THREE.MeshBasicMaterial({
        map: gradTex,
        transparent: true,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1
    });

    // --- 1. WOODEN TEST TUBE RACK WITH 6 TUBES ---
    const rackGroup = new THREE.Group();
    const rackBase = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.015, 0.09), materials.wood);
    rackBase.position.y = 0.0075;
    rackGroup.add(rackBase);

    const rackTop = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.015, 0.09), materials.wood);
    rackTop.position.y = 0.11;
    rackGroup.add(rackTop);

    // Support Pillars
    const pillarL = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.11, 12), materials.wood);
    pillarL.position.set(-0.165, 0.055, 0);
    rackGroup.add(pillarL);

    const pillarR = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.11, 12), materials.wood);
    pillarR.position.set(0.165, 0.055, 0);
    rackGroup.add(pillarR);

    // 6 Solution Test Tubes
    const tubeGeo = new THREE.CylinderGeometry(0.011, 0.011, 0.14, 16);
    tubeGeo.translate(0, 0.07, 0);

    const liquidColors = [
        { color: 0xe60033, name: "LiCl Sol" },
        { color: 0xffaa00, name: "NaCl Sol" },
        { color: 0xc8a2c8, name: "KCl Sol" },
        { color: 0xe25822, name: "CaCl₂ Sol" },
        { color: 0x00e5a3, name: "CuCl₂ Sol" },
        { color: 0x4488ff, name: "Dil. HCl Wash" }
    ];

    liquidColors.forEach((lData, i) => {
        const xPos = -0.13 + i * 0.052;
        const tube = new THREE.Mesh(tubeGeo, materials.glass);
        tube.position.set(xPos, 0.015, 0);
        tube.castShadow = true;
        rackGroup.add(tube);

        // Liquid inside tube
        const liquidGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.065, 16);
        liquidGeo.translate(0, 0.0325, 0);
        const liquidMat = new THREE.MeshPhysicalMaterial({
            color: lData.color,
            transmission: 0.85,
            opacity: 0.9,
            transparent: true,
            roughness: 0.1
        });
        const liquid = new THREE.Mesh(liquidGeo, liquidMat);
        liquid.position.set(xPos, 0.018, 0);
        rackGroup.add(liquid);
    });

    rackGroup.position.set(-0.65, 0.90, -1.05);
    group.add(rackGroup);

    // --- 2. BEAKER WITH MEASURING SCALE & GLASS STIRRING ROD ---
    const beakerGroup = new THREE.Group();
    const beakerMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.11, 24, 1, true), materials.glass);
    beakerMesh.position.y = 0.055;
    beakerGroup.add(beakerMesh);

    // Bottom plate of beaker
    const beakerBottom = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.005, 24), materials.glass);
    beakerBottom.position.y = 0.0025;
    beakerGroup.add(beakerBottom);

    // Graduation Scale Decal
    const beakerScale = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.09), gradMat);
    beakerScale.position.set(0, 0.055, 0.0456);
    beakerGroup.add(beakerScale);

    // Water Liquid in Beaker
    const bLiquid = new THREE.Mesh(new THREE.CylinderGeometry(0.043, 0.043, 0.06, 20), new THREE.MeshPhysicalMaterial({ color: 0x88ddee, transmission: 0.9, opacity: 0.85, transparent: true }));
    bLiquid.position.y = 0.032;
    beakerGroup.add(bLiquid);

    // Glass Stirring Rod resting inside beaker
    const rodGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.17, 10);
    const rod = new THREE.Mesh(rodGeo, materials.glass);
    rod.position.set(0.012, 0.085, 0);
    rod.rotation.z = Math.PI / 10;
    beakerGroup.add(rod);

    beakerGroup.position.set(-0.90, 0.90, -0.90);
    group.add(beakerGroup);

    // --- 3. GRADUATED MEASURING CYLINDER ---
    const cylinderGroup = new THREE.Group();
    const cylBase = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.015, 6), materials.glass);
    cylBase.position.y = 0.0075;
    cylinderGroup.add(cylBase);

    const cylBody = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 20, 1, true), materials.glass);
    cylBody.position.y = 0.125;
    cylinderGroup.add(cylBody);

    // Scale Decal
    const cylScale = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.18), gradMat);
    cylScale.position.set(0, 0.125, 0.0206);
    cylinderGroup.add(cylScale);

    // Liquid in Cylinder
    const cylLiquid = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.12, 16), new THREE.MeshPhysicalMaterial({ color: 0x44aaff, transmission: 0.9, opacity: 0.85, transparent: true }));
    cylLiquid.position.y = 0.075;
    cylinderGroup.add(cylLiquid);

    cylinderGroup.position.set(-0.95, 0.90, -0.65);
    group.add(cylinderGroup);

    // --- 4. ERLENMEYER FLASK & WASH BOTTLE ---
    const flaskGroup = new THREE.Group();
    const flaskBody = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.055, 0.09, 20), materials.glass);
    flaskBody.position.y = 0.045;
    flaskGroup.add(flaskBody);

    const flaskNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.05, 20), materials.glass);
    flaskNeck.position.y = 0.115;
    flaskGroup.add(flaskNeck);

    const flaskLiquid = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.05, 0.04, 20), new THREE.MeshPhysicalMaterial({ color: 0x00c8ff, transmission: 0.9, opacity: 0.85, transparent: true }));
    flaskLiquid.position.y = 0.025;
    flaskGroup.add(flaskLiquid);

    flaskGroup.position.set(0.65, 0.90, -1.05);
    group.add(flaskGroup);

    // Wash Bottle (Distilled H₂O)
    const washGroup = new THREE.Group();
    const wbBody = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.13, 16), new THREE.MeshStandardMaterial({ color: 0xeeeeee, transparent: true, opacity: 0.7, roughness: 0.3 }));
    wbBody.position.y = 0.065;
    washGroup.add(wbBody);

    const wbCap = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.02, 16), new THREE.MeshStandardMaterial({ color: 0x0066cc }));
    wbCap.position.y = 0.14;
    washGroup.add(wbCap);

    const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.09, 8), new THREE.MeshStandardMaterial({ color: 0x0066cc }));
    spout.position.set(0.015, 0.17, 0);
    spout.rotation.z = -Math.PI / 4;
    washGroup.add(spout);

    washGroup.position.set(0.78, 0.90, -1.02);
    group.add(washGroup);

    // --- 5. CERAMIC EVAPORATING DISH & WATCH GLASS ---
    // Evaporating Dish (White porcelain bowl)
    const dishGroup = new THREE.Group();
    const dishMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.025, 0.025, 24), materials.ceramic);
    dishMesh.position.y = 0.0125;
    dishGroup.add(dishMesh);
    dishGroup.position.set(0.36, 0.90, -0.74);
    group.add(dishGroup);

    // Watch Glass (Curved translucent glass disk)
    const watchGlassGroup = new THREE.Group();
    const wgGeo = new THREE.CylinderGeometry(0.04, 0.038, 0.004, 24);
    const wgMesh = new THREE.Mesh(wgGeo, materials.glass);
    wgMesh.position.y = 0.002;
    watchGlassGroup.add(wgMesh);
    watchGlassGroup.position.set(0.48, 0.90, -0.74);
    group.add(watchGlassGroup);

    // Glass Pipette / Rubber Dropper
    const pipetteGroup = new THREE.Group();
    const pStem = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.0015, 0.12, 10), materials.glass);
    pipetteGroup.add(pStem);

    const pBulb = new THREE.Mesh(new THREE.SphereGeometry(0.008, 12, 12), new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.6 }));
    pBulb.position.y = 0.065;
    pipetteGroup.add(pBulb);

    pipetteGroup.position.set(0.48, 0.903, -0.73);
    pipetteGroup.rotation.z = Math.PI / 2;
    group.add(pipetteGroup);

    // --- 6. CHEMICAL WASTE CONTAINER (Moved right to x=1.18 to ensure zero overlap with Lab Book) ---
    const wasteGroup = new THREE.Group();
    const wBody = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.22, 16), materials.plasticBase);
    wBody.position.y = 0.11;
    wasteGroup.add(wBody);

    const wCap = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 16), new THREE.MeshStandardMaterial({ color: 0xcc0000 }));
    wCap.position.y = 0.235;
    wasteGroup.add(wCap);

    // Label Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 256; canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffaa00'; ctx.fillRect(0, 0, 256, 128);
    ctx.fillStyle = '#000000'; ctx.fillRect(6, 6, 244, 116);
    ctx.fillStyle = '#ffaa00'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('CHEMICAL WASTE', 128, 50);
    ctx.fillStyle = '#ffffff'; ctx.font = '18px sans-serif';
    ctx.fillText('DISPOSAL ONLY', 128, 90);

    const wLabelTex = new THREE.CanvasTexture(canvas);
    const wLabelMat = new THREE.MeshBasicMaterial({
        map: wLabelTex,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1
    });
    const wLabel = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.08), wLabelMat);
    wLabel.position.set(0, 0.12, 0.072);
    wasteGroup.add(wLabel);

    wasteGroup.position.set(1.18, 0.90, -0.75);
    group.add(wasteGroup);

    return group;
}
