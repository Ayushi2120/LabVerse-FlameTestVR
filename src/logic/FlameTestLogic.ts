import * as THREE from 'three';
import { World } from '@iwsdk/core';
import { AudioEngine } from '../audio/AudioEngine';
import { OrientationScreen3D } from '../ui/OrientationScreen3D';
import { ResultDisplay3D } from '../ui/ResultDisplay3D';
import { LabBook3D } from '../ui/LabBook3D';
import { RealisticFlame } from '../scene/equipment/RealisticFlame';
import { GoldenSnitch } from '../scene/GoldenSnitch';
import { HogwartsLetter } from '../scene/HogwartsLetter';
import { MagicalDimension } from '../scene/MagicalDimension';
import { MagicalParticleSystem } from '../scene/MagicalParticleSystem';
import type { LaboratoryLighting } from '../scene/Lighting';

export type EasterEggDimensionState =
    | 'LAB_ACTIVE'
    | 'SNITCH_CAUGHT'
    | 'TRANSITION_TO_MAGIC'
    | 'MAGIC_WORLD_ACTIVE'
    | 'LETTER_REVEAL'
    | 'LETTER_NARRATION'
    | 'LETTER_CLOSING'
    | 'TRANSITION_TO_LAB'
    | 'LAB_RESTORED';

export const ExperimentState = {
    ORIENTATION: 'ORIENTATION',
    STARTING: 'STARTING',
    IDLE: 'IDLE',
    WIRE_GRABBED: 'WIRE_GRABBED',
    SALT_COLLECTED: 'SALT_COLLECTED',
    BURNER_INSTRUCTION: 'BURNER_INSTRUCTION',
    BURNER_ON: 'BURNER_ON',
    WIRE_IN_FLAME: 'WIRE_IN_FLAME',
    FLAME_RESULT: 'FLAME_RESULT',
    RESULT_DISPLAY: 'RESULT_DISPLAY',
    RESET: 'RESET'
} as const;

export type ExperimentState = typeof ExperimentState[keyof typeof ExperimentState];

export class FlameTestLogic {
    private scene: THREE.Scene;
    private world: World;
    private wireGroup: THREE.Group | null = null;
    private bunsenBurner: THREE.Group | null = null;
    private chemicalSamples: any[] = [];
    private instructionBoardGroup: THREE.Group | null = null;

    // Explicit Experiment State Machine (Starts in ORIENTATION mode)
    private currentState: ExperimentState = ExperimentState.ORIENTATION;
    private currentChemical: any = null;
    private defaultFlameColor = 0x38bdf8;
    private burnTimer = 0;
    private isBurnerOn = false;
    private wasWireMoved = false;
    private feedbackSprites: { sprite: THREE.Sprite, timer: number }[] = [];

    // 3D Orientation, Result & Lab Book Subsystems (Feature 4)
    private orientationScreen!: OrientationScreen3D;
    private resultDisplay3D!: ResultDisplay3D;
    private labBook!: LabBook3D;

    // Sequential Multi-Salt Challenge Tracking (Feature 2)
    private currentTargetSaltIndex = 0; // 0: Salt A, 1: Salt B, 2: Salt C, 3: Salt D, 4: Salt E, 5: Salt F (SrCl2)
    private completedSalts = new Set<string>();
    private lastWrongDipFeedbackTime = 0;

    // 3D Directional Target Arrow pointing directly to target salt (Feature 3)
    private targetArrowGroup!: THREE.Group;
    private arrowShaftAndCone!: THREE.Group;
    private arrowHalo!: THREE.Mesh;
    private arrowLabelCanvas!: HTMLCanvasElement;
    private arrowLabelTexture!: THREE.CanvasTexture;
    private arrowLabelSprite!: THREE.Sprite;
    private arrowAnimTime = 0;

    // Safety Equipment State
    private areGlovesEquipped = false;
    private hasNarratedBurnerStage = false;
    private glovesGroup: THREE.Group | null = null;

    // Near-field Hand Tracking & Gesture State
    private isWireGrabbedVR = false;
    private grabbingVRHandIndex = -1;
    private isSqueezeHolding = false;
    private vrGrabOffsetPos = new THREE.Vector3();
    private vrGrabOffsetQuat = new THREE.Quaternion();
    private isVRGrabOffsetInitialized = false;
    private static _scratchWireQuat = new THREE.Quaternion();
    private handTouchDots: THREE.Mesh[] = [];
    private lastInteractionTime = 0;
    private lastBurnerToggleTime = 0;

    private initiateVRWireGrab(handIndex: number) {
        if (this.isHeldDesktop) return;
        if (!this.areGlovesEquipped) {
            this.promptGlovesRequired();
            return;
        }
        this.isWireGrabbedVR = true;
        this.isVRGrabOffsetInitialized = false;
        this.grabbingVRHandIndex = handIndex;
        this.vrWireReleaseFrames = 0;
        this.audio.playGrab();
        if (this.currentState === ExperimentState.IDLE) {
            this.transitionTo(ExperimentState.WIRE_GRABBED);
        }
    }

    // Release Wire 3D UI
    private releaseBtnGroup: THREE.Group;
    private releaseButtonMesh: THREE.Mesh;
    private releaseCanvas: HTMLCanvasElement;
    private releaseTexture: THREE.CanvasTexture;
    public isHeldDesktop = false;
    public onReleaseCallback?: () => void;

    // Permanent 3D Wall Exit VR Switch Station (Side Wall near Laboratory Entrance)
    private wallExitVRBtnGroup!: THREE.Group;
    private wallExitVRButtonMesh!: THREE.Mesh;
    private wallExitVRCanvas!: HTMLCanvasElement;
    private wallExitVRTexture!: THREE.CanvasTexture;
    private wallExitVRStatusLed!: THREE.Mesh;
    private isExitingVR = false;
    public onExitVRCallback?: () => void;

    // Hidden Scientific Easter Egg (Quantum Buckminsterfullerene C60)
    private easterEggGroup!: THREE.Group;
    private easterEggMesh!: THREE.Group;
    private easterEggCore!: THREE.Mesh;
    private easterEggCard!: THREE.Mesh;
    private isEasterEggActive = false;
    private easterEggRestY = 1.04;

    // Optional Pop-Culture Easter Egg (Harry Potter 3D Golden Snitch & Magical Fantasy Dimension)
    private goldenSnitch!: GoldenSnitch;
    private magicalDimension!: MagicalDimension;
    private magicalParticles!: MagicalParticleSystem;
    private easterEggDimensionState: EasterEggDimensionState = 'LAB_ACTIVE';
    private snitchAppearanceTimer = 0;
    private snitchAppearanceCount = 0;
    private hasCaughtSnitch = false;

    // Beginner-Friendly Target Beacon Highlight
    private targetBeaconMesh!: THREE.Mesh;
    private beaconAnimTime = 0;

    // Subsystems
    private audio: AudioEngine;

    // UI
    private resultUIGroup: THREE.Group;
    private resultCanvas: HTMLCanvasElement;
    private resultTexture: THREE.CanvasTexture;
    private resetButtonMesh: THREE.Mesh;
    private closeButtonMesh: THREE.Mesh;
    private resultActivationTime = 0;
    private grabHintSprite: THREE.Sprite | null = null;

    // Optimization: static scratch objects to avoid GC allocation pauses on Meta Quest
    private static _v1 = new THREE.Vector3();
    private static _v2 = new THREE.Vector3();
    private static _v3 = new THREE.Vector3();
    private static _scratchWristPos = [new THREE.Vector3(), new THREE.Vector3()];
    private static _scratchWristQuat = [new THREE.Quaternion(), new THREE.Quaternion()];
    private static _scratchIndexTipPos = [new THREE.Vector3(), new THREE.Vector3()];
    private static _scratchThumbTipPos = [new THREE.Vector3(), new THREE.Vector3()];
    private static _scratchCtrlPos = new THREE.Vector3();
    private static _scratchCtrlQuat = new THREE.Quaternion();
    private static _scratchLocalPoke = new THREE.Vector3();
    private static _scratchExitPos = new THREE.Vector3();
    private static _scratchGlovesPos = new THREE.Vector3();
    private static _scratchTargetPos = new THREE.Vector3();
    private static _scratchEggPos = new THREE.Vector3();
    private static _scratchRelPos = new THREE.Vector3();
    private static _scratchWirePos = new THREE.Vector3();
    private wireLoopMesh: THREE.Mesh | null = null;
    private vrWireReleaseFrames = 0;

