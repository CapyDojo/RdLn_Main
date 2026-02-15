# Particle Cursor Prototype Plan
**Date:** 2026-02-15
**Type:** Prototype Documentation
**Status:** Implemented (Beta)

## 1. Overview
This prototype introduces a **3D Particle Cursor** effect as a potential replacement or alternative to the previous "Kintsugi" cursor. It is inspired by modern "background particle" web trends, designed to create a premium, fluid, and "dopaminergic" user interaction.

The effect consists of thousands of soft, glowing particles that float in a 3D space and gently repel from the user's mouse cursor, simulating a "parting of the sea" physics interaction.

## 2. Technical Implementation
*   **Library:** `Three.js` (for WebGL rendering) + `React-Three-Fiber` (not used here, raw Three.js used for granular control).
*   **Performance Strategy:**
    *   **BufferGeometry:** Uses a single geometry with `Float32Array` attributes for positions and velocities, allowing for thousands of particles with minimal draw calls.
    *   **DrawRange:** Optimizes rendering by only drawing the active number of particles specified in the config, without needing to rebuild geometry.
    *   **Ref Pattern:** Uses `useRef` to bridge React state (Leva controls) and the Three.js animation loop, preventing expensive React re-renders.
*   **Controls:** Integrated with `Leva` for real-time parameter tuning.
*   **File Path:** `src/components/ParticleCursor.jsx`

## 3. Configuration Parameters (Leva)
The following controls are available in the "Particle Options" panel:

| Parameter | Default | Description |
| :--- | :--- | :--- |
| **Particle Count** | 600 | Number of active particles (Max 2000). |
| **Particle Size** | 3.5 | Visual size of each particle dot. |
| **Color** | Gold (#ffd700) | Hex color code for the particles. |
| **Repel Radius** | 120 | The distance at which particles start moving away from the mouse. |
| **Repel Strength** | 5 | How fast/forcefully particles move away. |
| **Friction** | 0.96 | Velocity decay (0.9 = thick fluid, 0.99 = slippery ice). |
| **Float Speed** | 0.5 | Speed of the ambient "breathing" or floating animation. |

## 4. Usage & Switching
To toggle between the **Kintsugi Cursor** and the **Particle Cursor**, edit `src/App.jsx`:

### Enable Particle Cursor (Current)
```javascript
import ParticleCursor from './components/ParticleCursor';
// import KintsugiCursor from './components/KintsugiCursor';

// ... inside JSX ...
<ParticleCursor />
{/* <KintsugiCursor /> */}
```

### Revert to Kintsugi Cursor
```javascript
// import ParticleCursor from './components/ParticleCursor';
import KintsugiCursor from './components/KintsugiCursor';

// ... inside JSX ...
{/* <ParticleCursor /> */}
<KintsugiCursor />
```

## 5. Improvement Roadmap
Potential enhancements if this prototype is selected for production:

*   **Shader Material:** Move physics calculation to a GLSL shader (`GPGPU`) for 100,000+ particles capability.
*   **Interactive Fluid:** Add "drag" force so particles follow the mouse before repelling, creating a trail.
*   **Depth of Field:** Use post-processing to blur distant particles for a true cinematic look.
*   **Texture Variation:** Use different sprite textures for varied particle aesthetics (stars, dust, bokeh).
