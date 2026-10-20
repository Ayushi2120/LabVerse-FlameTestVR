import * as THREE from 'three';

/**
 * Creates an authentic, anatomically shaped 3D Nitrile Glove with:
 * - Contoured palm with thenar & hypothenar muscle mounds
 * - 5 articulated fingers with natural relaxed curvature
 * - Realistic rolled beaded wrist cuff (iconic feature of nitrile exam gloves)
 * - Natural flexible rubber drape and specular sheen
 */
export function createAnatomicalGlove(isLeft: boolean, pose: 'flat' | 'emerging' = 'flat'): THREE.Group {
    const gloveGroup = new THREE.Group();
    gloveGroup.name = isLeft ? "GloveL" : "GloveR";
    gloveGroup.userData = { isGloves: true, isLeft, pose };

    // Authentic Medical Nitrile Blue Rubber Material
    const nitrileMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7, // Classic medical nitrile cobalt blue
        roughness: 0.36,
        metalness: 0.08,
        bumpScale: 0.001,
        side: THREE.DoubleSide
    });

    const nitrileDarkMat = new THREE.MeshStandardMaterial({
        color: 0x0369a1, // Deep fold shadow blue
        roughness: 0.42,
        metalness: 0.06
    });

    // 1. ROLLED BEADED WRIST CUFF (Signature feature of examination gloves)
    const cuffRadius = 0.024;
    const cuffTube = 0.0034;
    const cuffGeo = new THREE.TorusGeometry(cuffRadius, cuffTube, 16, 32);
    const cuffMesh = new THREE.Mesh(cuffGeo, nitrileMat);
    cuffMesh.rotation.x = Math.PI / 2;
    cuffMesh.position.y = -0.046;
    cuffMesh.userData = { isGloves: true };
    gloveGroup.add(cuffMesh);

    // 2. WRIST SLEEVE & FOLDS
    const wristGeo = new THREE.CylinderGeometry(0.024, 0.023, 0.028, 24, 2);
    const wristMesh = new THREE.Mesh(wristGeo, nitrileMat);
    wristMesh.position.y = -0.032;
    wristMesh.userData = { isGloves: true };
    gloveGroup.add(wristMesh);

    // Subtle rubber folds around the wrist
    const fold1 = new THREE.Mesh(new THREE.TorusGeometry(0.0242, 0.0016, 12, 24), nitrileDarkMat);
    fold1.rotation.x = Math.PI / 2 + 0.05;
    fold1.position.y = -0.036;
    fold1.userData = { isGloves: true };
    gloveGroup.add(fold1);

    const fold2 = new THREE.Mesh(new THREE.TorusGeometry(0.0246, 0.0014, 12, 24), nitrileDarkMat);
    fold2.rotation.x = Math.PI / 2 - 0.06;
    fold2.position.y = -0.024;
    fold2.userData = { isGloves: true };
    gloveGroup.add(fold2);

    // 3. PALM / METACARPAL BODY
    const palmGroup = new THREE.Group();
    palmGroup.position.y = 0.005;

    // Main central palm mass (contoured flattened capsule)
    const palmGeo = new THREE.CylinderGeometry(0.028, 0.024, 0.044, 20);
    palmGeo.scale(1.0, 1.0, 0.38); // Flattened hand thickness
    const palmMesh = new THREE.Mesh(palmGeo, nitrileMat);
    palmMesh.userData = { isGloves: true };
    palmGroup.add(palmMesh);

    // Thenar muscle mound (base of thumb)
    const thenarGeo = new THREE.SphereGeometry(0.013, 16, 12);
    thenarGeo.scale(isLeft ? 1.2 : 1.2, 1.4, 0.7);
    const thenarMesh = new THREE.Mesh(thenarGeo, nitrileMat);
    thenarMesh.position.set(isLeft ? -0.016 : 0.016, -0.008, 0.004);
    thenarMesh.userData = { isGloves: true };
    palmGroup.add(thenarMesh);

    // Hypothenar muscle mound (opposite edge)
    const hypoGeo = new THREE.SphereGeometry(0.011, 14, 12);
    hypoGeo.scale(1.0, 1.3, 0.6);
    const hypoMesh = new THREE.Mesh(hypoGeo, nitrileMat);
    hypoMesh.position.set(isLeft ? 0.018 : -0.018, -0.010, 0.002);
    hypoMesh.userData = { isGloves: true };
    palmGroup.add(hypoMesh);

    // Knuckle arch ridge where fingers sprout
    const knuckleArch = new THREE.Mesh(
        new THREE.CylinderGeometry(0.027, 0.027, 0.012, 16),
        nitrileMat
    );
    knuckleArch.scale.set(1.0, 1.0, 0.36);
    knuckleArch.position.y = 0.022;
    knuckleArch.userData = { isGloves: true };
    palmGroup.add(knuckleArch);

    gloveGroup.add(palmGroup);

    // Helper: Build a segmented anatomical finger with natural curl
    function createFinger(
        length: number,
        baseRadius: number,
        curlX: number,
        splayZ: number,
        knuckleX: number
    ): THREE.Group {
        const finger = new THREE.Group();
        finger.position.set(knuckleX, 0.028, 0);

        const seg1Len = length * 0.42;
        const seg2Len = length * 0.33;
        const seg3Len = length * 0.25;

        // Phalanx 1 (Proximal)
        const p1Geo = new THREE.CylinderGeometry(baseRadius * 0.92, baseRadius, seg1Len, 12);
        const p1Mesh = new THREE.Mesh(p1Geo, nitrileMat);
        p1Mesh.position.y = seg1Len / 2;
        p1Mesh.userData = { isGloves: true };
        finger.add(p1Mesh);

        // Joint 1 crease
        const j1Mesh = new THREE.Mesh(new THREE.SphereGeometry(baseRadius * 0.94, 12, 12), nitrileMat);
        j1Mesh.position.y = seg1Len;
        j1Mesh.userData = { isGloves: true };
        finger.add(j1Mesh);

        // Phalanx 2 (Intermediate)
        const p2Group = new THREE.Group();
        p2Group.position.y = seg1Len;
        p2Group.rotation.x = curlX * 0.55; // Natural joint flexion

        const p2Geo = new THREE.CylinderGeometry(baseRadius * 0.82, baseRadius * 0.90, seg2Len, 12);
        const p2Mesh = new THREE.Mesh(p2Geo, nitrileMat);
        p2Mesh.position.y = seg2Len / 2;
        p2Mesh.userData = { isGloves: true };
        p2Group.add(p2Mesh);

        // Joint 2 crease
        const j2Mesh = new THREE.Mesh(new THREE.SphereGeometry(baseRadius * 0.84, 12, 12), nitrileMat);
        j2Mesh.position.y = seg2Len;
        j2Mesh.userData = { isGloves: true };
        p2Group.add(j2Mesh);

        // Phalanx 3 (Distal + Rounded Fingertip)
        const p3Group = new THREE.Group();
        p3Group.position.y = seg2Len;
        p3Group.rotation.x = curlX * 0.45; // Subtle distal curl

        const p3Geo = new THREE.CylinderGeometry(baseRadius * 0.70, baseRadius * 0.80, seg3Len, 12);
        const p3Mesh = new THREE.Mesh(p3Geo, nitrileMat);
        p3Mesh.position.y = seg3Len / 2;
        p3Mesh.userData = { isGloves: true };
        p3Group.add(p3Mesh);

        // Soft hemispherical nitrile fingertip dome
        const tipGeo = new THREE.SphereGeometry(baseRadius * 0.72, 12, 12);
        const tipMesh = new THREE.Mesh(tipGeo, nitrileMat);
        tipMesh.position.y = seg3Len;
        tipMesh.userData = { isGloves: true };
        p3Group.add(tipMesh);

        p2Group.add(p3Group);
        finger.add(p2Group);

        finger.rotation.z = splayZ;
        finger.rotation.x = curlX * 0.2;
        return finger;
    }

    // 4. FOUR MAIN FINGERS (Index, Middle, Ring, Pinky)
    const sideMult = isLeft ? 1 : -1;

    // Index Finger
    const indexFinger = createFinger(0.046, 0.0052, 0.28, sideMult * 0.08, sideMult * -0.016);
    gloveGroup.add(indexFinger);

    // Middle Finger (Longest)
    const middleFinger = createFinger(0.052, 0.0054, 0.32, sideMult * 0.01, sideMult * -0.005);
    gloveGroup.add(middleFinger);

    // Ring Finger
    const ringFinger = createFinger(0.047, 0.0051, 0.36, sideMult * -0.06, sideMult * 0.006);
    gloveGroup.add(ringFinger);

    // Pinky Finger (Shortest, curved inward)
    const pinkyFinger = createFinger(0.038, 0.0044, 0.42, sideMult * -0.14, sideMult * 0.016);
    gloveGroup.add(pinkyFinger);

    // 5. OPPOSABLE THUMB (Angled outward ~35° and rotated forward)
    const thumbGroup = new THREE.Group();
    thumbGroup.position.set(sideMult * -0.022, -0.006, 0.006);
    thumbGroup.rotation.z = sideMult * 0.62; // Angled outward
    thumbGroup.rotation.x = -0.32; // Angled forward
    thumbGroup.rotation.y = sideMult * -0.25;

    const t1Len = 0.022;
    const t2Len = 0.020;
    const tRadius = 0.0058;

    const t1Geo = new THREE.CylinderGeometry(tRadius * 0.90, tRadius, t1Len, 12);
    const t1Mesh = new THREE.Mesh(t1Geo, nitrileMat);
    t1Mesh.position.y = t1Len / 2;
    t1Mesh.userData = { isGloves: true };
    thumbGroup.add(t1Mesh);

    const t2Group = new THREE.Group();
    t2Group.position.y = t1Len;
    t2Group.rotation.x = 0.35; // Inward thumb flexion

    const t2Geo = new THREE.CylinderGeometry(tRadius * 0.74, tRadius * 0.88, t2Len, 12);
    const t2Mesh = new THREE.Mesh(t2Geo, nitrileMat);
    t2Mesh.position.y = t2Len / 2;
    t2Mesh.userData = { isGloves: true };
    t2Group.add(t2Mesh);

    const thumbTip = new THREE.Mesh(new THREE.SphereGeometry(tRadius * 0.75, 12, 12), nitrileMat);
    thumbTip.position.y = t2Len;
    thumbTip.userData = { isGloves: true };
    t2Group.add(thumbTip);

    thumbGroup.add(t2Group);
    gloveGroup.add(thumbGroup);

    // Apply specific pose styling
    if (pose === 'emerging') {
        // Glove crumpled emerging from dispenser opening
        gloveGroup.rotation.x = Math.PI / 4;
        gloveGroup.rotation.y = isLeft ? -0.2 : 0.2;
        gloveGroup.scale.set(0.92, 0.92, 0.92);
    } else {
        // Glove resting flat on bench beside dispenser
        gloveGroup.rotation.x = -Math.PI / 2 + 0.08; // Flat on table surface
        gloveGroup.rotation.z = isLeft ? 0.35 : -0.35;
    }

    return gloveGroup;
}

