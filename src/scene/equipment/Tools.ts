import * as THREE from 'three';
import { MaterialLibrary } from '../../materials/MaterialLibrary';
import { createRealisticNitrileGlovesStation, createWireGloveGrip } from './NitrileGloves';

export function createTools(materials: MaterialLibrary): THREE.Group {
    const group = new THREE.Group();

    // --- 1. PLATINUM WIRE LOOP & HOLDER RACK ---
    const wireGroup = new THREE.Group();

    // Wooden / Metal Rest Holder Rack on desk (Centered in front of burner: x = 0.00, z = -0.58)
    const rackGroup = new THREE.Group();
    const rackBase = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.06), materials.wood);
    rackBase.position.y = 0.01;
    rackGroup.add(rackBase);

    const peg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.055), materials.metal);
    peg1.position.set(-0.05, 0.0375, 0);
    rackGroup.add(peg1);

    const peg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.055), materials.metal);
    peg2.position.set(0.05, 0.0375, 0);
    rackGroup.add(peg2);

    rackGroup.position.set(0.00, 0.90, -0.58);
    group.add(rackGroup);

    // Platinum Wire Instrument
    // Handle with rubber grip
    const handleGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.18, 16);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x1a2536, roughness: 0.4, metalness: 0.3 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.x = -0.09;
    handle.rotation.z = Math.PI / 2;
    wireGroup.add(handle);

    // Handle Grip Ribs
    for (let i = 0; i < 4; i++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.0085, 0.001, 8, 16), materials.darkMetal);
        ring.position.x = -0.14 + i * 0.03;
        ring.rotation.y = Math.PI / 2;
        wireGroup.add(ring);
    }

    // 3D Nitrile Gloved Hand Gripping the Handle (visible when wire held with gloves equipped)
    const wireGloveHand = createWireGloveGrip();
    wireGloveHand.name = "WireGloveHand";
    wireGloveHand.position.set(-0.09, 0, 0);
    wireGloveHand.visible = false;
    wireGroup.add(wireGloveHand);

    // Metal Shaft
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.12, 16), materials.metal);
    shaft.position.x = 0.06;
    shaft.rotation.z = Math.PI / 2;
    wireGroup.add(shaft);

    // Platinum Wire Loop Tip
    const loopGeo = new THREE.TorusGeometry(0.010, 0.002, 12, 24);
    const loopMat = materials.metal.clone();
    (loopMat as THREE.MeshStandardMaterial).color.setHex(0xcccccc);
    const loop = new THREE.Mesh(loopGeo, loopMat);
    loop.position.x = 0.125;
    loop.rotation.x = Math.PI / 2; // Flat horizontal loop tip
    wireGroup.add(loop);

    // Position securely on desk rest rack at ergonomic 0.90m table height
    wireGroup.position.set(0.00, 0.935, -0.58);
    wireGroup.rotation.y = 0.0;
    wireGroup.scale.set(1.2, 1.2, 1.2);
    wireGroup.userData.isGrabbable = true;
    wireGroup.name = "PlatinumWire";
    group.add(wireGroup);

    // --- 2. SMALL PORCELAIN LABORATORY TRAY (Mid Right: x = 0.38, z = -0.52) ---
    const trayGroup = new THREE.Group();
    const trayBase = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.015, 0.16), materials.ceramic);
    trayBase.position.y = 0.0075;
    trayGroup.add(trayBase);

    // Tray raised rim
    const rimFront = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.02, 0.008), materials.ceramic);
    rimFront.position.set(0, 0.01, 0.076);
    trayGroup.add(rimFront);
    const rimBack = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.02, 0.008), materials.ceramic);
    rimBack.position.set(0, 0.01, -0.076);
    trayGroup.add(rimBack);
    const rimL = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.02, 0.16), materials.ceramic);
    rimL.position.set(-0.126, 0.01, 0);
    trayGroup.add(rimL);
    const rimR = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.02, 0.16), materials.ceramic);
    rimR.position.set(0.126, 0.01, 0);
    trayGroup.add(rimR);

    trayGroup.position.set(0.38, 0.90, -0.52);
    group.add(trayGroup);

    // --- 3. CRUCIBLE TONGS (STAINLESS STEEL - PLACED NEATLY INSIDE TRAY) ---
    const tongsGroup = new THREE.Group();
    
    // Left Arm with curved jaw
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.18, 10), materials.metal);
    armL.position.set(-0.010, 0, 0);
    armL.rotation.z = -0.07;
    tongsGroup.add(armL);

    // Right Arm with curved jaw
    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.18, 10), materials.metal);
    armR.position.set(0.010, 0, 0);
    armR.rotation.z = 0.07;
    tongsGroup.add(armR);

    // Center Pivot Pin
    const pivot = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.01, 10), materials.darkMetal);
    pivot.rotation.x = Math.PI / 2;
    tongsGroup.add(pivot);

    tongsGroup.position.set(0.34, 0.915, -0.52);
    tongsGroup.rotation.x = Math.PI / 2;
    tongsGroup.rotation.z = 0;
    group.add(tongsGroup);

    // --- 4. LITMUS PAPER BOOKLET & STRIPS (INSIDE TRAY BESIDE TONGS) ---
    const litmusGroup = new THREE.Group();
    
    // Booklet Cover
    const cover = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.005, 0.07), new THREE.MeshStandardMaterial({ color: 0xcc2222 }));
    cover.position.y = 0.0025;
    litmusGroup.add(cover);

    // Red & Blue Litmus Strips inside booklet
    const redStrip = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.002, 0.05), new THREE.MeshStandardMaterial({ color: 0xee4444 }));
    redStrip.position.set(-0.01, 0.006, 0.008);
    litmusGroup.add(redStrip);

    const blueStrip = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.002, 0.05), new THREE.MeshStandardMaterial({ color: 0x4488ff }));
    blueStrip.position.set(0.01, 0.006, 0.008);
    litmusGroup.add(blueStrip);

    litmusGroup.position.set(0.44, 0.915, -0.52);
    group.add(litmusGroup);

    // --- 5. TEST TUBE HOLDER (WOODEN CLAMP PEG - Front Left: x = -0.48, z = -0.50) ---
    const clampGroup = new THREE.Group();
    const clampPeg1 = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.16, 0.01), materials.wood);
    clampPeg1.position.set(-0.005, 0, 0);
    clampPeg1.rotation.z = 0.05;
    clampGroup.add(clampPeg1);

    const clampPeg2 = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.16, 0.01), materials.wood);
    clampPeg2.position.set(0.005, 0, 0);
    clampPeg2.rotation.z = -0.05;
    clampGroup.add(clampPeg2);

    const spring = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.016, 8), materials.metal);
    spring.rotation.z = Math.PI / 2;
    clampGroup.add(spring);

    clampGroup.position.set(-0.45, 0.905, -0.48);
    clampGroup.rotation.x = Math.PI / 2;
    clampGroup.rotation.z = -Math.PI / 4;
    group.add(clampGroup);

    // --- 6. SAFETY GOGGLES (Front Left: x = -0.75, z = -0.48) ---
    const gogglesGroup = new THREE.Group();
    const lens = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.055, 0.018), materials.glass);
    gogglesGroup.add(lens);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.065, 0.01), materials.plasticBase);
    frame.position.z = -0.009;
    gogglesGroup.add(frame);

    gogglesGroup.position.set(-0.75, 0.90, -0.48);
    gogglesGroup.rotation.x = -Math.PI / 2;
    group.add(gogglesGroup);

    // --- 7. REALISTIC NITRILE GLOVES STATION (Front Far Left: x = -1.05, z = -0.48) ---
    const glovesGroup = createRealisticNitrileGlovesStation();
    glovesGroup.position.set(-1.05, 0.90, -0.48);
    glovesGroup.rotation.y = Math.PI / 12;
    group.add(glovesGroup);

    return group;
}
