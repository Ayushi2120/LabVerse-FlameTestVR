import * as THREE from 'three';

export interface SaltObservationData {
    letter: string;
    mysteryName: string;
    name: string;
    formula: string;
    flameColor: number;
    flameName: string;
    info: string;
    testNumber: number;
}

export interface LabBookCallbacks {
    onPageFlip?: () => void;
}

export class LabBook3D {
    public group: THREE.Group;
    private callbacks: LabBookCallbacks;

    // Physical Book 3D Elements
    private bookChassis!: THREE.Mesh;
    private pagesCanvas!: HTMLCanvasElement;
    private pagesTexture!: THREE.CanvasTexture;

    // Physical Buttons for Page Turning
    private prevBtnMesh!: THREE.Mesh;
    private nextBtnMesh!: THREE.Mesh;

    // Tabletop Desk Blotter & Book Elements
    private deskBlotterGroup!: THREE.Group;
    private notebookGroup!: THREE.Group;

    // Dynamic 3D Page Turn Animation Elements
    private flipPivot!: THREE.Group;
    private flipMesh!: THREE.Mesh;
    private isFlipping = false;
    private flipProgress = 0;
    private flipDir = 1; // 1 for next, -1 for prev

    // State
    private currentSpread = 0; // 0: Pages 1-2, 1: Pages 3-4, 2: Pages 5-6, 3: Pages 7-8 (Summary & Theory)
    private totalSpreads = 4;
    // Observations Store: Keyed by salt letter ('A', 'B', 'C', 'D', 'E', 'F')
    private observations: Map<string, SaltObservationData> = new Map();

    // Dedicated Swipe Gesture Tracking in VR
    private lastSwipeX = 0;
    private swipeStartTime = 0;
    private inSwipeZone = false;
    private lastInteractionTime = 0;

    constructor(callbacks: LabBookCallbacks = {}) {
        this.callbacks = callbacks;
        this.group = new THREE.Group();
        this.group.name = 'LabBook3DGroup';

        // Position resting naturally on laboratory workbench tabletop (tabletop surface is at y = 0.90m)
        // Positioned securely at x = 0.82m, z = -0.62m, resting flush on the table surface with generous spacing
        // Subtle natural yaw angle (-0.16 rad / ~9 deg) facing student standing in front of table
        this.group.position.set(0.82, 0.90, -0.62);
        this.group.rotation.set(0, -0.16, 0);

        this.buildDeskBlotterAndCradle();
        this.buildBookModel();
        this.buildButtons();
        this.renderBookPages();
    }

    public getGroup(): THREE.Group {
        return this.group;
    }

    public getObservationsCount(): number {
        return this.observations.size;
    }

    public isSaltCompleted(letter: string): boolean {
        return this.observations.has(letter);
    }

    public getObservations(): Map<string, SaltObservationData> {
        return this.observations;
    }

