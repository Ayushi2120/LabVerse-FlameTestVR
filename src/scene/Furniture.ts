import * as THREE from 'three';
import { MaterialLibrary } from '../materials/MaterialLibrary';

export function createFurniture(materials: MaterialLibrary): THREE.Group {
    const group = new THREE.Group();

    // --- 1. MAIN CENTRAL FLAME TEST WORKBENCH ---
    const benchWidth = 2.8;
    const benchDepth = 0.85;
    const benchHeight = 0.90; // Ergonomic standard standing interaction height (0.90m)
    const benchZ = -0.9;

    // Main Countertop (Heavy chemical-resistant dark epoxy resin slab with beveled edge)
    const topGeo = new THREE.BoxGeometry(benchWidth + 0.02, 0.05, benchDepth + 0.02);
    const mainTop = new THREE.Mesh(topGeo, materials.countertop);
    mainTop.position.set(0, benchHeight - 0.025, benchZ);
    mainTop.receiveShadow = true;
    mainTop.castShadow = true;
    group.add(mainTop);

    // Countertop Bevel Bullnose Lower Apron
    const lipGeo = new THREE.BoxGeometry(benchWidth + 0.024, 0.015, benchDepth + 0.024);
    const mainLip = new THREE.Mesh(lipGeo, materials.countertop);
    mainLip.position.set(0, benchHeight - 0.045, benchZ);
    group.add(mainLip);

    // Cabinet Base below workbench (Wood laminate body with dark trim)
    const cabGeo = new THREE.BoxGeometry(benchWidth - 0.1, benchHeight - 0.14, benchDepth - 0.1);
    const cabBase = new THREE.Mesh(cabGeo, materials.wood);
    cabBase.position.set(0, (benchHeight - 0.14) / 2 + 0.09, benchZ);
    cabBase.receiveShadow = true;
    cabBase.castShadow = true;
    group.add(cabBase);

    // Architectural Ergonomic Recessed Toe-Kick (Dark recess along bottom front for comfortable standing)
    const toeKickGeo = new THREE.BoxGeometry(benchWidth - 0.1, 0.09, benchDepth - 0.22);
    const toeKick = new THREE.Mesh(toeKickGeo, new THREE.MeshStandardMaterial({ color: 0x151b22, roughness: 0.8 }));
    toeKick.position.set(0, 0.045, benchZ - 0.05);
    group.add(toeKick);

    // Cabinet Drawers & Doors Front Detailing
    const drawerCols = 4;
    const colWidth = (benchWidth - 0.2) / drawerCols;
    for (let col = 0; col < drawerCols; col++) {
        const xPos = -(benchWidth - 0.2) / 2 + colWidth / 2 + col * colWidth;

        // Top Drawer panel
        const drawerGeo = new THREE.BoxGeometry(colWidth - 0.02, 0.18, 0.02);
        const drawer = new THREE.Mesh(drawerGeo, materials.wood);
        drawer.position.set(xPos, benchHeight - 0.16, benchZ + benchDepth / 2 - 0.04);
        group.add(drawer);

        // Stainless steel handle on drawer
        const handleGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.12);
        const handle = new THREE.Mesh(handleGeo, materials.metal);
        handle.rotation.z = Math.PI / 2;
        handle.position.set(xPos, benchHeight - 0.16, benchZ + benchDepth / 2 - 0.025);
        group.add(handle);

        // Lower Cupboard door
        const doorGeo = new THREE.BoxGeometry(colWidth - 0.02, 0.55, 0.02);
        const door = new THREE.Mesh(doorGeo, materials.wood);
        door.position.set(xPos, (benchHeight - 0.20) / 2 + 0.05, benchZ + benchDepth / 2 - 0.04);
        group.add(door);

        // Door knob / vertical handle
        const doorHandle = new THREE.Mesh(handleGeo, materials.metal);
        doorHandle.position.set(xPos + colWidth / 3, (benchHeight - 0.20) / 2 + 0.05, benchZ + benchDepth / 2 - 0.025);
        group.add(doorHandle);
    }

    // --- 2. BENCH GAS TURRET & ELECTRICAL OUTLETS ---
    // Gas Turret (Brass dual-valve fixture in center rear of main bench)
    const turretGroup = new THREE.Group();
    const turretBase = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.08, 16), materials.brass);
    turretBase.position.y = 0.04;
    turretGroup.add(turretBase);

    // Dual nozzle outlets
    const nozzleL = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.05, 12), materials.brass);
    nozzleL.rotation.z = Math.PI / 2;
    nozzleL.position.set(-0.035, 0.06, 0);
    turretGroup.add(nozzleL);

    const valveKnobL = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.01, 12), materials.darkMetal);
    valveKnobL.position.set(-0.05, 0.06, 0);
    valveKnobL.rotation.z = Math.PI / 2;
    turretGroup.add(valveKnobL);

    const nozzleR = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.05, 12), materials.brass);
    nozzleR.rotation.z = Math.PI / 2;
    nozzleR.position.set(0.035, 0.06, 0);
    turretGroup.add(nozzleR);

    turretGroup.position.set(0.15, benchHeight, benchZ - 0.28);
    group.add(turretGroup);

    // Flexible Black Gas Tube from Gas Turret nozzle to Bunsen Burner inlet
    const tubeCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.10, benchHeight + 0.06, benchZ - 0.28),
        new THREE.Vector3(0.12, benchHeight + 0.02, benchZ - 0.45),
        new THREE.Vector3(0.15 + 0.015, benchHeight + 0.03, -0.85)
    ]);
    const tubeGeo = new THREE.TubeGeometry(tubeCurve, 16, 0.005, 8, false);
    const gasHose = new THREE.Mesh(tubeGeo, materials.blackRubber);
    group.add(gasHose);

    // Electrical Power Socket Box on main bench
    const socketBox = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.08, 0.06), materials.plasticBase);
    socketBox.position.set(-0.8, benchHeight + 0.04, benchZ - 0.3);
    group.add(socketBox);

    // Socket Faceplate & Outlet holes
    const socketPlateMat = new THREE.MeshStandardMaterial({
        color: 0xf4f7fa,
        roughness: 0.5,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1
    });
    const socketPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.06), socketPlateMat);
    socketPlate.position.set(-0.8, benchHeight + 0.04, benchZ - 0.268);
    group.add(socketPlate);

    // --- 3. SIDE WORKBENCH LEFT (WITH CERAMIC SINK & FAUCET) ---
    const sideBenchL = new THREE.Group();
    const sTopL = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.05, 0.7), materials.countertop);
    sTopL.position.set(-3.9, benchHeight - 0.025, -1.5);
    sideBenchL.add(sTopL);

    const sBaseL = new THREE.Mesh(new THREE.BoxGeometry(1.9, benchHeight - 0.05, 0.65), materials.wood);
    sBaseL.position.set(-3.9, (benchHeight - 0.05) / 2, -1.5);
    sideBenchL.add(sBaseL);

    // Ceramic Sink Basin inset
    const sinkBasin = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.22, 0.45), materials.ceramic);
    sinkBasin.position.set(-3.8, benchHeight - 0.11, -1.4);
    sideBenchL.add(sinkBasin);

    // Chrome Gooseneck Water Faucet
    const faucetCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-3.8, benchHeight, -1.6),
        new THREE.Vector3(-3.8, benchHeight + 0.25, -1.6),
        new THREE.Vector3(-3.8, benchHeight + 0.28, -1.45),
        new THREE.Vector3(-3.8, benchHeight + 0.22, -1.45)
    ]);
    const faucetGeo = new THREE.TubeGeometry(faucetCurve, 16, 0.012, 10, false);
    const faucetMesh = new THREE.Mesh(faucetGeo, materials.metal);
    sideBenchL.add(faucetMesh);

    // Faucet Control Handles (Hot / Cold)
    const handleCold = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.03, 12), materials.metal);
    handleCold.position.set(-3.87, benchHeight + 0.05, -1.6);
    sideBenchL.add(handleCold);

    const handleHot = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.03, 12), materials.metal);
    handleHot.position.set(-3.73, benchHeight + 0.05, -1.6);
    sideBenchL.add(handleHot);

    // --- DIGITAL ANALYTICAL BALANCE (PRECISION SCALE ON SIDE WORKBENCH) ---
    const balanceGroup = new THREE.Group();
    // Heavy base housing
    const balBase = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.30), materials.plasticBase);
    balBase.position.y = 0.03;
    balanceGroup.add(balBase);

    // Stainless steel weighing pan
    const balPan = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.006, 24), materials.metal);
    balPan.position.y = 0.063;
    balanceGroup.add(balPan);

    // Glass Draft Shield Enclosure (3-sided glass chamber with top lid)
    const draftGlass = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.26), materials.glass);
    draftGlass.position.set(0, 0.15, -0.01);
    balanceGroup.add(draftGlass);

    // Digital LED Readout Panel
    const scaleCanvas = document.createElement('canvas');
    scaleCanvas.width = 128; scaleCanvas.height = 48;
    const sctx = scaleCanvas.getContext('2d')!;
    sctx.fillStyle = '#050a10'; sctx.fillRect(0, 0, 128, 48);
    sctx.fillStyle = '#00ff66'; sctx.font = 'bold 24px monospace'; sctx.textAlign = 'center';
    sctx.fillText('0.000 g', 64, 32);
    const scaleTex = new THREE.CanvasTexture(scaleCanvas);
    const scaleDisplayMat = new THREE.MeshBasicMaterial({
        map: scaleTex,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1
    });
    const scaleDisplay = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.032), scaleDisplayMat);
    scaleDisplay.position.set(0, 0.045, 0.152);
    balanceGroup.add(scaleDisplay);

    balanceGroup.position.set(-3.9, benchHeight, -0.85);
    sideBenchL.add(balanceGroup);

    // --- PORCELAIN MORTAR & PESTLE ---
    const mortarGroup = new THREE.Group();
    const mortarBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.035, 0.05, 20), materials.ceramic);
    mortarBowl.position.y = 0.025;
    mortarGroup.add(mortarBowl);

    // Pestle grinding tool
    const pestle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.09, 12), materials.ceramic);
    pestle.position.set(0.02, 0.05, 0);
    pestle.rotation.z = Math.PI / 6;
    mortarGroup.add(pestle);

    mortarGroup.position.set(-3.9, benchHeight, -1.85);
    sideBenchL.add(mortarGroup);

    group.add(sideBenchL);

    // --- 4. SIDE WORKBENCH RIGHT (WITH FUME HOOD / VENTILATION EXHAUST) ---
    const fumeHoodGroup = new THREE.Group();
    
    // Countertop base for fume hood
    const fhBaseTop = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.8), materials.countertop);
    fhBaseTop.position.set(3.8, benchHeight - 0.025, -1.5);
    fumeHoodGroup.add(fhBaseTop);

    const fhBaseCab = new THREE.Mesh(new THREE.BoxGeometry(1.5, benchHeight - 0.05, 0.75), materials.wood);
    fhBaseCab.position.set(3.8, (benchHeight - 0.05) / 2, -1.5);
    fumeHoodGroup.add(fhBaseCab);

    // Fume Hood Housing enclosure
    const hoodBody = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.4, 0.75), materials.fumeHoodMetal);
    hoodBody.position.set(3.8, benchHeight + 0.7, -1.5);
    fumeHoodGroup.add(hoodBody);

    // Fume Hood Interior Cavity
    const hoodInner = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 0.65), materials.darkMetal);
    hoodInner.position.set(3.8, benchHeight + 0.60, -1.48);
    fumeHoodGroup.add(hoodInner);

    // Glass Sliding Sash Front
    const sash = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.8, 0.02), materials.glass);
    sash.position.set(3.8, benchHeight + 0.75, -1.13);
    fumeHoodGroup.add(sash);

    // Fume Hood Exhaust Duct extending to ceiling
    const ductCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(3.8, benchHeight + 1.4, -1.5),
        new THREE.Vector3(3.8, 3.2, -1.5)
    ]);
    const ductGeo = new THREE.TubeGeometry(ductCurve, 8, 0.12, 16, false);
    const ductMesh = new THREE.Mesh(ductGeo, materials.metal);
    fumeHoodGroup.add(ductMesh);

    group.add(fumeHoodGroup);

    // --- 5. WALL-MOUNTED GLASS CABINETS (BACK & LEFT WALLS) ---
    const createWallCabinet = (x: number, y: number, z: number, rY: number) => {
        const cabGroup = new THREE.Group();
        
        // Frame
        const frame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.35), materials.wood);
        cabGroup.add(frame);

        // Glass Front Doors
        const doorL = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.76, 0.02), materials.glass);
        doorL.position.set(-0.29, 0, 0.175);
        cabGroup.add(doorL);

        const doorR = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.76, 0.02), materials.glass);
        doorR.position.set(0.29, 0, 0.175);
        cabGroup.add(doorR);

        // Interior Wooden Shelf
        const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.02, 0.3), materials.wood);
        cabGroup.add(shelf);

        // Stored Equipment inside cabinet (Chemical bottles & flasks)
        for (let b = 0; b < 5; b++) {
            const botGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.12, 12);
            const botMat = b % 2 === 0 ? materials.amberGlass : materials.glass;
            const bottle = new THREE.Mesh(botGeo, botMat);
            bottle.position.set(-0.45 + b * 0.22, 0.07, 0.05);
            cabGroup.add(bottle);

            // Cap
            const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.03, 10), materials.blackRubber);
            cap.position.set(-0.45 + b * 0.22, 0.145, 0.05);
            cabGroup.add(cap);
        }

        cabGroup.position.set(x, y, z);
        cabGroup.rotation.y = rY;
        return cabGroup;
    };

    // Wall glass cabinet mounted cleanly on Left Side Wall ONLY (between windows, leaving all back wall charts 100% unobstructed)
    group.add(createWallCabinet(-4.8, 2.1, 0, Math.PI / 2));

    // --- 6. LABORATORY SWIVEL STOOLS ---
    const createStool = (x: number, z: number) => {
        const stoolGroup = new THREE.Group();

        // Round wooden seat with beveled edge
        const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.04, 24), materials.wood);
        seat.position.y = 0.52;
        seat.castShadow = true;
        stoolGroup.add(seat);

        // Central chrome pole with height adjusting lever
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.48, 16), materials.metal);
        pole.position.y = 0.26;
        stoolGroup.add(pole);

        // Circular chrome footrest ring
        const footrest = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.01, 8, 24), materials.metal);
        footrest.rotation.x = Math.PI / 2;
        footrest.position.y = 0.18;
        stoolGroup.add(footrest);

        // 5-star dark metal base
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.22, 0.05, 16), materials.darkMetal);
        base.position.y = 0.025;
        stoolGroup.add(base);

        stoolGroup.position.set(x, 0, z);
        return stoolGroup;
    };

    group.add(createStool(-1.1, 0.2));
    group.add(createStool(1.1, 0.2));

    // --- 7. TIERED BENCH REAGENT RACK (STORAGE FOR ORGANIZED CHEMICAL REAGENTS) ---
    const reagentRackGroup = new THREE.Group();
    // 2-tier wooden step shelf
    const tier1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.02, 0.14), materials.wood);
    tier1.position.set(0, 0.05, 0);
    reagentRackGroup.add(tier1);

    const tier2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.02, 0.14), materials.wood);
    tier2.position.set(0, 0.14, -0.12);
    reagentRackGroup.add(tier2);

    const rackSidesGeo = new THREE.BoxGeometry(0.02, 0.18, 0.38);
    const rackSideL = new THREE.Mesh(rackSidesGeo, materials.wood);
    rackSideL.position.set(-0.41, 0.09, -0.06);
    reagentRackGroup.add(rackSideL);
    const rackSideR = new THREE.Mesh(rackSidesGeo, materials.wood);
    rackSideR.position.set(0.41, 0.09, -0.06);
    reagentRackGroup.add(rackSideR);

    // Chemical bottles on reagent rack
    for (let i = 0; i < 5; i++) {
        // Lower tier (amber borosilicate bottles)
        const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.09, 12), materials.amberGlass);
        b1.position.set(-0.30 + i * 0.15, 0.105, 0);
        reagentRackGroup.add(b1);
        const c1 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 10), materials.blackRubber);
        c1.position.set(-0.30 + i * 0.15, 0.16, 0);
        reagentRackGroup.add(c1);

        // Upper tier (clear borosilicate reagent flasks)
        const b2 = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.08, 12), materials.glass);
        b2.position.set(-0.30 + i * 0.15, 0.19, -0.12);
        reagentRackGroup.add(b2);
        const c2 = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.018, 10), materials.ceramic);
        c2.position.set(-0.30 + i * 0.15, 0.239, -0.12);
        reagentRackGroup.add(c2);
    }
    reagentRackGroup.position.set(3.8, benchHeight, -0.85); // Neatly arranged on side bench
    group.add(reagentRackGroup);

    return group;
}
