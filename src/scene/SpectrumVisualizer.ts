import * as THREE from 'three';

interface SpectralLine {
    wavelength: number; // nm
    color: string;
    intensity: number; // 0..1
    label?: string;
}

const SPECTRAL_DATA: Record<string, { element: string; symbol: string; transition: string; lines: SpectralLine[] }> = {
    'Lithium Chloride': {
        element: 'Lithium',
        symbol: 'Li',
        transition: '2p → 2s electronic de-excitation',
        lines: [
            { wavelength: 670.8, color: '#e11d48', intensity: 1.0, label: '670.8 nm (Carmine Red)' },
            { wavelength: 610.4, color: '#f97316', intensity: 0.45, label: '610.4 nm (Orange)' }
        ]
    },
    'Sodium Chloride': {
        element: 'Sodium',
        symbol: 'Na',
        transition: '3p → 3s electronic de-excitation',
        lines: [
            { wavelength: 589.0, color: '#ffee00', intensity: 1.0, label: 'D2 (589.0 nm)' },
            { wavelength: 589.6, color: '#ffea00', intensity: 0.9, label: 'D1 (589.6 nm)' },
        ]
    },
    'Potassium Chloride': {
        element: 'Potassium',
        symbol: 'K',
        transition: '4p → 4s and 5p → 4s electronic de-excitation',
        lines: [
            { wavelength: 404.4, color: '#a855f7', intensity: 0.85, label: '404.4 nm (Violet)' },
            { wavelength: 404.7, color: '#9333ea', intensity: 0.65, label: '404.7 nm' },
            { wavelength: 766.5, color: '#dc2626', intensity: 0.95, label: '766.5 nm (Deep Red)' },
            { wavelength: 769.9, color: '#b91c1c', intensity: 0.75, label: '769.9 nm' },
        ]
    },
    'Copper(II) Chloride': {
        element: 'Copper',
        symbol: 'Cu',
        transition: 'CuCl molecular bands & 4p → 4s electronic transition',
        lines: [
            { wavelength: 435.8, color: '#3b82f6', intensity: 0.7, label: '435.8 nm (Blue)' },
            { wavelength: 510.5, color: '#10b981', intensity: 0.95, label: '510.5 nm (Green)' },
            { wavelength: 521.8, color: '#059669', intensity: 0.85, label: '521.8 nm' },
            { wavelength: 578.2, color: '#eab308', intensity: 0.7, label: '578.2 nm (Yellow)' },
        ]
    },
    'Copper(II) Sulfate': {
        element: 'Copper',
        symbol: 'Cu',
        transition: '4p → 4s and 3d⁹4p → 3d¹⁰ electronic transition',
        lines: [
            { wavelength: 510.5, color: '#10b981', intensity: 0.95, label: '510.5 nm (Green)' },
            { wavelength: 521.8, color: '#059669', intensity: 0.85, label: '521.8 nm' },
            { wavelength: 578.2, color: '#eab308', intensity: 0.7, label: '578.2 nm (Yellow)' },
            { wavelength: 435.8, color: '#3b82f6', intensity: 0.6, label: '435.8 nm (Blue)' },
        ]
    },
    'Calcium Chloride': {
        element: 'Calcium',
        symbol: 'Ca',
        transition: 'CaOH molecular band & 4p → 4s atomic de-excitation',
        lines: [
            { wavelength: 422.7, color: '#8b5cf6', intensity: 0.75, label: '422.7 nm (Violet)' },
            { wavelength: 554.0, color: '#22c55e', intensity: 0.5, label: '554.0 nm (Green)' },
            { wavelength: 616.2, color: '#f97316', intensity: 0.85, label: '616.2 nm (Orange)' },
            { wavelength: 622.0, color: '#ea580c', intensity: 1.0, label: '622.0 nm (Brick Red)' },
        ]
    },
    'Strontium Chloride': {
        element: 'Strontium',
        symbol: 'Sr',
        transition: '5p → 5s atomic line & SrOH molecular emission bands',
        lines: [
            { wavelength: 460.7, color: '#06b6d4', intensity: 0.75, label: '460.7 nm (Blue)' },
            { wavelength: 606.0, color: '#f43f5e', intensity: 0.8, label: '606.0 nm (Red)' },
            { wavelength: 668.0, color: '#e11d48', intensity: 0.95, label: '668.0 nm (Crimson)' },
            { wavelength: 689.0, color: '#be123c', intensity: 0.85, label: '689.0 nm (Deep Red)' },
        ]
    }
};

