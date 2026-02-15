import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useControls, folder } from 'leva';

const ParticleCursor = () => {
    const mountRef = useRef(null);
    // Track mouse position specifically for the repel effect
    const mouseRef = useRef(new THREE.Vector3(0, 0, 0));

    // Configuration with Leva
    const config = useControls('Particle Options', {
        'Visuals': folder({
            particleCount: { value: 600, min: 100, max: 2000, step: 50 },
            particleSize: { value: 3.5, min: 0.5, max: 8, step: 0.1 },
            color: { value: '#ffd700', label: 'Color' },
        }),
        'Interaction': folder({
            repelRadius: { value: 120, min: 50, max: 500, step: 10 },
            repelStrength: { value: 5, min: 0, max: 10, step: 0.1 },
        }),
        'Physics': folder({
            friction: { value: 0.96, min: 0.9, max: 0.99, step: 0.001 },
            floatSpeed: { value: 0.5, min: 0, max: 2, step: 0.1 }
        })
    });

    // Ref pattern to avoid re-initializing Three.js on every config change
    const configRef = useRef(config);
    useEffect(() => {
        configRef.current = config;
    }, [config]);

    useEffect(() => {
        const currentMount = mountRef.current;
        let animationFrameId;

        // Scene Setup
        const scene = new THREE.Scene();
        // Perspective adds depth
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 400;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        currentMount.appendChild(renderer.domElement);

        // Particle System
        const maxParticleCount = 2000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(maxParticleCount * 3);
        const velocities = new Float32Array(maxParticleCount * 3); // vx, vy, vz

        // Initialize Particles
        for (let i = 0; i < maxParticleCount; i++) {
            const x = (Math.random() - 0.5) * window.innerWidth * 1.5;
            const y = (Math.random() - 0.5) * window.innerHeight * 1.5;
            const z = (Math.random() - 0.5) * 400; // Depth

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Texture for soft glowing particles
        const sprite = new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/sprites/spark1.png');

        const material = new THREE.PointsMaterial({
            color: new THREE.Color(config.color),
            size: config.particleSize,
            map: sprite,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            opacity: 0.8
        });

        const particles = new THREE.Points(geometry, material);
        scene.add(particles);

        // Raycaster for accurate mouse interaction in 3D space
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); // Plane at z=0

        const handleMouseMove = (event) => {
            // Normalized Device Coordinates (-1 to +1)
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            // Update raycaster to find world position on z=0 plane
            raycaster.setFromCamera(mouse, camera);
            const target = new THREE.Vector3();
            raycaster.ray.intersectPlane(plane, target);
            mouseRef.current.copy(target);
        };

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('resize', handleResize);

        // Animation Loop
        const animate = () => {
            const cfg = configRef.current;

            // Dynamic Material Updates
            material.size = cfg.particleSize;
            material.color.set(cfg.color);

            // Control active count via DrawRange (cheaper than recreating geometry)
            geometry.setDrawRange(0, Math.min(maxParticleCount, cfg.particleCount));

            const posAttribute = geometry.attributes.position;
            const posArray = posAttribute.array;

            // Mouse Interaction Position
            const mx = mouseRef.current.x;
            const my = mouseRef.current.y;
            const radiusSq = cfg.repelRadius * cfg.repelRadius;

            // Physics Update
            for (let i = 0; i < maxParticleCount; i++) {
                if (i > cfg.particleCount) break; // Skip checking invisible ones

                let px = posArray[i * 3];
                let py = posArray[i * 3 + 1];
                let pz = posArray[i * 3 + 2];

                let vx = velocities[i * 3];
                let vy = velocities[i * 3 + 1];
                let vz = velocities[i * 3 + 2];

                // 1. Base Float Movement
                const noiseScale = 0.002;
                const time = Date.now() * 0.0005;
                vx += Math.sin(py * noiseScale + time) * 0.02 * cfg.floatSpeed;
                vy += Math.cos(px * noiseScale + time) * 0.02 * cfg.floatSpeed;

                // 2. Mouse Repel
                const dx = px - mx;
                const dy = py - my;
                const distSq = dx * dx + dy * dy;

                if (distSq < radiusSq) {
                    const dist = Math.sqrt(distSq);
                    const force = (cfg.repelRadius - dist) / cfg.repelRadius; // 0 to 1

                    const angle = Math.atan2(dy, dx);
                    const repelFactor = force * cfg.repelStrength;

                    vx += Math.cos(angle) * repelFactor;
                    vy += Math.sin(angle) * repelFactor;
                }

                // Physics Integration
                px += vx;
                py += vy;
                pz += vz;

                // Friction
                vx *= cfg.friction;
                vy *= cfg.friction;
                vz *= cfg.friction;

                // Wrap boundaries

                // Texture wrap boundaries - hard coded for now based on perspective camera z=400
                if (px > 800) px = -800;
                if (px < -800) px = 800;
                if (py > 500) py = -500;
                if (py < -500) py = 500;

                posArray[i * 3] = px;
                posArray[i * 3 + 1] = py;
                posArray[i * 3 + 2] = pz;

                velocities[i * 3] = vx;
                velocities[i * 3 + 1] = vy;
                velocities[i * 3 + 2] = vz;
            }

            posAttribute.needsUpdate = true;
            renderer.render(scene, camera);
            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);

            if (currentMount) {
                currentMount.removeChild(renderer.domElement);
            }
            // Dispose
            geometry.dispose();
            material.dispose();
            renderer.dispose();
            sprite.dispose();
        };
    }, []); // Run once on mount

    return (
        <div
            ref={mountRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 0, // Behind content but visible
                pointerEvents: 'none',
                opacity: 0.8
            }}
        />
    );
};

export default ParticleCursor;
