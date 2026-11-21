import * as THREE from 'three';

export interface ResultDisplayCallbacks {
    onContinue: () => void;
    onReset: () => void;
    onExitVR?: () => void;
    onClose: () => void;
}

export class ResultDisplay3D {
    public group: THREE.Group;
    private callbacks: ResultDisplayCallbacks;

    // 3D Chassis & Canvas Plaque
    private chassisMesh!: THREE.Mesh;
    private displayCanvas!: HTMLCanvasElement;
    private displayTexture!: THREE.CanvasTexture;

    // 3D Rotating Crystal Model (Feature 4 & 5.E)
    private crystalGroup!: THREE.Group;
    private crystalCore!: THREE.Mesh;
    private latticeSpheres: THREE.Mesh[] = [];

    // 3D Faceted Flame-Color Indicator Gemstone (Feature 4)
    private flameGemMesh!: THREE.Mesh;
    private flameGemLight!: THREE.PointLight;

    // Genuine 3D Physical Buttons with Readable Face Plaques
    private continueBtnMesh!: THREE.Mesh;
    private resetBtnMesh!: THREE.Mesh;
    private closeBtnMesh!: THREE.Mesh;

    // State & Animation
    private isVisible = false;
    private animTime = 0;
    private entranceProgress = 0;
    private currentSample: any = null;
    private lastInteractionTime = 0;

    constructor(callbacks: ResultDisplayCallbacks) {
        this.callbacks = callbacks;
        this.group = new THREE.Group();
        this.group.name = 'ResultDisplay3D';
        this.group.visible = false;

        this.buildPhysicalChassis();
        this.buildRotatingCrystalModel();
        this.buildFlameColorIndicator();
        this.buildButtons();
    }

    public getGroup(): THREE.Group {
        return this.group;
    }

    public getContinueButtonMesh(): THREE.Mesh {
        return this.continueBtnMesh;
    }

    public getResetButtonMesh(): THREE.Mesh {
        return this.resetBtnMesh;
    }

    public getExitVRButtonMesh(): THREE.Mesh | null {
        return null;
    }

    public getCurrentSample(): any {
        return this.currentSample;
    }

