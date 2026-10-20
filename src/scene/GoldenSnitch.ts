import * as THREE from 'three';
import { HogwartsLetter } from './HogwartsLetter';
import { AudioEngine } from '../audio/AudioEngine';
import { MagicalParticleSystem } from './MagicalParticleSystem';

export type SnitchState = 'HIDDEN' | 'ENTERING' | 'HOVERING' | 'DODGING' | 'RECOVERING' | 'CAUGHT' | 'PRESENTING_LETTER' | 'DEPARTING';

export interface SnitchCallbacks {
    scene?: THREE.Scene;
    audio?: AudioEngine;
    particles?: MagicalParticleSystem;
    onCatch?: () => void;
    onDepart?: () => void;
    onLetterClose?: () => void;
}

/**
 * GoldenSnitch — Authentic 3D Quidditch Golden Snitch Easter Egg for LABVERSE.
 * - Genuine 3D metallic sphere with Quidditch filigree seam rings.
 * - Two articulated feather-like wings with independent high-frequency flutter.
 * - Restrained golden particle spark trail.
 * - Playful, natural creature flight kinematics with curiosity pauses and dodge behavior.
 * - Releases the 3D Hogwarts Letter with wax seal and magical message upon catch.
 * - Desktop raycasting and Meta Quest VR near-field finger poke & pinch detection.
 * - 100% optional, non-intrusive, zero interference with Flame Test experiment state machine.
 */
export class GoldenSnitch {
    public group: THREE.Group;
    public bodyGroup: THREE.Group;
    public leftWingGroup: THREE.Group;
    public rightWingGroup: THREE.Group;

    // 3D Hogwarts Letter
    private letter: HogwartsLetter | null = null;

    // Materials
    private bodyMaterial: THREE.MeshPhysicalMaterial;
    private seamMaterial: THREE.MeshStandardMaterial;
    private wingMaterial: THREE.MeshStandardMaterial;
    private shaftMaterial: THREE.MeshStandardMaterial;

    // Light
    private snitchLight: THREE.PointLight;

    // State Machine
    private state: SnitchState = 'HIDDEN';
    private stateTimer = 0;
    private flightTime = 0;
    private hasDodged = false;
    private hasTriggeredCatchCallback = false;
    private hasTriggeredGather = false;

    // Flight Positions & Motion
    private currentPos = new THREE.Vector3(0, 1.35, -0.55);
    private targetPos = new THREE.Vector3(0, 1.35, -0.55);
    private baseCenter = new THREE.Vector3(0, 1.32, -0.55);

    // Callbacks
    private callbacks: SnitchCallbacks;

    // Interaction Hit Testing
    private hitSphereRadius = 0.14; // Comfortable 14cm grab/poke radius around 2.4cm body
    private hitSphereCenter = new THREE.Vector3();

    // Reusable Scratch Objects (Zero GC in XR loop)
    private static _scratchV1 = new THREE.Vector3();

