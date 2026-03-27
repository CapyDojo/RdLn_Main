import React, { useEffect, useRef } from 'react';
import { useControls, folder } from 'leva';

const KintsugiCursor = () => {
    const canvasRef = useRef(null);
    const pointsRef = useRef([]);
    const branchesRef = useRef([]);
    const particlesRef = useRef([]);
    const lastPosRef = useRef({ x: 0, y: 0, time: 0 });

    // --- Leva Configuration ---
    const config = useControls('Kintsugi Options', {
        'Energy Flash': folder({
            flashDuration: { value: 4, min: 1, max: 20, step: 1, label: 'Duration (Frames)' },
            flashBloom: { value: 8, min: 0, max: 30, step: 0.5, label: 'Bloom Radius' },
            flashOpacity: { value: 0.8, min: 0, max: 1, step: 0.05, label: 'Flash Opacity' },
            velocityTriggerInfo: { value: 'Higher sensitivity = flashes at lower speeds', editable: false },
        }),
        'Kintsugi Physics': folder({
            widthBase: { value: 8, min: 1, max: 20, step: 0.5, label: 'Stroke Width' },
            velocitySensitivity: { value: 0.012, min: 0.001, max: 0.05, step: 0.001, label: 'Crack Sensitivity' },
            branchLife: { value: 40, min: 10, max: 100, step: 1, label: 'Crack Lifespan' },
            branchLength: { value: 1.0, min: 0.5, max: 3.0, step: 0.1, label: 'Crack Length Multiplier' },
            violentThreshold: { value: 5, min: 0, max: 20, step: 0.5, label: 'Violent Speed Threshold' },
        }),
        'Palette': folder({
            goldBase: { value: 'rgba(218, 165, 32, 1)', label: 'Gold Base' },
            goldCore: { value: 'rgba(255, 255, 240, 0.9)', label: 'Ivory Core' },
            goldGlow: { value: 'rgba(255, 140, 0, 0.3)', label: 'Orange Glow' },
        })
    });

    // Make config accessible to the effect via ref to avoid re-binding event listeners on every change
    const configRef = useRef(config);
    useEffect(() => {
        configRef.current = config;
    }, [config]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        // --- Helpers ---
        // Recursive fractal path generator
        const generateFractalPath = (x1, y1, x2, y2, displacement) => {
            if (displacement < 1) {
                return [{ x: x1, y: y1 }, { x: x2, y: y2 }];
            }

            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;

            // Perpendicular random displacement
            const dx = x2 - x1;
            const dy = y2 - y1;
            const normalX = -dy;
            const normalY = dx;
            const len = Math.sqrt(normalX * normalX + normalY * normalY);

            const jitter = (Math.random() - 0.5) * displacement;
            const dX = (normalX / len) * jitter;
            const dY = (normalY / len) * jitter;

            // Reduce displacement for recursion to simulate lightning/cracks
            const newDisp = displacement / 2;

            const left = generateFractalPath(x1, y1, midX + dX, midY + dY, newDisp);
            const right = generateFractalPath(midX + dX, midY + dY, x2, y2, newDisp);

            return left.concat(right.slice(1));
        };

        const handleMouseMove = (e) => {
            const now = Date.now();
            const dt = Math.max(1, now - lastPosRef.current.time);
            const dx = e.clientX - lastPosRef.current.x;
            const dy = e.clientY - lastPosRef.current.y;
            const dist = Math.hypot(dx, dy);
            const velocity = dist / dt;

            const cfg = configRef.current; // Real-time config access

            // --- 1. Main Trail Logic ---
            // Viscosity: Weighted average for width to simulate liquid
            // Slow = Thick, Fast = Thin
            const targetWidth = Math.max(1, cfg.widthBase - Math.min(velocity * 0.8, 4.5));

            // Look at previous point to smooth transitions
            const lastPoint = pointsRef.current[pointsRef.current.length - 1];
            const width = lastPoint ? lastPoint.width * 0.8 + targetWidth * 0.2 : targetWidth;

            const point = {
                x: e.clientX,
                y: e.clientY,
                age: 0,
                life: 50,
                width: width,
                vx: dx * 0.1, // Momentum for particles
                vy: dy * 0.1
            };
            pointsRef.current.push(point);

            // --- 2. Branching Logic (Fractals) ---
            // Dynamic Chance: Higher velocity = More cracks (Stress)
            // Modified mainly by velocitySensitivity from controls
            const dynamicBranchChance = Math.min(0.35, 0.002 + (velocity * velocity * cfg.velocitySensitivity));

            if (dist > 5 && Math.random() < dynamicBranchChance) {
                const angle = Math.atan2(dy, dx);

                // Varied angles: Exclude perpendicular (90 deg) angles
                // We want either "forward-ish" or "backward-ish" but not "sideways T-bone"
                let offset;
                if (Math.random() < 0.65) {
                    // Forward cone: +/- 50 degrees (approx 0.9 rads)
                    offset = (Math.random() - 0.5) * 1.8;
                } else {
                    // Backward cone: +/- 50 degrees from rear
                    offset = Math.PI + (Math.random() - 0.5) * 1.8;
                }
                const branchAngle = angle + offset;

                // Length proportional to velocity (ferocity)
                const speedFactor = Math.min(velocity, 10);
                const baseLength = (75 + (speedFactor * 90) + (Math.random() * 80));

                // Apply multiplier from Leva config
                const length = baseLength * (cfg.branchLength || 1.0);

                const endX = e.clientX + Math.cos(branchAngle) * length;
                const endY = e.clientY + Math.sin(branchAngle) * length;

                const displacement = length / 8;
                const path = generateFractalPath(e.clientX, e.clientY, endX, endY, displacement);

                branchesRef.current.push({
                    path: path,
                    life: cfg.branchLife,
                    maxLife: cfg.branchLife,
                    width: Math.random() * 5 + 3,
                    isViolent: velocity > cfg.violentThreshold
                });
            }

            // --- 3. Particle Spawning ---
            if (Math.random() < 0.3) {
                particlesRef.current.push({
                    x: e.clientX + (Math.random() - 0.5) * 10,
                    y: e.clientY + (Math.random() - 0.5) * 10,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() * 0.5) + 0.5, // Gravity
                    life: 60 + Math.random() * 40,
                    maxLife: 100,
                    size: Math.random() * 2 + 0.5,
                    color: Math.random() > 0.5 ? '#ffd700' : '#ffffff' // Gold or White sparkle
                });
            }

            lastPosRef.current = { x: e.clientX, y: e.clientY, time: now };
        };

        window.addEventListener('mousemove', handleMouseMove);

        const render = () => {
            const cfg = configRef.current; // Real-time config access
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Common styles for "Liquid Gold"
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // --- Render Branches ---
            // Pass 1: Glow
            ctx.shadowBlur = 15;
            ctx.shadowColor = cfg.goldGlow;

            for (let i = branchesRef.current.length - 1; i >= 0; i--) {
                const branch = branchesRef.current[i];
                branch.life--;
                if (branch.life <= 0) {
                    branchesRef.current.splice(i, 1);
                    continue;
                }

                const opacity = branch.life / branch.maxLife;

                // Draw segments individually for tapering
                if (branch.path.length > 0) {
                    // "Healing" Effect
                    const lifeRatio = branch.life / branch.maxLife;
                    const visibleRatio = Math.pow(lifeRatio, 0.5);
                    const visibleIndexLimit = Math.floor(branch.path.length * visibleRatio);

                    for (let j = 0; j < visibleIndexLimit && j < branch.path.length - 1; j++) {
                        const pStart = branch.path[j];
                        const pEnd = branch.path[j + 1];
                        const taperFactor = 1 - (j / (branch.path.length - 1));
                        const segmentWidth = Math.max(0.5, branch.width * taperFactor);

                        ctx.beginPath();
                        ctx.moveTo(pStart.x, pStart.y);
                        ctx.lineTo(pEnd.x, pEnd.y);

                        // Flash Effect: Uses Leva config
                        const isFresh = branch.maxLife - branch.life < cfg.flashDuration;

                        // 1. Glow
                        ctx.globalAlpha = isFresh ? cfg.flashOpacity : opacity * 0.5;
                        ctx.strokeStyle = isFresh ? '#FFFFFF' : cfg.goldGlow;
                        ctx.lineWidth = segmentWidth + (isFresh ? cfg.flashBloom : 4);
                        ctx.stroke();

                        // 2. Base
                        ctx.globalAlpha = isFresh ? 1.0 : opacity;
                        ctx.strokeStyle = isFresh ? '#FFFFFF' : cfg.goldBase;
                        ctx.lineWidth = segmentWidth;
                        ctx.stroke();

                        // 3. Core
                        ctx.strokeStyle = cfg.goldCore;
                        ctx.lineWidth = Math.max(0.5, segmentWidth * 0.3);
                        ctx.stroke();
                    }
                }
            }
            ctx.globalAlpha = 1; // Reset

            // --- Render Main Trail ---
            pointsRef.current = pointsRef.current.filter(p => p.age < p.life);

            if (pointsRef.current.length > 1) {
                // Pass 1: Glow (Underneath)
                ctx.shadowBlur = 20;
                ctx.shadowColor = cfg.goldGlow;
                ctx.strokeStyle = cfg.goldGlow;
                ctx.beginPath();
                for (let i = 0; i < pointsRef.current.length - 1; i++) {
                    const p1 = pointsRef.current[i];
                    const p2 = pointsRef.current[i + 1];
                    const midX = (p1.x + p2.x) / 2;
                    const midY = (p1.y + p2.y) / 2;
                    if (i === 0) ctx.moveTo(p1.x, p1.y);
                    ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
                }
                ctx.lineCap = 'round';
                ctx.lineWidth = cfg.widthBase + 6;
                ctx.globalAlpha = 0.4;
                ctx.stroke();

                // Pass 2 & 3: Liquid Body
                ctx.shadowBlur = 0;

                for (let i = 0; i < pointsRef.current.length - 1; i++) {
                    const p1 = pointsRef.current[i];
                    const p2 = pointsRef.current[i + 1];

                    const ageProgress = p1.age / p1.life;
                    const widthMultiplier = 0.4 + (ageProgress * 1.5);
                    const currentWidth = p1.width * widthMultiplier;

                    const midX = (p1.x + p2.x) / 2;
                    const midY = (p1.y + p2.y) / 2;

                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
                    ctx.lineTo(p2.x, p2.y);

                    const opacity = 1 - ageProgress;
                    ctx.globalAlpha = opacity;

                    ctx.strokeStyle = cfg.goldBase;
                    ctx.lineWidth = Math.max(0.5, currentWidth);
                    ctx.stroke();

                    // Core Highlight
                    ctx.globalAlpha = opacity * 0.8;
                    ctx.strokeStyle = cfg.goldCore;
                    ctx.lineWidth = Math.max(0.5, currentWidth * 0.3);
                    ctx.stroke();
                }
            }

            // --- Render Particles ---
            for (let i = particlesRef.current.length - 1; i >= 0; i--) {
                const p = particlesRef.current[i];
                p.life--;
                if (p.life <= 0) {
                    particlesRef.current.splice(i, 1);
                    continue;
                }

                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.02;

                const opacity = p.life / p.maxLife;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = opacity;

                if (Math.random() < 0.1) {
                    ctx.globalAlpha = 1;
                    ctx.shadowColor = '#fff';
                    ctx.shadowBlur = 10;
                } else {
                    ctx.shadowBlur = 0;
                }

                ctx.fill();
            }

            pointsRef.current.forEach(p => p.age++);
            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []); // Empty dependency array - we use refs for config access

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                pointerEvents: 'none',
                zIndex: 9998,
                filter: 'drop-shadow(0 0 5px rgba(218, 165, 32, 0.4))'
            }}
        />
    );
};

export default KintsugiCursor;