/**
 * Creates high-resolution canvas texture for realistic medical Nitrile Glove packaging.
 */
function createDispenserBoxTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // 1. Base Carton Blue Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 1024, 1024);
    bgGrad.addColorStop(0, '#0284c7');
    bgGrad.addColorStop(0.5, '#0369a1');
    bgGrad.addColorStop(1, '#075985');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1024, 1024);

    // 2. White & Cyan Clean Scientific Banner Layout
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(40, 40, 944, 210);

    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(40, 246, 944, 8);

    // Brand Name & Product Header
    ctx.fillStyle = '#0369a1';
    ctx.font = 'bold 36px "Inter", "Arial", sans-serif';
    ctx.fillText('LABVERSE™ MEDICAL & LABORATORY SUPPLIES', 60, 92);

    ctx.fillStyle = '#0f172a';
    ctx.font = '900 68px "Inter", "Arial", sans-serif';
    ctx.fillText('NITRILE EXAM GLOVES', 60, 172);

    ctx.fillStyle = '#0284c7';
    ctx.font = '600 24px "Inter", "Arial", sans-serif';
    ctx.fillText('POWDER-FREE • NON-STERILE • CHEMISTRY & FLAME RESISTANT', 60, 218);

    // 3. Size Badge (M - Medium)
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(880, 145, 65, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "Inter", "Arial", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SIZE', 880, 125);
    ctx.font = '900 56px "Inter", "Arial", sans-serif';
    ctx.fillText('M', 880, 175);
    ctx.textAlign = 'left';

    // 4. Center Oval Dispenser Graphic (Perforated tear-out guideline)
    ctx.save();
    ctx.setLineDash([12, 10]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(512, 540, 310, 150, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.ellipse(512, 540, 290, 130, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 28px "Inter", "Arial", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⮟ TEAR HERE TO DISPENSE GLOVES ⮟', 512, 530);
    ctx.font = '500 20px "Inter", "Arial", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('PULL ONE GLOVE AT A TIME', 512, 565);
    ctx.textAlign = 'left';

    // 5. Quality & Compliance Features
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px "Inter", "Arial", sans-serif';
    ctx.fillText('✔ 100% SYNTHETIC NITRILE RUBBER', 80, 750);
    ctx.fillText('✔ ZERO LATEX PROTEIN ALLERGENS', 80, 795);
    ctx.fillText('✔ MICRO-TEXTURED FINGERTIPS FOR HIGH GRIP', 80, 840);

    ctx.fillText('✔ 100 GLOVES BY WEIGHT (50 PAIRS)', 560, 750);
    ctx.fillText('✔ EN 455 / ASTM D6319 CERTIFIED', 560, 795);
    ctx.fillText('✔ FLAME TEST & ACID RESISTANT', 560, 840);

    // 6. Bottom Barcode & Lot Metadata
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(80, 890, 864, 80);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('LOT: LV-9042-SRFLAME | REF: NBR-240-BLU | EXP: 2030-08', 110, 935);

    // Faux Barcode lines
    for (let x = 650; x < 900; x += 6) {
        ctx.fillStyle = (x % 12 === 0) ? '#0f172a' : '#64748b';
        ctx.fillRect(x, 905, 3, 50);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

/**
 * Creates the complete realistic Nitrile Gloves Dispenser Workstation:
 * - Commercial laboratory packaging with high-res medical branding
 * - Recessed 3D dispensing slot with internal glove bundle
 * - Emerging 3D Nitrile Glove (Right hand) ready to grab
 * - Second anatomical 3D Nitrile Glove (Left hand) resting on desk
 * - Dynamic "GLOVES EQUIPPED ✔" status hologram badge
 */
export function createRealisticNitrileGlovesStation(): THREE.Group {
    const stationGroup = new THREE.Group();
    stationGroup.name = "GlovesGroup";
    stationGroup.userData = { isGloves: true, isPokeable: true };

    const boxWidth = 0.22;
    const boxHeight = 0.062;
    const boxDepth = 0.135;

    // 1. Photorealistic Cardboard Dispenser Box
    const boxTexture = createDispenserBoxTexture();
    const boxTopMat = new THREE.MeshStandardMaterial({
        map: boxTexture,
        roughness: 0.35,
        metalness: 0.1
    });

    const boxSideMat = new THREE.MeshStandardMaterial({
        color: 0x0369a1,
        roughness: 0.4,
        metalness: 0.1
    });

    // Box Materials: [Right, Left, Top, Bottom, Front, Back]
    const boxMaterials = [
        boxSideMat,
        boxSideMat,
        boxTopMat,   // Top with branding and oval opening
        boxSideMat,
        boxSideMat,
        boxSideMat
    ];

    const boxMesh = new THREE.Mesh(new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth), boxMaterials);
    boxMesh.position.set(0, boxHeight / 2, 0);
    boxMesh.userData = { isGloves: true };
    stationGroup.add(boxMesh);

    // 2. Beveled Metallic Rim Border
    const rimMat = new THREE.MeshStandardMaterial({
        color: 0x00e5ff,
        emissive: 0x003344,
        metalness: 0.8,
        roughness: 0.2
    });
    const rimMesh = new THREE.Mesh(new THREE.BoxGeometry(boxWidth + 0.004, 0.004, boxDepth + 0.004), rimMat);
    rimMesh.position.set(0, boxHeight + 0.002, 0);
    rimMesh.userData = { isGloves: true };
    stationGroup.add(rimMesh);

    // 3. Real 3D Recessed Oval Opening inside the box
    const holeMat = new THREE.MeshBasicMaterial({
        color: 0x081525,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1
    });
    const holeGeo = new THREE.CylinderGeometry(0.046, 0.046, 0.002, 24);
    holeGeo.scale(1.4, 1.0, 0.75); // Oval shape
    const holeMesh = new THREE.Mesh(holeGeo, holeMat);
    holeMesh.position.set(0, boxHeight + 0.0015, 0);
    holeMesh.userData = { isGloves: true };
    stationGroup.add(holeMesh);

    // Internal layered clump of folded blue gloves inside the hole
    const clumpMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.45 });
    const clump = new THREE.Mesh(new THREE.SphereGeometry(0.038, 16, 12), clumpMat);
    clump.scale.set(1.3, 0.35, 0.7);
    clump.position.set(0, boxHeight - 0.004, 0);
    clump.userData = { isGloves: true };
    stationGroup.add(clump);

    // 4. Emerging Right Glove (Partially pulled from dispenser opening)
    const gloveR = createAnatomicalGlove(false, 'emerging');
    gloveR.position.set(0.02, boxHeight + 0.028, 0.015);
    gloveR.rotation.y = 0.25;
    gloveR.rotation.z = -0.15;
    gloveR.userData = { isGloves: true };
    stationGroup.add(gloveR);

    // 5. Laid-Out Left Glove (Anatomical glove resting beside box on lab bench)
    const gloveL = createAnatomicalGlove(true, 'flat');
    gloveL.position.set(-0.16, 0.016, 0.02);
    gloveL.rotation.y = -0.22;
    gloveL.userData = { isGloves: true };
    stationGroup.add(gloveL);

    // 6. Holographic Equipped Status Badge (Illuminates when equipped)
    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 512;
    badgeCanvas.height = 128;
    const badgeCtx = badgeCanvas.getContext('2d')!;

    badgeCtx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    badgeCtx.strokeStyle = '#00e5ff';
    badgeCtx.lineWidth = 4;
    badgeCtx.roundRect(10, 10, 492, 108, 16);
    badgeCtx.fill();
    badgeCtx.stroke();

    badgeCtx.fillStyle = '#00e5ff';
    badgeCtx.font = 'bold 36px "Inter", "Arial", sans-serif';
    badgeCtx.textAlign = 'center';
    badgeCtx.fillText('🧤 NITRILE SAFETY GLOVES', 256, 56);
    badgeCtx.fillStyle = '#94a3b8';
    badgeCtx.font = '600 24px "Inter", "Arial", sans-serif';
    badgeCtx.fillText('CLICK / POKE BOX TO EQUIP', 256, 94);

    const badgeTex = new THREE.CanvasTexture(badgeCanvas);
    badgeTex.colorSpace = THREE.SRGBColorSpace;
    const badgeMat = new THREE.MeshBasicMaterial({
        map: badgeTex,
        transparent: true,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1
    });
    const badgeMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.045), badgeMat);
    badgeMesh.name = "GlovesBadge";
    badgeMesh.position.set(0, boxHeight + 0.08, 0);
    badgeMesh.rotation.x = -Math.PI / 6; // Angled toward user eyes
    badgeMesh.userData = { isGloves: true };
    stationGroup.add(badgeMesh);

    // Method to update badge face on equip
    stationGroup.userData.onEquip = () => {
        badgeCtx.clearRect(0, 0, 512, 128);
        badgeCtx.fillStyle = 'rgba(6, 78, 59, 0.95)';
        badgeCtx.strokeStyle = '#10b981';
        badgeCtx.lineWidth = 4;
        badgeCtx.roundRect(10, 10, 492, 108, 16);
        badgeCtx.fill();
        badgeCtx.stroke();

        badgeCtx.fillStyle = '#34d399';
        badgeCtx.font = '900 38px "Inter", "Arial", sans-serif';
        badgeCtx.textAlign = 'center';
        badgeCtx.fillText('✔ GLOVES EQUIPPED', 256, 56);
        badgeCtx.fillStyle = '#a7f3d0';
        badgeCtx.font = 'bold 24px "Inter", "Arial", sans-serif';
        badgeCtx.fillText('HANDS PROTECTED FOR FLAME TEST', 256, 94);
        badgeTex.needsUpdate = true;
    };

    // Method to restore badge face on unequip
    stationGroup.userData.onUnequip = () => {
        badgeCtx.clearRect(0, 0, 512, 128);
        badgeCtx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        badgeCtx.strokeStyle = '#00e5ff';
        badgeCtx.lineWidth = 4;
        badgeCtx.roundRect(10, 10, 492, 108, 16);
        badgeCtx.fill();
        badgeCtx.stroke();

        badgeCtx.fillStyle = '#00e5ff';
        badgeCtx.font = 'bold 36px "Inter", "Arial", sans-serif';
        badgeCtx.textAlign = 'center';
        badgeCtx.fillText('🧤 NITRILE SAFETY GLOVES', 256, 56);
        badgeCtx.fillStyle = '#94a3b8';
        badgeCtx.font = '600 24px "Inter", "Arial", sans-serif';
        badgeCtx.fillText('CLICK / POKE BOX TO EQUIP', 256, 94);
        badgeTex.needsUpdate = true;
    };

    return stationGroup;
}

