import * as THREE from 'three';
import { World, LocomotionEnvironment, PokeInteractable, RayInteractable } from '@iwsdk/core';
import { RayDisplayMode, outlineMaterial } from '@iwsdk/xr-input';
import { MaterialLibrary } from './materials/MaterialLibrary';
import { createRoom } from './scene/Room';
import { createLighting } from './scene/Lighting';
import { createFurniture } from './scene/Furniture';
import { createBunsenBurner } from './scene/equipment/BunsenBurner';
import { createGlassware } from './scene/equipment/Glassware';
import { createTools } from './scene/equipment/Tools';
import { createChemicalSamples } from './scene/ChemicalSamples';
import { FlameTestLogic, ExperimentState } from './logic/FlameTestLogic';
import { tintSceneHandMeshes } from './scene/equipment/NitrileGloves';

async function init() {
    const container = document.getElementById('app')!;
    
    const world = await World.create(container, {
        xr: {
            features: {
                handTracking: true
            }
        },
        features: {
            grabbing: { useHandPinchForGrab: true },
            locomotion: {
                initialPlayerPosition: [0, 0, -0.3], // Spawn closer to desk
                browserControls: { keyboard: true }
            }
        },
        render: {
            camera: {
                position: [0, 1.6, 0] // Standing height offset
            }
        }
    });

    // Optimize depth clipping planes for maximum WebGL depth buffer precision (eliminates Z-fighting across 0.05m-35m room)
    if (world.camera) {
        (world.camera as any).near = 0.05;
        (world.camera as any).far = 35.0;
        (world.camera as any).updateProjectionMatrix();
    }

    // Configure @iwsdk built-in ray pointers to INVISIBLE for direct VR headset hand tracking
    if ((world as any).input?.xr?.multiPointers) {
        const mp = (world as any).input.xr.multiPointers;
        if (mp.left?.ray?.visual) mp.left.ray.visual.rayDisplayMode = RayDisplayMode.Invisible;
        if (mp.right?.ray?.visual) mp.right.ray.visual.rayDisplayMode = RayDisplayMode.Invisible;
    }

    const scene = world.scene as any;
    scene.background = new THREE.Color(0xf2f5f8); // Clean laboratory wall color
    scene.fog = new THREE.Fog(0xf2f5f8, 12, 25);

    // Create Environment
    const materials = new MaterialLibrary();
    const labLighting = createLighting(scene);
    
    const roomGroup = createRoom(materials);
    scene.add(roomGroup as any);
    const roomEntity = world.createTransformEntity(roomGroup as any);
    roomEntity.addComponent(LocomotionEnvironment);

    const furnitureGroup = createFurniture(materials);
    scene.add(furnitureGroup as any);
    
    // Interactive Bunsen Burner & Power Switch
    const burnerGroup = createBunsenBurner(materials);
    scene.add(burnerGroup as any);
    
    // Pass world to Logic Engine and register reversible lab environment
    const logicEngine = new FlameTestLogic(scene, world);
    logicEngine.setLabEnvironment(labLighting, roomGroup, furnitureGroup);
    logicEngine.onReleaseCallback = () => {
        isWireHeld = false;
        isLeftMouseDragging = false;
        isRightMouseDragging = false;
        wasDraggingWire = false;
    };

    // VR: Event listeners on burner knob and switch
    if (burnerGroup.userData.knob) {
        burnerGroup.userData.knob.addEventListener('pointerdown', () => {
            logicEngine.getAudioEngine().resume();
            logicEngine.toggleBurner();
        });
    }

    if (burnerGroup.userData.burnerSwitch) {
        burnerGroup.userData.burnerSwitch.addEventListener('pointerdown', () => {
            logicEngine.getAudioEngine().resume();
            logicEngine.toggleBurner();
        });
    }

    // State variables for locomotion & XR
    let isPointerLocked = false;
    let pitch = 0;
    let yaw = 0;

    // Toast and UI element references
    let toastTimeout: any = null;
    const toastEl = document.getElementById('toast-msg');
    const vrBtnEl = document.getElementById('vr-btn');
    const hudEl = document.getElementById('desktop-hud');

    function showToast(message: string, durationMs = 6000) {
        if (!toastEl) {
            alert(message);
            return;
        }
        if (toastTimeout) clearTimeout(toastTimeout);
        toastEl.textContent = message;
        toastEl.classList.add('visible');
        toastTimeout = setTimeout(() => {
            toastEl.classList.remove('visible');
        }, durationMs);
    }

    // --- VR HAND TRACKING SETUP & VISUAL 3D HAND JOINT MESHES ---
    const renderer = (world as any).renderer;
    if (renderer && renderer.xr) {
        // Resume Web Audio when XR session starts (crucial for Meta Quest / VR headset audio)
        renderer.xr.addEventListener('sessionstart', () => {
            if (world.camera) {
                (world.camera as any).near = 0.05;
                (world.camera as any).far = 35.0;
                (world.camera as any).updateProjectionMatrix();
            }
            logicEngine.getAudioEngine().resume();
            logicEngine.onXRSessionStart();
            if (vrBtnEl) vrBtnEl.style.display = 'none';
            if (hudEl) hudEl.style.display = 'none';
        });

        // Safely handle WebXR session end event
        renderer.xr.addEventListener('sessionend', () => {
            logicEngine.onXRSessionEnd();
            if (vrBtnEl) vrBtnEl.style.display = 'block';
            if (hudEl) hudEl.style.display = 'block';

            // Re-render desktop view and sync aspect ratio cleanly
            const width = container.clientWidth || window.innerWidth;
            const height = container.clientHeight || window.innerHeight;
            if (width > 0 && height > 0 && renderer) {
                renderer.setSize(width, height);
                if (world.camera) {
                    (world.camera as any).aspect = width / height;
                    (world.camera as any).updateProjectionMatrix();

                    // Sync pitch and yaw with camera orientation for smooth mouse look
                    const euler = new THREE.Euler().setFromQuaternion((world.camera as any).quaternion, 'YXZ');
                    pitch = euler.x;
                    yaw = euler.y;
                }
            }
        });

        for (let i = 0; i < 2; i++) {
            const hand = renderer.xr.getHand(i);
            scene.add(hand); // CRITICAL: Three.js requires hand objects in scene to update joint matrices

            // Hook up connected event for accurate handedness determination
            hand.addEventListener('connected', (event: any) => {
                hand.userData.handedness = event.data?.handedness || (i === 0 ? 'left' : 'right');
                hand.userData.inputSource = event.data;
            });

            // Hook up select / squeeze events for VR hands & controllers
            hand.addEventListener('selectstart', () => {
                logicEngine.getAudioEngine().resume();
                logicEngine.onVRHandSelectStart(i);
            });
            hand.addEventListener('selectend', () => logicEngine.onVRHandSelectEnd(i));
            hand.addEventListener('squeezestart', () => {
                logicEngine.getAudioEngine().resume();
                logicEngine.onVRHandSqueezeStart(i);
            });
            hand.addEventListener('squeezeend', () => logicEngine.onVRHandSqueezeEnd(i));

            const controller = renderer.xr.getController(i);
            scene.add(controller);
            controller.addEventListener('connected', (event: any) => {
                controller.userData.handedness = event.data?.handedness || (i === 0 ? 'left' : 'right');
                controller.userData.inputSource = event.data;
            });
            controller.addEventListener('selectstart', () => {
                logicEngine.getAudioEngine().resume();
                logicEngine.onVRHandSelectStart(i);
            });
            controller.addEventListener('selectend', () => logicEngine.onVRHandSelectEnd(i));
            controller.addEventListener('squeezestart', () => {
                logicEngine.getAudioEngine().resume();
                logicEngine.onVRHandSqueezeStart(i);
            });
            controller.addEventListener('squeezeend', () => logicEngine.onVRHandSqueezeEnd(i));
        }
    }

    // --- VR LASER BEAMS (kept inactive so direct hand tracking is used) ---
    const laserBeams: THREE.Line[] = [];
    for (let i = 0; i < 2; i++) {
        const rayGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(),
            new THREE.Vector3()
        ]);
        const rayMat = new THREE.LineBasicMaterial({
            color: 0x00e5ff,
            transparent: true,
            opacity: 0.9,
            linewidth: 4
        });
        const rayLine = new THREE.Line(rayGeo, rayMat);
        rayLine.visible = false;
        
        const cursorDot = new THREE.Mesh(
            new THREE.SphereGeometry(0.012, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.9 })
        );
        cursorDot.name = 'CursorDot';
        rayLine.add(cursorDot);

        scene.add(rayLine);
        laserBeams.push(rayLine);
    }

    const toolsGroup = createTools(materials);
    scene.add(toolsGroup as any);
    scene.add(createGlassware(materials) as any);
    scene.add(createChemicalSamples(materials) as any);

    // Make Platinum Wire Grabbable
    const wireObject = toolsGroup.getObjectByName('PlatinumWire');
    if (wireObject) {
        // Save initial transform for resetting later
        wireObject.userData.initialPosition = wireObject.position.clone();
        wireObject.userData.initialQuaternion = wireObject.quaternion.clone();

        const wireEntity = world.createTransformEntity(wireObject as any);
        wireEntity.addComponent(RayInteractable);
        wireEntity.addComponent(PokeInteractable);
    }

    // Custom Left Click & Right Click Wire Grab for Desktop with Real-Time Dragging
    let isWireHeld = false;
    let isLeftMouseDragging = false;
    let isRightMouseDragging = false;
    let desktopGrabPlaneY = 0.935;
    let desktopHeightOffset = 0;
    let wasDraggingWire = false;
    const desktopGrabOffsetPos = new THREE.Vector3();
    const desktopGrabInitialQuat = new THREE.Quaternion();
    const currentMouseVec = new THREE.Vector2(0, 0);
    const crosshairEl = document.getElementById('crosshair');

    window.addEventListener('mousemove', (e) => {
        currentMouseVec.x = (e.clientX / window.innerWidth) * 2 - 1;
        currentMouseVec.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('wheel', (e) => {
        if (isWireHeld) {
            desktopHeightOffset += (e.deltaY < 0 ? 0.02 : -0.02);
            desktopHeightOffset = Math.max(-0.06, Math.min(0.30, desktopHeightOffset));
        }
    }, { passive: true });

    document.addEventListener('mousedown', (e) => {
        logicEngine.getAudioEngine().resume();
        const isPresenting = (world as any).session || (world as any).renderer?.xr?.isPresenting;
        if (!isPresenting) {
            const expState = logicEngine.getCurrentState();
            if (e.button === 2) { // Right Click: Hold wire
                if (expState !== ExperimentState.ORIENTATION && expState !== ExperimentState.STARTING) {
                    if (logicEngine.isVRWireHeld()) {
                        return;
                    }
                    if (logicEngine.areGlovesEquippedState()) {
                        isWireHeld = true;
                        isRightMouseDragging = true;
                        logicEngine.isHeldDesktop = true;
                        desktopHeightOffset = 0;
                        if (wireObject) {
                            desktopGrabPlaneY = wireObject.position.y;
                            desktopGrabOffsetPos.set(0, 0, 0);
                            desktopGrabInitialQuat.copy(wireObject.quaternion);
                            wasDraggingWire = true;
                        }
                    } else {
                        logicEngine.promptGlovesRequired();
                    }
                }
            } else if (e.button === 0) { // Left Click: Interact or Drag Wire
                const raycaster = new THREE.Raycaster();
                if (isPointerLocked) {
                    raycaster.setFromCamera(frameCenterVec, world.camera as any);
                } else {
                    raycaster.setFromCamera(currentMouseVec, world.camera as any);
                }
                const intersects = raycaster.intersectObjects(scene.children, true);
                
                for (let i = 0; i < intersects.length; i++) {
                    const hitObj = intersects[i].object;

                    // 1. Check 3D Orientation Screen Click (Feature 1, Feature 2, Feature 5.A, 5.E, 5.F)
                    if (logicEngine.getOrientationScreen() && logicEngine.getOrientationScreen().handleClick(hitObj, intersects[i].point)) {
                        break;
                    }

                    // 2. Check 3D Result Device Click (Feature 4, Feature 5.A, 5.E, 5.H)
                    if (logicEngine.getResultDisplay3D() && logicEngine.getResultDisplay3D().handleClick(hitObj)) {
                        break;
                    }

                    // 2b. Check 3D Lab Book Click (Feature 4: Page Turning & Observations Review)
                    if (logicEngine.getLabBook() && logicEngine.getLabBook().handleClick(hitObj, intersects[i].point)) {
                        break;
                    }

                    // 3. Check Wall Exit VR Button (ALWAYS UNBLOCKED in ALL states)
                    let checkExit: THREE.Object3D | null = hitObj;
                    let isExitVRHit = false;
                    while (checkExit) {
                        if (
                            checkExit === logicEngine.getWallExitVRButtonMesh() ||
                            checkExit.userData?.isExitVRButton || 
                            checkExit.name === 'WallExitVRBtn' ||
                            checkExit.name === 'WallExitVRBtnGroup'
                        ) {
                            isExitVRHit = true;
                            break;
                        }
                        checkExit = checkExit.parent;
                    }

                    if (isExitVRHit) {
                        logicEngine.triggerExitVR();
                        break;
                    }

                    // Feature 1 Gating: Block all laboratory actions while in ORIENTATION or STARTING mode
                    if (expState === ExperimentState.ORIENTATION || expState === ExperimentState.STARTING) {
                        continue;
                    }
                    
                    let current: THREE.Object3D | null = hitObj;
                    let isGlovesHit = false;
                    let isSwitchHit = false;
                    let isResetHit = false;
                    let isReleaseHit = false;
                    let isWireHit = false;
                    let isInstCloseHit = false;
                    let isEasterEggHit = false;
                    let isSnitchHit = false;
                    let instGroupObj: THREE.Object3D | null = null;

                    while (current) {
                        if (
                            current.name === 'GoldenSnitch' ||
                            current.name === 'SnitchBodyGroup' ||
                            current.name === 'HogwartsLetter' ||
                            current.name === 'TopFlapGroup' ||
                            current.name === 'BottomFlapGroup' ||
                            current.name === 'WaxSealGroup' ||
                            current.name === 'LetterControlBar' ||
                            current.userData?.isGoldenSnitch ||
                            current.userData?.isHogwartsLetter ||
                            current.userData?.isWaxSeal ||
                            current.userData?.isLetterControl ||
                            (logicEngine.getGoldenSnitch() && logicEngine.getGoldenSnitch().isHitByObject(current))
                        ) {
                            isSnitchHit = true;
                            break;
                        }
                        if (
                            current.name === 'GlovesGroup' ||
                            current.userData?.isGloves ||
                            current.name === 'GloveL' ||
                            current.name === 'GloveR'
                        ) {
                            isGlovesHit = true;
                            break;
                        }
                        if (
                            current.name === 'EasterEggBuckyball' ||
                            current.name === 'EasterEggGroup' ||
                            current.userData?.isEasterEgg ||
                            current === logicEngine.getEasterEggMesh()
                        ) {
                            isEasterEggHit = true;
                            break;
                        }
                        if (current.name === 'InstructionCloseBtn' || current.userData?.isCloseButton) {
                            isInstCloseHit = true;
                            instGroupObj = current;
                            break;
                        }
                        if (current.name === 'BurnerSwitchBtn' || current.userData?.isBurnerSwitch || current.name === 'BurnerSwitchGroup' || current.name === 'BurnerKnob') {
                            isSwitchHit = true;
                            break;
                        }
                        if (current === logicEngine.getResetButtonMesh() || current.userData?.isResetButton || current.userData?.isResultReset) {
                            isResetHit = true;
                            break;
                        }
                        if (current === logicEngine.getReleaseButtonMesh() || current.userData?.isReleaseButton || current.name === 'ReleaseWireBtn') {
                            isReleaseHit = true;
                            break;
                        }
                        if (current.name === 'PlatinumWire' || current.parent?.name === 'PlatinumWire') {
                            isWireHit = true;
                            break;
                        }
                        current = current.parent;
                    }

                    if (isSnitchHit) {
                        if (logicEngine.getGoldenSnitch() && logicEngine.getGoldenSnitch().isActive()) {
                            logicEngine.getGoldenSnitch().interact(intersects[i].object);
                            break;
                        }
                    }

                    if (isGlovesHit) {
                        logicEngine.equipGloves();
                        break;
                    }

                    if (isEasterEggHit) {
                        logicEngine.toggleEasterEgg();
                        break;
                    }

                    if (isInstCloseHit && instGroupObj) {
                        let parentObj: THREE.Object3D | null = instGroupObj;
                        while (parentObj && parentObj.name !== 'InstructionBoardGroup') {
                            parentObj = parentObj.parent;
                        }
                        if (parentObj) parentObj.visible = false;
                        break;
                    }

                    if (isReleaseHit) {
                        logicEngine.releaseWire();
                        isWireHeld = false;
                        break;
                    }
                    if (isSwitchHit) {
                        logicEngine.toggleBurner();
                        break;
                    }
                    if (isResetHit) {
                        logicEngine.resetExperiment();
                        break;
                    }
                    if (isWireHit) {
                        if (logicEngine.isVRWireHeld()) {
                            break;
                        }
                        if (!logicEngine.areGlovesEquippedState()) {
                            logicEngine.promptGlovesRequired();
                        } else if (wireObject) {
                            isWireHeld = true;
                            isLeftMouseDragging = true;
                            logicEngine.isHeldDesktop = true;
                            desktopHeightOffset = 0;

                            const hitPt = intersects[i].point;
                            desktopGrabPlaneY = hitPt.y;

                            const currentWireWorld = scratchTargetPos;
                            wireObject.getWorldPosition(currentWireWorld);
                            desktopGrabOffsetPos.copy(currentWireWorld).sub(hitPt);
                            desktopGrabInitialQuat.copy(wireObject.quaternion);
                            wasDraggingWire = true;
                        }
                        break;
                    }
                }

                // Note: clicking empty desk does NOT toggle wire
            }
        }
    });

    window.addEventListener('mouseup', (e) => {
        if (e.button === 0) {
            if (isLeftMouseDragging) {
                isLeftMouseDragging = false;
                isWireHeld = false;
                logicEngine.isHeldDesktop = false;
            }
        } else if (e.button === 2) {
            if (isRightMouseDragging) {
                isRightMouseDragging = false;
                isWireHeld = false;
                logicEngine.isHeldDesktop = false;
            }
        }
    });

    // Prevent context menu on right click
    document.addEventListener('contextmenu', (e) => {
        if (isPointerLocked) e.preventDefault();
    });

    // Keyboard shortcuts ('E' / 'G' for wire toggle, 'Q' for release wire, 'L' for burner, 'R' for reset)
    document.addEventListener('keydown', (e) => {
        logicEngine.getAudioEngine().resume();
        const expState = logicEngine.getCurrentState();
        const k = e.key.toLowerCase();

        // Block tool shortcuts if experiment hasn't started yet (Feature 1 Gating)
        if (expState === ExperimentState.ORIENTATION || expState === ExperimentState.STARTING) {
            if (k === 'e' || k === 'g' || k === 'l') {
                return;
            }
        }

        if (k === 'e' || k === 'g') {
            if (!logicEngine.areGlovesEquippedState()) {
                logicEngine.promptGlovesRequired();
            } else {
                isWireHeld = !isWireHeld;
            }
        } else if (k === 'q') {
            logicEngine.releaseWire();
            isWireHeld = false;
        }
        logicEngine.handleKey(e.key);
    });

    // Safe resize handler
    window.addEventListener('resize', () => {
        const isPresenting = (world as any).session || (world as any).renderer?.xr?.isPresenting;
        if (renderer && renderer.xr && isPresenting) return;
        const width = container.clientWidth || window.innerWidth;
        const height = container.clientHeight || window.innerHeight;
        if (width > 0 && height > 0 && renderer) {
            renderer.setSize(width, height);
            if (world.camera) {
                (world.camera as any).aspect = width / height;
                (world.camera as any).near = 0.05;
                (world.camera as any).far = 35.0;
                (world.camera as any).updateProjectionMatrix();
            }
        }
    });

    // Persistent scratch objects for zero GC per-frame allocations
    const frameRaycaster = new THREE.Raycaster();
    const frameCenterVec = new THREE.Vector2(0, 0);
    const scratchTargetPos = new THREE.Vector3();
    const wireTargetPos = new THREE.Vector3();

    // Hook into world update for logic and crosshair reticle hover
    const originalUpdate = world.update.bind(world);
    world.update = (delta: number, time: number) => {
        originalUpdate(delta, time);
        logicEngine.isHeldDesktop = isWireHeld;
        logicEngine.update(delta);

        // Update Desktop Crosshair Reticle & Hover State
        const isPresentingXR = (world as any).session || (world as any).renderer?.xr?.isPresenting;
        if (isPointerLocked && !isPresentingXR && crosshairEl) {
            crosshairEl.classList.add('active');
            
            frameRaycaster.setFromCamera(frameCenterVec, world.camera as any);
            const intersects = frameRaycaster.intersectObjects(scene.children, true);
            
            let isHoveringInteractable = false;
            for (let i = 0; i < Math.min(intersects.length, 5); i++) {
                let current: THREE.Object3D | null = intersects[i].object;
                while (current) {
                    if (
                        current.userData?.isStartExperimentButton ||
                        current.userData?.isEnterVRButton ||
                        current.userData?.isTabButton ||
                        current.userData?.isPrevButton ||
                        current.userData?.isNextButton ||
                        current.userData?.isRotatableCenterpiece ||
                        current.userData?.isResultContinue ||
                        current.userData?.isResultReset ||
                        current.userData?.isResultExitVR ||
                        current.userData?.isResultClose ||
                        current.userData?.isRotatableCrystal ||
                        current.name === 'GlovesGroup' ||
                        current.userData?.isGloves ||
                        current.name === 'GloveL' ||
                        current.name === 'GloveR' ||
                        current.name === 'BurnerSwitchBtn' || 
                        current.userData?.isBurnerSwitch || 
                        current === logicEngine.getResetButtonMesh() ||
                        current === logicEngine.getWallExitVRButtonMesh() ||
                        current.userData?.isResetButton ||
                        current.userData?.isExitVRButton ||
                        current.name === 'WallExitVRBtn' ||
                        current.name === 'WallExitVRBtnGroup' ||
                        current.name === 'EasterEggBuckyball' ||
                        current.name === 'EasterEggGroup' ||
                        current.userData?.isEasterEgg ||
                        current.name === 'GoldenSnitch' ||
                        current.name === 'SnitchBodyGroup' ||
                        current.userData?.isGoldenSnitch ||
                        current.name === 'HogwartsLetter' ||
                        current.userData?.isHogwartsLetter ||
                        current.userData?.isWaxSeal ||
                        current.userData?.isLetterControl ||
                        current === logicEngine.getReleaseButtonMesh() ||
                        current.userData?.isReleaseButton ||
                        current.name === 'PlatinumWire' ||
                        current.userData?.saltSamples
                    ) {
                        isHoveringInteractable = true;
                        break;
                    }
                    current = current.parent;
                }
                if (isHoveringInteractable) break;
            }

            if (isHoveringInteractable) {
                crosshairEl.classList.add('hovering');
            } else {
                crosshairEl.classList.remove('hovering');
            }
        } else if (crosshairEl) {
            crosshairEl.classList.remove('active', 'hovering');
        }

        // Custom dynamic laser beam rays disabled for direct VR headset hand tracking
        laserBeams[0].visible = false;
        laserBeams[1].visible = false;

        // Custom Desktop Wire Transform Update with Real-Time Dragging & Preserved Grab Offset
        if (wireObject && isWireHeld && !isPresentingXR) {
            if (isPointerLocked) {
                frameRaycaster.setFromCamera(frameCenterVec, world.camera as any);
            } else {
                frameRaycaster.setFromCamera(currentMouseVec, world.camera as any);
            }

            const ray = frameRaycaster.ray;
            const targetPlaneY = desktopGrabPlaneY + desktopHeightOffset;

            // Intersect ray with horizontal table plane at targetPlaneY
            // ray.origin.y + t * ray.direction.y = targetPlaneY  =>  t = (targetPlaneY - ray.origin.y) / ray.direction.y
            if (ray.direction.y < -0.005) {
                const t = (targetPlaneY - ray.origin.y) / ray.direction.y;
                if (t > 0) {
                    scratchTargetPos.copy(ray.origin).addScaledVector(ray.direction, t);

                    // Strictly clamp target point to laboratory workbench active surface volume
                    scratchTargetPos.x = Math.max(-1.20, Math.min(1.20, scratchTargetPos.x));
                    scratchTargetPos.y = Math.max(0.86, Math.min(1.30, scratchTargetPos.y));
                    scratchTargetPos.z = Math.max(-1.15, Math.min(-0.35, scratchTargetPos.z));

                    // Target wire position PRESERVES initial grab offset without decay or teleport
                    wireTargetPos.copy(scratchTargetPos).add(desktopGrabOffsetPos);

                    if (wireObject.parent) {
                        wireObject.parent.worldToLocal(wireTargetPos);
                    }
                    wireObject.position.copy(wireTargetPos);
                    wireObject.quaternion.copy(desktopGrabInitialQuat);
                }
            }
        }

        // Synchronize Meta Quest Hand Tracking Blue Nitrile Glove Appearance
        const isGloved = logicEngine.areGlovesEquippedState();
        if (outlineMaterial && outlineMaterial.uniforms && outlineMaterial.uniforms.outlineColor) {
            outlineMaterial.uniforms.outlineColor.value.setHex(isGloved ? 0x00d4ff : 0xffffff);
        }

        if (isPresentingXR) {
            tintSceneHandMeshes(scene, isGloved, logicEngine.getGloveColor());
        }

        // Desktop wire held glove hand visibility
        const wireGlove = wireObject?.getObjectByName('WireGloveHand');
        if (wireGlove) {
            wireGlove.visible = (isWireHeld && isGloved && !isPresentingXR);
        }

        // Desktop HUD Gloves status indicator
        if (hudEl) {
            if (isGloved && !hudEl.dataset.gloved) {
                hudEl.dataset.gloved = 'true';
                hudEl.innerHTML = `<span>🧤 GLOVES EQUIPPED</span> &bull; <span>WASD</span> Walk &bull; <span>Click</span> Interact &bull; <span>Q</span> Release Wire &bull; <span>Esc</span> Cursor`;
            } else if (!isGloved && hudEl.dataset.gloved) {
                delete hudEl.dataset.gloved;
                hudEl.innerHTML = `<span>WASD</span> Walk &bull; <span>Click</span> Interact &bull; <span>Q</span> Release Wire &bull; <span>Esc</span> Cursor`;
            }
        }

        // Prevent falling below floor
        if (world.player && world.player.position.y < 0) {
            world.player.position.y = 0;
        }
    };

    // Query XR support on page load to update HTML VR button
    if ('xr' in navigator && (navigator as any).xr?.isSessionSupported) {
        (navigator as any).xr.isSessionSupported('immersive-vr')
            .then((supported: boolean) => {
                if (vrBtnEl) {
                    if (supported) {
                        vrBtnEl.textContent = '🥽 ENTER VR (Headset Ready)';
                        vrBtnEl.style.borderColor = '#00e5ff';
                        vrBtnEl.style.boxShadow = '0 0 20px rgba(0, 229, 255, 0.6)';
                    } else {
                        vrBtnEl.textContent = '🥽 ENTER VR';
                    }
                }
            })
            .catch(() => {});
    }

    async function requestVREntry() {
        logicEngine.getAudioEngine().resume();

        if (!('xr' in navigator) || !(navigator as any).xr) {
            showToast("⚠️ WebXR is not supported in this browser. Please open on a Meta Quest VR Headset (Meta Quest Browser) or Chrome/Edge with WebXR enabled. You can click 'START EXPERIMENT' on the screen to play in Desktop 3D Mode!");
            return;
        }

        try {
            const isSupported = await (navigator as any).xr.isSessionSupported('immersive-vr');
            if (!isSupported) {
                showToast("🥽 No VR Headset Detected! Immersive VR mode requires a Meta Quest headset or VR hardware. Click 'START EXPERIMENT' on the screen to play directly in Desktop 3D Mode with WASD & Mouse!");
                return;
            }

            if (typeof (world as any).launchXR === 'function') {
                await (world as any).launchXR();
            } else if (renderer && renderer.xr) {
                const session = await (navigator as any).xr.requestSession('immersive-vr', {
                    optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking']
                });
                await renderer.xr.setSession(session);
            }
            if (world.camera) {
                world.camera.rotation.set(0, 0, 0);
            }
            pitch = 0;
            yaw = 0;
        } catch (err: any) {
            console.warn("WebXR entry error:", err);
            showToast(`⚠️ VR Session Error: ${err.message || 'Could not initialize VR'}. Click 'START EXPERIMENT' for Desktop 3D Mode!`);
        }
    }

    // WebXR Launch Hook (Triggered from 3D ENTER VR button on Orientation Screen or Wall Console)
    logicEngine.onEnterVRCallback = () => {
        requestVREntry();
    };

    if (vrBtnEl) {
        vrBtnEl.addEventListener('click', (e) => {
            e.stopPropagation();
            requestVREntry();
        });
    }

    container.addEventListener('click', (e: MouseEvent) => {
        logicEngine.getAudioEngine().resume();
        const isPresenting = (world as any).session || (world as any).renderer?.xr?.isPresenting;
        if (!isPresenting && !isPointerLocked) {
            if (wasDraggingWire) {
                wasDraggingWire = false;
                return;
            }
            // Raycast click before pointer lock using standard mouse coordinates
            const mouse = new THREE.Vector2(
                (e.clientX / window.innerWidth) * 2 - 1,
                -(e.clientY / window.innerHeight) * 2 + 1
            );
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, world.camera as any);
            const intersects = raycaster.intersectObjects(scene.children, true);

            let handled = false;
            for (let i = 0; i < intersects.length; i++) {
                const hitObj = intersects[i].object;
                if (logicEngine.getOrientationScreen() && logicEngine.getOrientationScreen().handleClick(hitObj, intersects[i].point)) {
                    handled = true;
                    break;
                }
                if (logicEngine.getResultDisplay3D() && logicEngine.getResultDisplay3D().handleClick(hitObj)) {
                    handled = true;
                    break;
                }
                if (logicEngine.getLabBook() && logicEngine.getLabBook().handleClick(hitObj, intersects[i].point)) {
                    handled = true;
                    break;
                }
                let checkObj: THREE.Object3D | null = hitObj;
                while (checkObj) {
                    if (
                        checkObj === logicEngine.getWallExitVRButtonMesh() ||
                        checkObj.userData?.isExitVRButton ||
                        checkObj.name === 'WallExitVRBtn' ||
                        checkObj.name === 'WallExitVRBtnGroup'
                    ) {
                        logicEngine.triggerExitVR();
                        handled = true;
                        break;
                    }
                    if (
                        checkObj.name === 'PlatinumWire' ||
                        checkObj.name === 'GlovesGroup' ||
                        checkObj.name === 'GloveL' ||
                        checkObj.name === 'GloveR' ||
                        checkObj.name === 'BurnerSwitchBtn' ||
                        checkObj.name === 'BurnerKnob' ||
                        checkObj.name === 'GoldenSnitch' ||
                        checkObj.name === 'EasterEggBuckyball' ||
                        checkObj === logicEngine.getResetButtonMesh() ||
                        checkObj === logicEngine.getReleaseButtonMesh() ||
                        checkObj.userData?.saltSamples
                    ) {
                        handled = true;
                        break;
                    }
                    checkObj = checkObj.parent;
                }
                if (handled) break;
            }

            // Request pointer lock only when clicking the environment floor/walls to explore, not when interacting with tools or UI
            if (!handled) {
                container.requestPointerLock();
            }
        }
    });

    document.addEventListener('pointerlockchange', () => {
        isPointerLocked = document.pointerLockElement === container;
    });

    document.addEventListener('mousemove', (event) => {
        const isPresenting = (world as any).session || (world as any).renderer?.xr?.isPresenting;
        if (isPointerLocked && !isPresenting) {
            yaw -= event.movementX * 0.002;
            pitch -= event.movementY * 0.002;
            
            pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, pitch));
            world.camera.rotation.set(pitch, yaw, 0, 'YXZ');
        }
    });
}

init().catch(console.error);