    constructor(scene: THREE.Scene, world: World) {
        this.scene = scene;
        this.world = world;
        this.audio = new AudioEngine();

        // --- 1. FREESTANDING 3D EXIT VR PEDESTAL KIOSK STAND BESIDE WORKBENCH ---
        // Positioned beside the front-right corner of the laboratory table (x = 1.45, y = 1.05, z = -0.35)
        // Natural ergonomic interaction height (1.05m), comfortable arm's reach from the standing workstation
        // Angled cleanly inward and forward to directly face the student standing at the workbench
        this.wallExitVRBtnGroup = new THREE.Group();
        this.wallExitVRBtnGroup.name = "WallExitVRBtnGroup";
        this.wallExitVRBtnGroup.position.set(1.45, 1.05, -0.35);
        this.wallExitVRBtnGroup.lookAt(new THREE.Vector3(0.20, 1.05, 0.15)); // Facing toward user standing in front of table

        // Heavy Cast-Metal Pedestal Base resting flat on the laboratory floor (y = 0.00m)
        const standMetalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
        const basePlate = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.024, 24), standMetalMat);
        basePlate.position.set(0, -1.038, 0);
        this.wallExitVRBtnGroup.add(basePlate);

        // High-Visibility Amber Hazard Warning Ring on Base
        const baseTrimMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.5, roughness: 0.3 });
        const baseRing = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.004, 8, 24), baseTrimMat);
        baseRing.rotation.x = Math.PI / 2;
        baseRing.position.set(0, -1.025, 0);
        this.wallExitVRBtnGroup.add(baseRing);

        // Heavy Pedestal Stand Pillar Column (Vertical Mast from floor base to console)
        const pillarMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.25 });
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.025, 0.86, 20), pillarMat);
        pillar.position.set(0, -0.60, 0);
        this.wallExitVRBtnGroup.add(pillar);

        // Stand Collar Connectors (Bottom & Top)
        const collarGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.024, 20);
        const collarB = new THREE.Mesh(collarGeo, standMetalMat);
        collarB.position.set(0, -1.015, 0);
        this.wallExitVRBtnGroup.add(collarB);

        const collarT = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.04, 20), standMetalMat);
        collarT.position.set(0, -0.17, 0);
        this.wallExitVRBtnGroup.add(collarT);

        // Console Mounting Bracket Plate behind enclosure
        const mountPlate = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.36, 0.015), standMetalMat);
        mountPlate.position.set(0, 0, -0.008);
        this.wallExitVRBtnGroup.add(mountPlate);

        // Enclosure Chassis Box
        const encMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7, roughness: 0.3 });
        const encBox = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.34, 0.055), encMat);
        encBox.position.z = 0.02;
        this.wallExitVRBtnGroup.add(encBox);

        // High-Visibility Amber Hazard Warning Trim Plates (Top & Bottom)
        const hazardMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.3, roughness: 0.4 });
        const trimTop = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.014, 0.058), hazardMat);
        trimTop.position.set(0, 0.155, 0.02);
        this.wallExitVRBtnGroup.add(trimTop);

        const trimBottom = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.014, 0.058), hazardMat);
        trimBottom.position.set(0, -0.155, 0.02);
        this.wallExitVRBtnGroup.add(trimBottom);

        // 3D Header Signboard Plate
        const signCanvas = document.createElement('canvas');
        signCanvas.width = 384; signCanvas.height = 96;
        const sctx = signCanvas.getContext('2d')!;
        sctx.fillStyle = '#0a101d'; sctx.fillRect(0, 0, 384, 96);
        sctx.strokeStyle = '#f59e0b'; sctx.lineWidth = 4; sctx.strokeRect(3, 3, 378, 90);
        sctx.fillStyle = '#f59e0b'; sctx.font = 'bold 28px sans-serif'; sctx.textAlign = 'center';
        sctx.fillText('LABORATORY EXIT', 192, 38);
        sctx.fillStyle = '#94a3b8'; sctx.font = 'bold 18px sans-serif';
        sctx.fillText('RETURN TO BROWSER', 192, 70);

        const signTex = new THREE.CanvasTexture(signCanvas);
        signTex.colorSpace = THREE.SRGBColorSpace;
        const signPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.055), new THREE.MeshBasicMaterial({ map: signTex }));
        signPlate.position.set(0, 0.09, 0.050);
        this.wallExitVRBtnGroup.add(signPlate);

        // 3D Status LED Indicator Lens Dome (Vibrant green when ready, amber on press)
        const ledGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.012, 16);
        ledGeo.rotateX(Math.PI / 2);
        const ledMat = new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: 0x00aa44, roughness: 0.2 });
        this.wallExitVRStatusLed = new THREE.Mesh(ledGeo, ledMat);
        this.wallExitVRStatusLed.position.set(0.095, 0.09, 0.052);
        this.wallExitVRBtnGroup.add(this.wallExitVRStatusLed);

        // Genuine 3D Push Switch Paddle Mesh
        this.wallExitVRCanvas = document.createElement('canvas');
        this.wallExitVRCanvas.width = 384; this.wallExitVRCanvas.height = 160;
        const dvrCtx = this.wallExitVRCanvas.getContext('2d')!;
        dvrCtx.fillStyle = '#92400e'; dvrCtx.fillRect(0, 0, 384, 160);
        dvrCtx.fillStyle = '#d97706'; dvrCtx.fillRect(6, 6, 372, 148);
        dvrCtx.strokeStyle = '#fef3c7'; dvrCtx.lineWidth = 6; dvrCtx.strokeRect(8, 8, 368, 144);
        dvrCtx.fillStyle = '#ffffff'; dvrCtx.font = 'bold 44px sans-serif'; dvrCtx.textAlign = 'center';
        dvrCtx.fillText('🚪 EXIT VR', 192, 72);
        dvrCtx.fillStyle = '#fef3c7'; dvrCtx.font = 'bold 22px sans-serif';
        dvrCtx.fillText('PRESS TO RETURN', 192, 122);
        this.wallExitVRTexture = new THREE.CanvasTexture(this.wallExitVRCanvas);
        this.wallExitVRTexture.colorSpace = THREE.SRGBColorSpace;

        const btnFaceMat = new THREE.MeshBasicMaterial({ map: this.wallExitVRTexture });
        const btnSideMat = new THREE.MeshStandardMaterial({ color: 0x78350f, metalness: 0.4, roughness: 0.3 });
        const dvrGeo = new THREE.BoxGeometry(0.21, 0.095, 0.035);
        this.wallExitVRButtonMesh = new THREE.Mesh(dvrGeo, [
            btnSideMat, btnSideMat, btnSideMat, btnSideMat, btnFaceMat, btnSideMat
        ]);
        this.wallExitVRButtonMesh.name = "WallExitVRBtn";
        this.wallExitVRButtonMesh.userData = { isExitVRButton: true, isWallExitVR: true };
        this.wallExitVRButtonMesh.position.set(0, -0.035, 0.055);
        this.wallExitVRBtnGroup.add(this.wallExitVRButtonMesh);

        this.scene.add(this.wallExitVRBtnGroup);

        // --- 2. CREATE SECRET SCIENTIFIC EASTER EGG (QUANTUM C60 BUCKEYBALL) ---
        this.createEasterEgg();

        // --- 3. CREATE BEGINNER TARGET BEACON HIGHLIGHT ---
        this.createTargetBeacon();

        // Setup 3D Release Platinum Wire UI Button Group
        this.releaseBtnGroup = new THREE.Group();
        this.releaseBtnGroup.name = "ReleaseWireBtnGroup";
        this.releaseBtnGroup.visible = false;

        this.releaseCanvas = document.createElement('canvas');
        this.releaseCanvas.width = 256;
        this.releaseCanvas.height = 96;
        const rctx = this.releaseCanvas.getContext('2d')!;
        rctx.fillStyle = 'rgba(20, 25, 35, 0.9)';
        rctx.fillRect(0, 0, 256, 96);
        rctx.strokeStyle = '#00e5ff';
        rctx.lineWidth = 4;
        rctx.strokeRect(3, 3, 250, 90);
        rctx.fillStyle = '#ff3344';
        rctx.fillRect(10, 10, 236, 76);
        rctx.fillStyle = '#ffffff';
        rctx.font = 'bold 22px sans-serif';
        rctx.textAlign = 'center';
        rctx.textBaseline = 'middle';
        rctx.fillText('RELEASE WIRE', 128, 48);

        this.releaseTexture = new THREE.CanvasTexture(this.releaseCanvas);
        const relGeo = new THREE.PlaneGeometry(0.12, 0.045);
        const relMat = new THREE.MeshBasicMaterial({
            map: this.releaseTexture,
            transparent: true,
            side: THREE.DoubleSide,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1
        });
        this.releaseButtonMesh = new THREE.Mesh(relGeo, relMat);
        this.releaseButtonMesh.name = "ReleaseWireBtn";
        this.releaseButtonMesh.userData = { isReleaseButton: true };
        this.releaseBtnGroup.add(this.releaseButtonMesh);

        this.scene.add(this.releaseBtnGroup);

        // Setup 3D Result UI at comfortable human eye height (1.35m) & arm reach (z=-0.75m)
        this.resultUIGroup = new THREE.Group();
        this.resultUIGroup.name = "ResultUIGroup";
        this.resultUIGroup.position.set(0, 1.35, -0.75);
        this.resultUIGroup.rotation.x = -Math.PI / 18; // 10 degree ergonomic view tilt
        this.resultUIGroup.visible = false;
        this.scene.add(this.resultUIGroup);

        // Result Canvas
        this.resultCanvas = document.createElement('canvas');
        this.resultCanvas.width = 512;
        this.resultCanvas.height = 256;
        this.resultTexture = new THREE.CanvasTexture(this.resultCanvas);
        const panelGeo = new THREE.PlaneGeometry(0.5, 0.25);
        const panelMat = new THREE.MeshBasicMaterial({
            map: this.resultTexture,
            transparent: true,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1
        });
        const panel = new THREE.Mesh(panelGeo, panelMat);
        this.resultUIGroup.add(panel);

        // 3D RESET Button Mesh (Centered on result panel)
        const btnGeo = new THREE.BoxGeometry(0.20, 0.045, 0.02);
        const btnMat = new THREE.MeshStandardMaterial({ color: 0xff4444, emissive: 0x440000 });
        this.resetButtonMesh = new THREE.Mesh(btnGeo, btnMat);
        this.resetButtonMesh.name = "ResultResetBtn";
        this.resetButtonMesh.position.set(0, -0.15, 0.01);
        this.resultUIGroup.add(this.resetButtonMesh);

        // 3D Close 'X' Button Mesh at top right of result panel
        const closeGeo = new THREE.CircleGeometry(0.025, 16);
        const closeMat = new THREE.MeshBasicMaterial({ color: 0xff2222, side: THREE.DoubleSide });
        this.closeButtonMesh = new THREE.Mesh(closeGeo, closeMat);
        this.closeButtonMesh.position.set(0.23, 0.11, 0.01);
        this.closeButtonMesh.name = "ResultCloseBtn";
        this.resultUIGroup.add(this.closeButtonMesh);

        // White 'X' Cross Bar on Close Button
        const xGeo = new THREE.PlaneGeometry(0.028, 0.005);
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
        this.closeButtonMesh.add(x1);
        const x2 = new THREE.Mesh(xGeo, xMat);
        x2.rotation.z = -Math.PI / 4;
        x2.position.z = 0.0024;
        this.closeButtonMesh.add(x2);

        // Clean instructional label positioned stationary above rest stand, never covering the wire
        const hintCanvas = document.createElement('canvas');
        hintCanvas.width = 512;
        hintCanvas.height = 64;
        const hctx = hintCanvas.getContext('2d')!;
        hctx.fillStyle = 'rgba(10, 16, 26, 0.88)';
        hctx.fillRect(0, 0, 512, 64);
        hctx.strokeStyle = '#00e5ff';
        hctx.lineWidth = 3;
        hctx.strokeRect(2, 2, 508, 60);
        hctx.fillStyle = '#ffffff';
        hctx.font = 'bold 22px sans-serif';
        hctx.textAlign = 'center';
        hctx.textBaseline = 'middle';
        hctx.fillText('Grab the platinum wire', 256, 32);

        const hintTex = new THREE.CanvasTexture(hintCanvas);
        const hintMat = new THREE.SpriteMaterial({ map: hintTex, transparent: true });
        this.grabHintSprite = new THREE.Sprite(hintMat);
        this.grabHintSprite.scale.set(0.38, 0.05, 1);
        this.grabHintSprite.position.set(0.00, 1.05, -0.58);
        this.grabHintSprite.visible = false; // Hidden until safety gloves are equipped
        this.scene.add(this.grabHintSprite);

        // Initialize 3D Orientation Screen (Feature 1 & 2 - Genuinely 3D, 1.75m distance)
        this.orientationScreen = new OrientationScreen3D({
            onStartExperiment: () => this.startExperiment(),
            onEnterVR: () => this.triggerEnterVR()
        });
        this.scene.add(this.orientationScreen.getGroup());

        // Initialize 3D Result Device (Feature 4 - Positioned on user's right side)
        this.resultDisplay3D = new ResultDisplay3D({
            onContinue: () => this.continueExperiment(),
            onReset: () => this.resetExperiment(),
            onExitVR: () => this.triggerExitVR(),
            onClose: () => this.resultDisplay3D.hide()
        });
        this.scene.add(this.resultDisplay3D.getGroup());

        // Initialize 3D Laboratory Notebook (Feature 4 - Countertop Reading Lectern)
        this.labBook = new LabBook3D({
            onPageFlip: () => this.audio.playBlip()
        });
        this.scene.add(this.labBook.getGroup());

        // Initialize 3D Directional Target Arrow pointing directly to target salt (Feature 3)
        this.createTargetArrow();

        // Initialize Unified Magical Particle Engine for all 6 golden particle effects
        this.magicalParticles = new MagicalParticleSystem();
        this.scene.add(this.magicalParticles.group);

        // Initialize Upgraded Temporary Magical Dimension for Golden Snitch Easter Egg
        this.magicalDimension = new MagicalDimension({
            scene: this.scene,
            particles: this.magicalParticles,
            audio: this.audio
        });

        // Initialize 3D Golden Snitch Easter Egg with 3D Hogwarts Letter
        this.goldenSnitch = new GoldenSnitch({
            scene: this.scene,
            audio: this.audio,
            particles: this.magicalParticles,
            onCatch: () => {
                this.hasCaughtSnitch = true;
                this.easterEggDimensionState = 'SNITCH_CAUGHT';
                // Trigger smooth environment transformation into temporary magical dimension
                this.easterEggDimensionState = 'TRANSITION_TO_MAGIC';
                this.magicalDimension.transitionIn(2.4, () => {
                    this.easterEggDimensionState = 'MAGIC_WORLD_ACTIVE';
                });
            },
            onLetterClose: () => {
                // When letter sequence finishes & folds, smoothly dissolve fantasy realm and return to laboratory
                this.easterEggDimensionState = 'TRANSITION_TO_LAB';
                this.magicalDimension.transitionOut(2.2, () => {
                    this.easterEggDimensionState = 'LAB_RESTORED';
                    setTimeout(() => {
                        this.easterEggDimensionState = 'LAB_ACTIVE';
                    }, 400);
                });
            },
            onDepart: () => {
                this.easterEggDimensionState = 'LAB_ACTIVE';
            }
        });
        this.scene.add(this.goldenSnitch.group);

        setTimeout(() => this.findReferences(), 100);
    }

    // --- 3D DIRECTIONAL TARGET ARROW (FEATURE 3) ---
    private createTargetArrow() {
        this.targetArrowGroup = new THREE.Group();
        this.targetArrowGroup.name = "TargetArrowGroup";
        this.targetArrowGroup.position.set(-0.78, 1.15, -0.65); // Over Mystery Salt A
        this.targetArrowGroup.visible = false;

        this.arrowShaftAndCone = new THREE.Group();
        this.arrowShaftAndCone.name = "ArrowShaftAndCone";

        // Cyan metallic arrow material with bloom emission
        const arrowMat = new THREE.MeshStandardMaterial({
            color: 0x00e5ff,
            emissive: 0x0088cc,
            emissiveIntensity: 0.6,
            roughness: 0.25,
            metalness: 0.7
        });

        // Downward pointing arrow cone (tip at y = 0)
        const coneGeo = new THREE.ConeGeometry(0.026, 0.055, 16);
        coneGeo.rotateX(Math.PI); // Tip points down (-Y)
        const coneMesh = new THREE.Mesh(coneGeo, arrowMat);
        coneMesh.position.y = 0.0275;
        this.arrowShaftAndCone.add(coneMesh);

        // Arrow Shaft
        const shaftGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.065, 16);
        const shaftMesh = new THREE.Mesh(shaftGeo, arrowMat);
        shaftMesh.position.y = 0.0875;
        this.arrowShaftAndCone.add(shaftMesh);

        // Soft Glowing Halo Ring around shaft
        const haloGeo = new THREE.TorusGeometry(0.032, 0.0035, 8, 24);
        haloGeo.rotateX(Math.PI / 2);
        const haloMat = new THREE.MeshBasicMaterial({
            color: 0x00e5ff,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        });
        this.arrowHalo = new THREE.Mesh(haloGeo, haloMat);
        this.arrowHalo.position.y = 0.07;
        this.arrowShaftAndCone.add(this.arrowHalo);

        this.targetArrowGroup.add(this.arrowShaftAndCone);

        // 3D Billboard Label above arrow
        this.arrowLabelCanvas = document.createElement('canvas');
        this.arrowLabelCanvas.width = 384;
        this.arrowLabelCanvas.height = 96;
        this.arrowLabelTexture = new THREE.CanvasTexture(this.arrowLabelCanvas);
        this.arrowLabelTexture.colorSpace = THREE.SRGBColorSpace;

        const labelMat = new THREE.SpriteMaterial({ map: this.arrowLabelTexture, transparent: true });
        this.arrowLabelSprite = new THREE.Sprite(labelMat);
        this.arrowLabelSprite.position.set(0, 0.17, 0);
        this.arrowLabelSprite.scale.set(0.30, 0.075, 1);
        this.targetArrowGroup.add(this.arrowLabelSprite);

        this.updateTargetArrowLabel('A');
        this.scene.add(this.targetArrowGroup);
    }

    private updateTargetArrowLabel(letter: string) {
        if (!this.arrowLabelCanvas || !this.arrowLabelTexture) return;
        const ctx = this.arrowLabelCanvas.getContext('2d')!;
        ctx.clearRect(0, 0, 384, 96);

        // Dark glass background with cyan border
        ctx.fillStyle = 'rgba(10, 18, 30, 0.92)';
        ctx.fillRect(0, 0, 384, 96);
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 4;
        ctx.strokeRect(3, 3, 378, 90);

        // Header
        ctx.fillStyle = '#00e5ff';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`TARGET: MYSTERY SALT ${letter}`, 192, 36);

        // Subtext prompt
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('Dip platinum wire here', 192, 68);

        this.arrowLabelTexture.needsUpdate = true;
    }

    public updateTargetArrowPosition() {
        if (!this.targetArrowGroup) return;
        const sample = this.chemicalSamples[this.currentTargetSaltIndex];
        if (sample && sample.standPosition) {
            this.targetArrowGroup.position.set(sample.standPosition.x, 1.15, sample.standPosition.z);
            this.updateTargetArrowLabel(sample.letter || String.fromCharCode(65 + this.currentTargetSaltIndex));
        }
    }

    public updateTargetArrowVisibility() {
        if (!this.targetArrowGroup) return;

        // Strictly hide during orientation, or if all salts are finished, or if sample already collected on wire
        if (
            this.currentState === ExperimentState.ORIENTATION ||
            this.currentState === ExperimentState.STARTING ||
            this.completedSalts.size >= 6 ||
            this.currentTargetSaltIndex >= 6 ||
            this.currentChemical !== null
        ) {
            this.targetArrowGroup.visible = false;
            return;
        }

        // Show when user needs guidance to dip into target salt
        if (this.areGlovesEquipped && (this.currentState === ExperimentState.WIRE_GRABBED || this.currentState === ExperimentState.IDLE)) {
            this.targetArrowGroup.visible = true;
        } else {
            this.targetArrowGroup.visible = false;
        }
    }

    private findReferences() {
        this.scene.traverse((child) => {
            if (child.name === 'PlatinumWire') this.wireGroup = child as THREE.Group;
            if (child.userData?.flameMesh) this.bunsenBurner = child as THREE.Group;
            if (child.userData?.saltSamples) this.chemicalSamples = child.userData.saltSamples;
            if (child.name === 'InstructionBoardGroup') this.instructionBoardGroup = child as THREE.Group;
            if (child.name === 'GlovesGroup' || child.userData?.isGloves) this.glovesGroup = child as THREE.Group;
        });

        this.updateTargetArrowPosition();
        this.updateTargetArrowVisibility();

        // Initialize Reset & Close Button Listeners
        this.resetButtonMesh.addEventListener('pointerdown', () => this.handleResetClick());
        this.closeButtonMesh.addEventListener('pointerdown', () => this.handleResetClick());
        this.wallExitVRButtonMesh.addEventListener('pointerdown', () => this.triggerExitVR());
        if (this.easterEggMesh) {
            this.easterEggMesh.addEventListener('pointerdown', () => this.toggleEasterEgg());
        }
    }

    // --- EXPERIMENT START CONTROL (FEATURE 1) ---
    public onEnterVRCallback: (() => void) | null = null;

    public triggerEnterVR() {
        this.audio.resume();
        if (this.onEnterVRCallback) {
            this.onEnterVRCallback();
        }
    }

    public startExperiment() {
        if (this.currentState !== ExperimentState.ORIENTATION && this.currentState !== ExperimentState.STARTING) return;
        this.currentState = ExperimentState.STARTING;
        this.audio.resume();

        if (this.orientationScreen && this.orientationScreen.getGroup().visible && !this.orientationScreen.isOrientationExiting()) {
            this.orientationScreen.animateExit();
        }

        // Feature 1 Requirement: Play welcome narration when Start Experiment is activated
        this.audio.voice.narrateWelcomeSequence();

        setTimeout(() => {
            this.transitionTo(ExperimentState.IDLE);
        }, 350);
    }

    // Advance experiment to test next salt without resetting entire lab (Feature 2)
    public continueExperiment() {
        if (!this.wireGroup) return;

        if (this.resultDisplay3D) {
            this.resultDisplay3D.hide();
        }
        this.resultUIGroup.visible = false;
        this.releaseBtnGroup.visible = false;
        this.isWireGrabbedVR = false;
        this.isSqueezeHolding = false;
        this.grabbingVRHandIndex = -1;
        this.isHeldDesktop = false;
        if (this.onReleaseCallback) this.onReleaseCallback();

        this.currentChemical = null;
        this.hasNarratedBurnerStage = false;

        // Turn burner OFF
        if (this.isBurnerOn) {
            this.toggleBurner();
        }

        // Reset wire loop mesh color back to metallic chrome
        this.wireGroup.children.forEach(c => {
            if (c instanceof THREE.Mesh && c.geometry.type === 'TorusGeometry') {
                (c.material as THREE.MeshStandardMaterial).color.setHex(0xcccccc);
            }
        });

        // Teleport wire back to initial rest stand position
        if (this.wireGroup.userData.initialPosition) {
            this.wireGroup.position.copy(this.wireGroup.userData.initialPosition);
            this.wireGroup.quaternion.copy(this.wireGroup.userData.initialQuaternion);
        }

        // Check if all 6 salts have been tested
        if (this.completedSalts.size >= 6 || this.currentTargetSaltIndex >= 5) {
            this.updateTargetArrowVisibility();
            this.audio.playCorrect();
            this.audio.voice.setNarration("Congratulations! You have completed all six flame test challenges. Review your observations in the 3D lab notebook.");
            this.showFeedback("All 6 Mystery Salts Identified!", new THREE.Vector3(0, 1.25, -0.75));
            this.transitionTo(ExperimentState.IDLE);
            return;
        }

        // Advance to next sequential untested salt
        this.currentTargetSaltIndex++;
        this.updateTargetArrowPosition();
        this.updateTargetArrowVisibility();

        const nextSample = this.chemicalSamples[this.currentTargetSaltIndex];
        const nextLetter = nextSample?.letter || String.fromCharCode(65 + this.currentTargetSaltIndex);

        this.audio.voice.narrateCleanWire();
        this.audio.voice.setNarration(`Clean wire ready. Follow the 3D arrow to dip into Mystery Salt ${nextLetter}.`);

        // Ready for next salt selection
        this.transitionTo(ExperimentState.IDLE);
    }

    public getOrientationScreen(): OrientationScreen3D {
        return this.orientationScreen;
    }

    public getResultDisplay3D(): ResultDisplay3D {
        return this.resultDisplay3D;
    }

    public onXRSessionStart() {
        const camPos = new THREE.Vector3();
        const camDir = new THREE.Vector3();
        if (this.world && (this.world as any).camera) {
            (this.world as any).camera.getWorldPosition(camPos);
            (this.world as any).camera.getWorldDirection(camDir);
        }
        if (this.orientationScreen) {
            this.orientationScreen.setVRMode(true, camPos, camDir);
        }
    }

    public onXRSessionEnd() {
        if (this.orientationScreen) {
            this.orientationScreen.setVRMode(false);
        }
    }

    // --- SAFETY GLOVES WORKFLOW & VALIDATION ---
    public areGlovesEquippedState(): boolean {
        return this.areGlovesEquipped;
    }

    public promptGlovesRequired() {
        this.audio.resume();
        this.showFeedback("Safety First: Wear Nitrile Gloves!", new THREE.Vector3(-1.05, 1.08, -0.48));
        this.audio.voice.narrateGlovesPrompt();
    }

    public equipGloves() {
        if (this.currentState === ExperimentState.ORIENTATION || this.currentState === ExperimentState.STARTING) {
            this.showFeedback("Click START EXPERIMENT first!", new THREE.Vector3(-1.05, 1.08, -0.48));
            return;
        }
        if (this.areGlovesEquipped) {
            // If wire is held, warn user; otherwise allow unequipping gloves
            if (this.isWireCurrentlyHeld()) {
                this.showFeedback("Release wire before removing gloves!", new THREE.Vector3(-1.05, 1.08, -0.48));
            } else {
                this.unequipGloves();
            }
            return;
        }
        this.audio.resume();
        this.areGlovesEquipped = true;
        this.audio.playGrab();
        this.showFeedback("Safety Gloves Equipped", new THREE.Vector3(-1.05, 1.08, -0.48));

        if (this.glovesGroup) {
            // Subtle spring reaction on dispenser box
            this.glovesGroup.scale.set(0.95, 0.95, 0.95);
            setTimeout(() => {
                if (this.glovesGroup) this.glovesGroup.scale.set(1, 1, 1);
            }, 200);

            // Update 3D badge on realistic nitrile dispenser
            if (typeof this.glovesGroup.userData?.onEquip === 'function') {
                this.glovesGroup.userData.onEquip();
            }
        }

        // Part 1 requirement: Play "Safety gloves equipped." followed by "Step two: Grab the platinum wire."
        this.audio.voice.narrateGlovesEquipped();

        // Reveal wire hint label and guide
        if (this.grabHintSprite && this.currentState === ExperimentState.IDLE) {
            this.grabHintSprite.visible = true;
            this.grabHintSprite.position.set(0.00, 1.05, -0.58);
        }

        // Show 3D arrow to target salt container (Feature 3)
        this.updateTargetArrowVisibility();
    }

    public unequipGloves() {
        if (!this.areGlovesEquipped) return;
        this.areGlovesEquipped = false;
        this.audio.playBlip();
        this.showFeedback("Safety Gloves Unequipped", new THREE.Vector3(-1.05, 1.08, -0.48));

        if (this.glovesGroup && typeof this.glovesGroup.userData?.onUnequip === 'function') {
            this.glovesGroup.userData.onUnequip();
        }

        if (this.grabHintSprite && this.currentState === ExperimentState.IDLE) {
            this.grabHintSprite.visible = false;
        }
        this.updateTargetArrowVisibility();
    }

    public getGloveColor(): number {
        return 0x0284c7; // Authentic medical nitrile cobalt blue
    }

    public getGlovesGroup(): THREE.Group | null {
        return this.glovesGroup;
    }

    // --- 3D HIDDEN SCIENTIFIC EASTER EGG (QUANTUM BUCKMINSTERFULLERENE C60) ---
    private createEasterEgg() {
        this.easterEggGroup = new THREE.Group();
        this.easterEggGroup.name = "EasterEggGroup";
        // Positioned on the reagent rack upper tier on the side counter (x = 3.8, z = -0.97)
        this.easterEggGroup.position.set(3.8, this.easterEggRestY, -0.97);

        // Dark Walnut Wood Pedestal
        const pedMat = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.6 });
        const pedBase = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.072, 0.02, 24), pedMat);
        pedBase.position.y = 0.01;
        this.easterEggGroup.add(pedBase);

        // Brass Specimen Rim Plaque on Pedestal
        const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.3 });
        const brassRim = new THREE.Mesh(new THREE.CylinderGeometry(0.066, 0.066, 0.005, 24), brassMat);
        brassRim.position.y = 0.022;
        this.easterEggGroup.add(brassRim);

        // Molecular Cage Group
        this.easterEggMesh = new THREE.Group();
        this.easterEggMesh.name = "EasterEggBuckyball";
        this.easterEggMesh.userData = { isEasterEgg: true, isPokeable: true };
        this.easterEggMesh.position.y = 0.085;

        // Truncated Icosahedron C60 mathematical vertices
        const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio ~1.618034
        const s = 0.018; // Scale factor for ~10cm desk specimen

        const rawCoords: THREE.Vector3[] = [];
        const addPermutations = (x: number, y: number, z: number) => {
            const signs = [-1, 1];
            for (let sx of (x === 0 ? [0] : signs)) {
                for (let sy of (y === 0 ? [0] : signs)) {
                    for (let sz of (z === 0 ? [0] : signs)) {
                        rawCoords.push(new THREE.Vector3(sx * x * s, sy * y * s, sz * z * s));
                    }
                }
            }
        };

        // Even cyclic permutations of standard C60 vertices
        const baseTuples = [
            [0, 1, 3 * phi],
            [1, 2 + phi, 2 * phi],
            [phi, 2, 2 * phi + 1]
        ];

        baseTuples.forEach(([a, b, c]) => {
            addPermutations(a, b, c);
            addPermutations(c, a, b);
            addPermutations(b, c, a);
        });

        // Unique vertices array
        const vertices: THREE.Vector3[] = [];
        rawCoords.forEach(v => {
            if (!vertices.some(existing => existing.distanceTo(v) < 0.001)) {
                vertices.push(v);
            }
        });

        // 60 Carbon Atom Spheres
        const carbonMat = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            metalness: 0.85,
            roughness: 0.25
        });
        const carbonGeo = new THREE.SphereGeometry(0.0035, 8, 8);

        vertices.forEach(v => {
            const atom = new THREE.Mesh(carbonGeo, carbonMat);
            atom.position.copy(v);
            atom.userData = { isEasterEgg: true };
            this.easterEggMesh.add(atom);
        });

        // Covalent Bond Struts
        const bondMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.7, roughness: 0.3 });
        for (let i = 0; i < vertices.length; i++) {
            for (let j = i + 1; j < vertices.length; j++) {
                const dist = vertices[i].distanceTo(vertices[j]);
                if (dist > 0.020 && dist < 0.040) {
                    const mid = new THREE.Vector3().addVectors(vertices[i], vertices[j]).multiplyScalar(0.5);
                    const bondGeo = new THREE.CylinderGeometry(0.0014, 0.0014, dist, 6);
                    const bond = new THREE.Mesh(bondGeo, bondMat);
                    bond.position.copy(mid);
                    bond.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vertices[j].clone().sub(vertices[i]).normalize());
                    bond.userData = { isEasterEgg: true };
                    this.easterEggMesh.add(bond);
                }
            }
        }

        // Inner Quantum Core Orb
        const coreGeo = new THREE.SphereGeometry(0.015, 16, 16);
        const coreMat = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x7928ca,
            roughness: 0.2,
            metalness: 0.8,
            transparent: true,
            opacity: 0.85
        });
        this.easterEggCore = new THREE.Mesh(coreGeo, coreMat);
        this.easterEggCore.userData = { isEasterEgg: true };
        this.easterEggMesh.add(this.easterEggCore);

        // Subtle Quantum PointLight
        const eggLight = new THREE.PointLight(0x00e5ff, 0.6, 0.8);
        this.easterEggMesh.add(eggLight);

        this.easterEggGroup.add(this.easterEggMesh);

        // Floating 3D Holographic Info Card
        const hCardCanvas = document.createElement('canvas');
        hCardCanvas.width = 512; hCardCanvas.height = 256;
        const hctx = hCardCanvas.getContext('2d')!;
        hctx.fillStyle = 'rgba(10, 18, 30, 0.95)'; hctx.fillRect(0, 0, 512, 256);
        hctx.strokeStyle = '#00e5ff'; hctx.lineWidth = 4; hctx.strokeRect(4, 4, 504, 248);
        hctx.fillStyle = '#00e5ff'; hctx.font = 'bold 28px sans-serif'; hctx.textAlign = 'center';
        hctx.fillText('⚛️ SECRET: BUCKYBALL C₆₀', 256, 45);
        hctx.fillStyle = '#f59e0b'; hctx.font = 'bold 20px sans-serif';
        hctx.fillText('Buckminsterfullerene Carbon Allotrope', 256, 85);
        hctx.fillStyle = '#ffffff'; hctx.font = '18px sans-serif';
        hctx.fillText('• 60 Carbon atoms in a truncated icosahedron', 256, 130);
        hctx.fillText('• Discovered in 1985 (Harold Kroto et al.)', 256, 165);
        hctx.fillText('• Awarded 1996 Nobel Prize in Chemistry!', 256, 200);

        const hCardTex = new THREE.CanvasTexture(hCardCanvas);
        const hCardMat = new THREE.MeshBasicMaterial({ map: hCardTex, transparent: true, side: THREE.DoubleSide });
        this.easterEggCard = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.16), hCardMat);
        this.easterEggCard.position.set(0, 0.22, 0);
        this.easterEggCard.visible = false;
        this.easterEggGroup.add(this.easterEggCard);

        this.scene.add(this.easterEggGroup);
    }

    // Target Beacon Ring (subtle glowing guide for next action)
    private createTargetBeacon() {
        const beaconGeo = new THREE.TorusGeometry(0.045, 0.003, 12, 32);
        beaconGeo.rotateX(Math.PI / 2);
        const beaconMat = new THREE.MeshBasicMaterial({
            color: 0x00e5ff,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        this.targetBeaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
        this.targetBeaconMesh.name = "TargetBeaconMesh";
        this.scene.add(this.targetBeaconMesh);
    }

    public toggleEasterEgg() {
        this.isEasterEggActive = !this.isEasterEggActive;
        this.audio.resume();
        this.audio.playEasterEggChime();
        const pos = new THREE.Vector3();
        this.easterEggGroup.getWorldPosition(pos);
        this.showFeedback(this.isEasterEggActive ? "Discovered C₆₀ Buckyball!" : "Fullerene Restored", pos);
    }

    public getEasterEggMesh(): THREE.Object3D {
        return this.easterEggMesh;
    }

    public getAudioEngine(): AudioEngine {
        return this.audio;
    }

    private handleResetClick() {
        const now = Date.now();
        if (this.resultActivationTime && now - this.resultActivationTime < 500) return;
        this.resetExperiment();
    }

    public handleRightClickRaycast(_object: THREE.Object3D): boolean {
        return false;
    }

    public getCurrentState(): ExperimentState {
        return this.currentState;
    }

    // --- STATE MACHINE TRANSITION ENGINE ---
    private transitionTo(newState: ExperimentState) {
        if (this.currentState === newState) return;
        console.log(`[FlameTestLogic State] ${this.currentState} -> ${newState}`);
        this.currentState = newState;

        switch (newState) {
            case ExperimentState.IDLE:
                if (this.grabHintSprite) {
                    this.grabHintSprite.visible = this.areGlovesEquipped;
                    this.grabHintSprite.position.set(0.00, 1.05, -0.58);
                }
                if (this.areGlovesEquipped) {
                    this.audio.voice.narrateGrabWire();
                }
                break;
            case ExperimentState.WIRE_GRABBED:
                if (this.grabHintSprite) this.grabHintSprite.visible = false;
                {
                    const targetL = this.chemicalSamples[this.currentTargetSaltIndex]?.letter || 'A';
                    this.audio.voice.setNarration(`Follow the 3D arrow to dip into Mystery Salt ${targetL}.`);
                }
                break;
            case ExperimentState.SALT_COLLECTED:
            case ExperimentState.BURNER_INSTRUCTION:
                if (this.grabHintSprite) this.grabHintSprite.visible = false;
                // Fix Part 2: Play burner narration strictly ONCE per test cycle
                if (!this.hasNarratedBurnerStage) {
                    this.hasNarratedBurnerStage = true;
                    this.audio.voice.narrateBurner();
                }
                break;
            case ExperimentState.BURNER_ON:
                if (this.grabHintSprite) this.grabHintSprite.visible = false;
                // Do not duplicate burner narration here
                break;
            case ExperimentState.WIRE_IN_FLAME:
            case ExperimentState.FLAME_RESULT:
                if (this.grabHintSprite) this.grabHintSprite.visible = false;
                break;
            case ExperimentState.RESULT_DISPLAY:
                if (this.grabHintSprite) this.grabHintSprite.visible = false;
                break;
        }

        // Keep 3D directional arrow strictly synchronized with state (Feature 3)
        this.updateTargetArrowVisibility();
    }

    // --- BURNER POWER SWITCH POKE / TOGGLE ---
    public toggleBurner() {
        if (!this.bunsenBurner) return;
        if (this.currentState === ExperimentState.ORIENTATION || this.currentState === ExperimentState.STARTING) {
            this.showFeedback("Click START EXPERIMENT first!", new THREE.Vector3(0.15, 1.05, -0.80));
            return;
        }
        this.audio.resume();

        // Button press animation feedback (depress switch mesh down, then spring back up)
        if (this.bunsenBurner.userData.burnerSwitch) {
            const switchBtn = this.bunsenBurner.userData.burnerSwitch as THREE.Mesh;
            const initY = switchBtn.userData.initialY ?? 0.0425;
            switchBtn.position.y = initY - 0.008;
            setTimeout(() => {
                switchBtn.position.y = initY;
            }, 200);
        }

        // Toggle state
        this.isBurnerOn = !this.isBurnerOn;
        this.audio.toggleBurner(this.isBurnerOn);

        const realisticFlame = this.bunsenBurner.userData.realisticFlame as RealisticFlame | undefined;
        if (realisticFlame) {
            realisticFlame.setIgnited(this.isBurnerOn);
            if (this.isBurnerOn) {
                realisticFlame.resetToDefaultColor();
            }
        }

        const flameMesh = this.bunsenBurner.userData.flameMesh as THREE.Mesh;
        if (flameMesh && flameMesh.material && (flameMesh.material as any).opacity !== undefined) {
            (flameMesh.material as any).opacity = this.isBurnerOn ? 0.8 : 0.0;
        }

        const flameLight = this.bunsenBurner.userData.flameLight as THREE.PointLight;
        if (flameLight) {
            flameLight.intensity = this.isBurnerOn ? 0.65 : 0.0;
            if (this.isBurnerOn) {
                flameLight.color.setHex(this.defaultFlameColor);
            }
        }

        if (this.isBurnerOn) {
            // Advance state machine if salt is already collected
            if (this.currentState === ExperimentState.SALT_COLLECTED || this.currentState === ExperimentState.BURNER_INSTRUCTION) {
                this.transitionTo(ExperimentState.BURNER_ON);
            }
        }

        // Update 3D Power Switch Label
        const bSwitchMat = this.bunsenBurner.userData.burnerSwitchMat as THREE.MeshStandardMaterial;
        const bSwitchCanvas = this.bunsenBurner.userData.burnerSwitchCanvas as HTMLCanvasElement;
        const bSwitchTex = this.bunsenBurner.userData.burnerSwitchTexture as THREE.CanvasTexture;

        if (bSwitchMat && bSwitchCanvas && bSwitchTex) {
            const ctx = bSwitchCanvas.getContext('2d')!;
            ctx.fillStyle = 'rgba(20, 20, 30, 0.95)';
            ctx.fillRect(0, 0, 256, 64);

            if (this.isBurnerOn) {
                bSwitchMat.color.setHex(0x00ff88);
                bSwitchMat.emissive.setHex(0x004422);
                ctx.strokeStyle = '#00ff88';
                ctx.lineWidth = 4;
                ctx.strokeRect(2, 2, 252, 60);
                ctx.fillStyle = '#00ff88';
                ctx.font = 'bold 24px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('POWER: ON', 128, 32);
            } else {
                bSwitchMat.color.setHex(0xff2222);
                bSwitchMat.emissive.setHex(0x660000);
                ctx.strokeStyle = '#ff4444';
                ctx.lineWidth = 4;
                ctx.strokeRect(2, 2, 252, 60);
                ctx.fillStyle = '#ff4444';
                ctx.font = 'bold 24px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('POWER: OFF', 128, 32);
            }
            bSwitchTex.needsUpdate = true;
        }

        this.showFeedback(this.isBurnerOn ? "Burner Ignited" : "Burner Turned Off", this.bunsenBurner.position);
    }

    public getResetButtonMesh(): THREE.Mesh {
        return this.resultDisplay3D ? this.resultDisplay3D.getResetButtonMesh() : this.resetButtonMesh;
    }

    public getDeskRestartButtonMesh(): THREE.Mesh | null {
        return null;
    }

    public getDeskExitVRButtonMesh(): THREE.Mesh {
        return this.wallExitVRButtonMesh;
    }

    public getWallExitVRButtonMesh(): THREE.Mesh {
        return this.wallExitVRButtonMesh;
    }

    public getResultExitVRButtonMesh(): THREE.Mesh | null {
        return null;
    }

    public getReleaseButtonMesh(): THREE.Mesh {
        return this.releaseButtonMesh;
    }

    public isWireCurrentlyHeld(): boolean {
        return this.isWireGrabbedVR || this.isHeldDesktop;
    }

    public isVRWireHeld(): boolean {
        return this.isWireGrabbedVR;
    }

    public releaseWire() {
        this.isWireGrabbedVR = false;
        this.isVRGrabOffsetInitialized = false;
        this.isSqueezeHolding = false;
        this.grabbingVRHandIndex = -1;
        this.isHeldDesktop = false;
        this.releaseBtnGroup.visible = false;
        this.audio.playBlip();

        if (this.wireGroup) {
            const wirePos = new THREE.Vector3();
            this.wireGroup.getWorldPosition(wirePos);
            this.showFeedback("Wire Detached", wirePos);
        }

        if (this.onReleaseCallback) {
            this.onReleaseCallback();
        }
    }

    public async triggerExitVR(): Promise<boolean> {
        if (this.isExitingVR) return false;
        this.isExitingVR = true;

        this.audio.playBlip();

        // Physical 3D button depression animation feedback
        if (this.wallExitVRButtonMesh) {
            this.wallExitVRButtonMesh.position.z = 0.040; // slides backwards into enclosure
        }
        if (this.wallExitVRStatusLed) {
            (this.wallExitVRStatusLed.material as THREE.MeshStandardMaterial).emissive.setHex(0xffaa00);
        }

        const renderer = (this.world as any).renderer;
        const xr = renderer?.xr;
        const session: any = xr?.getSession ? xr.getSession() : (this.world as any).session;

        if (session) {
            this.showFeedback("Exiting VR Session...", this.wallExitVRBtnGroup.position);
            try {
                if (typeof session.end === 'function') {
                    await session.end();
                }
            } catch (err: any) {
                console.warn('[XR] Handled session end warning:', err);
            }
        } else {
            this.showFeedback("Already in Desktop View", this.wallExitVRBtnGroup.position);
        }

        setTimeout(() => {
            if (this.wallExitVRButtonMesh) {
                this.wallExitVRButtonMesh.position.z = 0.055; // springs back forward
            }
            if (this.wallExitVRStatusLed) {
                (this.wallExitVRStatusLed.material as THREE.MeshStandardMaterial).emissive.setHex(0x00aa44);
            }
            this.isExitingVR = false;
        }, 800);

        if (this.onExitVRCallback) {
            this.onExitVRCallback();
        }

        return true;
    }

    public onVRHandSelectStart(handIndex: number) {
        this.audio.resume();

        const renderer = (this.world as any).renderer;
        if (!renderer || !renderer.xr) return;

        const hand = renderer.xr.getHand ? renderer.xr.getHand(handIndex) : null;
        const controller = renderer.xr.getController ? renderer.xr.getController(handIndex) : null;

        const raycaster = new THREE.Raycaster();
        const origin = new THREE.Vector3();
        const quat = new THREE.Quaternion();
        let hasPointer = false;

        if (hand && (hand as any).joints) {
            const indexTip = (hand as any).joints['index-finger-tip'] || (hand as any).joints[9];
            const wrist = (hand as any).joints['wrist'] || (hand as any).joints[0];
            if (indexTip && wrist) {
                indexTip.getWorldPosition(origin);
                const wristPos = new THREE.Vector3();
                wrist.getWorldPosition(wristPos);
                if (origin.lengthSq() > 0.001) {
                    const dir = origin.clone().sub(wristPos).normalize();
                    quat.setFromUnitVectors(new THREE.Vector3(0, 0, -1), dir);
                    hasPointer = true;
                }
            }
        }

        if (!hasPointer && controller) {
            controller.updateMatrixWorld(true);
            controller.getWorldPosition(origin);
            controller.getWorldQuaternion(quat);
            if (origin.lengthSq() > 0.001) {
                hasPointer = true;
            }
        }

        if (!hasPointer && hand) {
            hand.updateMatrixWorld(true);
            hand.getWorldPosition(origin);
            hand.getWorldQuaternion(quat);
            if (origin.lengthSq() > 0.001) {
                hasPointer = true;
            }
        }

        // 1. PRIMARY: Check Desk Exit VR Button (ALWAYS UNBLOCKED in ALL states, right by user's hand)
        if (hasPointer && this.wallExitVRButtonMesh) {
            const exitVRPos = new THREE.Vector3();
            this.wallExitVRButtonMesh.getWorldPosition(exitVRPos);
            if (origin.distanceTo(exitVRPos) < 0.40) {
                this.triggerExitVR();
                return;
            }

            const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(quat);
            raycaster.set(origin, dir);
            const exitHits = raycaster.intersectObject(this.wallExitVRBtnGroup, true);
            if (exitHits.length > 0) {
                this.triggerExitVR();
                return;
            }
        }

        // 2. In ORIENTATION or STARTING state: allow VR controller trigger / hand pinch raycast selection
        if (this.currentState === ExperimentState.ORIENTATION || this.currentState === ExperimentState.STARTING) {
            if (hasPointer && this.orientationScreen && this.orientationScreen.getGroup().visible) {
                this.orientationScreen.getGroup().updateMatrixWorld(true);

                // Direct check: if controller/hand origin is close to start button (< 0.45m), trigger Start!
                const startBtn = this.orientationScreen.getStartButtonMesh();
                if (startBtn) {
                    const startPos = new THREE.Vector3();
                    startBtn.getWorldPosition(startPos);
                    if (origin.distanceTo(startPos) < 0.45) {
                        this.startExperiment();
                        return;
                    }
                }

                // Check direct proximity to any button on orientation screen (< 0.30m)
                if (this.orientationScreen.checkPokeAndInteract(origin)) {
                    return;
                }

                const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(quat);
                raycaster.set(origin, dir);
                const intersects = raycaster.intersectObjects(this.orientationScreen.getGroup().children, true);
                for (let i = 0; i < intersects.length; i++) {
                    const hitObj = intersects[i].object;
                    const hitPt = intersects[i].point;
                    if (this.orientationScreen.handleClick(hitObj, hitPt)) {
                        return;
                    }
                }
            }

            // Strict gating: Block laboratory equipment interactions until Start Experiment is activated
            return;
        }

        // 3. Support raycast click on ResultDisplay3D (Continue, Reset, Exit VR)
        if (this.resultDisplay3D && this.resultDisplay3D.getGroup().visible && hasPointer) {
            // Check direct proximity (< 0.35m)
            if (this.resultDisplay3D.checkPokeAndInteract(origin)) {
                return;
            }

            const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(quat);
            raycaster.set(origin, dir);
            const intersects = raycaster.intersectObjects(this.resultDisplay3D.getGroup().children, true);
            for (let i = 0; i < intersects.length; i++) {
                const hitObj = intersects[i].object;
                const hitPt = intersects[i].point;
                if (this.resultDisplay3D.handleClick(hitObj, hitPt)) {
                    return;
                }
            }
        }

        // 3b. Support raycast / pinch click on 3D Lab Book (Feature 4)
        if (this.labBook && hasPointer) {
            if (this.labBook.checkPokeAndInteract(origin)) {
                return;
            }
            const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(quat);
            raycaster.set(origin, dir);
            const bookHits = raycaster.intersectObjects(this.labBook.getGroup().children, true);
            for (let i = 0; i < bookHits.length; i++) {
                if (this.labBook.handleClick(bookHits[i].object, bookHits[i].point)) {
                    return;
                }
            }
        }



        // 5. Support raycast click on Bunsen Burner switch
        if (this.bunsenBurner && hasPointer) {
            const bPos = new THREE.Vector3();
            this.bunsenBurner.getWorldPosition(bPos);
            if (origin.distanceTo(bPos) < 0.35) {
                this.toggleBurner();
                return;
            }

            const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(quat);
            raycaster.set(origin, dir);
            const bHits = raycaster.intersectObject(this.bunsenBurner, true);
            if (bHits.length > 0) {
                this.toggleBurner();
                return;
            }
        }

        // 6. Support raycast click on Nitrile Gloves dispenser
        if (!this.areGlovesEquipped && hasPointer) {
            const glovesPos = new THREE.Vector3(-1.05, 0.90, -0.48);
            if (origin.distanceTo(glovesPos) < 0.35) {
                this.equipGloves();
                return;
            }
            if (this.glovesGroup) {
                const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(quat);
                raycaster.set(origin, dir);
                const gHits = raycaster.intersectObject(this.glovesGroup, true);
                if (gHits.length > 0) {
                    this.equipGloves();
                    return;
                }
            }
        }

        // 7. Support raycast click on 3D Release Wire Button
        if (this.releaseBtnGroup.visible && hasPointer) {
            const relPos = new THREE.Vector3();
            this.releaseButtonMesh.getWorldPosition(relPos);
            if (origin.distanceTo(relPos) < 0.30) {
                this.releaseWire();
                return;
            }

            const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(quat);
            raycaster.set(origin, dir);
            const relHits = raycaster.intersectObject(this.releaseBtnGroup, true);
            if (relHits.length > 0) {
                this.releaseWire();
                return;
            }
        }

        // 8. Platinum Wire Grab & Toggle Release (Raycast Hit OR Distance < 0.28m)
        if (this.wireGroup && hasPointer) {
            const wirePos = new THREE.Vector3();
            this.wireGroup.getWorldPosition(wirePos);
            const dist = origin.distanceTo(wirePos);

            const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(quat);
            raycaster.set(origin, dir);
            const wireHits = raycaster.intersectObject(this.wireGroup, true);

            if (dist < 0.32 || wireHits.length > 0) {
                if (this.isWireGrabbedVR) {
                    this.releaseWire();
                } else {
                    this.initiateVRWireGrab(handIndex);
                }
                return;
            }
        }

        // 9. Hidden Scientific Easter Egg (Quantum Buckyball C60) Raycast / Proximity
        if (this.easterEggGroup && hasPointer) {
            const eggPos = new THREE.Vector3();
            this.easterEggGroup.getWorldPosition(eggPos);
            const dist = origin.distanceTo(eggPos);

            const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(quat);
            raycaster.set(origin, dir);
            const eggHits = raycaster.intersectObject(this.easterEggGroup, true);

            if (dist < 0.35 || eggHits.length > 0) {
                this.toggleEasterEgg();
                return;
            }
        }

        // 10. Instruction Board Close Button Raycast
        if (this.instructionBoardGroup && this.instructionBoardGroup.visible && hasPointer) {
            const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(quat);
            raycaster.set(origin, dir);
            const instHits = raycaster.intersectObject(this.instructionBoardGroup, true);
            if (instHits.length > 0) {
                for (const hit of instHits) {
                    let cur: THREE.Object3D | null = hit.object;
                    while (cur && cur !== this.instructionBoardGroup) {
                        if (cur.name === 'InstructionCloseBtn' || cur.userData?.isCloseButton) {
                            this.instructionBoardGroup.visible = false;
                            return;
                        }
                        cur = cur.parent;
                    }
                }
            }
        }

        // 11. Result UI Reset Button Raycast
        if (this.resetButtonMesh && this.resultUIGroup.visible && hasPointer) {
            const resetPos = new THREE.Vector3();
            this.resetButtonMesh.getWorldPosition(resetPos);
            if (origin.distanceTo(resetPos) < 0.25) {
                this.resetExperiment();
                return;
            }
            const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(quat);
            raycaster.set(origin, dir);
            const rHits = raycaster.intersectObject(this.resetButtonMesh, true);
            if (rHits.length > 0) {
                this.resetExperiment();
                return;
            }
        }
    }

    public onVRHandSelectEnd(_handIndex: number) {
        // Trigger click/pinch released:
        // Do not force-drop wire here so toggle grab works smoothly just like desktop left-click!
        // Wire release is handled naturally via:
        // 1. Opening hand (18-frame debounced grace gesture)
        // 2. Touching/raycasting the 3D Release Wire button
        // 3. Pinching/triggering wire again (toggle release)
        // 4. Releasing grip squeeze (hold mode)
    }

    public onVRHandSqueezeStart(handIndex: number) {
        this.audio.resume();
        // If glove is equipped and near wire, grab wire in squeeze-hold mode (like desktop right click hold)
        if (this.wireGroup && this.areGlovesEquipped && !this.isWireGrabbedVR) {
            const wirePos = new THREE.Vector3();
            this.wireGroup.getWorldPosition(wirePos);
            const renderer = (this.world as any).renderer;
            const hand = renderer?.xr?.getHand ? renderer.xr.getHand(handIndex) : null;
            const controller = renderer?.xr?.getController ? renderer.xr.getController(handIndex) : null;
            
            const handPos = new THREE.Vector3();
            if (hand && (hand as any).joints?.wrist) {
                (hand as any).joints.wrist.getWorldPosition(handPos);
            } else if (controller) {
                controller.getWorldPosition(handPos);
            }

            if (handPos.lengthSq() > 0.001 && handPos.distanceTo(wirePos) < 0.35) {
                this.initiateVRWireGrab(handIndex);
                this.isSqueezeHolding = true;
                return;
            }
        }
        // Fallback: squeeze can also trigger select interactions if not wire grabbing
        this.onVRHandSelectStart(handIndex);
    }

    public onVRHandSqueezeEnd(handIndex: number) {
        if (this.isSqueezeHolding && this.isWireGrabbedVR && this.grabbingVRHandIndex === handIndex) {
            this.releaseWire();
            this.isSqueezeHolding = false;
        }
    }

    // --- STRICT NEAR-FIELD FINGER POKE & TARGET COLLISION ENGINE ---
    private checkPokeCollisions(pokePos: THREE.Vector3, handIndex: number = 0) {
        const now = Date.now();
        this.audio.resume();

        // 1. Check Desk Exit VR Switch Poke (ALWAYS UNBLOCKED in ALL states, right by user's hands)
        if (this.wallExitVRButtonMesh) {
            const exitVRPos = FlameTestLogic._scratchExitPos;
            this.wallExitVRButtonMesh.getWorldPosition(exitVRPos);
            const dist = pokePos.distanceTo(exitVRPos);
            const localPoke = this.wallExitVRButtonMesh.worldToLocal(FlameTestLogic._scratchLocalPoke.copy(pokePos));
            const inBounds = (
                Math.abs(localPoke.x) <= 0.18 &&
                Math.abs(localPoke.y) <= 0.10 &&
                Math.abs(localPoke.z) <= 0.16
            );
            if (dist < 0.28 || inBounds) {
                this.lastInteractionTime = now;
                this.triggerExitVR();
                return;
            }
        }
        if (this.wallExitVRBtnGroup) {
            const exitGroupPos = FlameTestLogic._scratchExitPos;
            this.wallExitVRBtnGroup.getWorldPosition(exitGroupPos);
            if (pokePos.distanceTo(exitGroupPos) < 0.28) {
                this.lastInteractionTime = now;
                this.triggerExitVR();
                return;
            }
        }

        // 2. Check 3D Orientation Screen Poke (Always active in ORIENTATION mode)
        if (this.orientationScreen && this.orientationScreen.checkPokeAndInteract(pokePos)) {
            this.lastInteractionTime = now;
            return;
        }

        // 3. Check 3D Result Device on user's right
        if (this.resultDisplay3D && this.resultDisplay3D.checkPokeAndInteract(pokePos)) {
            this.lastInteractionTime = now;
            return;
        }

        // 3b. Check 3D Lab Book Poke (Page Turning & Observations Review - Feature 4)
        if (this.labBook && this.labBook.checkPokeAndInteract(pokePos)) {
            this.lastInteractionTime = now;
            return;
        }

        // If in ORIENTATION or STARTING, do not allow poking laboratory tools/burners
        if (this.currentState === ExperimentState.ORIENTATION || this.currentState === ExperimentState.STARTING) {
            return;
        }

        // 4. Check Nitrile Gloves Dispenser Poke (Equip gloves on direct touch)
        if (!this.areGlovesEquipped) {
            const glovesPos = FlameTestLogic._scratchGlovesPos.set(-1.05, 0.90, -0.48);
            if (this.glovesGroup) {
                this.glovesGroup.getWorldPosition(glovesPos);
            }
            if (pokePos.distanceTo(glovesPos) < 0.28) {
                this.lastInteractionTime = now;
                this.equipGloves();
                return;
            }
        }

        // 4b. Check Platinum Wire Poke (Direct finger touch to grab wire in VR)
        if (this.wireGroup && !this.isWireGrabbedVR) {
            const wirePos = FlameTestLogic._scratchWirePos;
            this.wireGroup.getWorldPosition(wirePos);
            if (pokePos.distanceTo(wirePos) < 0.22) {
                this.lastInteractionTime = now;
                this.initiateVRWireGrab(handIndex);
                return;
            }
        }

        // 5. Check Burner Power Switch Poke (ALWAYS UNBLOCKED)
        if (this.bunsenBurner && now - this.lastBurnerToggleTime > 250) {
            const targets: THREE.Object3D[] = [];
            if (this.bunsenBurner.userData.burnerSwitch) targets.push(this.bunsenBurner.userData.burnerSwitch);
            if (this.bunsenBurner.userData.knob) targets.push(this.bunsenBurner.userData.knob);
            targets.push(this.bunsenBurner); // Burner base fallback

            for (const target of targets) {
                target.updateMatrixWorld(true);
                const targetPos = FlameTestLogic._scratchTargetPos;
                target.getWorldPosition(targetPos);

                if (pokePos.distanceTo(targetPos) < 0.25) { // 25cm hit radius
                    this.lastBurnerToggleTime = now;
                    this.lastInteractionTime = now;
                    this.toggleBurner();
                    return;
                }
            }
        }

        if (now - this.lastInteractionTime < 350) return; // 350ms Debounce lock for secondary UI

        // 6. Check Hidden Easter Egg (Quantum Buckyball C60) Poke
        if (this.easterEggMesh) {
            const eggPos = FlameTestLogic._scratchEggPos;
            this.easterEggMesh.getWorldPosition(eggPos);
            if (pokePos.distanceTo(eggPos) < 0.25) {
                this.lastInteractionTime = now;
                this.toggleEasterEgg();
                return;
            }
        }

        // 7. Check Optional Pop-Culture Golden Snitch Easter Egg Poke & Proximity
        if (this.goldenSnitch && this.goldenSnitch.isActive()) {
            if (this.goldenSnitch.checkPokeAndInteract(pokePos)) {
                this.lastInteractionTime = now;
                return;
            }
        }

        // 8. Check Release Platinum Wire Button Poke
        if (this.releaseBtnGroup.visible) {
            const relPos = FlameTestLogic._scratchRelPos;
            this.releaseButtonMesh.getWorldPosition(relPos);
            if (pokePos.distanceTo(relPos) < 0.18) {
                this.lastInteractionTime = now;
                this.releaseWire();
                return;
            }
        }

        // 9. Check Result UI Reset & Close Buttons
        if (this.resultUIGroup.visible) {
            const resetPos = FlameTestLogic._scratchTargetPos;
            const closePos = FlameTestLogic._scratchRelPos;
            this.resetButtonMesh.getWorldPosition(resetPos);
            this.closeButtonMesh.getWorldPosition(closePos);

            if (pokePos.distanceTo(resetPos) < 0.16 || pokePos.distanceTo(closePos) < 0.16) {
                this.lastInteractionTime = now;
                this.resetExperiment();
                return;
            }
        }

        // 10. Check Instruction Board Close Button
        if (this.instructionBoardGroup && this.instructionBoardGroup.visible) {
            const boardPos = FlameTestLogic._scratchTargetPos;
            this.instructionBoardGroup.getWorldPosition(boardPos);
            const closePos = boardPos.clone().add(new THREE.Vector3(0.64, 0.31, 0));
            if (pokePos.distanceTo(closePos) < 0.22) {
                this.instructionBoardGroup.visible = false;
                this.lastInteractionTime = now;
                return;
            }
        }
    }

    public update(delta: number) {
        if (this.orientationScreen) {
            this.orientationScreen.update(delta);
        }
        if (this.resultDisplay3D) {
            this.resultDisplay3D.update(delta);
        }
        if (this.labBook) {
            this.labBook.update(delta);
        }

        // --- VR HEADSET DIRECT HAND & CONTROLLER TRACKING POKE ENGINE ---
        const renderer = (this.world as any).renderer;
        const isPresenting = !!(renderer && renderer.xr && renderer.xr.isPresenting);

        // Keep UI screen distance synchronized in VR (close floating screen ~0.85m) vs Desktop (1.75m)
        if (this.orientationScreen) {
            if (isPresenting && !this.orientationScreen.getIsVRMode()) {
                const camPos = new THREE.Vector3();
                const camDir = new THREE.Vector3();
                if (this.world && (this.world as any).camera) {
                    (this.world as any).camera.getWorldPosition(camPos);
                    (this.world as any).camera.getWorldDirection(camDir);
                }
                this.orientationScreen.setVRMode(true, camPos, camDir);
            } else if (!isPresenting && this.orientationScreen.getIsVRMode()) {
                this.orientationScreen.setVRMode(false);
            } else if (isPresenting && this.orientationScreen.getIsVRMode() && (this.currentState === ExperimentState.ORIENTATION || this.currentState === ExperimentState.STARTING)) {
                const camPos = new THREE.Vector3();
                const camDir = new THREE.Vector3();
                if (this.world && (this.world as any).camera) {
                    (this.world as any).camera.getWorldPosition(camPos);
                    (this.world as any).camera.getWorldDirection(camDir);
                }
                this.orientationScreen.updateVRPose(camPos, camDir);
            }
        }

        if (isPresenting) {
            if (this.handTouchDots.length === 0) {
                for (let d = 0; d < 2; d++) {
                    const dotGeo = new THREE.SphereGeometry(0.007, 16, 16);
                    const dotMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.85 });
                    const dot = new THREE.Mesh(dotGeo, dotMat);
                    dot.name = `HandTouchDot_${d}`;
                    dot.visible = false;
                    this.scene.add(dot);
                    this.handTouchDots.push(dot);
                }
            }

            for (let i = 0; i < 2; i++) {
                const hand = renderer.xr.getHand ? renderer.xr.getHand(i) : null;
                const controller = renderer.xr.getController ? renderer.xr.getController(i) : null;
                const touchDot = this.handTouchDots[i];
                let foundHand = false;

                if (hand && (hand as any).joints) {
                    const joints = (hand as any).joints;
                    const wristJoint = joints['wrist'] || joints[0];
                    const indexTipJoint = joints['index-finger-tip'] || joints[9] || joints[8] || joints[4];

                    if (indexTipJoint && wristJoint) {
                        const wristPos = FlameTestLogic._scratchWristPos[i];
                        const wristQuat = FlameTestLogic._scratchWristQuat[i];
                        wristJoint.getWorldPosition(wristPos);
                        wristJoint.getWorldQuaternion(wristQuat);

                        const indexTipPos = FlameTestLogic._scratchIndexTipPos[i];
                        indexTipJoint.getWorldPosition(indexTipPos);

                        if (wristPos.lengthSq() > 0.01 && indexTipPos.lengthSq() > 0.01) {
                            foundHand = true;

                            if (touchDot) {
                                touchDot.position.copy(indexTipPos);
                                touchDot.visible = false;
                            }

                            // Poke check with index fingertip (WORKS FOR ALL 3D PANELS & EQUIPMENT!)
                            this.checkPokeCollisions(indexTipPos, i);

                            // Pinch check (Thumb tip to index tip)
                            let isPinching = false;
                            const thumbTipPos = FlameTestLogic._scratchThumbTipPos[i];
                            const thumbTipJoint = joints['thumb-tip'] || joints[4];
                            if (thumbTipJoint) {
                                thumbTipJoint.getWorldPosition(thumbTipPos);
                                if (thumbTipPos.distanceTo(indexTipPos) < 0.05) {
                                    isPinching = true;
                                }
                            }

                            // Closed fist gesture check
                            const isFistClosed = indexTipPos.distanceTo(wristPos) < 0.13;

                            // Near-field platinum wire grab (< 22 cm multi-point contact)
                            if (this.wireGroup && this.currentState !== ExperimentState.ORIENTATION && this.currentState !== ExperimentState.STARTING) {
                                const wirePos = FlameTestLogic._scratchWirePos;
                                this.wireGroup.getWorldPosition(wirePos);
                                const distWristToWire = wristPos.distanceTo(wirePos);
                                const distIndexToWire = indexTipPos.distanceTo(wirePos);
                                const distThumbToWire = thumbTipJoint ? thumbTipPos.distanceTo(wirePos) : 999;
                                const minHandDistToWire = Math.min(distWristToWire, distIndexToWire, distThumbToWire);

                                if ((isFistClosed || isPinching) && minHandDistToWire < 0.22 && !this.isWireGrabbedVR && !this.isHeldDesktop) {
                                    this.initiateVRWireGrab(i);
                                }

                                // Smooth natural hand attachment preserving relative transform and grab offset
                                if (this.isWireGrabbedVR && this.grabbingVRHandIndex === i) {
                                    if (isFistClosed || isPinching) {
                                        this.vrWireReleaseFrames = 0;
                                        const graspPoint = thumbTipJoint
                                            ? FlameTestLogic._v2.copy(indexTipPos).add(thumbTipPos).multiplyScalar(0.5)
                                            : FlameTestLogic._v2.copy(indexTipPos);

                                        const handQuat = wristQuat;

                                        // Initialize grab offset in hand coordinate frame on the first frame of grab (ZERO jump)
                                        if (!this.isVRGrabOffsetInitialized && this.wireGroup) {
                                            const currentWirePos = FlameTestLogic._scratchWirePos;
                                            const currentWireQuat = FlameTestLogic._scratchWireQuat;
                                            this.wireGroup.getWorldPosition(currentWirePos);
                                            this.wireGroup.getWorldQuaternion(currentWireQuat);

                                            const invHandQuat = handQuat.clone().invert();
                                            this.vrGrabOffsetPos.copy(currentWirePos).sub(graspPoint).applyQuaternion(invHandQuat);
                                            this.vrGrabOffsetQuat.copy(invHandQuat.multiply(currentWireQuat));
                                            this.isVRGrabOffsetInitialized = true;
                                        }

                                        // Apply rigid grab offset in hand space: wire follows hand exactly without leaping to headset/hand origin
                                        const targetWirePos = FlameTestLogic._v3.copy(this.vrGrabOffsetPos).applyQuaternion(handQuat).add(graspPoint);
                                        const targetQuat = handQuat.clone().multiply(this.vrGrabOffsetQuat);

                                        if (this.wireGroup.parent) {
                                            this.wireGroup.parent.worldToLocal(targetWirePos);
                                        }
                                        this.wireGroup.position.copy(targetWirePos);
                                        this.wireGroup.quaternion.copy(targetQuat);
                                    } else {
                                        // Natural release gesture: opening fingers releases wire immediately at current position
                                        this.vrWireReleaseFrames = (this.vrWireReleaseFrames || 0) + 1;
                                        if (this.vrWireReleaseFrames >= 3) {
                                            this.releaseWire();
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // ALSO check controller position if hand joints are not present or active
                if (controller) {
                    controller.updateMatrixWorld(true);
                    const ctrlPos = FlameTestLogic._scratchCtrlPos;
                    const ctrlQuat = FlameTestLogic._scratchCtrlQuat;
                    controller.getWorldPosition(ctrlPos);
                    controller.getWorldQuaternion(ctrlQuat);

                    if (ctrlPos.lengthSq() > 0.01) {
                        const ctrlTipPos = ctrlPos.clone().add(new THREE.Vector3(0, 0, -0.12).applyQuaternion(ctrlQuat));
                        this.checkPokeCollisions(ctrlTipPos, i);
                        this.checkPokeCollisions(ctrlPos, i);

                        if (!foundHand && touchDot) {
                            touchDot.position.copy(ctrlTipPos);
                            touchDot.visible = true;
                        }

                        // Controller wire movement support with Grab Offset
                        if (this.isWireGrabbedVR && this.grabbingVRHandIndex === i && !foundHand && this.wireGroup) {
                            if (!this.isVRGrabOffsetInitialized) {
                                const currentWirePos = FlameTestLogic._scratchWirePos;
                                const currentWireQuat = FlameTestLogic._scratchWireQuat;
                                this.wireGroup.getWorldPosition(currentWirePos);
                                this.wireGroup.getWorldQuaternion(currentWireQuat);

                                const invCtrlQuat = ctrlQuat.clone().invert();
                                this.vrGrabOffsetPos.copy(currentWirePos).sub(ctrlPos).applyQuaternion(invCtrlQuat);
                                this.vrGrabOffsetQuat.copy(invCtrlQuat.multiply(currentWireQuat));
                                this.isVRGrabOffsetInitialized = true;
                            }

                            const targetWirePos = FlameTestLogic._v3.copy(this.vrGrabOffsetPos).applyQuaternion(ctrlQuat).add(ctrlPos);
                            const targetQuat = ctrlQuat.clone().multiply(this.vrGrabOffsetQuat);

                            if (this.wireGroup.parent) {
                                this.wireGroup.parent.worldToLocal(targetWirePos);
                            }
                            this.wireGroup.position.copy(targetWirePos);
                            this.wireGroup.quaternion.copy(targetQuat);
                        }
                    }
                }
            }
        } else {
            this.handTouchDots.forEach(d => d.visible = false);
        }

        // Feature 1: Keep experiment actions & hints completely inactive during ORIENTATION & STARTING
        if (this.currentState === ExperimentState.ORIENTATION || this.currentState === ExperimentState.STARTING) {
            if (this.targetBeaconMesh) this.targetBeaconMesh.visible = false;
            if (this.grabHintSprite) this.grabHintSprite.visible = false;
            if (this.wireGroup && this.wireGroup.userData.initialPosition) {
                // Strict gating: keep wire fixed in place before Start Experiment is pressed
                this.wireGroup.position.copy(this.wireGroup.userData.initialPosition);
                if (this.wireGroup.userData.initialQuaternion) {
                    this.wireGroup.quaternion.copy(this.wireGroup.userData.initialQuaternion);
                }
            }
            return;
        }

        // Update Target Highlight Beacon (subtle beginner-friendly action guide)
        if (this.targetBeaconMesh) {
            this.beaconAnimTime += delta;
            const bPulse = 1.0 + Math.sin(this.beaconAnimTime * 4) * 0.12;
            const bAlpha = 0.35 + Math.sin(this.beaconAnimTime * 4) * 0.2;
            this.targetBeaconMesh.scale.set(bPulse, bPulse, bPulse);
            (this.targetBeaconMesh.material as THREE.MeshBasicMaterial).opacity = bAlpha;

            switch (this.currentState) {
                case ExperimentState.IDLE:
                    this.targetBeaconMesh.visible = true;
                    this.targetBeaconMesh.position.set(0.00, 0.935, -0.58);
                    break;
                case ExperimentState.WIRE_GRABBED:
                    this.targetBeaconMesh.visible = true;
                    this.targetBeaconMesh.position.set(-0.44, 0.905, -0.72);
                    break;
                case ExperimentState.SALT_COLLECTED:
                case ExperimentState.BURNER_INSTRUCTION:
                    this.targetBeaconMesh.visible = true;
                    this.targetBeaconMesh.position.set(0.235, 0.925, -0.80);
                    break;
                case ExperimentState.BURNER_ON:
                    this.targetBeaconMesh.visible = true;
                    this.targetBeaconMesh.position.set(0.15, 1.06, -0.80);
                    break;
                default:
                    this.targetBeaconMesh.visible = false;
                    break;
            }
        }

        // Update 3D Directional Target Arrow Animation (Feature 3)
        if (this.targetArrowGroup && this.targetArrowGroup.visible) {
            this.arrowAnimTime += delta;
            const targetSample = this.chemicalSamples[this.currentTargetSaltIndex];
            if (targetSample && targetSample.standPosition) {
                const bobY = 1.15 + Math.sin(this.arrowAnimTime * 3.5) * 0.016;
                this.targetArrowGroup.position.set(targetSample.standPosition.x, bobY, targetSample.standPosition.z);
            }
            if (this.arrowShaftAndCone) {
                this.arrowShaftAndCone.rotation.y += delta * 1.5;
            }
            if (this.arrowHalo) {
                const pulse = 1.0 + Math.sin(this.arrowAnimTime * 4) * 0.15;
                this.arrowHalo.scale.set(pulse, pulse, 1);
            }
        }

        // Update Easter Egg levitation, quantum pulsation, and rotation
        if (this.easterEggMesh) {
            if (this.isEasterEggActive) {
                const targetY = 0.22 + Math.sin(this.beaconAnimTime * 3) * 0.02;
                this.easterEggMesh.position.y += (targetY - this.easterEggMesh.position.y) * 0.08;
                this.easterEggMesh.rotation.y += delta * 1.5;
                this.easterEggMesh.rotation.x += delta * 0.7;
                this.easterEggCard.visible = true;
                if (this.world && this.world.camera) {
                    const camPos = FlameTestLogic._v1;
                    (this.world.camera as any).getWorldPosition(camPos);
                    this.easterEggCard.lookAt(camPos);
                }
            } else {
                this.easterEggMesh.position.y += (0.085 - this.easterEggMesh.position.y) * 0.1;
                this.easterEggMesh.rotation.y += delta * 0.2;
                this.easterEggCard.visible = false;
            }
        }

        if (!this.wireGroup || !this.bunsenBurner) return;

        this.wireGroup.updateMatrixWorld(true);

        // Position 3D Release Wire Option on workbench when wire is held (never covers wire or user hand)
        const isWireHeld = this.isWireGrabbedVR || this.isHeldDesktop;
        if (isWireHeld && this.wireGroup) {
            this.releaseBtnGroup.visible = true;
            this.releaseBtnGroup.position.set(0.00, 0.96, -0.48);

            if (this.world && this.world.camera) {
                const camPos = FlameTestLogic._v1;
                (this.world.camera as any).getWorldPosition(camPos);
                this.releaseBtnGroup.lookAt(camPos);
            }
        } else {
            this.releaseBtnGroup.visible = false;
        }

        // Get exact world position of the wire loop tip mesh
        if (!this.wireLoopMesh && this.wireGroup) {
            this.wireGroup.traverse(c => {
                if (c instanceof THREE.Mesh && c.geometry.type === 'TorusGeometry') {
                    this.wireLoopMesh = c;
                }
            });
        }
        const loopWorldPos = FlameTestLogic._v2;
        if (this.wireLoopMesh) {
            this.wireLoopMesh.getWorldPosition(loopWorldPos);
        } else {
            FlameTestLogic._v2.set(0.125, 0, 0).applyMatrix4(this.wireGroup.matrixWorld);
        }

        // Check wire position for movement trigger
        const initialPos = this.wireGroup.userData.initialPosition;
        let isMoved = false;
        if (initialPos) {
            isMoved = this.wireGroup.position.distanceTo(initialPos) > 0.04;
            if (isMoved && !this.wasWireMoved) {
                if (!this.areGlovesEquipped) {
                    this.promptGlovesRequired();
                    // Snap wire back if moved without gloves
                    this.wireGroup.position.copy(initialPos);
                    if (this.wireGroup.userData.initialQuaternion) {
                        this.wireGroup.quaternion.copy(this.wireGroup.userData.initialQuaternion);
                    }
                } else {
                    this.audio.playGrab();
                    this.wasWireMoved = true;
                    if (this.currentState === ExperimentState.IDLE) {
                        this.transitionTo(ExperimentState.WIRE_GRABBED);
                    }
                }
            } else if (!isMoved && this.currentState === ExperimentState.WIRE_GRABBED) {
                this.wasWireMoved = false;
            }
        }

        // Instructional Hint: strictly visible only in IDLE state when safety gloves are equipped
        if (this.grabHintSprite) {
            this.grabHintSprite.visible = (this.currentState === ExperimentState.IDLE && this.areGlovesEquipped);
            if (this.grabHintSprite.visible) {
                this.grabHintSprite.position.set(0.00, 1.05, -0.58);
            }
        }

        // --- STEP 2: DIP WIRE INTO SALT (STRICT NEAR-FIELD DIPPING CHECK & TARGET VALIDATION - FEATURE 2 & 3) ---
        if (this.currentState === ExperimentState.WIRE_GRABBED || this.currentState === ExperimentState.IDLE) {
            let closestSample: any = null;
            let minDistance = 0.095; // 9.5 cm radius around the dish center

            for (const sample of this.chemicalSamples) {
                sample.mesh.getWorldPosition(FlameTestLogic._v3);
                const dx = loopWorldPos.x - FlameTestLogic._v3.x;
                const dz = loopWorldPos.z - FlameTestLogic._v3.z;
                const dist2D = Math.sqrt(dx * dx + dz * dz);

                // Require physical dipping contact inside or just above dish
                if (dist2D < minDistance && loopWorldPos.y >= FlameTestLogic._v3.y - 0.04 && loopWorldPos.y <= FlameTestLogic._v3.y + 0.16) {
                    minDistance = dist2D;
                    closestSample = sample;
                }
            }

            if (closestSample && this.currentChemical !== closestSample) {
                const targetSample = this.chemicalSamples[this.currentTargetSaltIndex];

                if (closestSample === targetSample) {
                    // Correct designated target salt dipped!
                    this.currentChemical = closestSample;

                    // Visually change wire tip to white (salt loaded)
                    this.wireGroup.children.forEach(c => {
                        if (c instanceof THREE.Mesh && c.geometry.type === 'TorusGeometry') {
                            (c.material as THREE.MeshStandardMaterial).color.setHex(0xffffff);
                        }
                    });

                    this.audio.playDip(); // Play short clear dip audio effect ONCE
                    this.updateTargetArrowVisibility(); // Hide arrow once correct sample is collected

                    const mysteryLabel = closestSample.mysteryName || `Mystery Salt ${closestSample.letter || ''}`;
                    this.showFeedback(`Sample Collected: ${mysteryLabel}`, loopWorldPos);
                    this.transitionTo(this.isBurnerOn ? ExperimentState.BURNER_ON : ExperimentState.SALT_COLLECTED);
                } else {
                    // Student dipped into a non-target dish: gently guide back to designated target salt
                    const now = Date.now();
                    if (now - this.lastWrongDipFeedbackTime > 1600) {
                        this.lastWrongDipFeedbackTime = now;
                        this.audio.playWrong();
                        const targetLetter = targetSample?.letter || String.fromCharCode(65 + this.currentTargetSaltIndex);
                        this.showFeedback(`Please test Mystery Salt ${targetLetter} first!`, loopWorldPos);
                        this.audio.voice.setNarration(`Follow the 3D arrow to test Mystery Salt ${targetLetter}.`);
                    }
                }
            }
        }

        const realisticFlame = this.bunsenBurner.userData.realisticFlame as RealisticFlame | undefined;
        const flameMesh = this.bunsenBurner.userData.flameMesh as THREE.Mesh;
        const flameLight = this.bunsenBurner.userData.flameLight as THREE.PointLight;
        const flamePos = FlameTestLogic._v3;
        flameMesh.getWorldPosition(flamePos);

        // Flame combustion center is slightly above the burner nozzle rim
        const flameCenter = FlameTestLogic._v2.copy(flamePos).add(new THREE.Vector3(0, 0.055, 0));
        const distToFlame = loopWorldPos.distanceTo(flameCenter);

        // --- STEP 5: BRING WIRE TO FLAME (STRICT STATE & PHYSICAL CONTACT VALIDATION) ---
        if (this.isBurnerOn && (this.currentState === ExperimentState.BURNER_ON || this.currentState === ExperimentState.SALT_COLLECTED)) {
            // Require actual physical overlap between wire loop tip and flame (< 14 cm)
            if (this.currentChemical && distToFlame < 0.14) {
                this.transitionTo(ExperimentState.WIRE_IN_FLAME);
                this.burnTimer = 3.5; // Feature 3: 3.5s observation window
                this.audio.playReaction();
                if (realisticFlame) {
                    realisticFlame.triggerReactionBurst(this.currentChemical.flameColor);
                }
            }
        }

        // --- STEP 6: FLAME COLOR TRANSITION, BLOOM & EMISSION (FEATURE 3) ---
        if (this.currentState === ExperimentState.WIRE_IN_FLAME && this.currentChemical) {
            this.burnTimer -= delta;

            const isWireInFlame = distToFlame < 0.17;
            const bloomProgress = Math.sin(Math.max(0, Math.min(1.0, 1 - (this.burnTimer / 3.5))) * Math.PI); // 0 -> 1 -> 0

            if (realisticFlame) {
                if (isWireInFlame) {
                    realisticFlame.setTargetColor(this.currentChemical.flameColor);
                    realisticFlame.update(delta, true, bloomProgress);
                } else {
                    // Smoothly ease back towards gas blue if wire is removed
                    realisticFlame.resetToDefaultColor();
                    realisticFlame.update(delta, false, 0.0);
                }
            } else if (flameMesh && flameMesh.material) {
                const targetColor = new THREE.Color(this.currentChemical.flameColor);
                if ((flameMesh.material as any).color) (flameMesh.material as any).color.lerp(targetColor, 0.08);
                if (flameLight) flameLight.color.lerp(targetColor, 0.08);
            }

            if (this.burnTimer <= 0) {
                this.transitionTo(ExperimentState.FLAME_RESULT);
                this.showResultPanel(this.currentChemical);
            }
        } else if (this.isBurnerOn) {
            if (realisticFlame) {
                realisticFlame.resetToDefaultColor();
                realisticFlame.update(delta, false, 0.0);
            } else if (flameMesh && flameMesh.material) {
                const defaultColor = new THREE.Color(this.defaultFlameColor);
                if ((flameMesh.material as any).color) (flameMesh.material as any).color.lerp(defaultColor, 0.05);
                if (flameLight) flameLight.color.lerp(defaultColor, 0.05);
            }
        } else {
            if (realisticFlame) {
                realisticFlame.update(delta, false, 0.0);
            }
        }

        // Update floating feedback sprites
        for (let i = this.feedbackSprites.length - 1; i >= 0; i--) {
            const fs = this.feedbackSprites[i];
            fs.timer -= delta;
            fs.sprite.position.y += delta * 0.05;
            fs.sprite.material.opacity = Math.max(0, fs.timer / 2.0);

            if (fs.timer <= 0) {
                this.scene.remove(fs.sprite);
                fs.sprite.material.dispose();
                fs.sprite.material.map?.dispose();
                this.feedbackSprites.splice(i, 1);
            }
        }

        // Update Optional 3D Golden Snitch Easter Egg Lifecycle
        if (this.goldenSnitch) {
            // Appearance opportunity gating:
            // - Must be past ORIENTATION & STARTING modes (student is exploring in the lab)
            // - Must NOT interrupt any voice narration or safety briefing
            // - Occasional carefully timed appearances:
            //   1st: after student has begun exploring (~22s after starting)
            //   2nd / 3rd: after completing a salt test / experiment (cooldown 65s)
            // - Maximum 3 appearances per session, prevents duplicate instances
            if (
                !this.goldenSnitch.isActive() &&
                !this.audio.voice.isSpeaking() &&
                this.snitchAppearanceCount < 3
            ) {
                this.snitchAppearanceTimer += delta;

                const hasCompletedAnySalt = this.completedSalts.size > 0;
                const canSpawnInitial = this.snitchAppearanceCount === 0 && this.snitchAppearanceTimer >= 22.0;
                const canSpawnFollowup = this.snitchAppearanceCount > 0 && this.snitchAppearanceTimer >= 65.0 && (hasCompletedAnySalt || this.currentState === ExperimentState.RESULT_DISPLAY || this.currentState === ExperimentState.IDLE);

                if (canSpawnInitial || canSpawnFollowup) {
                    this.snitchAppearanceTimer = 0;
                    this.snitchAppearanceCount++;
                    // Spawn from high right window airspace
                    this.goldenSnitch.spawn(new THREE.Vector3(1.15, 1.82, -0.95));
                }
            }

            // Provide player head/camera position for comfortable eye-level reading & catch hover
            let camPos: THREE.Vector3 | undefined = undefined;
            if (this.world && (this.world as any).camera) {
                camPos = FlameTestLogic._scratchTargetPos;
                (this.world as any).camera.getWorldPosition(camPos);
            }

            this.goldenSnitch.update(delta, camPos);
        }

        // Update Unified Magical Particle Engine for all 6 golden particle effects
        if (this.magicalParticles) {
            this.magicalParticles.update(delta);
        }

        // Update Temporary Magical Dimension Animation & Transformation Loop
        if (this.magicalDimension && this.magicalDimension.isActive()) {
            this.magicalDimension.update(delta);
        }
    }

    public setLabEnvironment(labLighting: LaboratoryLighting, roomGroup: THREE.Group, _furnitureGroup?: THREE.Group) {
        if (this.magicalDimension) {
            this.magicalDimension.setLabLighting(labLighting);
            this.magicalDimension.setRoomGroup(roomGroup);
        }
    }

    public getMagicalDimension(): MagicalDimension {
        return this.magicalDimension;
    }

    public getEasterEggDimensionState(): EasterEggDimensionState {
        return this.easterEggDimensionState;
    }

    public getGoldenSnitch(): GoldenSnitch {
        return this.goldenSnitch;
    }

    public hasCaughtGoldenSnitch(): boolean {
        return this.hasCaughtSnitch;
    }

    public getHogwartsLetter(): HogwartsLetter | null {
        return this.goldenSnitch ? this.goldenSnitch.getLetter() : null;
    }

    // --- STEP 7: 3D RESULT INFORMATION DISPLAY ON USER'S RIGHT (FEATURE 4) ---
    private showResultPanel(sample: any) {
        this.transitionTo(ExperimentState.RESULT_DISPLAY);
        this.resultUIGroup.visible = false; // Conceal old flat 2D panel

        let camPos = new THREE.Vector3(0, 1.3, 0.7);
        let camDir = new THREE.Vector3(0, 0, -1);
        if (this.world && this.world.camera) {
            (this.world.camera as any).getWorldPosition(camPos);
            (this.world.camera as any).getWorldDirection(camDir);
        }

        // Show Feature 4 3D Result Device on user's right side
        const renderer = (this.world as any).renderer;
        const isPresenting = !!(renderer && renderer.xr && renderer.xr.isPresenting);
        if (this.resultDisplay3D) {
            this.resultDisplay3D.showResult(sample, camPos, camDir, isPresenting);
        }

        this.audio.playCorrect();
        if (sample) {
            // Part 4: Reveal mystery salt identity on 3D stand plaque
            if (typeof sample.revealOnPlaque === 'function') {
                sample.revealOnPlaque();
            }

            // Automatically record observation in 3D Lab Book (Feature 4)
            if (this.labBook) {
                const testNumber = this.completedSalts.size + 1;
                this.labBook.recordObservation(sample, testNumber);
            }

            if (sample.letter) {
                this.completedSalts.add(sample.letter);
            }

            // Part 5: Announce observed flame color followed by "Your mystery salt has been identified."
            this.audio.voice.narrateObservationAndIdentify(sample.flameName || sample.formula || sample.name);
        }
    }

    // --- STEP 8: COMPLETE EXPERIMENT RESET ---
    public resetExperiment() {
        if (!this.wireGroup) return;

        this.resultUIGroup.visible = false;
        if (this.resultDisplay3D) {
            this.resultDisplay3D.hide();
        }
        this.releaseBtnGroup.visible = false;
        this.isWireGrabbedVR = false;
        this.isVRGrabOffsetInitialized = false;
        this.isSqueezeHolding = false;
        this.grabbingVRHandIndex = -1;
        this.isHeldDesktop = false;
        if (this.onReleaseCallback) this.onReleaseCallback();

        // Restore original tracked-hand appearance upon full experiment reset
        this.unequipGloves();

        this.currentChemical = null;
        this.hasNarratedBurnerStage = false; // Reset burner narration flag for subsequent test
        this.audio.voice.narrateCleanWire();

        // Turn burner OFF
        if (this.isBurnerOn) {
            this.toggleBurner();
        }

        // Reset wire loop mesh color back to metallic chrome
        this.wireGroup.children.forEach(c => {
            if (c instanceof THREE.Mesh && c.geometry.type === 'TorusGeometry') {
                (c.material as THREE.MeshStandardMaterial).color.setHex(0xcccccc);
            }
        });

        // Teleport wire back to initial rest stand position
        if (this.wireGroup.userData.initialPosition) {
            this.wireGroup.position.copy(this.wireGroup.userData.initialPosition);
            this.wireGroup.quaternion.copy(this.wireGroup.userData.initialQuaternion);
        }

        // Reset multi-salt challenge progression (Feature 2)
        this.currentTargetSaltIndex = 0;
        this.completedSalts.clear();

        // Reset all sample plaques back to neutral mystery state
        this.chemicalSamples.forEach(s => {
            if (typeof s.resetPlaque === 'function') {
                s.resetPlaque();
            }
        });

        // Clear 3D Lab Book records (explicit user reset - Feature 4)
        if (this.labBook) {
            this.labBook.resetRecords();
        }

        this.updateTargetArrowPosition();
        this.updateTargetArrowVisibility();

        // Reset State Machine back to IDLE
        this.transitionTo(ExperimentState.IDLE);
    }

    public getLabBook(): LabBook3D {
        return this.labBook;
    }

    private showFeedback(text: string, position: THREE.Vector3) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 64;
        const ctx = canvas.getContext('2d')!;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, 512, 64);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 256, 32);

        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
        const sprite = new THREE.Sprite(mat);

        sprite.position.copy(position);
        sprite.position.y += 0.05;
        sprite.scale.set(0.4, 0.05, 1);

        this.scene.add(sprite);
        this.feedbackSprites.push({ sprite, timer: 2.0 });
    }

    public handleKey(key: string) {
        const k = key.toLowerCase();
        if (k === 'l') {
            this.toggleBurner();
        } else if (k === 'r') {
            this.resetExperiment();
        } else if (k === 'x') {
            this.triggerExitVR();
        } else if (k === 'h') {
            if (this.goldenSnitch) {
                this.goldenSnitch.spawn();
            }
        }
    }
}
