import * as THREE from 'three';
import { MaterialLibrary } from '../materials/MaterialLibrary';

export function createRoom(materials: MaterialLibrary): THREE.Group {
    const group = new THREE.Group();

    // Canvas Texture Generator Helper
    const createCanvasTexture = (width: number, height: number, renderFunc: (ctx: CanvasRenderingContext2D) => void) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        renderFunc(ctx);
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    };

    const roomW = 10.0;
    const roomD = 7.5;
    const roomH = 3.4;

    // --- 1. TILED LABORATORY FLOOR ---
    const floorTex = createCanvasTexture(512, 512, (ctx) => {
        ctx.fillStyle = '#7a8b9e'; // Polished vinyl slate blue/gray
        ctx.fillRect(0, 0, 512, 512);
        
        // Grid tiles with subtle grout lines
        ctx.strokeStyle = '#5c6b7c';
        ctx.lineWidth = 4;
        ctx.strokeRect(0, 0, 512, 512);
        ctx.strokeRect(0, 0, 256, 256);
        ctx.strokeRect(256, 0, 256, 256);
        ctx.strokeRect(0, 256, 256, 256);
        ctx.strokeRect(256, 256, 256, 256);

        // Subtle specks/terrazzo texture
        ctx.fillStyle = '#a0b0c0';
        for (let i = 0; i < 60; i++) {
            const rx = Math.random() * 512;
            const ry = Math.random() * 512;
            ctx.fillRect(rx, ry, 3, 3);
        }
    });
    floorTex.wrapS = THREE.RepeatWrapping;
    floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(12, 9);
    const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.25, metalness: 0.1 });
    
    const floorGeo = new THREE.PlaneGeometry(roomW, roomD);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    group.add(floor);

    // --- 2. CEILING WITH ACOUSTIC TILES ---
    const ceilingTex = createCanvasTexture(512, 512, (ctx) => {
        ctx.fillStyle = '#eeeeee';
        ctx.fillRect(0, 0, 512, 512);
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 6;
        ctx.strokeRect(0, 0, 512, 512);
        ctx.strokeRect(0, 0, 256, 256);
        ctx.strokeRect(256, 256, 256, 256);
    });
    ceilingTex.wrapS = THREE.RepeatWrapping;
    ceilingTex.wrapT = THREE.RepeatWrapping;
    ceilingTex.repeat.set(10, 7.5);
    const ceilingMat = new THREE.MeshStandardMaterial({ map: ceilingTex, roughness: 0.9 });
    
    const ceilingGeo = new THREE.PlaneGeometry(roomW, roomD);
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = roomH;
    group.add(ceiling);

    // --- 3. SURROUNDING WALLS (TWO-TONE PAINT & TRIM) ---
    const wallTex = createCanvasTexture(512, 512, (ctx) => {
        ctx.fillStyle = '#f4f7fa'; // Upper clean white plaster
        ctx.fillRect(0, 0, 512, 512);
        ctx.fillStyle = '#3a88aa'; // Lower cyan/teal lab wall trim
        ctx.fillRect(0, 320, 512, 192);
        ctx.fillStyle = '#1c4455'; // Trim line border
        ctx.fillRect(0, 314, 512, 6);
    });
    const labWallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.85 });

    // Back Wall
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(roomW, roomH), labWallMat);
    backWall.position.set(0, roomH / 2, -roomD / 2);
    backWall.receiveShadow = true;
    group.add(backWall);

    // Front Wall
    const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(roomW, roomH), labWallMat);
    frontWall.position.set(0, roomH / 2, roomD / 2);
    frontWall.rotation.y = Math.PI;
    frontWall.receiveShadow = true;
    group.add(frontWall);

    // Left Wall
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(roomD, roomH), labWallMat);
    leftWall.position.set(-roomW / 2, roomH / 2, 0);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    group.add(leftWall);

    // Right Wall
    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(roomD, roomH), labWallMat);
    rightWall.position.set(roomW / 2, roomH / 2, 0);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.receiveShadow = true;
    group.add(rightWall);

    // --- COVED LABORATORY VINYL BASEBOARDS / SKIRTING TRIMS ---
    const baseboardMat = new THREE.MeshStandardMaterial({ color: 0x222a35, roughness: 0.6 });
    const addBaseboard = (w: number, d: number, x: number, z: number, ry: number = 0) => {
        const bb = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, d), baseboardMat);
        bb.position.set(x, 0.06, z);
        bb.rotation.y = ry;
        bb.receiveShadow = true;
        group.add(bb);
    };
    addBaseboard(roomW, 0.02, 0, -roomD / 2 + 0.01); // Back
    addBaseboard(roomW, 0.02, 0, roomD / 2 - 0.01);  // Front
    addBaseboard(roomD, 0.02, -roomW / 2 + 0.01, 0, Math.PI / 2); // Left
    addBaseboard(roomD, 0.02, roomW / 2 - 0.01, 0, Math.PI / 2);  // Right

    // --- ARCHITECTURAL STRUCTURAL SERVICE COLUMNS / BAY PILASTERS ---
    // These heavy structural utility columns frame the central workstation bay
    const columnGeo = new THREE.BoxGeometry(0.32, roomH, 0.45);
    
    // Left Support Column (Bay divider between main bench and wash sink)
    const colLeft = new THREE.Mesh(columnGeo, labWallMat);
    colLeft.position.set(-1.65, roomH / 2, -0.85);
    colLeft.castShadow = true;
    colLeft.receiveShadow = true;
    group.add(colLeft);

    // Column Base Trim
    const colLeftTrim = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.47), baseboardMat);
    colLeftTrim.position.set(-1.65, 0.06, -0.85);
    group.add(colLeftTrim);

    // Right Support Column (Bay divider between main bench and fume hood)
    const colRight = new THREE.Mesh(columnGeo, labWallMat);
    colRight.position.set(1.65, roomH / 2, -0.85);
    colRight.castShadow = true;
    colRight.receiveShadow = true;
    group.add(colRight);

    const colRightTrim = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.47), baseboardMat);
    colRightTrim.position.set(1.65, 0.06, -0.85);
    group.add(colRightTrim);

    // --- CEILING HVAC DIFFUSERS / AIR RETURN GRILLES ---
    for (let ventX of [-2.5, 2.5]) {
        for (let ventZ of [-1.5, 1.5]) {
            const ventGroup = new THREE.Group();
            const ventFrame = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.02, 0.6), materials.darkMetal);
            ventGroup.add(ventFrame);

            // Inner Louvers
            for (let l = 0; l < 5; l++) {
                const slat = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.01, 0.04), materials.metal);
                slat.position.z = -0.18 + l * 0.09;
                ventGroup.add(slat);
            }
            ventGroup.position.set(ventX, roomH - 0.01, ventZ);
            group.add(ventGroup);
        }
    }
    for (let w = 0; w < 2; w++) {
        const winGroup = new THREE.Group();
        const frameGeo = new THREE.BoxGeometry(1.8, 1.4, 0.08);
        const frame = new THREE.Mesh(frameGeo, materials.darkMetal);
        winGroup.add(frame);

        const paneGeo = new THREE.PlaneGeometry(1.7, 1.3);
        const paneMat = new THREE.MeshPhysicalMaterial({
            color: 0xddeeff,
            transmission: 0.7,
            roughness: 0.3,
            transparent: true,
            opacity: 0.85
        });
        const pane = new THREE.Mesh(paneGeo, paneMat);
        pane.position.z = 0.0;
        winGroup.add(pane);

        winGroup.position.set(-roomW / 2 + 0.05, 2.0, -1.8 + w * 3.6);
        winGroup.rotation.y = Math.PI / 2;
        group.add(winGroup);
    }

    // --- 5. ENTRY DOOR (FRONT WALL) ---
    const doorGroup = new THREE.Group();
    const doorBody = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.2, 0.08), new THREE.MeshStandardMaterial({ color: 0x2c3b4d, roughness: 0.7 }));
    doorBody.position.y = 1.1;
    doorGroup.add(doorBody);

    // Glass Window in door
    const doorWinMat = materials.glass.clone();
    (doorWinMat as any).polygonOffset = true;
    (doorWinMat as any).polygonOffsetFactor = -1;
    (doorWinMat as any).polygonOffsetUnits = -1;
    const doorWin = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.6), doorWinMat);
    doorWin.position.set(0, 1.45, 0.043);
    doorGroup.add(doorWin);

    // Metal Handle
    const doorHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.15, 12), materials.metal);
    doorHandle.rotation.z = Math.PI / 2;
    doorHandle.position.set(0.4, 1.0, 0.05);
    doorGroup.add(doorHandle);

    doorGroup.position.set(3.5, 0, roomD / 2 - 0.05);
    doorGroup.rotation.y = Math.PI;
    group.add(doorGroup);

    // --- 6. CHARTS & POSTERS ON WALLS ---

    // A. PERIODIC TABLE POSTER (BACK WALL)
    const ptTex = createCanvasTexture(1024, 768, (ctx) => {
        ctx.fillStyle = '#0f141c';
        ctx.fillRect(0, 0, 1024, 768);
        ctx.fillStyle = '#00e5ff';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PERIODIC TABLE OF THE ELEMENTS', 512, 50);
        ctx.fillStyle = '#8899aa';
        ctx.font = '18px sans-serif';
        ctx.fillText('LABVERSE VIRTUAL SCIENCE LABORATORY - CLASS 10 CHEMISTRY', 512, 80);

        for (let i = 0; i < 18; i++) {
            for (let j = 0; j < 7; j++) {
                if ((j < 1 && i > 0 && i < 17) || (j < 2 && i > 1 && i < 12) || (j < 3 && i > 1 && i < 12)) continue;
                const hue = (i / 18) * 360;
                ctx.fillStyle = `hsl(${hue}, 60%, 45%)`;
                ctx.fillRect(50 + i * 50 + 2, 100 + j * 60 + 2, 46, 56);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 16px sans-serif';
                ctx.fillText(`${i + j * 18}`, 50 + i * 50 + 23, 100 + j * 60 + 35);
            }
        }
    });
    const ptMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.8), new THREE.MeshBasicMaterial({
        map: ptTex,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1
    }));
    ptMesh.position.set(-2.2, 2.0, -roomD / 2 + 0.02);
    group.add(ptMesh);

    // B. FLAME TEST SPECTRUM CHART (BACK WALL RIGHT)
    const spectrumTex = createCanvasTexture(1024, 768, (ctx) => {
        ctx.fillStyle = '#111822';
        ctx.fillRect(0, 0, 1024, 768);
        ctx.fillStyle = '#ffaa00';
        ctx.font = 'bold 34px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('FLAME TEST EMISSION SPECTRA', 512, 50);

        const spectra = [
            { name: "Lithium (Li⁺)", color: "#e11d48", label: "Carmine / Crimson Red (671 nm)" },
            { name: "Sodium (Na⁺)", color: "#ffaa00", label: "Intense Yellow (589 nm)" },
            { name: "Potassium (K⁺)", color: "#c8a2c8", label: "Lilac (404 nm)" },
            { name: "Calcium (Ca²⁺)", color: "#e25822", label: "Orange-Red / Brick Red (622 nm)" },
            { name: "Copper (Cu²⁺)", color: "#00e5a3", label: "Blue-Green (510 nm)" },
            { name: "Strontium (Sr²⁺)", color: "#ff173d", label: "Scarlet / Crimson Red (606, 668 nm)" }
        ];

        spectra.forEach((s, idx) => {
            const y = 90 + idx * 105;
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 22px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(s.name, 40, y + 26);

            const grad = ctx.createLinearGradient(300, 0, 950, 0);
            grad.addColorStop(0, '#000000');
            grad.addColorStop(0.5, s.color);
            grad.addColorStop(1, '#000000');
            ctx.fillStyle = grad;
            ctx.fillRect(300, y, 650, 40);

            ctx.fillStyle = s.color;
            ctx.font = '17px sans-serif';
            ctx.fillText(s.label, 300, y + 66);
        });
    });
    const specMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.8), new THREE.MeshBasicMaterial({
        map: spectrumTex,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1
    }));
    specMesh.position.set(2.2, 2.0, -roomD / 2 + 0.02);
    group.add(specMesh);

    // C. LAB SAFETY & CAUTION POSTER (RIGHT WALL)
    const safetyTex = createCanvasTexture(512, 512, (ctx) => {
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(0, 0, 512, 512);
        ctx.fillStyle = '#000000';
        ctx.fillRect(12, 12, 488, 488);
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(20, 20, 472, 110);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 55px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('SAFETY FIRST', 256, 95);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText('• WEAR SAFETY GOGGLES', 256, 200);
        ctx.fillText('• USE TONGS FOR FLAME', 256, 260);
        ctx.fillText('• NO EATING OR DRINKING', 256, 320);
        ctx.fillText('• REPORT ALL SPILLS', 256, 380);
        ctx.fillText('• WASH HANDS AFTER LAB', 256, 440);
    });
    const safetyMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), new THREE.MeshBasicMaterial({
        map: safetyTex,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1
    }));
    safetyMesh.position.set(roomW / 2 - 0.02, 2.0, -1.8);
    safetyMesh.rotation.y = -Math.PI / 2;
    group.add(safetyMesh);

    // D. LABORATORY NOTICE BOARD (RIGHT WALL)
    const noticeTex = createCanvasTexture(512, 512, (ctx) => {
        ctx.fillStyle = '#b8860b'; // Corkboard texture
        ctx.fillRect(0, 0, 512, 512);
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(0, 0, 512, 20); ctx.fillRect(0, 492, 512, 20);
        ctx.fillRect(0, 0, 20, 512); ctx.fillRect(492, 0, 20, 512);

        // Pinned notes
        ctx.fillStyle = '#ffffff'; ctx.fillRect(40, 50, 200, 180);
        ctx.fillStyle = '#000'; ctx.font = 'bold 18px sans-serif';
        ctx.fillText('LAB SCHEDULE', 60, 90);
        ctx.font = '14px sans-serif';
        ctx.fillText('Class 10 - Sec A', 60, 130);
        ctx.fillText('Flame Test Exp', 60, 160);

        ctx.fillStyle = '#ffff88'; ctx.fillRect(270, 80, 190, 160);
        ctx.fillStyle = '#000'; ctx.font = 'bold 16px sans-serif';
        ctx.fillText('REMINDER:', 285, 115);
        ctx.fillText('Clean wire loop', 285, 145);
        ctx.fillText('with HCl wash!', 285, 175);
    });
    const noticeMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshBasicMaterial({
        map: noticeTex,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1
    }));
    noticeMesh.position.set(roomW / 2 - 0.02, 2.0, 0.8);
    noticeMesh.rotation.y = -Math.PI / 2;
    group.add(noticeMesh);

    // --- 7. EMERGENCY EQUIPMENT ---

    // Fire Extinguisher (Mounted on Right Wall)
    const extGroup = new THREE.Group();
    const bodyE = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.45, 16), new THREE.MeshStandardMaterial({ color: 0xcc0000, metalness: 0.3, roughness: 0.3 }));
    extGroup.add(bodyE);

    const nozzleE = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.12), materials.darkMetal);
    nozzleE.rotation.x = Math.PI / 2;
    nozzleE.position.set(0, 0.18, 0.06);
    extGroup.add(nozzleE);

    // Hose
    const hoseCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.18, 0.06),
        new THREE.Vector3(0.08, 0.05, 0.08),
        new THREE.Vector3(0.02, -0.1, 0.06)
    ]);
    const hoseMesh = new THREE.Mesh(new THREE.TubeGeometry(hoseCurve, 12, 0.008, 8, false), materials.blackRubber);
    extGroup.add(hoseMesh);

    const extSignTex = createCanvasTexture(256, 256, (ctx) => {
        ctx.fillStyle = '#cc0000'; ctx.fillRect(0, 0, 256, 256);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(10, 10, 236, 236);
        ctx.fillStyle = '#cc0000'; ctx.font = 'bold 44px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('FIRE', 128, 90);
        ctx.fillText('EXTINGUISHER', 128, 160);
    });
    const extSign = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.35), new THREE.MeshBasicMaterial({
        map: extSignTex,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1
    }));
    extSign.position.set(0, 0.45, -0.091);
    extGroup.add(extSign);

    extGroup.position.set(roomW / 2 - 0.12, 1.2, -2.8);
    extGroup.rotation.y = -Math.PI / 2;
    group.add(extGroup);

    // Emergency Eye Wash Station (Mounted on Right Wall near sink)
    const eyeWashGroup = new THREE.Group();
    const ewBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.08, 16), new THREE.MeshStandardMaterial({ color: 0x00aa44, metalness: 0.1, roughness: 0.3 }));
    eyeWashGroup.add(ewBowl);

    const ewNozzle1 = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.04), materials.metal);
    ewNozzle1.position.set(-0.05, 0.05, 0);
    eyeWashGroup.add(ewNozzle1);

    const ewNozzle2 = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.04), materials.metal);
    ewNozzle2.position.set(0.05, 0.05, 0);
    eyeWashGroup.add(ewNozzle2);

    const ewSignTex = createCanvasTexture(256, 256, (ctx) => {
        ctx.fillStyle = '#00aa44'; ctx.fillRect(0, 0, 256, 256);
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 40px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('EMERGENCY', 128, 80);
        ctx.fillText('EYE WASH', 128, 150);
        ctx.fillText('STATION', 128, 210);
    });
    const ewSign = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4), new THREE.MeshBasicMaterial({
        map: ewSignTex,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1
    }));
    ewSign.position.set(0, 0.4, 0.01);
    eyeWashGroup.add(ewSign);

    eyeWashGroup.position.set(roomW / 2 - 0.2, 1.3, 2.2);
    eyeWashGroup.rotation.y = -Math.PI / 2;
    group.add(eyeWashGroup);

    // Overhead Deluge Safety Shower (above eyewash)
    const showerGroup = new THREE.Group();
    // Overhead Supply Pipe from ceiling down
    const sPipe1 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.8), materials.metal);
    sPipe1.position.set(0, 0.4, 0);
    showerGroup.add(sPipe1);

    // Elbow extending out into room
    const sPipe2 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.4), materials.metal);
    sPipe2.rotation.x = Math.PI / 2;
    sPipe2.position.set(0, 0.8, -0.2);
    showerGroup.add(sPipe2);

    // Conical Shower Head
    const sHead = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.08, 16), new THREE.MeshStandardMaterial({ color: 0x00aa44, metalness: 0.3, roughness: 0.3 }));
    sHead.position.set(0, 0.76, -0.4);
    showerGroup.add(sHead);

    // Pull Rod and High-Visibility Yellow Triangular Handle
    const pullRod = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.6), materials.metal);
    pullRod.position.set(0, 0.45, -0.35);
    showerGroup.add(pullRod);

    const pullRing = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 8, 16), new THREE.MeshStandardMaterial({ color: 0xffcc00 }));
    pullRing.position.set(0, 0.15, -0.35);
    showerGroup.add(pullRing);

    showerGroup.position.set(roomW / 2 - 0.05, 2.2, 2.2);
    showerGroup.rotation.y = -Math.PI / 2;
    group.add(showerGroup);

    // NFPA 704 Chemical Hazard Diamond Placard (Mounted near chemical bay)
    const nfpaTex = createCanvasTexture(256, 256, (ctx) => {
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 256, 256);
        ctx.strokeStyle = '#000000'; ctx.lineWidth = 6; ctx.strokeRect(3, 3, 250, 250);

        ctx.save();
        ctx.translate(128, 128);
        ctx.rotate(Math.PI / 4);

        // Health (Blue - Top-Left in rotated space)
        ctx.fillStyle = '#0066cc'; ctx.fillRect(-70, -70, 70, 70);
        // Flammability (Red - Top-Right)
        ctx.fillStyle = '#cc0000'; ctx.fillRect(0, -70, 70, 70);
        // Instability/Reactivity (Yellow - Bottom-Right)
        ctx.fillStyle = '#ffcc00'; ctx.fillRect(0, 0, 70, 70);
        // Special Hazard (White - Bottom-Left)
        ctx.fillStyle = '#ffffff'; ctx.fillRect(-70, 0, 70, 70);
        ctx.strokeStyle = '#000000'; ctx.lineWidth = 4;
        ctx.strokeRect(-70, -70, 140, 140);
        ctx.beginPath();
        ctx.moveTo(-70, 0); ctx.lineTo(70, 0);
        ctx.moveTo(0, -70); ctx.lineTo(0, 70);
        ctx.stroke();

        ctx.restore();

        // Numbers & Symbols
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 36px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('1', 128, 65);  // Flammability (Red, top)
        ctx.fillText('2', 65, 128);  // Health (Blue, left)
        ctx.fillStyle = '#000000';
        ctx.fillText('0', 191, 128); // Instability (Yellow, right)
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText('COR', 128, 191); // Corrosive (White, bottom)
    });

    const nfpaMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.45), new THREE.MeshBasicMaterial({
        map: nfpaTex,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1
    }));
    nfpaMesh.position.set(-roomW / 2 + 0.02, 2.0, 1.8);
    nfpaMesh.rotation.y = Math.PI / 2;
    group.add(nfpaMesh);
    const instTex = createCanvasTexture(1024, 512, (ctx) => {
        // Dark Navy/Slate Lab Panel
        const grd = ctx.createLinearGradient(0, 0, 1024, 512);
        grd.addColorStop(0, '#101c2c');
        grd.addColorStop(1, '#080e18');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, 1024, 512);

        // Header Cyan Border
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 6;
        ctx.strokeRect(4, 4, 1016, 504);

        // Header Text
        ctx.fillStyle = '#00e5ff';
        ctx.font = 'bold 38px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('LABVERSE: FLAME TEST EXPERIMENT', 480, 60);

        ctx.fillStyle = '#ffaa00';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText('Class 10 Chemistry Practical • Qualitative Analysis of Metal Cations', 480, 98);

        ctx.beginPath();
        ctx.moveTo(50, 116); ctx.lineTo(910, 116);
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Step-by-step experiment instructions
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'left';

        const lines = [
            '1. GRAB PLATINUM WIRE: Hold wire by clicking/pinching with hand.',
            '2. DIP IN SALT SAMPLE: Touch tip to NaCl, KCl, CuSO₄, CaCl₂, or SrCl₂.',
            '3. IGNITE BUNSEN BURNER: Toggle the red Power Switch next to burner.',
            '4. PLACE IN FLAME: Move loaded wire into active flame cone.',
            '5. OBSERVE EMISSION: Watch characteristic flame color change.',
            '6. RESULT & RESET: Read analysis report and click RESET for next salt.'
        ];

        lines.forEach((line, idx) => {
            ctx.fillText(line, 45, 165 + idx * 52);
        });

        // Prominent Red 'X' Close Button on Canvas Top-Right
        ctx.fillStyle = '#ff2222';
        ctx.beginPath();
        ctx.arc(965, 48, 28, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(951, 34); ctx.lineTo(979, 62);
        ctx.moveTo(979, 34); ctx.lineTo(951, 62);
        ctx.stroke();
    });

    const instGroup = new THREE.Group();
    instGroup.name = "InstructionBoardGroup";

    const instMat = new THREE.MeshBasicMaterial({ map: instTex, transparent: true });
    // Reduced to 65% of original 2.2m x 1.1m (Width: 1.45m, Height: 0.725m)
    const instMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 0.725), instMat);
    instGroup.add(instMesh);

    // Interactive 3D Red 'X' Close Button at Top-Right (Solid Vibrant Red 0xff2222)
    const closeBtnGroup = new THREE.Group();
    closeBtnGroup.name = "InstructionCloseBtn";
    closeBtnGroup.userData.isCloseButton = true;
    closeBtnGroup.position.set(0.64, 0.31, 0.005);

    // Solid Red Circular Base Plate
    const closeBtnGeo = new THREE.CircleGeometry(0.038, 32);
    const closeBtnMat = new THREE.MeshBasicMaterial({ color: 0xff2222, side: THREE.DoubleSide });
    const closeBtnMesh = new THREE.Mesh(closeBtnGeo, closeBtnMat);
    closeBtnGroup.add(closeBtnMesh);

    // White 'X' Cross Bar 1
    const xBarGeo = new THREE.PlaneGeometry(0.042, 0.008);
    const xBarMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1
    });
    const xBar1 = new THREE.Mesh(xBarGeo, xBarMat);
    xBar1.rotation.z = Math.PI / 4;
    xBar1.position.z = 0.002;
    closeBtnGroup.add(xBar1);

    // White 'X' Cross Bar 2
    const xBar2 = new THREE.Mesh(xBarGeo, xBarMat);
    xBar2.rotation.z = -Math.PI / 4;
    xBar2.position.z = 0.0024;
    closeBtnGroup.add(xBar2);

    closeBtnGroup.addEventListener('pointerdown', () => {
        instGroup.visible = false;
    });

    instGroup.add(closeBtnGroup);

    instGroup.position.set(0, 2.25, -roomD / 2 + 0.03);
    instGroup.visible = false; // Replaced by genuine 3D OrientationScreen3D
    group.add(instGroup);

    return group;
}
