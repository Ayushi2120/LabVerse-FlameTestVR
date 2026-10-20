import * as THREE from 'three';

export interface OrientationScreenCallbacks {
    onStartExperiment: () => void;
    onEnterVR: () => void;
}

export class OrientationScreen3D {
    public group: THREE.Group;
    private callbacks: OrientationScreenCallbacks;
    private currentTab = 0; // 0: Mission/Overview, 1: Safety, 2: Protocol, 3: Controls
    private totalTabs = 4;

    // 3D Chassis & Main Content Plaque
    private mainCanvas!: HTMLCanvasElement;
    private mainTexture!: THREE.CanvasTexture;
    private screenMesh!: THREE.Mesh;

    // 3D Physical Buttons
    private startBtnMesh!: THREE.Mesh;
    private enterVRBtnMesh!: THREE.Mesh;
    private tabMeshes: THREE.Mesh[] = [];
    private tabPlaqueData: {
        ctx: CanvasRenderingContext2D;
        texture: THREE.CanvasTexture;
        label: string;
    }[] = [];
    private prevBtnMesh!: THREE.Mesh;
    private nextBtnMesh!: THREE.Mesh;

    // 3D Interactive Centerpiece: Quantum Bohr Atom
    private moleculeGroup!: THREE.Group;
    private electronRings: THREE.Mesh[] = [];
    private electronSpheres: THREE.Mesh[] = [];
    private nucleusMesh!: THREE.Mesh;
    private moleculeRotSpeed = 0.5;

    // Animation & Exit Transition
    private isExiting = false;
    private exitProgress = 0;
    private animTime = 0;
    private isStartingTriggered = false;

    // Poke & Click Debounce
    private lastInteractionTime = 0;

    // Dedicated Swipe Gesture Detection in 3D Guidebook Area (Feature 5.G)
    private lastSwipeX = 0;
    private swipeStartTime = 0;
    private inSwipeZone = false;

    constructor(callbacks: OrientationScreenCallbacks | (() => void)) {
        if (typeof callbacks === 'function') {
            this.callbacks = {
                onStartExperiment: callbacks,
                onEnterVR: () => {}
            };
        } else {
            this.callbacks = callbacks;
        }

        this.group = new THREE.Group();
        this.group.name = 'OrientationScreen3D';

        // Positioned comfortably in front of user at natural eye height and 1.75m distance
        // (Complies strictly with 1.5–2.0m distance requirement; never in user's face)
        this.group.position.set(0, 1.62, -1.75);
        this.group.rotation.x = -Math.PI / 36; // Subtle 5° ergonomic tilt toward user eye level

        this.buildTerminalChassis();
        this.buildInteractiveMolecule();
        this.buildControlsAndButtons();
        this.renderCanvasContent();
    }

    private neckMesh?: THREE.Mesh;
    private flangeMesh?: THREE.Mesh;
    private hasVRPoseInitialized = false;

    // Viewport positioning for Desktop vs Meta Quest VR
    private readonly desktopPos = new THREE.Vector3(0, 1.62, -1.75);
    private readonly desktopRot = new THREE.Euler(-Math.PI / 36, 0, 0);
    private readonly vrUIPos = new THREE.Vector3(0, 1.35, -0.60);
    private readonly vrUIRot = new THREE.Euler(-Math.PI / 36, 0, 0);
    private isVRMode = false;

    public getGroup(): THREE.Group {
        return this.group;
    }

    public getStartButtonMesh(): THREE.Mesh {
        return this.startBtnMesh;
    }

    public getEnterVRButtonMesh(): THREE.Mesh {
        return this.enterVRBtnMesh;
    }

    public getIsVRMode(): boolean {
        return this.isVRMode;
    }

    // --- ADAPT SCREEN POSITIONING FOR VR (FLOATING CLOSE TO EYES) VS DESKTOP ---
    public setVRMode(isVR: boolean, camPos?: THREE.Vector3, camDir?: THREE.Vector3) {
        this.isVRMode = isVR;
        if (isVR) {
            // 1. Hide table pedestal stand to make it a sleek floating HUD screen
            if (this.neckMesh) this.neckMesh.visible = false;
            if (this.flangeMesh) this.flangeMesh.visible = false;

            // 2. Hide ENTER VR button once in VR — user is already in VR!
            if (this.enterVRBtnMesh) this.enterVRBtnMesh.visible = false;

            // 3. Center START EXPERIMENT button prominently as the sole main action
            if (this.startBtnMesh) {
                this.startBtnMesh.position.set(0.0, -0.315, 0.044);
                this.startBtnMesh.userData.initialZ = 0.044;
            }

            // 4. Scale floating screen to 0.82 so it sits comfortably inside VR headset FOV
            this.group.scale.set(0.82, 0.82, 0.82);

            // 5. Position floating screen comfortably close to user's eyes (0.60m: natural arm reach)
            const vrDist = 0.60;
            if (camPos && camDir && (camPos.lengthSq() > 0.001 || camDir.lengthSq() > 0.001)) {
                this.hasVRPoseInitialized = true;
                const horizDir = new THREE.Vector3(camDir.x, 0, camDir.z).normalize();
                if (horizDir.lengthSq() < 0.01) horizDir.set(0, 0, -1);

                const targetPos = camPos.clone().add(horizDir.multiplyScalar(vrDist));
                targetPos.y = (camPos.y > 0.6) ? Math.max(1.10, Math.min(1.60, camPos.y - 0.08)) : 1.35;
                this.group.position.copy(targetPos);

                this.group.lookAt(new THREE.Vector3(camPos.x, targetPos.y, camPos.z));
                this.group.rotateX(-Math.PI / 36);
            } else {
                this.hasVRPoseInitialized = false;
                this.group.position.copy(this.vrUIPos);
                this.group.rotation.copy(this.vrUIRot);
            }
        } else {
            this.hasVRPoseInitialized = false;

            // 1. Restore pedestal stand anchored to desk
            if (this.neckMesh) this.neckMesh.visible = true;
            if (this.flangeMesh) this.flangeMesh.visible = true;

            // 2. Restore ENTER VR button
            if (this.enterVRBtnMesh) this.enterVRBtnMesh.visible = true;

            // 3. Restore START EXPERIMENT position
            if (this.startBtnMesh) {
                this.startBtnMesh.position.set(-0.16, -0.315, 0.044);
                this.startBtnMesh.userData.initialZ = 0.044;
            }

            // 4. Restore desktop scale and position
            this.group.scale.set(1, 1, 1);
            this.group.position.copy(this.desktopPos);
            this.group.rotation.copy(this.desktopRot);
        }
    }