    // --- 1. EXECUTIVE LEATHER DESK BLOTTER ---
    private buildDeskBlotterAndCradle() {
        this.deskBlotterGroup = new THREE.Group();
        this.deskBlotterGroup.name = 'DeskBlotterGroup';

        // Dark charcoal leather blotter mat (Width: 0.46m, Depth: 0.35m, Thickness: 0.003m)
        // Resting flush on table surface from y = 0.000 to y = 0.003
        const blotterMat = new THREE.MeshStandardMaterial({
            color: 0x141d28, // Deep textured charcoal leather
            roughness: 0.78,
            metalness: 0.12
        });
        const blotter = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.003, 0.35), blotterMat);
        blotter.position.set(0, 0.0015, -0.006);
        blotter.receiveShadow = true;
        this.deskBlotterGroup.add(blotter);

        // Embossed inner border / stitch ridge
        const stitchMat = new THREE.MeshStandardMaterial({
            color: 0x0e1520,
            roughness: 0.85,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1
        });
        const stitchRidge = new THREE.Mesh(new THREE.BoxGeometry(0.446, 0.0008, 0.336), stitchMat);
        stitchRidge.position.set(0, 0.0032, -0.006);
        this.deskBlotterGroup.add(stitchRidge);

        // Polished brass corner bindings on blotter corners
        const brassMat = new THREE.MeshStandardMaterial({
            color: 0xd4af37,
            metalness: 0.85,
            roughness: 0.25
        });
        const cornerGeo = new THREE.BoxGeometry(0.026, 0.004, 0.026);
        [
            [-0.218, 0.163],
            [-0.218, -0.175],
            [0.218, 0.163],
            [0.218, -0.175]
        ].forEach(([cx, cz]) => {
            const corner = new THREE.Mesh(cornerGeo, brassMat);
            corner.position.set(cx, 0.002, cz - 0.006);
            this.deskBlotterGroup.add(corner);
        });

        this.group.add(this.deskBlotterGroup);
    }

    // --- 2. THREE-DIMENSIONAL PHYSICAL SCIENCE NOTEBOOK ---
    private buildBookModel() {
        this.notebookGroup = new THREE.Group();
        this.notebookGroup.name = 'NotebookGroup';
        this.notebookGroup.position.set(0, 0, 0);

        // Hardcover Board Material: Deep midnight-navy library buckram cloth
        const coverMat = new THREE.MeshStandardMaterial({
            color: 0x0c1626,
            roughness: 0.55,
            metalness: 0.18
        });

        // Hardcover Case Board (Width: 0.420m, Thickness: 0.006m, Depth: 0.298m)
        // Resting directly on blotter from y = 0.003 to y = 0.009
        const backBoard = new THREE.Mesh(new THREE.BoxGeometry(0.420, 0.006, 0.298), coverMat);
        backBoard.position.set(0, 0.006, -0.006);
        backBoard.receiveShadow = true;
        this.notebookGroup.add(backBoard);

        // Polished Brass Corner Protectors on hardcover corners
        const goldCornerMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.85, roughness: 0.25 });
        const goldCornerGeo = new THREE.BoxGeometry(0.022, 0.007, 0.022);
        [
            [-0.200, 0.134],
            [-0.200, -0.146],
            [0.200, 0.134],
            [0.200, -0.146]
        ].forEach(([cx, cz]) => {
            const corner = new THREE.Mesh(goldCornerGeo, goldCornerMat);
            corner.position.set(cx, 0.007, cz - 0.006);
            this.notebookGroup.add(corner);
        });

        // Visible Spine Cylinder along center gutter
        const spineGeo = new THREE.CylinderGeometry(0.010, 0.010, 0.296, 20);
        spineGeo.rotateX(Math.PI / 2); // Aligned along Z-axis
        const spineMat = new THREE.MeshStandardMaterial({ color: 0x09101c, roughness: 0.5, metalness: 0.25 });
        const spine = new THREE.Mesh(spineGeo, spineMat);
        spine.position.set(0, 0.009, -0.006);
        this.notebookGroup.add(spine);

        // 5 Raised gold foil bands / ribs along spine
        const bandGeo = new THREE.CylinderGeometry(0.0105, 0.0105, 0.003, 20);
        bandGeo.rotateX(Math.PI / 2);
        [-0.11, -0.055, 0, 0.055, 0.11].forEach(zPos => {
            const band = new THREE.Mesh(bandGeo, goldCornerMat);
            band.position.set(0, 0.009, zPos - 0.006);
            this.notebookGroup.add(band);
        });

        // Archival Paper Block Material: Warm layered cream paper with matte finish
        const paperBlockMat = new THREE.MeshStandardMaterial({
            color: 0xf5f1e4,
            roughness: 0.88,
            metalness: 0.02
        });

        // Stacked Paper Blocks (Substantial 12mm thickness!)
        // Left paper block (Pages turned): y = 0.009 to y = 0.021
        const leftPaper = new THREE.Mesh(new THREE.BoxGeometry(0.194, 0.012, 0.262), paperBlockMat);
        leftPaper.position.set(-0.100, 0.015, -0.014);
        leftPaper.receiveShadow = true;
        this.notebookGroup.add(leftPaper);

        // Right paper block (Pages to come): y = 0.009 to y = 0.021
        const rightPaper = new THREE.Mesh(new THREE.BoxGeometry(0.194, 0.012, 0.262), paperBlockMat);
        rightPaper.position.set(0.100, 0.015, -0.014);
        rightPaper.receiveShadow = true;
        this.notebookGroup.add(rightPaper);

        // Layered Paper Edge Strata (Fine horizontal edge trim showing authentic page leaves)
        const edgeGildMat = new THREE.MeshStandardMaterial({ color: 0xe8dfcb, roughness: 0.75 });
        const edgeTrimL = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.0118, 0.260), edgeGildMat);
        edgeTrimL.position.set(-0.1975, 0.015, -0.014);
        this.notebookGroup.add(edgeTrimL);

        const edgeTrimR = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.0118, 0.260), edgeGildMat);
        edgeTrimR.position.set(0.1975, 0.015, -0.014);
        this.notebookGroup.add(edgeTrimR);

        // Slightly curved / rounded outer page corners (4 corner bevel caps)
        const cornerCapGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.012, 12);
        [
            [-0.194, 0.114],
            [-0.194, -0.142],
            [0.194, 0.114],
            [0.194, -0.142]
        ].forEach(([cx, cz]) => {
            const cap = new THREE.Mesh(cornerCapGeo, paperBlockMat);
            cap.position.set(cx, 0.015, cz);
            this.notebookGroup.add(cap);
        });

        // High-Resolution 2D Dynamic Canvas Spread (1536 x 1024)
        this.pagesCanvas = document.createElement('canvas');
        this.pagesCanvas.width = 1536;
        this.pagesCanvas.height = 1024;
        this.pagesTexture = new THREE.CanvasTexture(this.pagesCanvas);
        this.pagesTexture.colorSpace = THREE.SRGBColorSpace;

        // Open Pages Surface Plaque (Both Pages Left & Right)
        // With polygonOffset for guaranteed zero z-fighting on Meta Quest & desktop
        const pageFaceMat = new THREE.MeshStandardMaterial({
            map: this.pagesTexture,
            roughness: 0.88,
            metalness: 0.02,
            polygonOffset: true,
            polygonOffsetFactor: -2,
            polygonOffsetUnits: -2,
            depthWrite: true
        });

        const faceGeo = new THREE.PlaneGeometry(0.388, 0.260);
        faceGeo.rotateX(-Math.PI / 2); // Lies flat facing UP (+Y)
        this.bookChassis = new THREE.Mesh(faceGeo, pageFaceMat);
        this.bookChassis.name = 'LabBookPagesFace';
        this.bookChassis.position.set(0, 0.0212, -0.014);
        this.bookChassis.receiveShadow = true;
        this.bookChassis.userData = { isLabBookFace: true };
        this.notebookGroup.add(this.bookChassis);

        // Slim Crimson Satin Ribbon Bookmark nestled in center gutter
        const ribbonGeo = new THREE.PlaneGeometry(0.006, 0.310);
        ribbonGeo.rotateX(-Math.PI / 2);
        const ribbonMat = new THREE.MeshStandardMaterial({
            color: 0xc1121f,
            roughness: 0.35,
            metalness: 0.15,
            polygonOffset: true,
            polygonOffsetFactor: -3,
            polygonOffsetUnits: -3
        });
        const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
        ribbon.position.set(0, 0.0222, 0.005);
        this.notebookGroup.add(ribbon);

        // Tapered ribbon tail hanging past the lower edge onto blotter
        const tailGeo = new THREE.ConeGeometry(0.005, 0.018, 3);
        tailGeo.rotateX(-Math.PI / 2);
        const ribbonTail = new THREE.Mesh(tailGeo, ribbonMat);
        ribbonTail.position.set(0, 0.008, 0.160);
        this.notebookGroup.add(ribbonTail);

        // --- DYNAMIC PAGE-TURNING LEAF (3D PHYSICAL FLIP ANIMATION) ---
        this.flipPivot = new THREE.Group();
        this.flipPivot.name = 'PageFlipPivot';
        this.flipPivot.position.set(0, 0.0216, -0.014);

        const flipLeafGeo = new THREE.PlaneGeometry(0.192, 0.258);
        flipLeafGeo.rotateX(-Math.PI / 2);
        flipLeafGeo.translate(0.096, 0, 0); // Pivot along the spine edge (x = 0)
        const flipLeafMat = new THREE.MeshStandardMaterial({
            color: 0xf8f5ee,
            roughness: 0.85,
            side: THREE.DoubleSide
        });
        this.flipMesh = new THREE.Mesh(flipLeafGeo, flipLeafMat);
        this.flipMesh.visible = false;
        this.flipPivot.add(this.flipMesh);
        this.notebookGroup.add(this.flipPivot);

        this.group.add(this.notebookGroup);
    }

    // --- 3. PAGE-TURNING 3D BUTTONS ON LOWER HARDCOVER SHELF ---
    private buildButtons() {
        const btnGeo = new THREE.BoxGeometry(0.100, 0.010, 0.026);

        // A. Previous Page Button (z = +0.134, completely below paper edge at z = +0.116)
        const pCanvas = document.createElement('canvas');
        pCanvas.width = 384; pCanvas.height = 96;
        const pctx = pCanvas.getContext('2d')!;
        pctx.fillStyle = '#0f172a'; pctx.fillRect(0, 0, 384, 96);
        pctx.fillStyle = '#0284c7'; pctx.fillRect(4, 4, 376, 88);
        pctx.strokeStyle = '#38bdf8'; pctx.lineWidth = 5; pctx.strokeRect(6, 6, 372, 84);
        pctx.fillStyle = '#ffffff'; pctx.font = 'bold 28px "Inter", sans-serif'; pctx.textAlign = 'center';
        pctx.fillText('◀ PREV PAGE', 192, 58);
        const pTex = new THREE.CanvasTexture(pCanvas);
        pTex.colorSpace = THREE.SRGBColorSpace;
        const pFaceMat = new THREE.MeshBasicMaterial({ map: pTex });
        const pSideMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, metalness: 0.3, roughness: 0.4 });

        this.prevBtnMesh = new THREE.Mesh(btnGeo, [
            pSideMat, pSideMat, pFaceMat, pSideMat, pSideMat, pSideMat
        ]);
        this.prevBtnMesh.name = 'LabBookPrevBtn';
        this.prevBtnMesh.userData = { isLabBookPrev: true, initialY: 0.012 };
        this.prevBtnMesh.position.set(-0.112, 0.012, 0.134);
        this.notebookGroup.add(this.prevBtnMesh);

        // B. Next Page Button (z = +0.134, completely below paper edge at z = +0.116)
        const nCanvas = document.createElement('canvas');
        nCanvas.width = 384; nCanvas.height = 96;
        const nctx = nCanvas.getContext('2d')!;
        nctx.fillStyle = '#0f172a'; nctx.fillRect(0, 0, 384, 96);
        nctx.fillStyle = '#0284c7'; nctx.fillRect(4, 4, 376, 88);
        nctx.strokeStyle = '#38bdf8'; nctx.lineWidth = 5; nctx.strokeRect(6, 6, 372, 84);
        nctx.fillStyle = '#ffffff'; nctx.font = 'bold 28px "Inter", sans-serif'; nctx.textAlign = 'center';
        nctx.fillText('NEXT PAGE ▶', 192, 58);
        const nTex = new THREE.CanvasTexture(nCanvas);
        nTex.colorSpace = THREE.SRGBColorSpace;
        const nFaceMat = new THREE.MeshBasicMaterial({ map: nTex });
        const nSideMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, metalness: 0.3, roughness: 0.4 });

        this.nextBtnMesh = new THREE.Mesh(btnGeo, [
            nSideMat, nSideMat, nFaceMat, nSideMat, nSideMat, nSideMat
        ]);
        this.nextBtnMesh.name = 'LabBookNextBtn';
        this.nextBtnMesh.userData = { isLabBookNext: true, initialY: 0.012 };
        this.nextBtnMesh.position.set(0.112, 0.012, 0.134);
        this.notebookGroup.add(this.nextBtnMesh);

        // C. Center Gold-Foil Science Notebook Insignia Plaque on lower shelf
        const bCanvas = document.createElement('canvas');
        bCanvas.width = 256; bCanvas.height = 64;
        const bctx = bCanvas.getContext('2d')!;
        bctx.fillStyle = '#0c1626'; bctx.fillRect(0, 0, 256, 64);
        bctx.strokeStyle = '#d4af37'; bctx.lineWidth = 3; bctx.strokeRect(2, 2, 252, 60);
        bctx.fillStyle = '#d4af37'; bctx.font = 'bold 22px "Inter", sans-serif'; bctx.textAlign = 'center';
        bctx.fillText('SCIENCE NOTEBOOK', 128, 40);
        const bTex = new THREE.CanvasTexture(bCanvas);
        bTex.colorSpace = THREE.SRGBColorSpace;
        const badgeMat = new THREE.MeshBasicMaterial({
            map: bTex,
            polygonOffset: true,
            polygonOffsetFactor: -2,
            polygonOffsetUnits: -2
        });
        const badge = new THREE.Mesh(new THREE.PlaneGeometry(0.076, 0.019), badgeMat);
        badge.rotateX(-Math.PI / 2);
        badge.position.set(0, 0.0102, 0.134);
        this.notebookGroup.add(badge);
    }

    // --- 4. RECORD ACTUAL EXPERIMENT OBSERVATION (FEATURE 4) ---
    public recordObservation(sample: any, testNumber?: number) {
        if (!sample || !sample.letter) return;
        const letter = sample.letter.toUpperCase();

        const obsData: SaltObservationData = {
            letter,
            mysteryName: sample.mysteryName || `Mystery Salt ${letter}`,
            name: sample.name || 'Unknown',
            formula: sample.formula || '',
            flameColor: sample.flameColor || 0xffffff,
            flameName: sample.flameName || 'Observed Flame',
            info: sample.info || '',
            testNumber: testNumber || sample.testNumber || (this.observations.size + 1)
        };

        // Never duplicate a record if the same event fires twice
        this.observations.set(letter, obsData);

        // Jump directly to the spread that shows this newly completed observation
        if (letter === 'A') {
            this.currentSpread = 0;
        } else if (letter === 'B' || letter === 'C' || letter === 'D') {
            this.currentSpread = 1;
        } else if (letter === 'E' || letter === 'F') {
            this.currentSpread = 2;
        }

        this.renderBookPages();
    }

    public resetRecords() {
        this.observations.clear();
        this.currentSpread = 0;
        this.renderBookPages();
    }

    public nextSpread() {
        this.currentSpread = (this.currentSpread + 1) % this.totalSpreads;
        this.animateButtonPress(this.nextBtnMesh);
        this.triggerPageFlipAnimation(1);
        this.renderBookPages();
        if (this.callbacks.onPageFlip) this.callbacks.onPageFlip();
    }

    public prevSpread() {
        this.currentSpread = (this.currentSpread - 1 + this.totalSpreads) % this.totalSpreads;
        this.animateButtonPress(this.prevBtnMesh);
        this.triggerPageFlipAnimation(-1);
        this.renderBookPages();
        if (this.callbacks.onPageFlip) this.callbacks.onPageFlip();
    }

    private triggerPageFlipAnimation(dir: number) {
        this.flipDir = dir;
        this.isFlipping = true;
        this.flipProgress = 0;
        this.flipMesh.visible = true;
        this.flipPivot.rotation.z = dir > 0 ? 0 : Math.PI;
    }

    private animateButtonPress(mesh: THREE.Mesh) {
        if (!mesh) return;
        const initY = mesh.userData?.initialY ?? mesh.position.y;
        mesh.position.y = initY - 0.0025;
        setTimeout(() => {
            mesh.position.y = initY;
        }, 140);
    }

    // --- 5. RENDER HIGH-DENSITY SCIENTIFIC NOTEBOOK PAGES ---
    private renderBookPages() {
        const ctx = this.pagesCanvas.getContext('2d')!;
        ctx.clearRect(0, 0, 1536, 1024);

        // Archival Grid Notebook Paper Background (Warm off-white)
        ctx.fillStyle = '#f8f5ee';
        ctx.fillRect(0, 0, 1536, 1024);

        // Faint graph ruling lines
        ctx.strokeStyle = 'rgba(200, 215, 230, 0.45)';
        ctx.lineWidth = 1;
        for (let y = 40; y < 1024; y += 32) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(1536, y);
            ctx.stroke();
        }

        // Center Spine Crease Gradient Shadow
        const spineShadow = ctx.createLinearGradient(740, 0, 796, 0);
        spineShadow.addColorStop(0, 'rgba(0, 0, 0, 0)');
        spineShadow.addColorStop(0.5, 'rgba(0, 0, 0, 0.28)');
        spineShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = spineShadow;
        ctx.fillRect(740, 0, 56, 1024);

        // Page Margins (Left page: x=40 to 720; Right page: x=816 to 1496)
        const leftPageCx = 380;
        const rightPageCx = 1156;

        // Top Header on Both Pages
        this.drawPageHeader(ctx, leftPageCx, 'LAB RECORD / FLAME TEST OBSERVATIONS', `SPREAD ${this.currentSpread + 1} OF 4`);
        this.drawPageHeader(ctx, rightPageCx, 'QUALITATIVE CATION ANALYSIS', `CLASS 10 CHEMISTRY`);

        // Render current spread content
        if (this.currentSpread === 0) {
            // SPREAD 0: Page 1 (Overview & 6-Salt Tracker) + Page 2 (Mystery Salt A)
            this.renderPage1Overview(ctx, leftPageCx);
            this.renderSaltRecord(ctx, rightPageCx, 'A', 'Mystery Salt A', 1);
        } else if (this.currentSpread === 1) {
            // SPREAD 1: Page 3 (Mystery Salt B & C) + Page 4 (Mystery Salt D)
            this.renderSaltRecordSplit(ctx, leftPageCx, 'B', 'Mystery Salt B', 2, 'C', 'Mystery Salt C', 3);
            this.renderSaltRecord(ctx, rightPageCx, 'D', 'Mystery Salt D', 4);
        } else if (this.currentSpread === 2) {
            // SPREAD 2: Page 5 (Mystery Salt E) + Page 6 (Mystery Salt F: Strontium Chloride)
            this.renderSaltRecord(ctx, leftPageCx, 'E', 'Mystery Salt E', 5);
            this.renderSaltRecord(ctx, rightPageCx, 'F', 'Mystery Salt F', 6);
        } else {
            // SPREAD 3: Page 7 (Summary Table of 6 Salts) + Page 8 (Scientific Conclusion & Theory)
            this.renderSummaryTablePage(ctx, leftPageCx);
            this.renderConclusionTheoryPage(ctx, rightPageCx);
        }

        // Page Numbers at Bottom Margins (Clean footer margin)
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 20px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Page ${this.currentSpread * 2 + 1} of 8`, leftPageCx, 960);
        ctx.fillText(`Page ${this.currentSpread * 2 + 2} of 8`, rightPageCx, 960);

        this.pagesTexture.needsUpdate = true;
    }

    private drawPageHeader(ctx: CanvasRenderingContext2D, cx: number, title: string, subtitle: string) {
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 24px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(title, cx, 68);

        ctx.fillStyle = '#0284c7';
        ctx.font = 'bold 16px "Inter", sans-serif';
        ctx.fillText(subtitle, cx, 96);

        // Header rule
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx - 320, 110);
        ctx.lineTo(cx + 320, 110);
        ctx.stroke();
    }

    // Page 1: Overview & Progress
    private renderPage1Overview(ctx: CanvasRenderingContext2D, cx: number) {
        const leftX = cx - 310;
        let y = 150;

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 22px "Inter", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('EXPERIMENTAL LOGBOOK', leftX, y);
        y += 34;

        ctx.fillStyle = '#334155';
        ctx.font = '16px "Inter", sans-serif';
        ctx.fillText('• Standard: Class 10 Qualitative Chemistry Practical', leftX, y); y += 26;
        ctx.fillText('• Apparatus: Platinum wire loop, Bunsen burner, HCl wash', leftX, y); y += 26;
        ctx.fillText('• Safety: Nitrile gloves equipped, safety goggles verified', leftX, y); y += 40;

        // Challenge Progress Box
        const completedCount = this.observations.size;
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(leftX, y, 620, 110);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.strokeRect(leftX, y, 620, 110);

        ctx.fillStyle = '#0284c7';
        ctx.font = 'bold 20px "Inter", sans-serif';
        ctx.fillText(`OVERALL PROGRESS: ${completedCount} OF 6 SALTS IDENTIFIED`, leftX + 20, y + 36);

        // Progress bar
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(leftX + 20, y + 54, 580, 16);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(leftX + 20, y + 54, (completedCount / 6) * 580, 16);

        ctx.fillStyle = '#475569';
        ctx.font = '14px "Inter", sans-serif';
        ctx.fillText(`Target Sequence: Salt A ➔ Salt B ➔ Salt C ➔ Salt D ➔ Salt E ➔ Salt F`, leftX + 20, y + 95);
        y += 140;

        // Checklist of 6 Mystery Salts
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 19px "Inter", sans-serif';
        ctx.fillText('SIX-SALT CHALLENGE CHECKLIST:', leftX, y);
        y += 32;

        const salts = ['A', 'B', 'C', 'D', 'E', 'F'];
        salts.forEach((s, idx) => {
            const isDone = this.observations.has(s);
            const obs = this.observations.get(s);

            ctx.fillStyle = isDone ? '#10b981' : '#94a3b8';
            ctx.font = 'bold 18px "Inter", sans-serif';
            ctx.fillText(isDone ? `[✓] TEST ${idx + 1}: MYSTERY SALT ${s}` : `[  ] TEST ${idx + 1}: MYSTERY SALT ${s}`, leftX + 15, y);

            if (isDone && obs) {
                ctx.fillStyle = '#0f172a';
                ctx.font = 'bold 17px "Inter", sans-serif';
                ctx.fillText(`— ${obs.name} (${obs.formula})`, leftX + 280, y);

                ctx.fillStyle = '#' + obs.flameColor.toString(16).padStart(6, '0');
                ctx.font = 'bold 15px "Inter", sans-serif';
                ctx.fillText(obs.flameName, leftX + 500, y);
            } else {
                ctx.fillStyle = '#94a3b8';
                ctx.font = 'italic 16px "Inter", sans-serif';
                ctx.fillText(`— Pending investigation`, leftX + 280, y);
            }
            y += 34;
        });
    }

    // Single full-page Salt Record Card
    private renderSaltRecord(ctx: CanvasRenderingContext2D, cx: number, letter: string, mysteryTitle: string, testNum: number) {
        const leftX = cx - 310;
        let y = 145;

        const isDone = this.observations.has(letter);
        const obs = this.observations.get(letter);

        // Header Box
        ctx.fillStyle = isDone ? '#ecfdf5' : '#f8fafc';
        ctx.fillRect(leftX, y, 620, 720);
        ctx.strokeStyle = isDone ? '#10b981' : '#cbd5e1';
        ctx.lineWidth = 3;
        ctx.strokeRect(leftX, y, 620, 720);

        // Title banner
        ctx.fillStyle = isDone ? '#10b981' : '#64748b';
        ctx.fillRect(leftX, y, 620, 52);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px "Inter", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`TEST #${testNum}: ${mysteryTitle.toUpperCase()}`, leftX + 20, y + 34);

        ctx.textAlign = 'right';
        ctx.font = 'bold 16px "Inter", sans-serif';
        ctx.fillText(isDone ? 'STATUS: COMPLETED' : 'STATUS: UNTESTED', leftX + 600, y + 34);
        y += 85;

        ctx.textAlign = 'left';
        if (isDone && obs) {
            // Salt Chemical Identity (Legitimately Revealed)
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 26px "Inter", sans-serif';
            ctx.fillText(`Identified Compound:`, leftX + 25, y); y += 36;
            ctx.fillStyle = '#0284c7';
            ctx.font = 'bold 30px "Inter", sans-serif';
            ctx.fillText(`${obs.name} (${obs.formula})`, leftX + 25, y); y += 50;

            // Observed Flame Color with visual swatch pill
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 20px "Inter", sans-serif';
            ctx.fillText(`Observed Flame Colour:`, leftX + 25, y); y += 30;

            const flameHex = '#' + obs.flameColor.toString(16).padStart(6, '0');
            ctx.fillStyle = flameHex;
            ctx.beginPath();
            ctx.roundRect(leftX + 25, y - 6, 260, 42, 8);
            ctx.fill();

            ctx.fillStyle = (obs.flameName.includes('Yellow') || obs.flameName.includes('Lilac')) ? '#000000' : '#ffffff';
            ctx.font = 'bold 20px "Inter", sans-serif';
            ctx.fillText(`🔥 ${obs.flameName}`, leftX + 45, y + 22);
            y += 75;

            // Scientific Theory & Explanation
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 20px "Inter", sans-serif';
            ctx.fillText(`Scientific Explanation:`, leftX + 25, y); y += 30;

            ctx.fillStyle = '#334155';
            ctx.font = '18px "Inter", sans-serif';
            this.renderWrappedText(ctx, obs.info, leftX + 25, y, 570, 28);
            y += 180;

            // Verification Stamp
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 3;
            ctx.strokeRect(leftX + 25, y, 570, 64);
            ctx.fillStyle = '#047857';
            ctx.font = 'bold 19px "Inter", sans-serif';
            ctx.fillText(`✓ LAB TEST RECORDED & SCIENTIFICALLY VERIFIED`, leftX + 45, y + 38);
        } else {
            // Untested / Pending State (Does NOT reveal secret identities!)
            ctx.fillStyle = '#64748b';
            ctx.font = 'bold 24px "Inter", sans-serif';
            ctx.fillText(`Mystery Salt ID: Salt ${letter}`, leftX + 25, y); y += 45;

            ctx.fillStyle = '#94a3b8';
            ctx.font = '19px "Inter", sans-serif';
            ctx.fillText(`• Identified Compound: [Pending Investigation]`, leftX + 25, y); y += 36;
            ctx.fillText(`• Chemical Formula: [Redacted]`, leftX + 25, y); y += 36;
            ctx.fillText(`• Observed Flame Colour: [Awaiting Flame Test]`, leftX + 25, y); y += 50;

            ctx.fillStyle = '#475569';
            ctx.font = 'italic 18px "Inter", sans-serif';
            this.renderWrappedText(ctx, `To record this observation, grab the platinum wire, follow the 3D directional arrow to dip into the container, and introduce the sample to the Bunsen burner flame.`, leftX + 25, y, 570, 28);
            y += 160;

            // Pending Box
            ctx.fillStyle = '#f1f5f9';
            ctx.fillRect(leftX + 25, y, 570, 64);
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2;
            ctx.strokeRect(leftX + 25, y, 570, 64);
            ctx.fillStyle = '#64748b';
            ctx.font = 'bold 18px "Inter", sans-serif';
            ctx.fillText(`⏳ Awaiting Student Flame Excitation Test`, leftX + 45, y + 38);
        }
    }

    // Split page showing two salts (Salts B & C or D & E)
    private renderSaltRecordSplit(ctx: CanvasRenderingContext2D, cx: number, l1: string, m1: string, t1: number, l2: string, m2: string, t2: number) {
        const leftX = cx - 310;
        let y = 140;

        // Top Half: First Salt
        this.renderMiniSaltCard(ctx, leftX, y, 350, l1, m1, t1);
        y += 370;

        // Bottom Half: Second Salt
        this.renderMiniSaltCard(ctx, leftX, y, 350, l2, m2, t2);
    }

    private renderMiniSaltCard(ctx: CanvasRenderingContext2D, leftX: number, y: number, height: number, letter: string, mysteryTitle: string, testNum: number) {
        const isDone = this.observations.has(letter);
        const obs = this.observations.get(letter);

        ctx.fillStyle = isDone ? '#ecfdf5' : '#f8fafc';
        ctx.fillRect(leftX, y, 620, height);
        ctx.strokeStyle = isDone ? '#10b981' : '#cbd5e1';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(leftX, y, 620, height);

        ctx.fillStyle = isDone ? '#10b981' : '#64748b';
        ctx.fillRect(leftX, y, 620, 38);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px "Inter", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`TEST #${testNum}: ${mysteryTitle.toUpperCase()}`, leftX + 16, y + 25);
        ctx.textAlign = 'right';
        ctx.fillText(isDone ? '✓ IDENTIFIED' : '⏳ UNTESTED', leftX + 604, y + 25);

        ctx.textAlign = 'left';
        let cardY = y + 62;
        if (isDone && obs) {
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 22px "Inter", sans-serif';
            ctx.fillText(`${obs.name} (${obs.formula})`, leftX + 18, cardY); cardY += 32;

            const flameHex = '#' + obs.flameColor.toString(16).padStart(6, '0');
            ctx.fillStyle = flameHex;
            ctx.font = 'bold 18px "Inter", sans-serif';
            ctx.fillText(`Flame: ${obs.flameName}`, leftX + 18, cardY); cardY += 32;

            ctx.fillStyle = '#334155';
            ctx.font = '15px "Inter", sans-serif';
            this.renderWrappedText(ctx, obs.info, leftX + 18, cardY, 584, 22);
        } else {
            ctx.fillStyle = '#64748b';
            ctx.font = 'bold 19px "Inter", sans-serif';
            ctx.fillText(`Compound: [Pending Investigation]`, leftX + 18, cardY); cardY += 30;

            ctx.fillStyle = '#94a3b8';
            ctx.font = '16px "Inter", sans-serif';
            ctx.fillText(`Formula: [Redacted] | Flame: [Awaiting Test]`, leftX + 18, cardY); cardY += 30;

            ctx.fillStyle = '#64748b';
            ctx.font = 'italic 15px "Inter", sans-serif';
            this.renderWrappedText(ctx, `Test in flame to record qualitative cation observation.`, leftX + 18, cardY, 584, 22);
        }
    }

    // Page 7: Emission Spectra Observations Table for all 6 salts
    private renderSummaryTablePage(ctx: CanvasRenderingContext2D, cx: number) {
        const leftX = cx - 310;
        let y = 145;

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 22px "Inter", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('QUALITATIVE CATION ANALYSIS TABLE', leftX, y);
        y += 32;

        ctx.fillStyle = '#475569';
        ctx.font = '15px "Inter", sans-serif';
        ctx.fillText('Complete observation matrix for all tested unknown metal chloride salts:', leftX, y);
        y += 36;

        // Table Header
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(leftX, y, 620, 38);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px "Inter", sans-serif';
        ctx.fillText('Salt ID', leftX + 12, y + 25);
        ctx.fillText('Compound Name', leftX + 90, y + 25);
        ctx.fillText('Formula', leftX + 270, y + 25);
        ctx.fillText('Flame Colour', leftX + 370, y + 25);
        ctx.fillText('Status', leftX + 535, y + 25);
        y += 38;

        // Table Rows (Salts A-F)
        const salts = ['A', 'B', 'C', 'D', 'E', 'F'];
        salts.forEach((s, idx) => {
            const isDone = this.observations.has(s);
            const obs = this.observations.get(s);

            ctx.fillStyle = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
            ctx.fillRect(leftX, y, 620, 38);
            ctx.strokeStyle = '#e2e8f0';
            ctx.strokeRect(leftX, y, 620, 38);

            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 16px "Inter", sans-serif';
            ctx.fillText(`Salt ${s}`, leftX + 12, y + 25);

            if (isDone && obs) {
                ctx.fillStyle = '#334155';
                ctx.font = 'bold 14px "Inter", sans-serif';
                ctx.fillText(obs.name, leftX + 90, y + 25);
                ctx.fillText(obs.formula, leftX + 270, y + 25);

                ctx.fillStyle = '#' + obs.flameColor.toString(16).padStart(6, '0');
                ctx.font = 'bold 14px "Inter", sans-serif';
                ctx.fillText(obs.flameName, leftX + 370, y + 25);

                ctx.fillStyle = '#10b981';
                ctx.fillText('✓ Identified', leftX + 535, y + 25);
            } else {
                ctx.fillStyle = '#94a3b8';
                ctx.font = 'italic 14px "Inter", sans-serif';
                ctx.fillText('[Pending]', leftX + 90, y + 25);
                ctx.fillText('---', leftX + 270, y + 25);
                ctx.fillText('---', leftX + 370, y + 25);
                ctx.fillText('Untested', leftX + 535, y + 25);
            }
            y += 38;
        });

        y += 40;
        // Key Findings summary
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 18px "Inter", sans-serif';
        ctx.fillText('SUMMARY FINDINGS:', leftX, y);
        y += 28;
        ctx.fillStyle = '#334155';
        ctx.font = '15px "Inter", sans-serif';
        const notes = [
            '• Alkali metals (Li, Na, K) exhibit intense s-orbital de-excitations.',
            '• Alkaline earth metals (Ca, Sr) show distinct red/orange emission bands.',
            '• Strontium emits an intense scarlet-red (606 nm, 668 nm), distinct from Lithium.'
        ];
        notes.forEach(note => {
            ctx.fillText(note, leftX, y);
            y += 26;
        });
    }

    // Page 8: Scientific Conclusion & Theory
    private renderConclusionTheoryPage(ctx: CanvasRenderingContext2D, cx: number) {
        const leftX = cx - 310;
        let y = 145;

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 22px "Inter", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('ATOMIC EMISSION THEORY (ΔE = h·ν)', leftX, y);
        y += 34;

        ctx.fillStyle = '#334155';
        ctx.font = '16px "Inter", sans-serif';
        const conclusionText = 'When metal chloride salts are introduced into the high-temperature Bunsen burner flame, thermal energy vaporizes the salt into gaseous atoms and ions. Ground-state valence electrons absorb energy and jump to higher quantized orbitals. As these excited electrons rapidly drop back to lower stable energy states, they emit photons of discrete characteristic wavelengths obeying the Planck relation: ΔE = h·ν = h·c / λ.';
        this.renderWrappedText(ctx, conclusionText, leftX, y, 620, 26);
        y += 160;

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 20px "Inter", sans-serif';
        ctx.fillText('LITHIUM vs STRONTIUM DIFFERENTIATION:', leftX, y);
        y += 28;
        ctx.fillStyle = '#334155';
        ctx.font = '15px "Inter", sans-serif';
        const diffText = 'While both Lithium (Li⁺) and Strontium (Sr²⁺) produce red flames, their emission mechanisms differ fundamentally. Lithium produces a sharp atomic doublet at 670.8 nm (carmine/magenta-red). Strontium emission is dominated by excited SrOH molecular radical bands at 606 nm and 660–680 nm, yielding an intense, brilliant scarlet-crimson flare.';
        this.renderWrappedText(ctx, diffText, leftX, y, 620, 24);
        y += 160;

        // Official Completion Stamp
        const allCompleted = this.observations.size >= 6;
        ctx.fillStyle = allCompleted ? '#ecfdf5' : '#f1f5f9';
        ctx.fillRect(leftX, y, 620, 78);
        ctx.strokeStyle = allCompleted ? '#10b981' : '#94a3b8';
        ctx.lineWidth = 3;
        ctx.strokeRect(leftX, y, 620, 78);

        ctx.fillStyle = allCompleted ? '#047857' : '#64748b';
        ctx.font = 'bold 20px "Inter", sans-serif';
        ctx.fillText(
            allCompleted 
                ? '★ CERTIFIED: ALL 6 FLAME TESTS LEGITIMATELY COMPLETED ★'
                : `[PROGRESS: ${this.observations.size} / 6 MYSTERY SALTS IDENTIFIED]`,
            leftX + 25, y + 46
        );
    }

    private renderWrappedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
        const words = text.split(' ');
        let line = '';
        let curY = y;
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
                ctx.fillText(line, x, curY);
                line = words[n] + ' ';
                curY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, curY);
    }

    // --- 6. USER INTERACTION: DESKTOP MOUSE CLICK & VR POKE / CONTROLLER TRIGGER ---
    public handleClick(hitObj: THREE.Object3D, hitPoint?: THREE.Vector3): boolean {
        const now = Date.now();
        if (now - this.lastInteractionTime < 220) return false;

        // Proximity check on Prev / Next buttons (< 16cm from hitPoint)
        if (hitPoint) {
            const pPos = new THREE.Vector3();
            this.prevBtnMesh.getWorldPosition(pPos);
            if (hitPoint.distanceTo(pPos) < 0.16) {
                this.lastInteractionTime = now;
                this.prevSpread();
                return true;
            }

            const nPos = new THREE.Vector3();
            this.nextBtnMesh.getWorldPosition(nPos);
            if (hitPoint.distanceTo(nPos) < 0.16) {
                this.lastInteractionTime = now;
                this.nextSpread();
                return true;
            }
        }

        let cur: THREE.Object3D | null = hitObj;
        while (cur) {
            if (cur === this.prevBtnMesh || cur.userData?.isLabBookPrev) {
                this.lastInteractionTime = now;
                this.prevSpread();
                return true;
            }
            if (cur === this.nextBtnMesh || cur.userData?.isLabBookNext) {
                this.lastInteractionTime = now;
                this.nextSpread();
                return true;
            }
            if (cur === this.bookChassis || cur.userData?.isLabBookFace) {
                // Clicking right side flips next, left side flips prev
                this.lastInteractionTime = now;
                if (hitPoint) {
                    const localPt = this.bookChassis.worldToLocal(hitPoint.clone());
                    if (localPt.x > 0) {
                        this.nextSpread();
                    } else {
                        this.prevSpread();
                    }
                } else {
                    this.nextSpread();
                }
                return true;
            }
            cur = cur.parent;
        }

        return false;
    }

    public checkPokeAndInteract(pokePos: THREE.Vector3): boolean {
        const now = Date.now();
        if (now - this.lastInteractionTime < 240) return false;

        // 1. Prev Button Poke (< 16cm)
        const pPos = new THREE.Vector3();
        this.prevBtnMesh.getWorldPosition(pPos);
        if (pokePos.distanceTo(pPos) < 0.16) {
            this.lastInteractionTime = now;
            this.prevSpread();
            return true;
        }

        // 2. Next Button Poke (< 16cm)
        const nPos = new THREE.Vector3();
        this.nextBtnMesh.getWorldPosition(nPos);
        if (pokePos.distanceTo(nPos) < 0.16) {
            this.lastInteractionTime = now;
            this.nextSpread();
            return true;
        }

        // 3. Horizontal Swipe & Direct Touch on Book Pages (< 28cm)
        const bookPos = new THREE.Vector3();
        this.bookChassis.getWorldPosition(bookPos);
        if (pokePos.distanceTo(bookPos) < 0.28) {
            const localPoke = this.bookChassis.worldToLocal(pokePos.clone());
            if (Math.abs(localPoke.x) < 0.26 && Math.abs(localPoke.z) < 0.20 && Math.abs(localPoke.y) < 0.10) {
                // Swipe gesture tracking
                if (!this.inSwipeZone || (now - this.swipeStartTime) > 600) {
                    this.inSwipeZone = true;
                    this.lastSwipeX = localPoke.x;
                    this.swipeStartTime = now;
                } else {
                    const dx = localPoke.x - this.lastSwipeX;
                    if (Math.abs(dx) > 0.050 && (now - this.lastInteractionTime) > 300) {
                        this.lastInteractionTime = now;
                        this.inSwipeZone = false;
                        if (dx < -0.050) {
                            this.nextSpread(); // Swipe Right to Left -> Turn to Next Spread
                        } else {
                            this.prevSpread(); // Swipe Left to Right -> Turn to Prev Spread
                        }
                        return true;
                    }
                }
            } else {
                this.inSwipeZone = false;
            }

            // Direct Touch on Book Pages (< 18cm)
            if (pokePos.distanceTo(bookPos) < 0.18) {
                this.lastInteractionTime = now;
                if (localPoke.x > 0) {
                    this.nextSpread();
                } else {
                    this.prevSpread();
                }
                return true;
            }
        } else {
            this.inSwipeZone = false;
        }

        return false;
    }

    public update(delta: number) {
        if (this.isFlipping) {
            this.flipProgress += delta / 0.28; // 280ms duration
            if (this.flipProgress >= 1.0) {
                this.flipProgress = 1.0;
                this.isFlipping = false;
                this.flipMesh.visible = false;
                this.flipPivot.rotation.z = 0;
                this.flipPivot.position.y = 0.0216;
            } else {
                const t = this.flipProgress;
                const angle = t * Math.PI;
                if (this.flipDir > 0) {
                    this.flipPivot.rotation.z = angle;
                } else {
                    this.flipPivot.rotation.z = Math.PI - angle;
                }
                this.flipPivot.position.y = 0.0216 + Math.sin(t * Math.PI) * 0.020;
            }
        }
    }
}
