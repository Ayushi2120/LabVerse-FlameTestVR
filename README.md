# Labverse: Flame Test VR 🧪🔥

An interactive, high-fidelity WebXR virtual reality laboratory simulation of the analytical chemistry Flame Test experiment, built with Three.js, Vite, and TypeScript.

Supports both **Meta Quest WebXR natural hand tracking (6-DoF rigid grab & release)** and **Desktop 3D pointer-drag simulation**.

---

## 🌟 Key Features

- **Realistic Physics & Chemistry Simulation:**
  - 6 analytical mystery salt samples: Lithium Chloride (Crimson), Sodium Chloride (Golden Yellow), Potassium Chloride (Pale Lilac), Calcium Chloride (Brick Red), Copper(II) Chloride (Blue-Green), and Strontium Chloride (Scarlet Red).
  - Interactive Bunsen Burner with realistic bloom combustion shader, gas blue idle flame, and element-specific optical emission spectra.
  - Interactive Nitrile Safety Gloves dispenser with hand tinting and requirement enforcement.
- **Natural Platinum Wire Interaction:**
  - **Desktop Mouse Drag:** Click and hold left mouse button to pick up the wire with exact grab-offset preservation (zero jumping or teleportation). Move across the workbench in real time and scroll the mouse wheel to adjust vertical height. Release the mouse button to drop the wire at its current position.
  - **Meta Quest Tracked Hands:** Real-time pinch and fist grab gesture detection using WebXR hand joints. Rigid 6-DoF attachment in hand coordinate space, smooth dipping into salt dishes, and natural release on opening fingers.
- **Scientific HUD & Subsystems:**
  - 3D Floating Orientation Screen with step-by-step experiment gating.
  - 3D Observation Lab Book with dynamic record entries and page turning.
  - 3D Spectroscopic Result Display with emission wavelength analysis.
  - Hidden Easter Eggs: Quantum C60 Buckminsterfullerene & Hogwarts Golden Snitch with magical dimension transition.

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Build for production
npm run build

# 4. Preview production build
npm run preview
```

Open `https://localhost:5173/` in your browser. For Meta Quest VR, launch the URL in the Meta Quest Browser and click **🥽 ENTER VR**.

---

## 🎮 Controls

### Desktop 3D Mode
- **Left Mouse Click & Drag:** Grab and move the Platinum Wire in real time
- **Mouse Wheel:** Raise or lower wire height (lift out of dish / into burner flame)
- **Mouse Click:** Interact with buttons, gloves, switches, and screens
- **WASD:** Walk around the laboratory
- **Mouse Look:** Look around (when clicking background floor)
- **Q:** Release wire at current position
- **E / G:** Toggle wire grab
- **L:** Toggle Bunsen Burner power
- **R:** Reset experiment
- **Esc:** Free mouse cursor

### Meta Quest VR Mode
- **Natural Hand Pinch / Fist:** Grab the platinum wire near the stand or workbench
- **Natural Hand Open:** Release and drop the wire at its current position
- **Index Finger Poke:** Press buttons on the 3D Orientation Screen, Nitrile Gloves Dispenser, Bunsen Burner switch, and Wall Exit VR Pedestal
- **Controllers:** Squeeze grip to grab wire, trigger to select
