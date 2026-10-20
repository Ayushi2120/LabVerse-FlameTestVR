import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MaterialLibrary } from '../materials/MaterialLibrary';

export function createLitmusEquipment(materials: MaterialLibrary): THREE.Group {
    const group = new THREE.Group();

    // 1. Create a large central Lab Desk
    const deskGroup = new THREE.Group();
    
    // Desk Top
    const topGeo = new THREE.BoxGeometry(3, 0.1, 1.5);
    const topMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3 }); // Dark slate top
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.y = 0.95;
    top.receiveShadow = true;
    top.castShadow = true;
    deskGroup.add(top);

    // Desk Legs
    const legGeo = new THREE.BoxGeometry(0.1, 0.9, 0.1);
    const legMat = materials.metal;
    const positions = [
        [-1.4, 0.45, -0.65], [1.4, 0.45, -0.65],
        [-1.4, 0.45, 0.65], [1.4, 0.45, 0.65]
    ];
    positions.forEach(pos => {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(pos[0], pos[1], pos[2]);
        leg.castShadow = true;
        leg.receiveShadow = true;
        deskGroup.add(leg);
    });
    
    deskGroup.position.set(0, 0, -1);
    group.add(deskGroup);

    // 2. Load the Litmus GLB Model
    const loader = new GLTFLoader();
    loader.load(
        '/models/litmus.glb',
        (gltf) => {
            const litmusModel = gltf.scene;
            // Adjust scale and position as necessary based on the model's original scale
            litmusModel.scale.set(1, 1, 1);
            litmusModel.position.set(0, 1.0, -1);
            
            // Enable shadows for the loaded model
            litmusModel.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            group.add(litmusModel);
        },
        (progress) => {
            console.log(`Loading Litmus Model: ${(progress.loaded / progress.total * 100)}%`);
        },
        (error) => {
            console.error('Error loading Litmus GLB:', error);
        }
    );

    // 3. Add supplementary Glassware (Beakers/Flasks)
    const beakerGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.12, 16);
    beakerGeo.translate(0, 0.06, 0);

    const beaker1 = new THREE.Mesh(beakerGeo, materials.glass);
    beaker1.position.set(0.6, 1.0, -0.8);
    beaker1.castShadow = true;
    group.add(beaker1);

    const beaker2 = new THREE.Mesh(beakerGeo, materials.glass);
    beaker2.position.set(0.8, 1.0, -1.0);
    beaker2.castShadow = true;
    group.add(beaker2);

    // Add some liquid inside beaker1
    const liquidGeo = new THREE.CylinderGeometry(0.048, 0.048, 0.06, 16);
    liquidGeo.translate(0, 0.03, 0);
    const liquidMat = new THREE.MeshPhysicalMaterial({
        color: 0x4488ff, transmission: 0.8, opacity: 0.9, transparent: true
    });
    const liquid = new THREE.Mesh(liquidGeo, liquidMat);
    liquid.position.copy(beaker1.position);
    liquid.position.y += 0.001; // Slightly above bottom
    group.add(liquid);
    
    // Test tube rack
    const rackGeo = new THREE.BoxGeometry(0.3, 0.1, 0.08);
    const rack = new THREE.Mesh(rackGeo, materials.wood);
    rack.position.set(-0.8, 1.05, -1.0);
    rack.castShadow = true;
    group.add(rack);

    const tubeGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.15, 16);
    tubeGeo.translate(0, 0.075, 0);
    for (let i = 0; i < 5; i++) {
        const tube = new THREE.Mesh(tubeGeo, materials.glass);
        const xOffset = -0.95 + i * 0.075;
        tube.position.set(xOffset, 1.0, -1.0);
        tube.castShadow = true;
        group.add(tube);
        
        // Liquid in tubes
        const tLiquidGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.05, 16);
        tLiquidGeo.translate(0, 0.025, 0);
        const tLiquidColor = [0xffaaaa, 0xaaffaa, 0xaaaaaa, 0xaaaaff, 0xffaaff][i];
        const tLiquidMat = new THREE.MeshPhysicalMaterial({
            color: tLiquidColor, transmission: 0.8, opacity: 0.9, transparent: true
        });
        const tLiquid = new THREE.Mesh(tLiquidGeo, tLiquidMat);
        tLiquid.position.set(xOffset, 1.002, -1.0);
        group.add(tLiquid);
    }

    return group;
}
