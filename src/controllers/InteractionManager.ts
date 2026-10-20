import * as THREE from 'three';

export class InteractionManager {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private raycaster = new THREE.Raycaster();
    
    // State
    public grabbedObject: THREE.Object3D | null = null;
    private desktopHoldPoint: THREE.Group;
    private xrControllerHolding: THREE.Group | null = null;

    constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        // Desktop hold point attached to camera
        this.desktopHoldPoint = new THREE.Group();
        this.desktopHoldPoint.position.set(0, -0.2, -0.6); // Slightly down and in front
        this.camera.add(this.desktopHoldPoint);
        this.scene.add(this.camera);

        this.setupDesktopEvents();
        this.setupXREvents();
    }

    private getGrabbableAncestor(obj: THREE.Object3D): THREE.Object3D | null {
        let current: THREE.Object3D | null = obj;
        while (current && !current.userData?.isGrabbable && current.parent) {
            current = current.parent;
        }
        return current?.userData?.isGrabbable ? current : null;
    }

    // --- Desktop Interactions ---
    private setupDesktopEvents() {
        window.addEventListener('mousedown', (e) => {
            if (e.button !== 0 || this.renderer.xr.isPresenting) return; // Left click only
            
            // Raycast from center of screen
            this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
            const intersects = this.raycaster.intersectObjects(this.scene.children, true);
            
            if (intersects.length > 0) {
                const target = this.getGrabbableAncestor(intersects[0].object);
                if (target && !this.grabbedObject) {
                    this.grabbedObject = target;
                    // Keep original world position when grabbing to avoid snapping, but since it's First Person,
                    // snapping to the hold point looks like you just "picked it up".
                    this.grabbedObject.position.set(0,0,0);
                    this.grabbedObject.rotation.set(0,0,0);
                    this.desktopHoldPoint.attach(this.grabbedObject);
                }
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button !== 0 || this.renderer.xr.isPresenting) return;
            if (this.grabbedObject && !this.xrControllerHolding) {
                this.scene.attach(this.grabbedObject);
                this.grabbedObject = null;
            }
        });
    }

    // --- WebXR Interactions ---
    private setupXREvents() {
        const onSelectStart = (event: any) => {
            const controller = event.target as THREE.Group;
            if (this.grabbedObject) return;

            const tempMatrix = new THREE.Matrix4();
            tempMatrix.identity().extractRotation(controller.matrixWorld);
            this.raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
            this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

            const intersects = this.raycaster.intersectObjects(this.scene.children, true);
            for (let i = 0; i < intersects.length; i++) {
                const target = this.getGrabbableAncestor(intersects[i].object);
                if (target) {
                    this.grabbedObject = target;
                    this.xrControllerHolding = controller;
                    controller.attach(this.grabbedObject);
                    break; 
                }
            }
        };

        const onSelectEnd = (event: any) => {
            const controller = event.target as THREE.Group;
            if (this.xrControllerHolding === controller && this.grabbedObject) {
                this.scene.attach(this.grabbedObject);
                this.grabbedObject = null;
                this.xrControllerHolding = null;
            }
        };

        const c1 = this.renderer.xr.getController(0);
        const c2 = this.renderer.xr.getController(1);
        c1.addEventListener('selectstart', onSelectStart);
        c1.addEventListener('selectend', onSelectEnd);
        c2.addEventListener('selectstart', onSelectStart);
        c2.addEventListener('selectend', onSelectEnd);
    }
}
