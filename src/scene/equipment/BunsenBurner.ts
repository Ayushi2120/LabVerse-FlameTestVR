import * as THREE from 'three';
import { MaterialLibrary } from '../../materials/MaterialLibrary';
import { RealisticFlame } from './RealisticFlame';

export function createBunsenBurner(materials: MaterialLibrary): THREE.Group {
    const group = new THREE.Group();

    // Base (Heavy cast iron circular base)
    const baseGeo = new THREE.CylinderGeometry(0.045, 0.05, 0.02, 16);
    const base = new THREE.Mesh(baseGeo, materials.darkMetal);
    base.position.y = 0.01;
    base.castShadow = true;
    group.add(base);

    // Nickel-plated brass burner tube barrel
    const tubeGeo = new THREE.CylinderGeometry(0.011, 0.011, 0.13, 16);
    const tube = new THREE.Mesh(tubeGeo, materials.metal);
    tube.position.y = 0.085;
    tube.castShadow = true;
    group.add(tube);

    // Rotating Air Hole Collar
    const collarGeo = new THREE.CylinderGeometry(0.013, 0.013, 0.022, 16);
    const collar = new THREE.Mesh(collarGeo, materials.brass);
    collar.position.y = 0.042;
    group.add(collar);

    // Gas inlet spigot
    const inletGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.035);
    const inlet = new THREE.Mesh(inletGeo, materials.brass);
    inlet.rotation.z = Math.PI / 2;
    inlet.position.set(-0.018, 0.032, 0); // Gas inlet on left
    group.add(inlet);

    // Gas Needle Valve Control Knob (On left gas inlet)
    const knobGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.012, 16);
    const knobMat = new THREE.MeshStandardMaterial({ color: 0xaa2222, metalness: 0.3, roughness: 0.3 });
    const knob = new THREE.Mesh(knobGeo, knobMat);
    knob.rotation.z = Math.PI / 2;
    knob.position.set(-0.035, 0.032, 0);
    knob.name = "BurnerKnob";
    group.add(knob);

    // Realistic Procedural 3D Volumetric Flame System
    const realisticFlame = new RealisticFlame();
    group.add(realisticFlame.group);


    // Position Bunsen Burner assembly flush on main workbench countertop at y = 0.90
    group.position.set(0.15, 0.90, -0.80);

    // --- BURNER POWER SWITCH BOX (MOUNTED ON RIGHT SIDE OF BURNER BASE ON WORKBENCH) ---
    const switchGroup = new THREE.Group();
    switchGroup.name = "BurnerSwitchGroup";
    
    // Metal mounting bracket attaching switch box directly to the right edge of burner base
    const bracketGeo = new THREE.BoxGeometry(0.05, 0.008, 0.04);
    const bracket = new THREE.Mesh(bracketGeo, materials.darkMetal);
    bracket.position.set(0.045, 0.008, 0);
    switchGroup.add(bracket);

    // Switch box housing directly attached to right side of burner base
    const switchBaseGeo = new THREE.BoxGeometry(0.10, 0.035, 0.08);
    const switchBase = new THREE.Mesh(switchBaseGeo, materials.darkMetal);
    switchBase.position.set(0.085, 0.0175, 0);
    switchBase.castShadow = true;
    switchGroup.add(switchBase);

    // Glowing 3D Red Power Button Mesh
    const btnGeo = new THREE.BoxGeometry(0.08, 0.025, 0.06);
    const switchBtnMat = new THREE.MeshStandardMaterial({
        color: 0xff2222,
        emissive: 0x660000,
        roughness: 0.2,
        metalness: 0.3
    });
    const switchBtn = new THREE.Mesh(btnGeo, switchBtnMat);
    switchBtn.position.set(0.085, 0.0425, 0);
    switchBtn.name = "BurnerSwitchBtn";
    switchBtn.userData.isBurnerSwitch = true;
    switchBtn.userData.initialY = 0.0425;
    switchGroup.add(switchBtn);

    // Label Canvas on top of Power Button
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'rgba(20, 20, 30, 0.95)';
    ctx.fillRect(0, 0, 256, 64);
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 252, 60);
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('POWER: OFF', 128, 32);

    const labelTex = new THREE.CanvasTexture(canvas);
    const labelGeo = new THREE.PlaneGeometry(0.075, 0.045);
    const labelMat = new THREE.MeshBasicMaterial({
        map: labelTex,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2
    });
    const labelMesh = new THREE.Mesh(labelGeo, labelMat);
    labelMesh.position.set(0, 0.0135, 0);
    labelMesh.rotation.x = -Math.PI / 2;
    switchBtn.add(labelMesh);

    group.add(switchGroup);

    // Attach references to group for logic system
    group.userData.realisticFlame = realisticFlame;
    group.userData.flameMesh = realisticFlame.getPrimaryMesh();
    group.userData.flameLight = realisticFlame.getPointLight();
    group.userData.flameParticles = realisticFlame.getParticlePoints();
    group.userData.defaultFlameColor = 0x38bdf8;
    group.userData.knob = knob;
    group.userData.burnerSwitch = switchBtn;
    group.userData.burnerSwitchMat = switchBtnMat;
    group.userData.burnerSwitchCanvas = canvas;
    group.userData.burnerSwitchTexture = labelTex;

    return group;
}
