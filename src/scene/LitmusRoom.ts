import * as THREE from 'three';
import { MaterialLibrary } from '../materials/MaterialLibrary';

export function createLitmusRoom(_materials: MaterialLibrary): THREE.Group {
    const group = new THREE.Group();

    // Floor - White Tiles
    const floorGeo = new THREE.PlaneGeometry(10, 8);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xe0e0e0, roughness: 0.2, metalness: 0.1 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    group.add(floor);

    // Ceiling
    const ceilingGeo = new THREE.PlaneGeometry(10, 8);
    const ceilingMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 4;
    group.add(ceiling);

    // Walls - Light Blue/Grey
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xd0d8e0, roughness: 0.8 });
    const wallGeoFrontBack = new THREE.PlaneGeometry(10, 4);
    const wallGeoLeftRight = new THREE.PlaneGeometry(8, 4);

    const backWall = new THREE.Mesh(wallGeoFrontBack, wallMat);
    backWall.position.set(0, 2, -4);
    backWall.receiveShadow = true;
    group.add(backWall);

    const frontWall = new THREE.Mesh(wallGeoFrontBack, wallMat);
    frontWall.position.set(0, 2, 4);
    frontWall.rotation.y = Math.PI;
    frontWall.receiveShadow = true;
    group.add(frontWall);

    const leftWall = new THREE.Mesh(wallGeoLeftRight, wallMat);
    leftWall.position.set(-5, 2, 0);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    group.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeoLeftRight, wallMat);
    rightWall.position.set(5, 2, 0);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.receiveShadow = true;
    group.add(rightWall);
    
    // Add simple door
    const doorGeo = new THREE.BoxGeometry(1.5, 2.5, 0.1);
    const doorMat = new THREE.MeshStandardMaterial({color: 0xcccccc, roughness: 0.5, metalness: 0.8});
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(3.5, 1.25, 3.95);
    group.add(door);

    // Lighting (Ambient + Point)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    group.add(ambientLight);

    const mainLight = new THREE.PointLight(0xffffff, 50);
    mainLight.position.set(0, 3, 0);
    mainLight.castShadow = true;
    group.add(mainLight);

    const fillLight = new THREE.PointLight(0xeef5ff, 20);
    fillLight.position.set(-2, 2, 2);
    group.add(fillLight);

    return group;
}
