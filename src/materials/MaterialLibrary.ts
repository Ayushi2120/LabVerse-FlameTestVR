import * as THREE from 'three';

export class MaterialLibrary {
    public glass: THREE.MeshPhysicalMaterial;
    public amberGlass: THREE.MeshPhysicalMaterial;
    public metal: THREE.MeshStandardMaterial;
    public darkMetal: THREE.MeshStandardMaterial;
    public brass: THREE.MeshStandardMaterial;
    public countertop: THREE.MeshStandardMaterial;
    public plasticBase: THREE.MeshStandardMaterial;
    public wall: THREE.MeshStandardMaterial;
    public floor: THREE.MeshStandardMaterial;
    public wood: THREE.MeshStandardMaterial;
    public ceramic: THREE.MeshStandardMaterial;
    public rubber: THREE.MeshStandardMaterial;
    public blackRubber: THREE.MeshStandardMaterial;
    public fumeHoodMetal: THREE.MeshStandardMaterial;

    constructor() {
        // High quality physical glass material
        this.glass = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            metalness: 0.05,
            roughness: 0.1,
            transmission: 0.92,
            thickness: 0.08,
            ior: 1.52,
            transparent: true,
            opacity: 0.95,
            side: THREE.DoubleSide
        });

        // Amber/brown chemical reagent glass
        this.amberGlass = new THREE.MeshPhysicalMaterial({
            color: 0x774411,
            metalness: 0.1,
            roughness: 0.15,
            transmission: 0.75,
            thickness: 0.1,
            ior: 1.54,
            transparent: true,
            opacity: 0.9
        });

        // Nitrile blue rubber gloves
        this.rubber = new THREE.MeshStandardMaterial({
            color: 0x1177dd,
            metalness: 0.05,
            roughness: 0.65
        });

        // Black rubber gas tubing & stoppers
        this.blackRubber = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.1,
            roughness: 0.8
        });

        // Shiny stainless steel
        this.metal = new THREE.MeshStandardMaterial({
            color: 0xdde3ea,
            metalness: 0.9,
            roughness: 0.2
        });

        // Polished golden brass for gas valves and turrets
        this.brass = new THREE.MeshStandardMaterial({
            color: 0xd4af37,
            metalness: 0.85,
            roughness: 0.25
        });
        
        // Dark cast iron / anodized metal
        this.darkMetal = new THREE.MeshStandardMaterial({
            color: 0x282c34,
            metalness: 0.8,
            roughness: 0.35
        });

        // Dark chemically-resistant epoxy resin countertop
        this.countertop = new THREE.MeshStandardMaterial({
            color: 0x1e232a,
            metalness: 0.15,
            roughness: 0.25
        });

        // General dark plastic
        this.plasticBase = new THREE.MeshStandardMaterial({
            color: 0x181a1d,
            metalness: 0.1,
            roughness: 0.5
        });

        // Clean off-white lab wall plaster
        this.wall = new THREE.MeshStandardMaterial({
            color: 0xf2f5f8,
            metalness: 0.0,
            roughness: 0.85
        });

        // Polished lab floor
        this.floor = new THREE.MeshStandardMaterial({
            color: 0x7a8b9e,
            metalness: 0.1,
            roughness: 0.3
        });

        // Warm oak laminate for cabinets
        this.wood = new THREE.MeshStandardMaterial({
            color: 0x9a6438,
            metalness: 0.05,
            roughness: 0.7
        });

        // Ceramic white (sinks, evaporating dish)
        this.ceramic = new THREE.MeshStandardMaterial({
            color: 0xfafafa,
            metalness: 0.05,
            roughness: 0.15
        });

        // Fume hood powder coated steel
        this.fumeHoodMetal = new THREE.MeshStandardMaterial({
            color: 0x3a424e,
            metalness: 0.5,
            roughness: 0.4
        });
    }

    public getChemicalMaterial(colorHex: number): THREE.MeshStandardMaterial {
        return new THREE.MeshStandardMaterial({
            color: colorHex,
            metalness: 0.0,
            roughness: 0.85
        });
    }
}