/**
 * Creates a realistic 3D Nitrile Gloved Hand gripping the platinum wire handle.
 * Displayed in first-person / desktop mode when the wire is held and gloves are equipped.
 */
export function createWireGloveGrip(): THREE.Group {
    const gripGroup = new THREE.Group();
    gripGroup.name = "WireGloveGrip";

    const nitrileMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.36,
        metalness: 0.08
    });

    // 1. Rolled wrist cuff
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.0035, 16, 24), nitrileMat);
    cuff.rotation.y = Math.PI / 2;
    cuff.position.set(-0.065, 0, 0);
    gripGroup.add(cuff);

    // 2. Wrist forearm sleeve
    const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.024, 0.045, 16), nitrileMat);
    wrist.rotation.z = Math.PI / 2;
    wrist.position.set(-0.042, 0, 0);
    gripGroup.add(wrist);

    // 3. Palm wrapping handle
    const palm = new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.022, 0.048, 16), nitrileMat);
    palm.rotation.z = Math.PI / 2;
    palm.scale.set(1.0, 1.0, 0.75);
    palm.position.set(0.005, 0, 0);
    gripGroup.add(palm);

    // 4. Four Curled Fingers wrapped around wire handle
    for (let f = 0; f < 4; f++) {
        const fingerCurve = new THREE.Mesh(
            new THREE.TorusGeometry(0.014, 0.0042, 10, 20, Math.PI * 1.35),
            nitrileMat
        );
        fingerCurve.rotation.y = Math.PI / 2;
        fingerCurve.position.set(-0.012 + f * 0.012, 0.002, 0);
        gripGroup.add(fingerCurve);
    }

    // 5. Opposable Thumb pressing down on grip
    const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.0052, 0.024, 8, 16), nitrileMat);
    thumb.rotation.z = Math.PI / 3;
    thumb.rotation.x = -Math.PI / 6;
    thumb.position.set(-0.016, 0.014, 0.008);
    gripGroup.add(thumb);

    return gripGroup;
}