    constructor(callbacks: SnitchCallbacks = {}) {
        this.callbacks = callbacks;
        this.group = new THREE.Group();
        this.group.name = 'GoldenSnitch';
        this.group.visible = false;
        (this.group as any).userData = { isGoldenSnitch: true };

        // Instantiate 3D Hogwarts Letter if audio is provided
        if (this.callbacks.audio) {
            this.letter = new HogwartsLetter(this.callbacks.audio, {
                onDismissed: () => {
                    if (this.callbacks.onLetterClose) {
                        this.callbacks.onLetterClose();
                    }
                    if (this.state === 'PRESENTING_LETTER') {
                        this.depart();
                    }
                }
            }, this.callbacks.particles);
            if (this.callbacks.scene) {
                this.callbacks.scene.add(this.letter.group);
            } else {
                this.group.add(this.letter.group);
            }
        }

        // --- 1. MATERIALS ---
        // Polished Quidditch Gold with subtle reflections & clearcoat
        this.bodyMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffd700,
            emissive: 0x3d2800,
            metalness: 0.94,
            roughness: 0.14,
            clearcoat: 0.85,
            clearcoatRoughness: 0.1,
            reflectivity: 0.95
        });

        // Delicate engraved filigree meridian seams
        this.seamMaterial = new THREE.MeshStandardMaterial({
            color: 0xd4af37,
            metalness: 0.88,
            roughness: 0.28
        });

        // Translucent golden feather vanes with dual-sided rendering
        this.wingMaterial = new THREE.MeshStandardMaterial({
            color: 0xfff5c0,
            emissive: 0x332600,
            metalness: 0.82,
            roughness: 0.25,
            transparent: true,
            opacity: 0.88,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        // Feather spine / rachis
        this.shaftMaterial = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 0.92,
            roughness: 0.2
        });

        // --- 2. GOLDEN SPHERE BODY ---
        this.bodyGroup = new THREE.Group();
        this.bodyGroup.name = 'SnitchBodyGroup';

        // 2.4cm sphere body (authentic walnut scale)
        const bodyGeo = new THREE.SphereGeometry(0.024, 32, 32);
        const bodyMesh = new THREE.Mesh(bodyGeo, this.bodyMaterial);
        bodyMesh.castShadow = true;
        bodyMesh.receiveShadow = true;
        bodyMesh.userData = { isGoldenSnitch: true, isSnitchBody: true };
        this.bodyGroup.add(bodyMesh);

        // Engraved Quidditch orbital seam rings (flesh memory arcs)
        const seamGeo1 = new THREE.TorusGeometry(0.0241, 0.00065, 8, 36);
        const seam1 = new THREE.Mesh(seamGeo1, this.seamMaterial);
        seam1.rotation.x = Math.PI / 4;
        seam1.rotation.y = Math.PI / 6;
        this.bodyGroup.add(seam1);

        const seamGeo2 = new THREE.TorusGeometry(0.0241, 0.00065, 8, 36);
        const seam2 = new THREE.Mesh(seamGeo2, this.seamMaterial);
        seam2.rotation.x = -Math.PI / 4;
        seam2.rotation.z = Math.PI / 5;
        this.bodyGroup.add(seam2);

        // Circular wing socket bevel plates
        const socketGeo = new THREE.CylinderGeometry(0.0042, 0.0042, 0.002, 16);
        const leftSocket = new THREE.Mesh(socketGeo, this.seamMaterial);
        leftSocket.position.set(-0.0232, 0.003, 0);
        leftSocket.rotation.z = Math.PI / 2;
        this.bodyGroup.add(leftSocket);

        const rightSocket = new THREE.Mesh(socketGeo, this.seamMaterial);
        rightSocket.position.set(0.0232, 0.003, 0);
        rightSocket.rotation.z = -Math.PI / 2;
        this.bodyGroup.add(rightSocket);

        this.group.add(this.bodyGroup);

        // --- 3. ARTICULATED FEATHER WINGS ---
        this.leftWingGroup = this.createDetailedWing(false);
        this.leftWingGroup.position.set(-0.024, 0.004, 0);
        this.group.add(this.leftWingGroup);

        this.rightWingGroup = this.createDetailedWing(true);
        this.rightWingGroup.position.set(0.024, 0.004, 0);
        this.group.add(this.rightWingGroup);

        // --- 4. GENTLE GOLDEN POINT LIGHT ---
        this.snitchLight = new THREE.PointLight(0xffdf80, 0.55, 0.85);
        this.snitchLight.position.set(0, 0, 0);
        this.group.add(this.snitchLight);

        // Position initial group
        this.group.position.copy(this.currentPos);
    }

    /**
     * Constructs a realistic feather-like golden wing with central rachis and notched vane ribs.
     */
    private createDetailedWing(isRight: boolean): THREE.Group {
        const wingGroup = new THREE.Group();
        wingGroup.name = isRight ? 'RightWingGroup' : 'LeftWingGroup';

        const dir = isRight ? 1 : -1;

        // Central wing spine (rachis)
        const spineCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(dir * 0.03, 0.008, 0.004),
            new THREE.Vector3(dir * 0.065, 0.015, -0.002),
            new THREE.Vector3(dir * 0.095, 0.018, -0.010)
        ]);
        const spineGeo = new THREE.TubeGeometry(spineCurve, 16, 0.0009, 6, false);
        const spineMesh = new THREE.Mesh(spineGeo, this.shaftMaterial);
        spineMesh.userData = { isGoldenSnitch: true };
        wingGroup.add(spineMesh);

        // Realistic multi-layered feather vanes (3 tiered delicate feather blades)
        const vaneSegments = [
            { startLen: 0.015, endLen: 0.050, width: 0.014, zTilt: 0.003 },
            { startLen: 0.040, endLen: 0.078, width: 0.016, zTilt: -0.002 },
            { startLen: 0.065, endLen: 0.098, width: 0.011, zTilt: -0.006 }
        ];

        vaneSegments.forEach((seg, idx) => {
            const shape = new THREE.Shape();
            const sX = dir * seg.startLen;
            const eX = dir * seg.endLen;
            const mX = (sX + eX) * 0.5;

            shape.moveTo(sX, 0.004);
            // Curving feather leading edge
            shape.quadraticCurveTo(mX, 0.014, eX, 0.018);
            // Curving feather trailing edge with gentle barb contour
            shape.quadraticCurveTo(mX, 0.004 - seg.width, sX, 0.002);
            shape.closePath();

            const vaneGeo = new THREE.ShapeGeometry(shape);
            const vaneMesh = new THREE.Mesh(vaneGeo, this.wingMaterial);
            vaneMesh.position.z = seg.zTilt;
            vaneMesh.userData = { isGoldenSnitch: true };
            vaneMesh.name = `WingVane_${idx}`;
            wingGroup.add(vaneMesh);
        });

        return wingGroup;
    }

    /**
     * Spawns the Golden Snitch into the laboratory from a safe, peripheral approach.
     */
    public spawn(originPos?: THREE.Vector3) {
        if (this.state !== 'HIDDEN') return;

        this.hasDodged = false;
        this.hasTriggeredCatchCallback = false;
        this.state = 'ENTERING';
        this.stateTimer = 0;
        this.flightTime = 0;

        // Start off to the high side of the workstation (e.g. near right window or wall)
        if (originPos) {
            this.currentPos.copy(originPos);
        } else {
            this.currentPos.set(1.1, 1.85, -0.9);
        }

        // Target: gentle hovering pocket above front right of desk (reachable, non-obstructing)
        this.targetPos.set(0.42, 1.34, -0.55);
        this.group.position.copy(this.currentPos);
        this.group.visible = true;
        this.hasTriggeredGather = false;
    }

    /**
     * Returns true if the Snitch is currently active in the scene.
     */
    public isActive(): boolean {
        return this.state !== 'HIDDEN';
    }

    /**
     * Returns current state machine phase.
     */
    public getState(): SnitchState {
        return this.state;
    }

    /**
     * Main update loop called every frame by the laboratory logic engine.
     */
    public update(delta: number, playerHeadPos?: THREE.Vector3) {
        if (this.state === 'HIDDEN') return;

        this.stateTimer += delta;
        this.flightTime += delta;

        // 1. STATE MACHINE EXECUTION
        switch (this.state) {
            case 'ENTERING':
                this.updateEntering(delta);
                break;
            case 'HOVERING':
                this.updateHovering(delta, playerHeadPos);
                break;
            case 'DODGING':
                this.updateDodging(delta);
                break;
            case 'RECOVERING':
                this.updateRecovering(delta);
                break;
            case 'CAUGHT':
                this.updateCaught(delta, playerHeadPos);
                break;
            case 'PRESENTING_LETTER':
                this.updatePresentingLetter(delta, playerHeadPos);
                break;
            case 'DEPARTING':
                this.updateDeparting(delta);
                break;
        }

        // 2. WING FLUTTER ANIMATION
        this.animateWings(delta);

        // 3. FLIGHT PARTICLE TRAIL (WORLD SPACE)
        if (this.state !== 'CAUGHT' && this.state !== 'PRESENTING_LETTER' && this.callbacks.particles && Math.random() < 0.42) {
            this.group.getWorldPosition(this.hitSphereCenter);
            this.callbacks.particles.emitSnitchTrail(this.hitSphereCenter, 1);
        }

        // 4. POSITION & BANKING SYNCHRONIZATION
        this.group.position.copy(this.currentPos);
        this.group.getWorldPosition(this.hitSphereCenter);
    }

    /**
     * Entering: Swoops smoothly into reachable laboratory workstation airspace.
     */
    private updateEntering(_delta: number) {
        const t = Math.min(1.0, this.stateTimer / 2.4);
        // Smooth ease-out cubic interpolation
        const ease = 1.0 - Math.pow(1.0 - t, 3);

        this.currentPos.lerp(this.targetPos, ease * 0.08 + 0.02);

        // Subtle flight bob
        this.currentPos.y += Math.sin(this.flightTime * 6) * 0.0015;

        if (this.currentPos.distanceTo(this.targetPos) < 0.08 || this.stateTimer > 3.0) {
            this.state = 'HOVERING';
            this.stateTimer = 0;
        }
    }

    /**
     * Hovering: Natural playful creature hovering around reachable desk perimeter.
     * Subtle curiosity pauses and gentle harmonic figure-8 drifts.
     */
    private updateHovering(delta: number, _playerHeadPos?: THREE.Vector3) {
        // If student ignores it for > 20 seconds, depart gracefully without interrupting
        if (this.stateTimer > 20.0) {
            this.depart();
            return;
        }

        // Harmonic playful flight around base reach zone
        // Stays within safe bounds: x in [-0.55, 0.55], y in [1.22, 1.44], z in [-0.45, -0.68]
        // Never obstructs burner at (0.18, 0.95, -0.45) or salts at (-0.25, 0.95, -0.45)
        const t = this.flightTime;
        const hoverX = Math.sin(t * 0.9) * 0.32 + Math.cos(t * 1.7) * 0.12;
        const hoverY = Math.sin(t * 2.2) * 0.06 + Math.cos(t * 0.8) * 0.03;
        const hoverZ = Math.cos(t * 0.7) * 0.12 + Math.sin(t * 1.4) * 0.05;

        this.targetPos.set(
            this.baseCenter.x + hoverX,
            this.baseCenter.y + hoverY,
            this.baseCenter.z + hoverZ
        );

        // Smooth follow
        this.currentPos.lerp(this.targetPos, delta * 3.2);

        // Bank body in direction of motion
        const velX = (this.targetPos.x - this.currentPos.x) * 4.0;
        const velZ = (this.targetPos.z - this.currentPos.z) * 4.0;
        this.bodyGroup.rotation.z = -velX * 0.8;
        this.bodyGroup.rotation.x = velZ * 0.8;
        this.bodyGroup.rotation.y = Math.sin(t * 1.5) * 0.25;
    }

    /**
     * Dodging: Playful quick dart when first approached, demonstrating creature intelligence.
     */
    private updateDodging(delta: number) {
        // Smooth quick dart
        this.currentPos.lerp(this.targetPos, delta * 7.5);

        // Extreme flutter and banking during dart
        this.bodyGroup.rotation.z = Math.sin(this.stateTimer * 20) * 0.45;
        this.bodyGroup.rotation.x = Math.cos(this.stateTimer * 20) * 0.35;

        if (this.stateTimer > 0.65) {
            this.state = 'RECOVERING';
            this.stateTimer = 0;
            // Target settles back to a reachable, steady hover position right in front of user
            this.targetPos.set(0.15, 1.32, -0.52);
        }
    }

    /**
     * Recovering: Returns smoothly to easy reachable hover pocket after playful dodge.
     */
    private updateRecovering(delta: number) {
        this.currentPos.lerp(this.targetPos, delta * 3.5);
        this.bodyGroup.rotation.z = THREE.MathUtils.lerp(this.bodyGroup.rotation.z, 0, delta * 4);
        this.bodyGroup.rotation.x = THREE.MathUtils.lerp(this.bodyGroup.rotation.x, 0, delta * 4);

        if (this.currentPos.distanceTo(this.targetPos) < 0.05 || this.stateTimer > 1.8) {
            this.state = 'HOVERING';
            this.stateTimer = 0;
            this.baseCenter.set(0.12, 1.32, -0.52);
        }
    }

    /**
     * Caught: Magical reveal sequence.
     * Hovers stably in front of student, wings spread wide with gentle shimmer, golden burst.
     */
    private updateCaught(delta: number, playerHeadPos?: THREE.Vector3) {
        // Smoothly settle at comfortable eye-level reading distance
        if (playerHeadPos) {
            GoldenSnitch._scratchV1.copy(playerHeadPos);
            GoldenSnitch._scratchV1.z -= 0.62; // 62cm in front of headset
            GoldenSnitch._scratchV1.y = Math.max(1.25, playerHeadPos.y - 0.05);
            this.currentPos.lerp(GoldenSnitch._scratchV1, delta * 4.5);
        }

        // Gentle upright breathing bob
        this.currentPos.y += Math.sin(this.flightTime * 4) * 0.0008;
        this.bodyGroup.rotation.set(0, Math.sin(this.flightTime * 2) * 0.15, 0);

        // Sequence A-H: Snitch pauses, wings spread wide, chime plays, particles spiral, dimension transforms, Snitch speaks
        if (!this.hasTriggeredCatchCallback) {
            this.hasTriggeredCatchCallback = true;
            this.group.getWorldPosition(this.hitSphereCenter);
            // Effect A: Visible burst of champagne-gold particles emerging from Snitch
            if (this.callbacks.particles) {
                this.callbacks.particles.triggerSnitchCatchBurst(this.hitSphereCenter);
            }
            if (this.callbacks.audio) {
                this.callbacks.audio.playSnitchMagicalChime();
            }
            if (this.callbacks.onCatch) {
                this.callbacks.onCatch();
            }
            if (this.callbacks.audio?.voice) {
                this.callbacks.audio.voice.narrateSnitchCaught();
            }
        }

        // Effect C: Inward gathering particles around magical ring before letter emerges
        if (this.stateTimer > 1.6 && !this.hasTriggeredGather) {
            this.hasTriggeredGather = true;
            if (this.callbacks.particles) {
                this.group.getWorldPosition(this.hitSphereCenter);
                this.callbacks.particles.triggerLetterGather(this.hitSphereCenter);
            }
        }

        // After 2.4s of dimension transformation and voice line, release the 3D Hogwarts Letter
        if (this.stateTimer > 2.4) {
            if (this.letter) {
                this.state = 'PRESENTING_LETTER';
                this.stateTimer = 0;
                this.letter.emerge(this.group.position, playerHeadPos);
            } else if (this.stateTimer > 3.6) {
                this.depart();
            }
        }
    }

    /**
     * Presenting Letter: Snitch hovers gracefully above and slightly to the side of the floating letter.
     */
    private updatePresentingLetter(delta: number, playerHeadPos?: THREE.Vector3) {
        if (this.letter && this.letter.isActive()) {
            this.letter.update(delta, playerHeadPos);

            // Snitch hovers gracefully ~18cm above and 20cm to the right of the letter
            if (playerHeadPos) {
                GoldenSnitch._scratchV1.copy(playerHeadPos);
                GoldenSnitch._scratchV1.z -= 0.62;
                GoldenSnitch._scratchV1.y = Math.max(1.42, playerHeadPos.y + 0.18);
                GoldenSnitch._scratchV1.x += 0.20;
                this.currentPos.lerp(GoldenSnitch._scratchV1, delta * 3.0);
            }
            this.currentPos.y += Math.sin(this.flightTime * 3) * 0.0006;
            this.bodyGroup.rotation.y = Math.sin(this.flightTime * 1.5) * 0.25 - 0.2;
        } else {
            // Letter reading finished & dismissed -> Snitch departs!
            this.depart();
        }
    }

    /**
     * Departing: Short, joyful exit animation (curved upward loop towards ceiling).
     */
    private updateDeparting(delta: number) {
        // Exit target: high skylight / ventilation duct in ceiling
        this.targetPos.set(0.6, 3.4, -2.4);
        this.currentPos.lerp(this.targetPos, delta * 2.2);

        // Accelerate wings & spiral tilt
        this.bodyGroup.rotation.y += delta * 12.0;
        this.bodyGroup.rotation.z = 0.35;

        // Fade light
        this.snitchLight.intensity = Math.max(0, this.snitchLight.intensity - delta * 0.5);

        // When high enough, cleanly deactivate
        if (this.currentPos.y > 2.8 || this.stateTimer > 3.0) {
            this.hide();
            if (this.callbacks.onDepart) {
                this.callbacks.onDepart();
            }
        }
    }

    /**
     * Animates independent wing fluttering matching the current state.
     */
    private animateWings(_delta: number) {
        let flutterFreq = 50;
        let flutterAmp = 0.65;
        let baseRoll = 0.25;

        if (this.state === 'DODGING') {
            flutterFreq = 65;
            flutterAmp = 0.85;
        } else if (this.state === 'CAUGHT') {
            // Elegant spread wings with slow gentle shimmer
            flutterFreq = 10;
            flutterAmp = 0.14;
            baseRoll = 0.58; // Spread wide open
        } else if (this.state === 'PRESENTING_LETTER') {
            // Proud, gentle hovering wings while guarding the floating letter
            flutterFreq = 16;
            flutterAmp = 0.18;
            baseRoll = 0.45;
        } else if (this.state === 'HOVERING') {
            flutterFreq = 42;
            flutterAmp = 0.55;
            baseRoll = 0.30;
        }

        const flutter = Math.sin(this.flightTime * flutterFreq) * flutterAmp;
        const wave = Math.cos(this.flightTime * flutterFreq) * (flutterAmp * 0.3);

        // Left Wing
        this.leftWingGroup.rotation.z = baseRoll + flutter;
        this.leftWingGroup.rotation.x = wave;
        this.leftWingGroup.rotation.y = Math.sin(this.flightTime * 15) * 0.15;

        // Right Wing (mirrored)
        this.rightWingGroup.rotation.z = -baseRoll - flutter;
        this.rightWingGroup.rotation.x = wave;
        this.rightWingGroup.rotation.y = -Math.sin(this.flightTime * 15) * 0.15;
    }

    /**
     * Interacts with the Snitch (Triggered via Desktop click or VR poke/pinch).
     * Returns true if interaction succeeded.
     */
    public interact(hitObj?: THREE.Object3D): boolean {
        // If letter is presenting, clicking interacts with the letter (handles control buttons)
        if (this.state === 'PRESENTING_LETTER' && this.letter && this.letter.isActive()) {
            return this.letter.interact(hitObj);
        }

        if (this.state === 'HIDDEN' || this.state === 'CAUGHT' || this.state === 'DEPARTING') {
            return false;
        }

        // On first approach: playfully dodge once to feel alive!
        if (!this.hasDodged && (this.state === 'HOVERING' || this.state === 'ENTERING')) {
            this.triggerDodge();
            return false; // Dodged, not caught yet
        }

        // Catch the Snitch!
        this.state = 'CAUGHT';
        this.stateTimer = 0;
        return true;
    }

    /**
     * Triggers a playful, agile evasion dodge.
     */
    public triggerDodge() {
        this.hasDodged = true;
        this.state = 'DODGING';
        this.stateTimer = 0;

        // Quick dart ~28cm upward and slightly right/left
        const dartDirX = this.currentPos.x >= 0 ? -0.26 : 0.26;
        this.targetPos.set(
            this.currentPos.x + dartDirX,
            this.currentPos.y + 0.18,
            this.currentPos.z + 0.12
        );
    }

    /**
     * Smoothly departs the lab scene.
     */
    public depart() {
        if (this.state === 'DEPARTING' || this.state === 'HIDDEN') return;
        if (this.letter && this.letter.isActive()) {
            this.letter.closeAndDismiss();
        }
        this.state = 'DEPARTING';
        this.stateTimer = 0;
    }

    /**
     * Immediately hides and cleans up the Snitch without residual colliders.
     */
    public hide() {
        this.state = 'HIDDEN';
        this.stateTimer = 0;
        this.group.visible = false;
        this.snitchLight.intensity = 0.55;
        if (this.letter) {
            this.letter.hide();
        }
    }

    /**
     * VR Fingertip Poke / Hand Proximity collision check.
     * Returns true if poked and caught.
     */
    public checkPokeAndInteract(pokeWorldPos: THREE.Vector3): boolean {
        // If letter is active, check letter poke first
        if (this.state === 'PRESENTING_LETTER' && this.letter && this.letter.isActive()) {
            if (this.letter.checkPokeAndInteract(pokeWorldPos)) {
                return true;
            }
        }

        if (this.state === 'HIDDEN' || this.state === 'CAUGHT' || this.state === 'DEPARTING') {
            return false;
        }

        this.group.getWorldPosition(this.hitSphereCenter);
        const dist = pokeWorldPos.distanceTo(this.hitSphereCenter);

        // Near-approach dodge trigger (within 24cm)
        if (!this.hasDodged && dist < 0.24) {
            this.triggerDodge();
            return false;
        }

        // Direct catch radius (within 14cm)
        if (dist <= this.hitSphereRadius) {
            return this.interact();
        }

        return false;
    }

    /**
     * Desktop / VR Raycaster Hit Check.
     */
    public isHitByObject(hitObj: THREE.Object3D): boolean {
        if (this.letter && this.letter.isActive() && this.letter.isHitByObject(hitObj)) {
            return true;
        }

        let cur: THREE.Object3D | null = hitObj;
        while (cur) {
            if (cur === this.group || cur === this.bodyGroup || cur.userData?.isGoldenSnitch) {
                return true;
            }
            cur = cur.parent;
        }
        return false;
    }

    /**
     * Disposes geometry and materials cleanly on room unload.
     */
    public dispose() {
        this.hide();
        this.bodyMaterial.dispose();
        this.seamMaterial.dispose();
        this.wingMaterial.dispose();
        this.shaftMaterial.dispose();
        if (this.letter) {
            this.letter.dispose();
        }
    }

    public getLetter(): HogwartsLetter | null {
        return this.letter;
    }
}
