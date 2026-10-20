import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

export class CameraController {
    private camera: THREE.PerspectiveCamera;
    private controls: PointerLockControls;
    private moveForward = false;
    private moveBackward = false;
    private moveLeft = false;
    private moveRight = false;
    private velocity = new THREE.Vector3();
    private direction = new THREE.Vector3();
    
    private prevTime = performance.now();

    constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
        this.camera = camera;
        this.controls = new PointerLockControls(camera, domElement);
        
        // Start position
        this.camera.position.set(0, 1.7, 0.5); // 1.7m eye height, slightly back from desk

        domElement.addEventListener('click', () => {
            if (!this.controls.isLocked) {
                this.controls.lock();
            }
        });

        this.controls.addEventListener('lock', () => {
            const instr = document.getElementById('instructions');
            if (instr) instr.style.display = 'none';
        });

        this.controls.addEventListener('unlock', () => {
            const instr = document.getElementById('instructions');
            if (instr) instr.style.display = 'block';
        });

        document.addEventListener('keydown', (event) => this.onKeyDown(event));
        document.addEventListener('keyup', (event) => this.onKeyUp(event));
    }

    private onKeyDown(event: KeyboardEvent) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = true;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = true;
                break;
        }
    }

    private onKeyUp(event: KeyboardEvent) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = false;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.moveRight = false;
                break;
        }
    }

    public update() {
        if (this.controls.isLocked === true) {
            const time = performance.now();
            const delta = (time - this.prevTime) / 1000;

            this.velocity.x -= this.velocity.x * 10.0 * delta;
            this.velocity.z -= this.velocity.z * 10.0 * delta;

            this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
            this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
            this.direction.normalize();

            if (this.moveForward || this.moveBackward) this.velocity.z -= this.direction.z * 40.0 * delta;
            if (this.moveLeft || this.moveRight) this.velocity.x -= this.direction.x * 40.0 * delta;

            this.controls.moveRight(-this.velocity.x * delta);
            this.controls.moveForward(-this.velocity.z * delta);

            // Bounds check
            if (this.camera.position.x < -3.5) this.camera.position.x = -3.5;
            if (this.camera.position.x > 3.5) this.camera.position.x = 3.5;
            if (this.camera.position.z < -2.5) this.camera.position.z = -2.5;
            if (this.camera.position.z > 2.5) this.camera.position.z = 2.5;
            
            this.camera.position.y = 1.7; // keep height constant

            this.prevTime = time;
        } else {
            this.prevTime = performance.now();
        }
    }
}