export class SpectrumVisualizer {
    public group: THREE.Group;
    private canvas: HTMLCanvasElement;
    private texture: THREE.CanvasTexture;
    private closeBtnMesh: THREE.Mesh;
    private timer = 0;
    private autoHideTimer = 0;

    constructor(scene: THREE.Scene) {
        this.group = new THREE.Group();
        this.group.name = 'SpectrumVisualizerGroup';
        this.group.visible = false;

        // Position slightly to the right of the burner at comfortable height
        this.group.position.set(0.42, 1.25, -0.75);
        this.group.rotation.y = -Math.PI / 10;

        // Spectrometer display canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = 640;
        this.canvas.height = 360;
        this.texture = new THREE.CanvasTexture(this.canvas);

        // Display panel
        const panelGeo = new THREE.PlaneGeometry(0.48, 0.27);
        const panelMat = new THREE.MeshBasicMaterial({
            map: this.texture,
            transparent: true,
            side: THREE.DoubleSide,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1
        });
        const panel = new THREE.Mesh(panelGeo, panelMat);
        panel.name = 'SpectrumPanelMesh';
        this.group.add(panel);

        // Dark bevel backing frame
        const frameGeo = new THREE.BoxGeometry(0.49, 0.28, 0.015);
        const frameMat = new THREE.MeshStandardMaterial({
            color: 0x0f172a,
            roughness: 0.3,
            metalness: 0.7,
        });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.z = -0.012;
        this.group.add(frame);

        // Close button at top right
        const closeGeo = new THREE.CircleGeometry(0.018, 16);
        const closeMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide });
        this.closeBtnMesh = new THREE.Mesh(closeGeo, closeMat);
        this.closeBtnMesh.name = 'SpectrumCloseBtn';
        this.closeBtnMesh.userData = { isSpectrumClose: true };
        this.closeBtnMesh.position.set(0.22, 0.115, 0.005);
        this.group.add(this.closeBtnMesh);

        // Close 'X' symbol
        const xMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1
        });
        const x1 = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 0.004), xMat);
        x1.rotation.z = Math.PI / 4;
        x1.position.z = 0.002;
        this.closeBtnMesh.add(x1);
        const x2 = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 0.004), xMat);
        x2.rotation.z = -Math.PI / 4;
        x2.position.z = 0.0024;
        this.closeBtnMesh.add(x2);

        scene.add(this.group);
    }

    public show(sampleName: string) {
        const data = SPECTRAL_DATA[sampleName] || {
            element: sampleName,
            symbol: '?',
            transition: 'Atomic line emission spectra',
            lines: [
                { wavelength: 550, color: '#00e5ff', intensity: 1.0, label: '550 nm' }
            ]
        };

        this.drawSpectrum(data);
        this.autoHideTimer = 18; // auto-hide after 18 seconds
        this.group.visible = true;
    }

    public hide() {
        this.group.visible = false;
    }

    public isVisible(): boolean {
        return this.group.visible;
    }

    public checkPoke(pokePos: THREE.Vector3): boolean {
        if (!this.group.visible) return false;
        const closePos = new THREE.Vector3();
        this.closeBtnMesh.getWorldPosition(closePos);
        if (pokePos.distanceTo(closePos) < 0.12) {
            this.hide();
            return true;
        }
        return false;
    }

    public getCloseButtonMesh(): THREE.Mesh {
        return this.closeBtnMesh;
    }

    private drawSpectrum(data: { element: string; symbol: string; transition: string; lines: SpectralLine[] }) {
        const ctx = this.canvas.getContext('2d')!;
        ctx.clearRect(0, 0, 640, 360);

        // Background
        ctx.fillStyle = 'rgba(10, 15, 26, 0.95)';
        ctx.fillRect(0, 0, 640, 360);

        // Border
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 3;
        ctx.strokeRect(3, 3, 634, 354);

        // Header
        ctx.fillStyle = '#00e5ff';
        ctx.font = 'bold 20px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`ATOMIC EMISSION SPECTRUM`, 20, 34);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 16px system-ui, sans-serif';
        ctx.fillText(`${data.element} (${data.symbol}) — Characteristic Lines`, 20, 62);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '13px system-ui, sans-serif';
        ctx.fillText(`Transition: ${data.transition}`, 20, 84);

        // Spectrometer absorption/emission window
        const barX = 30;
        const barY = 110;
        const barW = 580;
        const barH = 110;
        const minLambda = 380;
        const maxLambda = 750;

        // Dark continuous spectrometer background
        ctx.fillStyle = '#05070c';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barW, barH);

        // Reference wavelength grid lines & labels (400, 450, 500, 550, 600, 650, 700 nm)
        ctx.fillStyle = '#64748b';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';

        for (let l = 400; l <= 700; l += 50) {
            const lx = barX + ((l - minLambda) / (maxLambda - minLambda)) * barW;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.beginPath();
            ctx.moveTo(lx, barY);
            ctx.lineTo(lx, barY + barH);
            ctx.stroke();

            ctx.fillText(`${l} nm`, lx, barY + barH + 18);
        }

        // Draw bright emission lines
        for (const line of data.lines) {
            const lx = barX + ((line.wavelength - minLambda) / (maxLambda - minLambda)) * barW;

            // Emission line glow bloom
            const glowGrad = ctx.createLinearGradient(lx - 8, barY, lx + 8, barY);
            glowGrad.addColorStop(0, 'rgba(0,0,0,0)');
            glowGrad.addColorStop(0.5, line.color);
            glowGrad.addColorStop(1, 'rgba(0,0,0,0)');

            ctx.fillStyle = glowGrad;
            ctx.globalAlpha = 0.5 * line.intensity;
            ctx.fillRect(lx - 8, barY, 16, barH);

            // Sharp central emission slit
            ctx.fillStyle = line.color;
            ctx.globalAlpha = 1.0;
            ctx.fillRect(lx - 1.5, barY, 3, barH);

            // High-intensity white center for bright lines
            if (line.intensity > 0.8) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(lx - 0.5, barY, 1, barH);
            }

            // Line indicator arrow above
            ctx.fillStyle = line.color;
            ctx.beginPath();
            ctx.moveTo(lx, barY - 4);
            ctx.lineTo(lx - 4, barY - 12);
            ctx.lineTo(lx + 4, barY - 12);
            ctx.closePath();
            ctx.fill();
        }

        ctx.globalAlpha = 1.0;

        // Line annotation list below
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 13px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Observed Photons:', 20, 275);

        ctx.font = '12px monospace';
        let lineSummary = data.lines.map(l => l.label || `${l.wavelength} nm`).join('   •   ');
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(lineSummary, 20, 298);

        // Scientific note
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'italic 12px system-ui, sans-serif';
        ctx.fillText('ΔE = hν = hc/λ: Electrons excited by heat release specific wavelengths.', 20, 328);

        this.texture.needsUpdate = true;
    }

    public update(delta: number) {
        if (!this.group.visible) return;

        this.timer += delta;
        if (this.autoHideTimer > 0) {
            this.autoHideTimer -= delta;
            if (this.autoHideTimer <= 0) {
                this.hide();
            }
        }
    }
}