/**
 * Creates a dedicated, high-performance Skinned Nitrile Glove ShaderMaterial.
 * Features:
 * - Accurate Three.js skinning chunks (<skinning_pars_vertex>, <skinning_vertex>) for 100% natural hand articulation
 * - Soft-wrapped diffuse lighting (Half-Lambert) matching authentic medical nitrile rubber
 * - Specular sheen & Fresnel rim contouring across all fingers, palms, and knuckles
 * - Gradient wrist boundary fade utilizing Meta Quest's native wristDist attribute
 */
export function createNitrileGloveMaterial(colorHex: number = 0x0284c7): THREE.ShaderMaterial {
    const baseColor = new THREE.Color(colorHex);
    const hsl = { h: 0, s: 0, l: 0 };
    baseColor.getHSL(hsl);

    const darkColor = new THREE.Color().setHSL(hsl.h, Math.min(1.0, hsl.s * 1.15), Math.max(0.08, hsl.l * 0.62));
    const highlightColor = new THREE.Color().setHSL(hsl.h, Math.max(0.2, hsl.s * 0.82), Math.min(0.95, hsl.l * 1.42));

    return new THREE.ShaderMaterial({
        uniforms: {
            gloveColor: { value: baseColor },
            gloveDarkColor: { value: darkColor },
            gloveHighlightColor: { value: highlightColor },
            opacityThresholds: { value: new THREE.Vector2(0.012, 0.065) },
        },
        vertexShader: `
            #include <common>
            #include <skinning_pars_vertex>

            attribute float wristDist;
            varying float vWristDist;
            varying vec3 vNormal;
            varying vec3 vViewPosition;

            void main() {
                #include <skinbase_vertex>
                #include <beginnormal_vertex>
                #include <skinnormal_vertex>
                #include <defaultnormal_vertex>

                vNormal = normalize(transformedNormal);

                vec3 transformed = vec3(position);
                #include <skinning_vertex>

                vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
                vViewPosition = -mvPosition.xyz;
                gl_Position = projectionMatrix * mvPosition;
                vWristDist = wristDist;
            }
        `,
        fragmentShader: `
            uniform vec3 gloveColor;
            uniform vec3 gloveDarkColor;
            uniform vec3 gloveHighlightColor;
            uniform vec2 opacityThresholds;

            varying float vWristDist;
            varying vec3 vNormal;
            varying vec3 vViewPosition;

            void main() {
                vec3 normal = normalize(vNormal);
                vec3 viewDir = normalize(vViewPosition);

                // Multi-point laboratory illumination
                vec3 lightDir1 = normalize(vec3(0.4, 0.9, 0.5));
                vec3 lightDir2 = normalize(vec3(-0.5, 0.35, -0.4));
                vec3 lightDir3 = normalize(vec3(0.0, -0.7, 0.7));

                // Soft-wrapped diffuse (Half-Lambert) for synthetic medical nitrile rubber
                float nDotL1 = max(0.0, dot(normal, lightDir1) * 0.65 + 0.35);
                float nDotL2 = max(0.0, dot(normal, lightDir2) * 0.5 + 0.5) * 0.35;
                float nDotL3 = max(0.0, dot(normal, lightDir3) * 0.5 + 0.5) * 0.15;
                float totalDiffuse = clamp(nDotL1 + nDotL2 + nDotL3, 0.0, 1.0);

                // Interpolate creases & shadow folds to main nitrile tone
                vec3 baseTone = mix(gloveDarkColor, gloveColor, totalDiffuse);

                // Subtle nitrile rubber specular highlight
                vec3 halfVec1 = normalize(lightDir1 + viewDir);
                float spec1 = pow(max(dot(normal, halfVec1), 0.0), 24.0) * 0.38;

                // Fresnel edge contouring (characteristic sheen along finger tubes and palm curves)
                float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.5);

                vec3 surfaceColor = baseTone + (gloveHighlightColor * (fresnel * 0.48 + spec1));

                // Wrist gradient fade matching Meta Quest tracking arm boundary
                float alpha = smoothstep(opacityThresholds.x, opacityThresholds.y, vWristDist);

                gl_FragColor = vec4(surfaceColor, clamp(alpha, 0.0, 1.0));
            }
        `,
        side: THREE.FrontSide,
        transparent: true,
        depthWrite: true,
        depthTest: true,
    });
}