    // --- 1. BUILD PHYSICAL 3D TERMINAL CHASSIS ---
    private buildPhysicalChassis() {
        // Metallic layered casing (Width: 0.98m, Height: 0.64m, Depth: 0.045m)
        const chassisGeo = new THREE.BoxGeometry(0.98, 0.64, 0.045);
        const chassisMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a, // Deep slate graphite
            metalness: 0.85,
            roughness: 0.25
        });
        this.chassisMesh = new THREE.Mesh(chassisGeo, chassisMat);
        this.group.add(this.chassisMesh);

        // Glowing cyan-gold bevel trim edge
        const trimGeo = new THREE.BoxGeometry(1.00, 0.66, 0.010);
        const trimMat = new THREE.MeshStandardMaterial({
            color: 0x00e5ff,
            metalness: 0.9,
            roughness: 0.15,
            emissive: 0x003344
        });
        const trim = new THREE.Mesh(trimGeo, trimMat);
        trim.position.z = -0.020;
        this.group.add(trim);

        // High resolution Canvas Display Plaque
        this.displayCanvas = document.createElement('canvas');
        this.displayCanvas.width = 1200;
        this.displayCanvas.height = 700;
        this.displayTexture = new THREE.CanvasTexture(this.displayCanvas);
        this.displayTexture.colorSpace = THREE.SRGBColorSpace;

        const screenGeo = new THREE.PlaneGeometry(0.94, 0.60);
        const screenMat = new THREE.MeshBasicMaterial({
            map: this.displayTexture,
            transparent: true,
            polygonOffset: true,
            polygonOffsetFactor: -2,
            polygonOffsetUnits: -2,
            depthWrite: true
        });
        const screenMesh = new THREE.Mesh(screenGeo, screenMat);
        screenMesh.position.z = 0.0255;
        this.group.add(screenMesh);
    }

    // --- 2. BUILD ROTATING 3D MOLECULAR CRYSTAL CENTERPIECE ---
    private buildRotatingCrystalModel() {
        this.crystalGroup = new THREE.Group();
        this.crystalGroup.name = 'ResultMolecularCrystal';
        // Positioned at top-left bay (x = -0.32, y = 0.15, z = 0.065)
        this.crystalGroup.position.set(-0.32, 0.15, 0.065);
        this.group.add(this.crystalGroup);

        // Central Faceted Ionic Crystal Core (Octahedron)
        const coreGeo = new THREE.OctahedronGeometry(0.054, 0);
        const coreMat = new THREE.MeshPhysicalMaterial({
            color: 0x00e5ff,
            emissive: 0x003355,
            metalness: 0.2,
            roughness: 0.1,
            transmission: 0.65,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1
        });
        this.crystalCore = new THREE.Mesh(coreGeo, coreMat);
        this.crystalCore.userData = { isRotatableCrystal: true };
        this.crystalGroup.add(this.crystalCore);

        // Surrounding Cubic Ionic Lattice Vertices
        const vertOffsets = [
            [-0.055, -0.055, -0.055], [0.055, -0.055, -0.055], [-0.055, 0.055, -0.055], [0.055, 0.055, -0.055],
            [-0.055, -0.055, 0.055], [0.055, -0.055, 0.055], [-0.055, 0.055, 0.055], [0.055, 0.055, 0.055]
        ];

        const sGeo = new THREE.SphereGeometry(0.014, 16, 16);
        vertOffsets.forEach((v, idx) => {
            const isCation = idx % 2 === 0;
            const mat = new THREE.MeshStandardMaterial({
                color: isCation ? 0xffaa00 : 0x00ff88,
                emissive: isCation ? 0x664400 : 0x004422,
                roughness: 0.2,
                metalness: 0.6
            });
            const sphere = new THREE.Mesh(sGeo, mat);
            sphere.position.set(v[0], v[1], v[2]);
            sphere.userData = { isRotatableCrystal: true };
            this.crystalGroup.add(sphere);
            this.latticeSpheres.push(sphere);
        });
    }

    // --- 3. BUILD 3D FACETED FLAME-COLOR INDICATOR GEMSTONE ---
    private buildFlameColorIndicator() {
        const indGroup = new THREE.Group();
        indGroup.position.set(0.32, 0.15, 0.065);
        this.group.add(indGroup);

        // 3D Faceted Gemstone (Dodecahedron)
        const gemGeo = new THREE.DodecahedronGeometry(0.052, 0);
        const gemMat = new THREE.MeshPhysicalMaterial({
            color: 0xffaa00,
            emissive: 0xaa6600,
            metalness: 0.1,
            roughness: 0.05,
            transmission: 0.75,
            clearcoat: 1.0,
            ior: 1.76,
            transparent: true,
            opacity: 0.95
        });
        this.flameGemMesh = new THREE.Mesh(gemGeo, gemMat);
        indGroup.add(this.flameGemMesh);

        // Localized point light radiating flame emission color
        this.flameGemLight = new THREE.PointLight(0xffaa00, 0.8, 1.0);
        this.flameGemLight.position.set(0, 0, 0.03);
        indGroup.add(this.flameGemLight);
    }

    // --- 4. HELPER: CREATE 3D BUTTON WITH VISIBLE FRONT PLAQUE ---
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
            metalness: 0.8,
            roughness: 0.25
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

        // Inner highlight border
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

    // --- 5. BUILD 3D POKEABLE BUTTONS WITH VISIBLE LABELS ---
    private buildButtons() {
        const btnY = -0.235;
        const btnZ = 0.040;

        // A. 3D CONTINUE / TEST NEXT SALT BUTTON (Left)
        this.continueBtnMesh = this.create3DButton(
            'ResultContinueBtn',
            0.30,
            0.065,
            0.032,
            0x064e3b,
            '#059669',
            '#047857',
            '#34d399',
            '▶ CONTINUE (NEXT SALT)',
            27,
            '#ffffff',
            { isResultContinue: true }
        );
        this.continueBtnMesh.position.set(-0.17, btnY, btnZ);
        this.group.add(this.continueBtnMesh);

        // B. 3D RESET EXPERIMENT BUTTON (Right)
        this.resetBtnMesh = this.create3DButton(
            'ResultResetBtn',
            0.26,
            0.065,
            0.032,
            0x7f1d1d,
            '#dc2626',
            '#991b1b',
            '#f87171',
            '🔄 RESET LAB',
            28,
            '#ffffff',
            { isResultReset: true, isResetButton: true }
        );
        this.resetBtnMesh.position.set(0.17, btnY, btnZ);
        this.group.add(this.resetBtnMesh);

        // D. 3D Close '✕' Button (Top Right Corner: x = 0.44, y = 0.27)
        const closeGeo = new THREE.CircleGeometry(0.028, 24);
        const closeMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide });
        this.closeBtnMesh = new THREE.Mesh(closeGeo, closeMat);
        this.closeBtnMesh.name = 'ResultCloseBtn';
        this.closeBtnMesh.userData = { isResultClose: true };
        this.closeBtnMesh.position.set(0.44, 0.27, 0.032);

        const xGeo = new THREE.PlaneGeometry(0.032, 0.006);
        const xMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1
        });
        const x1 = new THREE.Mesh(xGeo, xMat);
        x1.rotation.z = Math.PI / 4;
        x1.position.z = 0.002;
        this.closeBtnMesh.add(x1);
        const x2 = new THREE.Mesh(xGeo, xMat);
        x2.rotation.z = -Math.PI / 4;
        x2.position.z = 0.0024;
        this.closeBtnMesh.add(x2);

        this.group.add(this.closeBtnMesh);
    }

    private targetDisplayScale = 1.0;

    // --- 6. POSITION 3D RESULT DEVICE ON USER'S RIGHT SIDE (Feature 4) ---
    public showResult(sample: any, camPos: THREE.Vector3, camDir: THREE.Vector3, isVRMode = false) {
        this.currentSample = sample;

        // Calculate right vector orthogonal to camera direction & world up
        const worldUp = new THREE.Vector3(0, 1, 0);
        const horizDir = new THREE.Vector3(camDir.x, 0, camDir.z).normalize();
        if (horizDir.lengthSq() < 0.01) horizDir.set(0, 0, -1);
        const camRight = horizDir.clone().cross(worldUp).normalize();

        // In VR: position at natural arm reach (0.72m) so CONTINUE, RESET, and crystal can be poked comfortably
        // In Desktop: position at 1.25m so it doesn't obstruct view
        const fwd = isVRMode ? 0.62 : 1.15;
        const right = isVRMode ? 0.35 : 0.50;
        this.targetDisplayScale = isVRMode ? 0.78 : 1.0;

        const targetPos = camPos.clone()
            .add(horizDir.multiplyScalar(fwd))
            .add(camRight.multiplyScalar(right));

        // Natural chest-to-eye height
        targetPos.y = isVRMode
            ? Math.max(1.15, Math.min(1.40, camPos.y - 0.12))
            : Math.max(1.25, Math.min(1.45, camPos.y - 0.15));

        this.group.position.copy(targetPos);
        // Face directly toward the standing user's position
        this.group.lookAt(new THREE.Vector3(camPos.x, targetPos.y, camPos.z));

        // Update Flame Indicator Gemstone Color
        const gemMat = this.flameGemMesh.material as THREE.MeshPhysicalMaterial;
        gemMat.color.setHex(sample.flameColor);
        gemMat.emissive.setHex(sample.flameColor);
        this.flameGemLight.color.setHex(sample.flameColor);

        // Update 3D Molecular Crystal Core Color
        const coreMat = this.crystalCore.material as THREE.MeshPhysicalMaterial;
        coreMat.color.setHex(sample.flameColor);
        coreMat.emissive.setHex(sample.flameColor);

        // Render Canvas Report
        this.renderCanvasReport(sample);

        // Entrance scale-up animation
        this.isVisible = true;
        this.group.visible = true;
        this.entranceProgress = 0;
        this.group.scale.set(0.01, 0.01, 0.01);
    }

    public hide() {
        this.isVisible = false;
        this.group.visible = false;
    }

    // --- 7. RENDER 2D ANALYSIS DATA ON 3D CANVAS SCREEN ---
    private renderCanvasReport(sample: any) {
        const ctx = this.displayCanvas.getContext('2d')!;
        ctx.clearRect(0, 0, 1200, 700);

        // Dark sci-fi gradient background
        const grad = ctx.createLinearGradient(0, 0, 1200, 700);
        grad.addColorStop(0, 'rgba(10, 16, 26, 0.98)');
        grad.addColorStop(1, 'rgba(15, 23, 42, 0.98)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1200, 700);

        // Border colored with confirmed flame emission
        ctx.strokeStyle = '#' + sample.flameColor.toString(16).padStart(6, '0');
        ctx.lineWidth = 5;
        ctx.strokeRect(6, 6, 1188, 688);

        // Header Banner
        ctx.fillStyle = 'rgba(0, 229, 255, 0.10)';
        ctx.fillRect(10, 10, 1180, 65);

        ctx.fillStyle = '#00e5ff';
        ctx.font = 'bold 30px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🔬 FLAME TEST EMISSION SPECTROSCOPY REPORT', 600, 52);

        // Left 3D Bay Title (Crystal Model Callout)
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 18px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CRYSTAL LATTICE', 220, 255);
        ctx.font = '14px "Inter", sans-serif';
        ctx.fillText('(Drag to rotate)', 220, 280);

        // Right 3D Bay Title (Flame Indicator Callout)
        ctx.fillStyle = '#' + sample.flameColor.toString(16).padStart(6, '0');
        ctx.font = 'bold 18px "Inter", sans-serif';
        ctx.fillText('FLAME INDICATOR', 980, 255);
        ctx.font = '14px "Inter", sans-serif';
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText(sample.flameName, 980, 280);

        // Center Identification Block (x = 380 to 820)
        ctx.fillStyle = 'rgba(2, 132, 199, 0.14)';
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.45)';
        ctx.lineWidth = 2;
        ctx.strokeRect(360, 95, 480, 180);
        ctx.fillRect(360, 95, 480, 180);

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 22px "Inter", sans-serif';
        ctx.fillText(`TESTED: ${sample.mysteryName || 'MYSTERY SAMPLE'}`, 600, 132);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px "Inter", sans-serif';
        ctx.fillText(`IDENTIFIED: ${sample.name}`, 600, 180);

        ctx.fillStyle = '#' + sample.flameColor.toString(16).padStart(6, '0');
        ctx.font = 'bold 24px "Inter", sans-serif';
        ctx.fillText(`Formula: ${sample.formula} | Flame: ${sample.flameName}`, 600, 230);

        // Scientific Explanation & Electron Excitation Theory (Bottom Panel)
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.strokeRect(35, 305, 1130, 230);
        ctx.fillRect(35, 305, 1130, 230);

        ctx.textAlign = 'left';
        ctx.fillStyle = '#00e5ff';
        ctx.font = 'bold 22px "Inter", sans-serif';
        ctx.fillText('SCIENTIFIC EXPLANATION & ELECTRON DYNAMICS:', 60, 345);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '18px "Inter", sans-serif';
        this.wrapText(
            ctx,
            `${sample.info} When exposed to high temperature in the flame, metal cations absorb thermal energy, promoting valence electrons to quantized excited energy levels. Upon returning to their stable ground state, photons with this precise wavelength and colour are emitted.`,
            60,
            388,
            1080,
            28
        );

        this.displayTexture.needsUpdate = true;
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

    // --- 8. INTERACTION HANDLERS (POKE, CLICK, & DRAG) ---
    public checkPokeAndInteract(pokePos: THREE.Vector3): boolean {
        if (!this.isVisible || !this.group.visible) return false;
        const now = Date.now();
        if (now - this.lastInteractionTime < 240) return false;

        // A. Continue / Next Salt Button Poke (< 28cm or local bounds)
        const contPos = new THREE.Vector3();
        this.continueBtnMesh.getWorldPosition(contPos);
        const localContPoke = this.continueBtnMesh.worldToLocal(pokePos.clone());
        const inContBounds = (
            Math.abs(localContPoke.x) <= 0.18 &&
            Math.abs(localContPoke.y) <= 0.07 &&
            Math.abs(localContPoke.z) <= 0.14
        );
        if (pokePos.distanceTo(contPos) < 0.28 || inContBounds) {
            this.lastInteractionTime = now;
            this.animateButtonPress(this.continueBtnMesh);
            this.callbacks.onContinue();
            return true;
        }

        // B. Reset Lab Button Poke (< 28cm or local bounds)
        const resetPos = new THREE.Vector3();
        this.resetBtnMesh.getWorldPosition(resetPos);
        const localResetPoke = this.resetBtnMesh.worldToLocal(pokePos.clone());
        const inResetBounds = (
            Math.abs(localResetPoke.x) <= 0.18 &&
            Math.abs(localResetPoke.y) <= 0.07 &&
            Math.abs(localResetPoke.z) <= 0.14
        );
        if (pokePos.distanceTo(resetPos) < 0.28 || inResetBounds) {
            this.lastInteractionTime = now;
            this.animateButtonPress(this.resetBtnMesh);
            this.callbacks.onReset();
            return true;
        }

        // C. Close Button Poke (< 18cm)
        const closePos = new THREE.Vector3();
        this.closeBtnMesh.getWorldPosition(closePos);
        if (pokePos.distanceTo(closePos) < 0.18) {
            this.lastInteractionTime = now;
            this.callbacks.onClose();
            return true;
        }

        // D. Crystal rotate touch
        const cryPos = new THREE.Vector3();
        this.crystalGroup.getWorldPosition(cryPos);
        if (pokePos.distanceTo(cryPos) < 0.18) {
            this.crystalGroup.rotation.y += 0.35;
            this.crystalGroup.rotation.x += 0.20;
            return true;
        }

        return false;
    }

    public handleClick(hitObj: THREE.Object3D, hitPoint?: THREE.Vector3): boolean {
        if (!this.isVisible || !this.group.visible) return false;
        const now = Date.now();
        if (now - this.lastInteractionTime < 180) return false;

        if (hitPoint) {
            // Proximity checks for Continue and Reset buttons (< 20cm from ray hit point)
            const cPos = new THREE.Vector3();
            this.continueBtnMesh.getWorldPosition(cPos);
            if (hitPoint.distanceTo(cPos) < 0.20) {
                this.lastInteractionTime = now;
                this.animateButtonPress(this.continueBtnMesh);
                this.callbacks.onContinue();
                return true;
            }

            const rPos = new THREE.Vector3();
            this.resetBtnMesh.getWorldPosition(rPos);
            if (hitPoint.distanceTo(rPos) < 0.20) {
                this.lastInteractionTime = now;
                this.animateButtonPress(this.resetBtnMesh);
                this.callbacks.onReset();
                return true;
            }
        }

        let cur: THREE.Object3D | null = hitObj;
        while (cur) {
            if (cur === this.continueBtnMesh || cur.userData?.isResultContinue) {
                this.lastInteractionTime = now;
                this.animateButtonPress(this.continueBtnMesh);
                this.callbacks.onContinue();
                return true;
            }
            if (cur === this.resetBtnMesh || cur.userData?.isResultReset) {
                this.lastInteractionTime = now;
                this.animateButtonPress(this.resetBtnMesh);
                this.callbacks.onReset();
                return true;
            }
            if (cur === this.closeBtnMesh || cur.userData?.isResultClose) {
                this.lastInteractionTime = now;
                this.callbacks.onClose();
                return true;
            }
            if (cur.userData?.isRotatableCrystal || cur === this.crystalGroup) {
                this.crystalGroup.rotation.y += 0.45;
                this.crystalGroup.rotation.x += 0.25;
                return true;
            }
            cur = cur.parent;
        }

        return false;
    }

    public handleDrag(deltaX: number, deltaY: number) {
        if (!this.isVisible || !this.group.visible) return;
        this.crystalGroup.rotation.y += deltaX * 0.015;
        this.crystalGroup.rotation.x += deltaY * 0.015;
    }

    private animateButtonPress(mesh: THREE.Mesh) {
        const initZ = mesh.position.z;
        mesh.position.z -= 0.010;
        setTimeout(() => {
            mesh.position.z = initZ;
        }, 150);
    }

    // --- 9. PER-FRAME ANIMATION & GEMSTONE GLOW ---
    public update(delta: number) {
        if (!this.isVisible || !this.group.visible) return;
        this.animTime += delta;

        // Smooth entrance scaling
        if (this.entranceProgress < 1.0) {
            this.entranceProgress += delta * 3.5;
            const progress = Math.min(1.0, this.entranceProgress);
            const ease = 1 - Math.pow(1 - progress, 3);
            const currentScale = ease * this.targetDisplayScale;
            this.group.scale.set(currentScale, currentScale, currentScale);
        }

        // Rotate 3D molecular crystal
        this.crystalGroup.rotation.y += delta * 0.6;
        this.crystalGroup.rotation.x += delta * 0.3;

        // Gemstone flame breathing pulsation
        if (this.flameGemMesh) {
            this.flameGemMesh.rotation.y += delta * 0.8;
            const pulse = 1.0 + Math.sin(this.animTime * 4) * 0.08;
            this.flameGemMesh.scale.set(pulse, pulse, pulse);
            this.flameGemLight.intensity = 0.6 + Math.sin(this.animTime * 4) * 0.25;
        }
    }
}
