import * as THREE from 'three';

export interface LaboratoryLightEntry {
    light: THREE.Light;
    baseIntensity: number;
}

export interface LaboratoryLighting {
    setDimFactor: (factor: number) => void;
    restore: () => void;
    getAllLights: () => LaboratoryLightEntry[];
}

export function createLighting(scene: THREE.Scene): LaboratoryLighting {
    const lightEntries: LaboratoryLightEntry[] = [];

    const registerLight = <T extends THREE.Light>(light: T): T => {
        lightEntries.push({ light, baseIntensity: light.intensity });
        return light;
    };

    // 1. Soft Ambient Illumination for balanced overall laboratory visibility
    const ambientLight = registerLight(new THREE.AmbientLight(0xf0f5ff, 0.40)); 
    scene.add(ambientLight);

    // 2. Hemisphere Light (Clean neutral-white sky top, slate floor bounce bottom)
    const hemiLight = registerLight(new THREE.HemisphereLight(0xffffff, 0x3a4858, 0.45));
    hemiLight.position.set(0, 3.4, 0);
    scene.add(hemiLight);

    // 3. Directional Window Daylight (Frosted glass daylight from side windows)
    const windowLight = registerLight(new THREE.DirectionalLight(0xddeeff, 0.50));
    windowLight.position.set(-4.5, 2.8, -1.0);
    windowLight.target.position.set(0, 0.90, -0.9);
    windowLight.castShadow = false; 
    scene.add(windowLight);
    scene.add(windowLight.target);

    // --- 4. PROFESSIONAL LABORATORY EXPERIMENT LIGHTING ---
    // A. Main Task Spotlight over central experiment workbench (SINGLE real-time shadow caster)
    const benchSpot = registerLight(new THREE.SpotLight(0xfffaed, 2.0));
    benchSpot.position.set(0, 3.25, -0.65);
    benchSpot.angle = Math.PI / 4.2;
    benchSpot.penumbra = 0.50;
    benchSpot.decay = 1.2;
    benchSpot.distance = 4.5;
    benchSpot.castShadow = true;
    benchSpot.shadow.mapSize.width = 1024;
    benchSpot.shadow.mapSize.height = 1024;
    benchSpot.shadow.bias = -0.0012;
    benchSpot.target.position.set(0, 0.90, -0.75);
    scene.add(benchSpot);
    scene.add(benchSpot.target);

    // B. Reagent & Salt Samples Accent Spotlight (highlights crystal powders & ceramic dishes)
    const samplesSpot = registerLight(new THREE.SpotLight(0xf2f7ff, 1.4));
    samplesSpot.position.set(-0.44, 3.15, -0.50);
    samplesSpot.angle = Math.PI / 4.8;
    samplesSpot.penumbra = 0.50;
    samplesSpot.decay = 1.2;
    samplesSpot.distance = 4.2;
    samplesSpot.castShadow = false;
    samplesSpot.target.position.set(-0.44, 0.90, -0.72);
    scene.add(samplesSpot);
    scene.add(samplesSpot.target);

    // C. Bunsen Burner & Platinum Wire Accent Spotlight (highlights flame reaction & instrument)
    const burnerSpot = registerLight(new THREE.SpotLight(0xfff6ea, 1.4));
    burnerSpot.position.set(0.15, 3.15, -0.60);
    burnerSpot.angle = Math.PI / 5.0;
    burnerSpot.penumbra = 0.50;
    burnerSpot.decay = 1.2;
    burnerSpot.distance = 4.2;
    burnerSpot.castShadow = false;
    burnerSpot.target.position.set(0.15, 0.90, -0.80);
    scene.add(burnerSpot);
    scene.add(burnerSpot.target);

    // D. Controlled Warm Light near Bunsen Burner area (subtle warm instrument glow)
    const burnerWarmLight = registerLight(new THREE.PointLight(0xffb266, 0.40, 1.4));
    burnerWarmLight.position.set(0.15, 1.05, -0.80);
    burnerWarmLight.decay = 1.8;
    scene.add(burnerWarmLight);

    // 5. Recessed Overhead LED Troffer Panels on Ceiling (Diffused ambient fill)
    const createOverheadTroffer = (x: number, z: number) => {
        const pointLight = registerLight(new THREE.PointLight(0xfff8f0, 0.30, 6));
        pointLight.position.set(x, 3.1, z);
        pointLight.decay = 1.5;
        scene.add(pointLight);

        // LED Panel Housing Frame
        const fixtureGeo = new THREE.BoxGeometry(1.2, 0.05, 0.6);
        const fixtureMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
        fixture.position.set(x, 3.37, z);
        scene.add(fixture);

        // Metallic Rim Frame around troffer panel
        const rim = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.04, 0.65), new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.2 }));
        rim.position.set(x, 3.38, z);
        scene.add(rim);
    };

    // Grid of 4 LED troffer panels across lab ceiling
    createOverheadTroffer(-2.0, -1.5);
    createOverheadTroffer(2.0, -1.5);
    createOverheadTroffer(-2.0, 1.5);
    createOverheadTroffer(2.0, 1.5);

    return {
        setDimFactor: (factor: number) => {
            const clamped = THREE.MathUtils.clamp(factor, 0.0, 1.0);
            for (let i = 0; i < lightEntries.length; i++) {
                lightEntries[i].light.intensity = lightEntries[i].baseIntensity * clamped;
            }
        },
        restore: () => {
            for (let i = 0; i < lightEntries.length; i++) {
                lightEntries[i].light.intensity = lightEntries[i].baseIntensity;
            }
        },
        getAllLights: () => lightEntries
    };
}