    public updateVRPose(camPos: THREE.Vector3, camDir: THREE.Vector3) {
        if (!this.isVRMode || this.isExiting) return;
        // If pose hasn't been aligned to active VR camera yet, align now
        if (!this.hasVRPoseInitialized && camPos.lengthSq() > 0.01) {
            this.hasVRPoseInitialized = true;
            const horizDir = new THREE.Vector3(camDir.x, 0, camDir.z).normalize();
            if (horizDir.lengthSq() < 0.01) horizDir.set(0, 0, -1);

            const vrDist = 0.60;
            const targetPos = camPos.clone().add(horizDir.multiplyScalar(vrDist));
            targetPos.y = (camPos.y > 0.6) ? Math.max(1.10, Math.min(1.60, camPos.y - 0.08)) : 1.35;
            this.group.position.copy(targetPos);

            this.group.lookAt(new THREE.Vector3(camPos.x, targetPos.y, camPos.z));
            this.group.rotateX(-Math.PI / 36);
        }
    }

    // --- 1. BUILD PHYSICAL 3D TERMINAL HOUSING & PEDESTAL ---
    private buildTerminalChassis() {
        // Pedestal Column mounting into counter base
        const neckGeo = new THREE.CylinderGeometry(0.028, 0.038, 0.65, 20);
        const neckMat = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            metalness: 0.85,
            roughness: 0.25
        });
        const neck = new THREE.Mesh(neckGeo, neckMat);
        neck.position.set(0, -0.48, -0.02);
        this.neckMesh = neck;
        this.group.add(neck);

        // Heavy Base Flange Collar
        const flangeGeo = new THREE.CylinderGeometry(0.08, 0.10, 0.04, 24);
        const flangeMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            metalness: 0.9,
            roughness: 0.2
        });
        const flange = new THREE.Mesh(flangeGeo, flangeMat);
        flange.position.set(0, -0.78, -0.02);
        this.flangeMesh = flange;
        this.group.add(flange);

        // Terminal Main Backplate & Chassis (Width: 1.40m, Height: 0.86m, Thickness: 0.05m)
        const chassisGeo = new THREE.BoxGeometry(1.40, 0.86, 0.05);
        const chassisMat = new THREE.MeshStandardMaterial({
            color: 0x0b1120, // Deep futuristic slate
            metalness: 0.8,
            roughness: 0.25
        });
        const chassis = new THREE.Mesh(chassisGeo, chassisMat);
        this.group.add(chassis);

        // Sleek Metallic Bevel Rim with Luminescent Cyan Glow Accent
        const rimGeo = new THREE.BoxGeometry(1.42, 0.88, 0.012);
        const rimMat = new THREE.MeshStandardMaterial({
            color: 0x00e5ff,
            metalness: 0.9,
            roughness: 0.15,
            emissive: 0x003344
        });
        const rim = new THREE.Mesh(rimGeo, rimMat);
        rim.position.z = -0.022;
        this.group.add(rim);

        // High-Resolution 3D Screen Surface (Canvas Texture)
        this.mainCanvas = document.createElement('canvas');
        this.mainCanvas.width = 1200;
        this.mainCanvas.height = 700;
        this.mainTexture = new THREE.CanvasTexture(this.mainCanvas);
        this.mainTexture.colorSpace = THREE.SRGBColorSpace;

        const screenGeo = new THREE.PlaneGeometry(1.34, 0.80);
        const screenMat = new THREE.MeshBasicMaterial({
            map: this.mainTexture,
            transparent: true,
            polygonOffset: true,
            polygonOffsetFactor: -2,
            polygonOffsetUnits: -2,
            depthWrite: true
        });
        this.screenMesh = new THREE.Mesh(screenGeo, screenMat);
        this.screenMesh.position.z = 0.027;
        this.screenMesh.name = 'OrientationScreenCanvasMesh';
        this.group.add(this.screenMesh);
    }

    // --- 2. BUILD ROTATING 3D QUANTUM MOLECULE / ATOM CENTERPIECE ---
    private buildInteractiveMolecule() {
        this.moleculeGroup = new THREE.Group();
        this.moleculeGroup.name = 'OrientationMoleculeModel';
        // Precisely centered within designated left visualization area
        // (x = -0.402m perfectly aligns with frame center cx = 240; y = 0.012m sits midway between subtitle and instructions)
        this.moleculeGroup.position.set(-0.402, 0.012, 0.075);
        this.moleculeGroup.scale.set(0.72, 0.72, 0.72);
        this.group.add(this.moleculeGroup);

        // Glowing Quantum Core / Nucleus
        const coreGeo = new THREE.SphereGeometry(0.052, 24, 24);
        const coreMat = new THREE.MeshPhysicalMaterial({
            color: 0xffaa00,
            emissive: 0xff5500,
            roughness: 0.2,
            metalness: 0.1,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1
        });
        this.nucleusMesh = new THREE.Mesh(coreGeo, coreMat);
        this.nucleusMesh.userData = { isRotatableCenterpiece: true };
        this.moleculeGroup.add(this.nucleusMesh);

        // 3 Tilted Electron Orbit Rings
        const ringAngles = [
            { x: Math.PI / 5, y: 0, z: Math.PI / 6 },
            { x: -Math.PI / 4, y: Math.PI / 4, z: 0 },
            { x: Math.PI / 3, y: -Math.PI / 5, z: Math.PI / 3 }
        ];

        const ringColors = [0x00e5ff, 0x38bdf8, 0x00ff88];

        ringAngles.forEach((angle, idx) => {
            const ringGeo = new THREE.TorusGeometry(0.125 + idx * 0.015, 0.0035, 12, 48);
            const ringMat = new THREE.MeshStandardMaterial({
                color: ringColors[idx],
                emissive: ringColors[idx],
                roughness: 0.25,
                metalness: 0.8
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.set(angle.x, angle.y, angle.z);
            ring.userData = { isRotatableCenterpiece: true };
            this.moleculeGroup.add(ring);
            this.electronRings.push(ring);

            // Orbiting Electron Particle
            const eleGeo = new THREE.SphereGeometry(0.014, 16, 16);
            const eleMat = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                emissive: ringColors[idx],
                roughness: 0.1,
                metalness: 0.9
            });
            const electron = new THREE.Mesh(eleGeo, eleMat);
            electron.userData = { isRotatableCenterpiece: true };
            ring.add(electron);
            this.electronSpheres.push(electron);
        });

        // Protective Borosilicate Glass Viewing Dome
        const domeGeo = new THREE.SphereGeometry(0.19, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.65);
        const domeMat = new THREE.MeshPhysicalMaterial({
            color: 0x88ccff,
            transmission: 0.85,
            opacity: 0.35,
            transparent: true,
            roughness: 0.05,
            metalness: 0.05
        });
        const dome = new THREE.Mesh(domeGeo, domeMat);
        dome.position.z = -0.02;
        dome.userData = { isRotatableCenterpiece: true };
        this.moleculeGroup.add(dome);
    }

    // --- 3. HELPER: CREATE A GENUINE 3D BUTTON WITH VISIBLE FRONT PLAQUE ---
    private create3DButton(
        name: string,
        width: number,
        height: number,
        depth: number,
        bodyColor: number,
        gradientTop: string,
        gradientBottom: string,
        borderColor: string,
        label: string,
        fontSize: number,
        textColor = '#ffffff',
        userData: Record<string, any> = {}
    ): THREE.Mesh {
        const geo = new THREE.BoxGeometry(width, height, depth);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: bodyColor,
            metalness: 0.75,
            roughness: 0.3
        });
        const mesh = new THREE.Mesh(geo, bodyMat);
        mesh.name = name;
        mesh.userData = { ...userData, isButtonObject: true, initialZ: 0 };

        // Front Face Plaque with High-Contrast Canvas Texture
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 160;
        const ctx = canvas.getContext('2d')!;

        // Fill background gradient
        const grad = ctx.createLinearGradient(0, 0, 0, 160);
        grad.addColorStop(0, gradientTop);
        grad.addColorStop(1, gradientBottom);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 160);

        // Bevel border
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, 504, 152);

        // Subtle inner highlight
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 3;
        ctx.strokeRect(12, 12, 488, 136);

        // Crisp high-contrast label text
        ctx.fillStyle = textColor;
        ctx.font = `bold ${fontSize}px "Inter", -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, 256, 80);

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        const plaqueMat = new THREE.MeshBasicMaterial({
            map: tex,
            transparent: true,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1,
            depthWrite: true
        });
        const plaqueGeo = new THREE.PlaneGeometry(width - 0.004, height - 0.004);
        const plaque = new THREE.Mesh(plaqueGeo, plaqueMat);
        plaque.position.z = depth / 2 + 0.002;
        plaque.name = `${name}_Plaque`;
        plaque.userData = { ...userData, parentButton: mesh };
        mesh.add(plaque);

        return mesh;
    }

    // --- 4. BUILD 3D POKEABLE BUTTONS & CONTROLS ---
    private buildControlsAndButtons() {
        // A. 4 Physical Tab Buttons in dedicated navigation row below header
        // Header banner bottom is at y = +0.308m; Right bay content title starts below y = +0.190m.
        // Dedicated navigation row at y = +0.250m cleanly separates header and content without overlap.
        const tabWidth = 0.145;
        const tabHeight = 0.040;
        const tabDepth = 0.022;
        const startX = -0.002;
        const tabSpacing = 0.161; // 16mm gap between buttons
        const tabLabels = ['1. MISSION', '2. SAFETY', '3. STEPS', '4. CONTROLS'];

        this.tabMeshes = [];
        this.tabPlaqueData = [];

        for (let i = 0; i < this.totalTabs; i++) {
            const isActive = i === this.currentTab;
            const geo = new THREE.BoxGeometry(tabWidth, tabHeight, tabDepth);
            const bodyMat = new THREE.MeshStandardMaterial({
                color: isActive ? 0x0284c7 : 0x1e293b,
                metalness: 0.75,
                roughness: 0.3
            });
            const tabBtn = new THREE.Mesh(geo, bodyMat);
            tabBtn.name = `OrientationTabBtn_${i}`;
            tabBtn.userData = { isTabButton: true, tabIndex: i, isButtonObject: true, initialZ: 0.038 };

            // Plaque Canvas Texture
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 160;
            const ctx = canvas.getContext('2d')!;
            const texture = new THREE.CanvasTexture(canvas);
            texture.colorSpace = THREE.SRGBColorSpace;

            this.tabPlaqueData.push({
                ctx,
                texture,
                label: tabLabels[i]
            });

            const plaqueMat = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                polygonOffset: true,
                polygonOffsetFactor: -1,
                polygonOffsetUnits: -1,
                depthWrite: true
            });
            const plaqueGeo = new THREE.PlaneGeometry(tabWidth - 0.004, tabHeight - 0.004);
            const plaque = new THREE.Mesh(plaqueGeo, plaqueMat);
            plaque.position.z = tabDepth / 2 + 0.002;
            plaque.name = `OrientationTabBtn_${i}_Plaque`;
            plaque.userData = { isTabButton: true, tabIndex: i, parentButton: tabBtn };
            tabBtn.add(plaque);

            tabBtn.position.set(startX + i * tabSpacing, 0.250, 0.038);
            this.group.add(tabBtn);
            this.tabMeshes.push(tabBtn);
        }

        // Draw initial tab plaque faces
        this.updateTabVisuals();

        // B. 3D Prev / Next Page Buttons (Inside right bay at y = -0.21)
        this.prevBtnMesh = this.create3DButton(
            'OrientationPrevBtn',
            0.13,
            0.046,
            0.024,
            0x1e293b,
            '#334155',
            '#1e293b',
            '#00e5ff',
            '◀ PREV',
            34,
            '#ffffff',
            { isPrevButton: true }
        );
        this.prevBtnMesh.position.set(-0.02, -0.21, 0.038);
        this.prevBtnMesh.userData.initialZ = 0.038;
        this.group.add(this.prevBtnMesh);

        this.nextBtnMesh = this.create3DButton(
            'OrientationNextBtn',
            0.13,
            0.046,
            0.024,
            0x1e293b,
            '#334155',
            '#1e293b',
            '#00e5ff',
            'NEXT ▶',
            34,
            '#ffffff',
            { isNextButton: true }
        );
        this.nextBtnMesh.position.set(0.38, -0.21, 0.038);
        this.nextBtnMesh.userData.initialZ = 0.038;
        this.group.add(this.nextBtnMesh);

        // C. PROMINENT 3D "START EXPERIMENT" BUTTON (Bottom Left: x = -0.16, y = -0.32)
        this.startBtnMesh = this.create3DButton(
            'OrientationStartExperimentBtn',
            0.38,
            0.082,
            0.036,
            0x064e3b,
            '#059669',
            '#047857',
            '#34d399',
            '▶ START EXPERIMENT',
            32,
            '#ffffff',
            { isStartExperimentButton: true }
        );
        this.startBtnMesh.position.set(-0.16, -0.315, 0.044);
        this.startBtnMesh.userData.initialZ = 0.044;
        this.group.add(this.startBtnMesh);

        // D. PROMINENT 3D "ENTER VR" BUTTON (Bottom Right: x = 0.28, y = -0.32)
        this.enterVRBtnMesh = this.create3DButton(
            'OrientationEnterVRBtn',
            0.30,
            0.082,
            0.036,
            0x1e1b4b,
            '#0284c7',
            '#0369a1',
            '#38bdf8',
            '🥽 ENTER VR',
            32,
            '#ffffff',
            { isEnterVRButton: true }
        );
        this.enterVRBtnMesh.position.set(0.25, -0.315, 0.044);
        this.enterVRBtnMesh.userData.initialZ = 0.044;
        this.group.add(this.enterVRBtnMesh);
    }

    // --- 5. RENDER HIGH-DENSITY 2D CANVAS CONTENT ON 3D SCREEN ---
    private renderCanvasContent() {
        const ctx = this.mainCanvas.getContext('2d')!;
        ctx.clearRect(0, 0, 1200, 700);

        // Dark sci-fi glass gradient background
        const grad = ctx.createLinearGradient(0, 0, 1200, 700);
        grad.addColorStop(0, 'rgba(10, 16, 28, 0.98)');
        grad.addColorStop(1, 'rgba(15, 23, 42, 0.98)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1200, 700);

        // Outer cybernetic border
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 5;
        ctx.strokeRect(6, 6, 1188, 688);

        // Top Header Banner
        ctx.fillStyle = 'rgba(0, 229, 255, 0.10)';
        ctx.fillRect(10, 10, 1180, 70);
        ctx.fillStyle = '#00e5ff';
        ctx.font = 'bold 30px "Inter", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('⚡ LABVERSE — VIRTUAL CHEMISTRY LABORATORY', 35, 54);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 20px "Inter", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('CLASS 10 FLAME TEST EXPERIMENT', 1165, 54);

        // Left Bay: 3D Centerpiece Callout Frame (x = 35 to 440)
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
        ctx.lineWidth = 2;
        ctx.strokeRect(35, 100, 410, 480);
        ctx.fillStyle = 'rgba(2, 132, 199, 0.12)';
        ctx.fillRect(35, 100, 410, 480);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 22px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('QUANTUM ELECTRON MODEL', 240, 140);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '16px "Inter", sans-serif';
        ctx.fillText('Atomic Emission Spectroscopy', 240, 168);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = 'italic 15px "Inter", sans-serif';
        ctx.fillText('• Click / Poke atom to spin in 3D', 240, 520);
        ctx.fillText('• Observe quantum photon release', 240, 545);

        // Right Bay: Interactive Guidebook Tabs Content (x = 465 to 1165)
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.strokeRect(465, 100, 700, 480);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(465, 100, 700, 480);

        // Dedicated navigation row backing strip behind 3D tab buttons
        ctx.fillStyle = 'rgba(2, 6, 23, 0.65)';
        ctx.fillRect(470, 105, 690, 56);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.lineWidth = 1;
        ctx.strokeRect(470, 105, 690, 56);

        this.renderTabContent(ctx);

        // Page Indicator
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 18px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`PAGE ${this.currentTab + 1} OF ${this.totalTabs}`, 720, 555);

        this.mainTexture.needsUpdate = true;
    }

    private renderTabContent(ctx: CanvasRenderingContext2D) {
        ctx.textAlign = 'left';

        switch (this.currentTab) {
            case 0: // Overview & Scientific Mission
                ctx.fillStyle = '#00e5ff';
                ctx.font = 'bold 26px "Inter", sans-serif';
                ctx.fillText('EXPERIMENT OVERVIEW & OBJECTIVE', 495, 195);

                ctx.fillStyle = '#f1f5f9';
                ctx.font = 'bold 20px "Inter", sans-serif';
                ctx.fillText('• What is a Flame Test?', 495, 236);
                ctx.fillStyle = '#cbd5e1';
                ctx.font = '17px "Inter", sans-serif';
                this.wrapText(ctx, 'An analytical procedure used in chemistry to detect metal cations based on each element\'s characteristic emission spectrum.', 515, 265, 620, 26);

                ctx.fillStyle = '#f1f5f9';
                ctx.font = 'bold 20px "Inter", sans-serif';
                ctx.fillText('• Scientific Principle:', 495, 340);
                ctx.fillStyle = '#cbd5e1';
                ctx.font = '17px "Inter", sans-serif';
                this.wrapText(ctx, 'Thermal energy excites valence electrons to higher quantum orbitals. Returning to the ground state radiates electromagnetic waves (light) of characteristic colors.', 515, 369, 620, 26);

                ctx.fillStyle = '#34d399';
                ctx.font = 'bold 18px "Inter", sans-serif';
                ctx.fillText('🎯 YOUR MISSION: Identify 6 Mystery Salts (A to F) by their flame colours!', 495, 465);
                break;

            case 1: // Safety & Nitrile Gloves Protocol
                ctx.fillStyle = '#f59e0b';
                ctx.font = 'bold 26px "Inter", sans-serif';
                ctx.fillText('LAB SAFETY: GLOVES PROTOCOL', 495, 195);

                ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
                ctx.strokeStyle = '#ef4444';
                ctx.lineWidth = 2;
                ctx.strokeRect(495, 215, 640, 50);
                ctx.fillRect(495, 215, 640, 50);

                ctx.fillStyle = '#fca5a5';
                ctx.font = 'bold 19px "Inter", sans-serif';
                ctx.fillText('⚠ MANDATORY REQUIREMENT: WEAR SAFETY GLOVES', 510, 246);

                ctx.fillStyle = '#f1f5f9';
                ctx.font = '17px "Inter", sans-serif';
                this.wrapText(ctx, '1. Never touch chemicals or hot platinum wire with bare hands.', 495, 295, 620, 26);
                this.wrapText(ctx, '2. The Nitrile Gloves Dispenser is located on your FRONT-LEFT counter (-1.05m).', 495, 350, 620, 26);
                this.wrapText(ctx, '3. Click or poke the dispenser box to equip your safety gloves before handling equipment.', 495, 405, 620, 26);

                ctx.fillStyle = '#34d399';
                ctx.font = 'bold 18px "Inter", sans-serif';
                ctx.fillText('✔ Laboratory actions remain protected until gloves are equipped.', 495, 465);
                break;

            case 2: // Experiment Protocol & Sequence
                ctx.fillStyle = '#38bdf8';
                ctx.font = 'bold 26px "Inter", sans-serif';
                ctx.fillText('6-STEP EXPERIMENT WORKFLOW', 495, 195);

                const steps = [
                    'Step 1: Put on nitrile safety gloves from the dispenser box.',
                    'Step 2: Grab the platinum loop wire from the stand.',
                    'Step 3: Dip loop tip into a Mystery Salt dish (A to F).',
                    'Step 4: Switch on the Bunsen burner power switch.',
                    'Step 5: Bring prepared wire into the flame cone (<12cm).',
                    'Step 6: Observe the emission colour and review the 3D result.'
                ];

                ctx.fillStyle = '#f1f5f9';
                ctx.font = '17px "Inter", sans-serif';
                steps.forEach((step, idx) => {
                    ctx.fillText(step, 495, 238 + idx * 40);
                });
                break;

            case 3: // Interaction System & Controls Guide
                ctx.fillStyle = '#a855f7';
                ctx.font = 'bold 26px "Inter", sans-serif';
                ctx.fillText('INTERACTION & CONTROLS GUIDE', 495, 195);

                ctx.fillStyle = '#38bdf8';
                ctx.font = 'bold 18px "Inter", sans-serif';
                ctx.fillText('DESKTOP MODE:', 495, 235);
                ctx.fillStyle = '#cbd5e1';
                ctx.font = '16px "Inter", sans-serif';
                ctx.fillText('• Move: WASD keys | Look: Move mouse cursor', 515, 260);
                ctx.fillText('• Wire: Left-Click or E key | Release: Q key', 515, 286);
                ctx.fillText('• Burner: Click switch or L key | Reset: Click Reset or R key', 515, 312);

                ctx.fillStyle = '#38bdf8';
                ctx.font = 'bold 18px "Inter", sans-serif';
                ctx.fillText('META QUEST VR HEADSET:', 495, 350);
                ctx.fillStyle = '#cbd5e1';
                ctx.font = '16px "Inter", sans-serif';
                ctx.fillText('• Poke / Press: Touch buttons and switches directly with index finger', 515, 376);
                ctx.fillText('• Grab: Pinch thumb and index near platinum wire to pick up', 515, 402);
                ctx.fillText('• Dip: Lower wire loop into any salt sample dish', 515, 428);
                ctx.fillText('• Swipe: Deliberate horizontal hand swipe across guidebook to turn pages', 515, 454);
                break;
        }
    }

    private wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
        const words = text.split(' ');
        let line = '';
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
                ctx.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, y);
    }

    // --- SYNCHRONIZE ACTIVE TAB HIGHLIGHTING ACROSS BUTTONS ---
    private updateTabVisuals() {
        for (let i = 0; i < this.tabMeshes.length; i++) {
            const isActive = i === this.currentTab;
            const btn = this.tabMeshes[i];
            const mat = btn.material as THREE.MeshStandardMaterial;
            mat.color.setHex(isActive ? 0x0284c7 : 0x1e293b);

            const plaque = this.tabPlaqueData[i];
            if (plaque) {
                const { ctx, texture, label } = plaque;
                ctx.clearRect(0, 0, 512, 160);

                // Background gradient
                const grad = ctx.createLinearGradient(0, 0, 0, 160);
                if (isActive) {
                    grad.addColorStop(0, '#0284c7');
                    grad.addColorStop(1, '#0369a1');
                } else {
                    grad.addColorStop(0, '#1e293b');
                    grad.addColorStop(1, '#0f172a');
                }
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, 512, 160);

                // Outer border
                ctx.strokeStyle = isActive ? '#38bdf8' : '#475569';
                ctx.lineWidth = isActive ? 10 : 6;
                ctx.strokeRect(4, 4, 504, 152);

                // Subtle inner glow/highlight
                ctx.strokeStyle = isActive ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.15)';
                ctx.lineWidth = 3;
                ctx.strokeRect(12, 12, 488, 136);

                // Crisp high-contrast label text
                ctx.fillStyle = isActive ? '#ffffff' : '#94a3b8';
                ctx.font = 'bold 34px "Inter", -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(label, 256, 80);

                texture.needsUpdate = true;
            }
        }
    }

    public setTab(index: number) {
        if (index < 0 || index >= this.totalTabs || index === this.currentTab) return;
        this.currentTab = index;

        // Synchronize tab button visuals with active state
        this.updateTabVisuals();

        // Update guidebook content on screen canvas
        this.renderCanvasContent();
    }

    public nextTab() {
        const nextIndex = (this.currentTab + 1) % this.totalTabs;
        this.setTab(nextIndex);
    }

    public prevTab() {
        const prevIndex = (this.currentTab - 1 + this.totalTabs) % this.totalTabs;
        this.setTab(prevIndex);
    }

    // --- POKE & CLICK DISPATCHER ---
    public checkPokeAndInteract(pokePos: THREE.Vector3): boolean {
        if (this.isExiting || !this.group.visible) return false;
        const now = Date.now();
        if (now - this.lastInteractionTime < 200) return false;

        // 1. Check START EXPERIMENT Button Poke (< 30cm radius OR local box hit)
        const startPos = new THREE.Vector3();
        this.startBtnMesh.getWorldPosition(startPos);
        const distToStart = pokePos.distanceTo(startPos);
        const localStartPoke = this.startBtnMesh.worldToLocal(pokePos.clone());
        const inStartBounds = (
            Math.abs(localStartPoke.x) <= 0.28 &&
            Math.abs(localStartPoke.y) <= 0.10 &&
            Math.abs(localStartPoke.z) <= 0.18
        );
        if (distToStart < 0.30 || inStartBounds) {
            this.lastInteractionTime = now;
            this.triggerStartExperiment();
            return true;
        }

        // 2. Check ENTER VR Button Poke (only if visible and not in VR mode)
        if (this.enterVRBtnMesh && this.enterVRBtnMesh.visible && !this.isVRMode) {
            const vrPos = new THREE.Vector3();
            this.enterVRBtnMesh.getWorldPosition(vrPos);
            const distToVR = pokePos.distanceTo(vrPos);
            const localVRPoke = this.enterVRBtnMesh.worldToLocal(pokePos.clone());
            const inVRBounds = (
                Math.abs(localVRPoke.x) <= 0.20 &&
                Math.abs(localVRPoke.y) <= 0.08 &&
                Math.abs(localVRPoke.z) <= 0.15
            );
            if (distToVR < 0.28 || inVRBounds) {
                this.lastInteractionTime = now;
                this.triggerEnterVR();
                return true;
            }
        }

        // 3. Check Prev & Next Button Pokes (< 24cm)
        const prevPos = new THREE.Vector3();
        this.prevBtnMesh.getWorldPosition(prevPos);
        const localPrevPoke = this.prevBtnMesh.worldToLocal(pokePos.clone());
        const inPrevBounds = (
            Math.abs(localPrevPoke.x) <= 0.10 &&
            Math.abs(localPrevPoke.y) <= 0.06 &&
            Math.abs(localPrevPoke.z) <= 0.12
        );
        if (pokePos.distanceTo(prevPos) < 0.24 || inPrevBounds) {
            this.lastInteractionTime = now;
            this.animateButtonPress(this.prevBtnMesh);
            this.prevTab();
            return true;
        }

        const nextPos = new THREE.Vector3();
        this.nextBtnMesh.getWorldPosition(nextPos);
        const localNextPoke = this.nextBtnMesh.worldToLocal(pokePos.clone());
        const inNextBounds = (
            Math.abs(localNextPoke.x) <= 0.10 &&
            Math.abs(localNextPoke.y) <= 0.06 &&
            Math.abs(localNextPoke.z) <= 0.12
        );
        if (pokePos.distanceTo(nextPos) < 0.24 || inNextBounds) {
            this.lastInteractionTime = now;
            this.animateButtonPress(this.nextBtnMesh);
            this.nextTab();
            return true;
        }

        // 4. Check Tab Button Pokes (< 22cm)
        for (let i = 0; i < this.tabMeshes.length; i++) {
            const tPos = new THREE.Vector3();
            this.tabMeshes[i].getWorldPosition(tPos);
            const localTabPoke = this.tabMeshes[i].worldToLocal(pokePos.clone());
            const inTabBounds = (
                Math.abs(localTabPoke.x) <= 0.10 &&
                Math.abs(localTabPoke.y) <= 0.05 &&
                Math.abs(localTabPoke.z) <= 0.12
            );
            if (pokePos.distanceTo(tPos) < 0.22 || inTabBounds) {
                this.lastInteractionTime = now;
                this.animateButtonPress(this.tabMeshes[i]);
                this.setTab(i);
                return true;
            }
        }

        // 5. Check Molecule model touch / rotate
        const molPos = new THREE.Vector3();
        this.moleculeGroup.getWorldPosition(molPos);
        if (pokePos.distanceTo(molPos) < 0.20) {
            this.moleculeGroup.rotation.y += 0.35;
            this.moleculeGroup.rotation.x += 0.18;
            return true;
        }

        // 6. Deliberate Horizontal Swipe Detection in 3D Guidebook Info Area (y restricted to [ -0.14, 0.18 ])
        const localPos = this.group.worldToLocal(pokePos.clone());
        if (localPos.x >= 0.0 && localPos.x <= 0.65 && localPos.y >= -0.14 && localPos.y <= 0.18 && Math.abs(localPos.z) < 0.15) {
            if (!this.inSwipeZone || (now - this.swipeStartTime) > 600) {
                this.inSwipeZone = true;
                this.lastSwipeX = localPos.x;
                this.swipeStartTime = now;
            } else {
                const dx = localPos.x - this.lastSwipeX;
                if (Math.abs(dx) > 0.065 && (now - this.lastInteractionTime) > 280) {
                    this.lastInteractionTime = now;
                    this.inSwipeZone = false;
                    if (dx < -0.065) {
                        this.nextTab(); // Swipe Left -> Next Page
                    } else {
                        this.prevTab(); // Swipe Right -> Previous Page
                    }
                    return true;
                }
            }
        } else {
            this.inSwipeZone = false;
        }

        return false;
    }

    public handleClick(hitObj: THREE.Object3D, hitPoint?: THREE.Vector3): boolean {
        if (this.isExiting || !this.group.visible) return false;
        const now = Date.now();
        if (now - this.lastInteractionTime < 180) return false;

        // Proximity click check for START EXPERIMENT button (< 24cm from hit point)
        if (hitPoint && this.startBtnMesh) {
            const startPos = new THREE.Vector3();
            this.startBtnMesh.getWorldPosition(startPos);
            if (hitPoint.distanceTo(startPos) < 0.24) {
                this.lastInteractionTime = now;
                this.triggerStartExperiment();
                return true;
            }
        }

        // Proximity click check for ENTER VR button (< 24cm from hit point)
        if (hitPoint && this.enterVRBtnMesh && this.enterVRBtnMesh.visible && !this.isVRMode) {
            const vrPos = new THREE.Vector3();
            this.enterVRBtnMesh.getWorldPosition(vrPos);
            if (hitPoint.distanceTo(vrPos) < 0.24) {
                this.lastInteractionTime = now;
                this.triggerEnterVR();
                return true;
            }
        }

        // Proximity click check for PREV button (< 16cm from hit point)
        if (hitPoint && this.prevBtnMesh) {
            const prevPos = new THREE.Vector3();
            this.prevBtnMesh.getWorldPosition(prevPos);
            if (hitPoint.distanceTo(prevPos) < 0.16) {
                this.lastInteractionTime = now;
                this.animateButtonPress(this.prevBtnMesh);
                this.prevTab();
                return true;
            }
        }

        // Proximity click check for NEXT button (< 16cm from hit point)
        if (hitPoint && this.nextBtnMesh) {
            const nextPos = new THREE.Vector3();
            this.nextBtnMesh.getWorldPosition(nextPos);
            if (hitPoint.distanceTo(nextPos) < 0.16) {
                this.lastInteractionTime = now;
                this.animateButtonPress(this.nextBtnMesh);
                this.nextTab();
                return true;
            }
        }

        // Proximity click check for Tab buttons (< 14cm from hit point)
        if (hitPoint && this.tabMeshes) {
            for (let i = 0; i < this.tabMeshes.length; i++) {
                const tabPos = new THREE.Vector3();
                this.tabMeshes[i].getWorldPosition(tabPos);
                if (hitPoint.distanceTo(tabPos) < 0.14) {
                    this.lastInteractionTime = now;
                    this.animateButtonPress(this.tabMeshes[i]);
                    this.setTab(i);
                    return true;
                }
            }
        }

        let cur: THREE.Object3D | null = hitObj;
        while (cur) {
            if (cur === this.startBtnMesh || cur.userData?.isStartExperimentButton || cur.name?.includes('StartExperiment')) {
                this.lastInteractionTime = now;
                this.triggerStartExperiment();
                return true;
            }
            if ((cur === this.enterVRBtnMesh || cur.userData?.isEnterVRButton) && this.enterVRBtnMesh.visible && !this.isVRMode) {
                this.lastInteractionTime = now;
                this.triggerEnterVR();
                return true;
            }
            if (cur === this.prevBtnMesh || cur.userData?.isPrevButton) {
                this.lastInteractionTime = now;
                this.animateButtonPress(this.prevBtnMesh);
                this.prevTab();
                return true;
            }
            if (cur === this.nextBtnMesh || cur.userData?.isNextButton) {
                this.lastInteractionTime = now;
                this.animateButtonPress(this.nextBtnMesh);
                this.nextTab();
                return true;
            }
            if (cur.userData?.isTabButton && typeof cur.userData.tabIndex === 'number') {
                this.lastInteractionTime = now;
                const tabIndex = cur.userData.tabIndex;
                const targetBtn = this.tabMeshes[tabIndex] || (cur as THREE.Mesh);
                this.animateButtonPress(targetBtn);
                this.setTab(tabIndex);
                return true;
            }
            if (cur.userData?.isRotatableCenterpiece || cur === this.moleculeGroup) {
                this.moleculeGroup.rotation.y += 0.45;
                this.moleculeGroup.rotation.x += 0.22;
                return true;
            }
            cur = cur.parent;
        }

        return false;
    }

    public handleDrag(deltaX: number, deltaY: number) {
        if (this.isExiting || !this.group.visible) return;
        this.moleculeGroup.rotation.y += deltaX * 0.015;
        this.moleculeGroup.rotation.x += deltaY * 0.015;
    }

    private animateButtonPress(mesh: THREE.Mesh) {
        const initZ = (mesh.userData && typeof mesh.userData.initialZ === 'number' && mesh.userData.initialZ !== 0)
            ? mesh.userData.initialZ
            : mesh.position.z;
        mesh.position.z = initZ - 0.010;
        setTimeout(() => {
            mesh.position.z = initZ;
        }, 150);
    }

    private triggerStartExperiment() {
        if (this.isStartingTriggered) return;
        this.isStartingTriggered = true;

        // Button spring depression animation
        this.animateButtonPress(this.startBtnMesh);

        // Immediately trigger onStartExperiment while user gesture is active (unlocks audio & plays welcome sequence)
        try {
            this.callbacks.onStartExperiment();
        } catch (err) {
            console.error('[OrientationScreen3D] Error in onStartExperiment:', err);
        }

        // Smooth transition exit animation
        this.animateExit();
    }

    private triggerEnterVR() {
        this.animateButtonPress(this.enterVRBtnMesh);
        this.callbacks.onEnterVR();
    }

    public isOrientationExiting(): boolean {
        return this.isExiting;
    }

    public animateExit(onComplete?: () => void) {
        if (this.isExiting) return;
        this.isExiting = true;
        this.exitProgress = 0;

        const startY = this.group.position.y;
        const targetY = startY - 0.65; // sink into workbench
        const startScale = this.group.scale.x;

        const interval = setInterval(() => {
            this.exitProgress += 0.06;
            const progress = Math.min(1.0, this.exitProgress);

            // Smooth cubic ease out
            const ease = 1 - Math.pow(1 - progress, 3);
            this.group.position.y = THREE.MathUtils.lerp(startY, targetY, ease);
            const scale = THREE.MathUtils.lerp(startScale, 0.01, ease);
            this.group.scale.set(scale, scale, scale);

            if (progress >= 1.0) {
                clearInterval(interval);
                this.group.visible = false;
                if (onComplete) onComplete();
            }
        }, 16);
    }

    public resetOrientation() {
        this.isExiting = false;
        this.isStartingTriggered = false;
        this.hasVRPoseInitialized = false;
        if (this.isVRMode) {
            this.setVRMode(true);
        } else {
            this.setVRMode(false);
        }
        this.group.visible = true;
        this.setTab(0);
    }

    // --- 6. PER-FRAME ANIMATION (QUANTUM ORBIT DYNAMICS) ---
    public update(delta: number) {
        if (!this.group.visible) return;
        this.animTime += delta;

        // Rotate quantum molecule model
        this.moleculeGroup.rotation.y += delta * this.moleculeRotSpeed;
        this.moleculeGroup.rotation.x = Math.sin(this.animTime * 1.2) * 0.15;

        // Animate electrons around the torus rings
        for (let i = 0; i < this.electronSpheres.length; i++) {
            const angle = this.animTime * (2.0 + i * 0.8);
            const radius = 0.125 + i * 0.015;
            this.electronSpheres[i].position.set(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius,
                0
            );
        }

        // Pulse Start Experiment button face
        if (this.startBtnMesh && !this.isExiting) {
            const sGlow = 1.0 + Math.sin(this.animTime * 4) * 0.04;
            this.startBtnMesh.scale.set(sGlow, sGlow, 1.0);
        }

        // Pulse Enter VR button face (only if visible and not in VR)
        if (this.enterVRBtnMesh && this.enterVRBtnMesh.visible && !this.isVRMode && !this.isExiting) {
            const vrGlow = 1.0 + Math.cos(this.animTime * 4) * 0.04;
            this.enterVRBtnMesh.scale.set(vrGlow, vrGlow, 1.0);
        }
    }
}