/**
 * Traverses the scene to tint any WebXR hand models or controller skins to nitrile blue.
 * Applies the solid medical nitrile material directly to the tracked SkinnedMesh,
 * ensuring full, opaque, persistent glove coverage across palms, fingers, and visible surfaces.
 */
export function tintSceneHandMeshes(scene: THREE.Scene, isGloved: boolean, gloveColorHex: number = 0x0284c7) {
    scene.traverse((obj: any) => {
        if (!obj.isMesh || !obj.material) return;
        const name = (obj.name || '').toLowerCase();
        const parentName = (obj.parent?.name || '').toLowerCase();

        // 1. Strictly protect laboratory equipment, environment, and interactive props
        if (
            name.includes('salt') ||
            name.includes('dish') ||
            name.includes('burner') ||
            name.includes('table') ||
            name.includes('bench') ||
            name.includes('book') ||
            name.includes('wire') ||
            name.includes('flame') ||
            name.includes('glovesgroup') ||
            name.includes('glovebox') ||
            name.includes('buckyball') ||
            name.includes('easter') ||
            name.includes('screen') ||
            name.includes('display') ||
            name.includes('beaker') ||
            name.includes('flask') ||
            name.includes('room') ||
            name.includes('wall') ||
            name.includes('floor')
        ) return;

        // 2. Identify if this object is a tracked hand or controller mesh
        const isSkinned = obj.isSkinnedMesh === true;
        const hasWristDist = obj.geometry?.attributes?.wristDist !== undefined;
        const hasHandName = name.includes('hand') || parentName.includes('hand') || name.includes('oculus') || parentName.includes('oculus');
        const hasControllerName = name.includes('controller') || parentName.includes('controller');
        const isHandMesh = hasWristDist || isSkinned || hasHandName || hasControllerName;

        if (!isHandMesh) return;

        // Case A: Meta Quest AnimatedHand Outline mesh (BackSide inverted hull)
        if (obj.material.uniforms?.outlineColor?.value) {
            const targetOutline = isGloved ? 0x00d4ff : 0xffffff;
            if (obj.material.uniforms.outlineColor.value.getHex() !== targetOutline) {
                obj.material.uniforms.outlineColor.value.setHex(targetOutline);
            }
            return;
        }

        // Case B: Meta Quest SkinnedMesh (The primary anatomical tracked hand surface!)
        if (isSkinned) {
            // Ensure wristDist attribute exists on geometry
            if (!obj.geometry.attributes.wristDist) {
                const count = obj.geometry.attributes.position.count;
                const dummy = new Float32Array(count);
                dummy.fill(0.1); // > 0.065 so alpha is 1.0 (fully visible)
                obj.geometry.setAttribute('wristDist', new THREE.BufferAttribute(dummy, 1));
            }

            if (isGloved) {
                // Ensure cached glove material instance exists
                if (!obj.userData.gloveMaterial || obj.userData.lastGloveColor !== gloveColorHex) {
                    obj.userData.gloveMaterial = createNitrileGloveMaterial(gloveColorHex);
                    obj.userData.lastGloveColor = gloveColorHex;
                }

                if (obj.material !== obj.userData.gloveMaterial) {
                    if (!obj.userData.originalMaterial) {
                        obj.userData.originalMaterial = obj.material;
                    }
                    obj.material = obj.userData.gloveMaterial;
                    obj.visible = true;
                    obj.frustumCulled = false;
                }
            } else {
                // Restore original appearance (stencilMaterial or default)
                if (obj.userData.originalMaterial && obj.material !== obj.userData.originalMaterial) {
                    obj.material = obj.userData.originalMaterial;
                }
            }
            return;
        }

        // Case C: Standard Mesh / Skinned Hand Fallback (material with color)
        if (obj.material.color) {
            if (obj.userData?.originalColor === undefined) {
                obj.userData.originalColor = obj.material.color.getHex();
            }
            const targetColor = isGloved ? gloveColorHex : obj.userData.originalColor;
            if (obj.material.color.getHex() !== targetColor) {
                obj.material.color.setHex(targetColor);
            }
            if (obj.material.roughness !== undefined) {
                obj.material.roughness = isGloved ? 0.36 : 0.6;
            }
            if (obj.material.metalness !== undefined) {
                obj.material.metalness = isGloved ? 0.08 : 0.0;
            }
            if (obj.material.emissive) {
                obj.material.emissive.setHex(isGloved ? 0x002244 : 0x000000);
                obj.material.emissiveIntensity = isGloved ? 0.25 : 0.0;
            }
        }
    });
}

