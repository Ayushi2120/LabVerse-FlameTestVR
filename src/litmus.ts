import * as THREE from 'three';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { CameraController } from './controllers/CameraController';
import { MaterialLibrary } from './materials/MaterialLibrary';
import { createLitmusRoom } from './scene/LitmusRoom';
import { createLitmusEquipment } from './scene/LitmusEquipment';

// Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);
scene.fog = new THREE.Fog(0x111111, 4, 10);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.xr.enabled = true;
document.getElementById('app')!.appendChild(renderer.domElement);

// Add VR Button
const vrButton = VRButton.createButton(renderer);
vrButton.style.zIndex = '9999';
document.body.appendChild(vrButton);

// Create an XR rig to properly position the user in VR
const xrRig = new THREE.Group();
xrRig.position.set(0, 0, 0.5); // Start slightly back from desk
scene.add(xrRig);
xrRig.add(camera);

// Add visual pointer lines to XR controllers for navigation reference
const controller1 = renderer.xr.getController(0);
const controller2 = renderer.xr.getController(1);
xrRig.add(controller1);
xrRig.add(controller2);
const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,-1)]);
const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
const line1 = new THREE.Line(lineGeo, lineMat);
line1.scale.z = 5;
controller1.add(line1);
const line2 = new THREE.Line(lineGeo, lineMat);
line2.scale.z = 5;
controller2.add(line2);

// Controllers
const cameraController = new CameraController(camera, renderer.domElement);

// Create Environment
const materials = new MaterialLibrary();

// Litmus Room Environment Setup
scene.add(createLitmusRoom(materials));
scene.add(createLitmusEquipment(materials));

// Resize handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// XR Session Event handling to disable desktop controls when in VR
renderer.xr.addEventListener('sessionstart', () => {
    const instr = document.getElementById('instructions');
    if (instr) instr.style.display = 'none';
});



renderer.setAnimationLoop(() => {
    // Only update desktop controls if not presenting in VR
    if (!renderer.xr.isPresenting) {
        cameraController.update();
    }

    renderer.render(scene, camera);
});
