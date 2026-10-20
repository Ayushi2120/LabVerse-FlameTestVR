import * as THREE from 'three';
import { VoiceEngine } from '../audio/VoiceEngine';
import { AudioEngine } from '../audio/AudioEngine';

export class SaltCharacter {
    public group: THREE.Group;
    private voice: VoiceEngine;
    private audio: AudioEngine;
    
    // Meshes
    private bodyMesh: THREE.Mesh;
    private leftEye: THREE.Mesh;
    private rightEye: THREE.Mesh;
    private leftArm: THREE.Mesh;
    private rightArm: THREE.Mesh;
    private leftLeg: THREE.Mesh;
    private rightLeg: THREE.Mesh;
    private pointerArrow: THREE.Group;
    private speechBubble: THREE.Sprite;
    private speechBubbleTex: THREE.CanvasTexture;

    // Animation state
    private isVisible = false;
    private state: 'hidden' | 'emerging' | 'walking' | 'pointing' | 'celebrating' | 'shrinking' = 'hidden';
    private animTimer = 0;
    private walkProgress = 0;
    private startPos = new THREE.Vector3();
    private targetPos = new THREE.Vector3(-1.05, 0.88, -0.48); // Gloves position
    private currentPos = new THREE.Vector3();

    constructor(scene: THREE.Scene, voice: VoiceEngine, audio: AudioEngine) {
        this.voice = voice;
        this.audio = audio;
        this.group = new THREE.Group();
        this.group.name = 'SaltCharacterGroup';
        this.group.visible = false;
        this.group.userData = { isSaltCharacter: true };

        // --- 1. CRYSTAL BODY (Faceted translucent Halite / Salt crystal) ---
        const bodyGeo = new THREE.BoxGeometry(0.065, 0.075, 0.065);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.15,
            metalness: 0.1,
            transparent: true,
            opacity: 0.92,
            emissive: 0x88ccff,
            emissiveIntensity: 0.35,
        });
        this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        this.bodyMesh.position.y = 0.045;
        this.group.add(this.bodyMesh);

        // Crystal bevel corners for mineral look
        const topGeo = new THREE.OctahedronGeometry(0.038, 0);
        const topCrystal = new THREE.Mesh(topGeo, bodyMat);
        topCrystal.position.y = 0.048;
        topCrystal.rotation.y = Math.PI / 4;
        this.bodyMesh.add(topCrystal);

        // --- 2. EXPRESSIVE EYES ---
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x112233 });
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
        const eyeGeo = new THREE.SphereGeometry(0.007, 12, 12);
        const pupilGeo = new THREE.SphereGeometry(0.003, 8, 8);

        this.leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        this.leftEye.position.set(-0.016, 0.015, 0.034);
        const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
        leftPupil.position.set(0.001, 0.001, 0.005);
        this.leftEye.add(leftPupil);
        this.bodyMesh.add(this.leftEye);

        this.rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        this.rightEye.position.set(0.016, 0.015, 0.034);
        const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
        rightPupil.position.set(-0.001, 0.001, 0.005);
        this.rightEye.add(rightPupil);
        this.bodyMesh.add(this.rightEye);

        // Smile
        const smileGeo = new THREE.TorusGeometry(0.008, 0.0018, 8, 16, Math.PI);
        const smileMat = new THREE.MeshBasicMaterial({ color: 0x224466 });
        const smile = new THREE.Mesh(smileGeo, smileMat);
        smile.position.set(0, -0.008, 0.034);
        smile.rotation.z = Math.PI;
        this.bodyMesh.add(smile);

        // --- 3. ARMS ---
        const limbMat = new THREE.MeshStandardMaterial({ color: 0xe0f2fe, roughness: 0.3 });
        const armGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.04, 8);

        this.leftArm = new THREE.Mesh(armGeo, limbMat);
        this.leftArm.position.set(-0.042, 0.01, 0);
        this.leftArm.rotation.z = Math.PI / 4;
        this.bodyMesh.add(this.leftArm);

        this.rightArm = new THREE.Mesh(armGeo, limbMat);
        this.rightArm.position.set(0.042, 0.01, 0);
        this.rightArm.rotation.z = -Math.PI / 4;
        this.bodyMesh.add(this.rightArm);

        // --- 4. LEGS ---
        const legGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.035, 8);
        this.leftLeg = new THREE.Mesh(legGeo, limbMat);
        this.leftLeg.position.set(-0.018, -0.04, 0);
        this.bodyMesh.add(this.leftLeg);

        this.rightLeg = new THREE.Mesh(legGeo, limbMat);
        this.rightLeg.position.set(0.018, -0.04, 0);
        this.bodyMesh.add(this.rightLeg);

        // --- 5. POINTER ARROW (Points toward gloves) ---
        this.pointerArrow = new THREE.Group();
        const arrowShaft = new THREE.Mesh(
            new THREE.CylinderGeometry(0.006, 0.006, 0.08, 8),
            new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x0099cc })
        );
        arrowShaft.rotation.z = -Math.PI / 2;
        this.pointerArrow.add(arrowShaft);

        const arrowHead = new THREE.Mesh(
            new THREE.ConeGeometry(0.016, 0.04, 8),
            new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x00bbee })
        );
        arrowHead.position.set(-0.05, 0, 0);
        arrowHead.rotation.z = Math.PI / 2;
        this.pointerArrow.add(arrowHead);

        this.pointerArrow.position.set(-0.10, 0.08, 0);
        this.pointerArrow.visible = false;
        this.bodyMesh.add(this.pointerArrow);

        // --- 6. 3D SPEECH BUBBLE SPRITE ---
        const bubbleCanvas = document.createElement('canvas');
        bubbleCanvas.width = 512;
        bubbleCanvas.height = 160;
        this.speechBubbleTex = new THREE.CanvasTexture(bubbleCanvas);
        this.speechBubble = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.speechBubbleTex, transparent: true }));
        this.speechBubble.scale.set(0.35, 0.11, 1);
        this.speechBubble.position.set(0, 0.16, 0);
        this.speechBubble.visible = false;
        this.bodyMesh.add(this.speechBubble);

        scene.add(this.group);
    }

    private updateSpeechBubble(text: string) {
        const canvas = this.speechBubbleTex.image as HTMLCanvasElement;
        const ctx = canvas.getContext('2d')!;
        ctx.clearRect(0, 0, 512, 160);

        // Rounded speech bubble background
        ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
        ctx.beginPath();
        ctx.roundRect(10, 10, 492, 120, 18);
        ctx.fill();

        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Little speech tail
        ctx.beginPath();
        ctx.moveTo(240, 130);
        ctx.lineTo(256, 155);
        ctx.lineTo(272, 130);
        ctx.closePath();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
        ctx.fill();
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Word wrap
        const words = text.split(' ');
        let line1 = '';
        let line2 = '';
        for (const w of words) {
            if ((line1 + w).length < 28) {
                line1 += (line1 ? ' ' : '') + w;
            } else {
                line2 += (line2 ? ' ' : '') + w;
            }
        }

        if (line2) {
            ctx.fillText(line1, 256, 52);
            ctx.fillText(line2, 256, 88);
        } else {
            ctx.fillText(line1, 256, 70);
        }

        this.speechBubbleTex.needsUpdate = true;
        this.speechBubble.visible = true;
    }

    public warnUserAndPoint(fromPosition: THREE.Vector3) {
        if (this.isVisible && this.state !== 'hidden') return;

        this.isVisible = true;
        this.state = 'emerging';
        this.animTimer = 0;
        this.walkProgress = 0;

        this.startPos.copy(fromPosition);
        this.startPos.y = 0.88; // Tabletop height
        this.currentPos.copy(this.startPos);

        this.group.position.copy(this.currentPos);
        this.group.scale.set(0.01, 0.01, 0.01);
        this.group.visible = true;
        this.pointerArrow.visible = false;
        this.speechBubble.visible = false;

        this.updateSpeechBubble("Whoa! Safety first, Chemist! We need gloves!");
        this.voice.speak('glovesNeeded', 'high');
        this.audio.playBlip();
    }

    public onGlovesEquipped() {
        if (!this.isVisible) return;
        this.state = 'celebrating';
        this.animTimer = 0;
        this.pointerArrow.visible = false;
        this.updateSpeechBubble("Perfect! Now we're ready.");
        this.voice.speak('glovesOn', 'high');
        this.audio.playGrab();
    }

    public dismiss() {
        if (!this.isVisible) return;
        this.state = 'shrinking';
        this.animTimer = 0;
        this.speechBubble.visible = false;
        this.pointerArrow.visible = false;
    }

    public isCharacterActive(): boolean {
        return this.isVisible && this.state !== 'hidden';
    }

    public update(delta: number) {
        if (!this.isVisible || this.state === 'hidden') return;

        this.animTimer += delta;

        // Blinking
        const blinkPhase = Math.sin(this.animTimer * 2.5);
        this.leftEye.scale.y = blinkPhase > 0.95 ? 0.1 : 1;
        this.rightEye.scale.y = blinkPhase > 0.95 ? 0.1 : 1;

        switch (this.state) {
            case 'emerging': {
                // Spring emergence from dish
                const t = Math.min(1, this.animTimer / 0.6);
                const s = 1.0 + Math.sin(t * Math.PI) * 0.2;
                this.group.scale.set(s * t, s * t, s * t);
                this.bodyMesh.position.y = 0.045 + Math.sin(t * Math.PI) * 0.04;

                if (t >= 1) {
                    this.group.scale.set(1, 1, 1);
                    this.state = 'walking';
                    this.animTimer = 0;
                }
                break;
            }

            case 'walking': {
                // Waddling walk towards the gloves
                this.walkProgress = Math.min(1, this.animTimer / 3.0);
                this.currentPos.lerpVectors(this.startPos, this.targetPos, this.walkProgress);
                this.group.position.copy(this.currentPos);

                // Body bounce & limb waddle
                const waddleSpeed = 12;
                const legSwing = Math.sin(this.animTimer * waddleSpeed) * 0.35;
                this.leftLeg.rotation.x = legSwing;
                this.rightLeg.rotation.x = -legSwing;
                this.leftArm.rotation.x = -legSwing;
                this.rightArm.rotation.x = legSwing;
                this.bodyMesh.rotation.z = Math.sin(this.animTimer * waddleSpeed * 0.5) * 0.08;
                this.bodyMesh.position.y = 0.045 + Math.abs(Math.sin(this.animTimer * waddleSpeed)) * 0.015;

                // Look toward target direction
                const walkDir = this.targetPos.clone().sub(this.startPos).normalize();
                this.group.rotation.y = Math.atan2(walkDir.x, walkDir.z) + Math.PI;

                if (this.walkProgress >= 1) {
                    this.state = 'pointing';
                    this.animTimer = 0;
                    this.leftLeg.rotation.x = 0;
                    this.rightLeg.rotation.x = 0;
                    this.bodyMesh.rotation.z = 0;
                    this.pointerArrow.visible = true;
                    this.updateSpeechBubble("Put on the nitrile gloves first!");
                    this.voice.speak('glovesPoint', 'normal');
                }
                break;
            }

            case 'pointing': {
                // Point arm toward gloves & bounce pointer arrow
                this.leftArm.rotation.z = Math.PI / 1.8;
                this.leftArm.rotation.x = 0;
                this.rightArm.rotation.z = -Math.PI / 6;

                // Bob arrow
                const arrowBob = Math.sin(this.animTimer * 5) * 0.015;
                this.pointerArrow.position.x = -0.10 + arrowBob;
                this.bodyMesh.position.y = 0.045 + Math.sin(this.animTimer * 2) * 0.005;
                break;
            }

            case 'celebrating': {
                // Happy cheer jump before vanishing
                const t = this.animTimer / 1.2;
                this.bodyMesh.position.y = 0.045 + Math.abs(Math.sin(t * Math.PI * 3)) * 0.05;
                this.leftArm.rotation.z = Math.PI / 1.5;
                this.rightArm.rotation.z = -Math.PI / 1.5;
                this.group.rotation.y += delta * 4;

                if (t >= 1) {
                    this.state = 'shrinking';
                    this.animTimer = 0;
                }
                break;
            }

            case 'shrinking': {
                // Graceful shrink into sparkle
                const t = Math.min(1, this.animTimer / 0.5);
                const s = Math.max(0, 1 - t);
                this.group.scale.set(s, s, s);
                this.bodyMesh.position.y -= delta * 0.05;

                if (t >= 1) {
                    this.group.visible = false;
                    this.state = 'hidden';
                    this.isVisible = false;
                }
                break;
            }
        }
    }
}
