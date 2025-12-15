import React, { useEffect, useRef } from 'react';

const KintsugiCursor = () => {
    const canvasRef = useRef(null);
    const pointsRef = useRef([]);
    const branchesRef = useRef([]);
    const particlesRef = useRef([]);
    const lastPosRef = useRef({ x: 0, y: 0, time: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        // --- Configuration ---
        const CONFIG = {
            goldBase: 'rgba(218, 165, 32, 1)',   // Solid Goldenrod
            goldCore: 'rgba(255, 255, 240, 0.9)', // Ivory/White core for shine
            goldGlow: 'rgba(255, 140, 0, 0.3)',   // Dark Orange glow
            widthBase: 8,       // Slightly reduced from 12
            widthVar: 4.5, // How much velocity affects width
            lifeSpan: 50,
            branchChance: 0.08, // Slightly lower chance for cleaner look
            particleChance: 0.3, // Chance per frame to spawn dust
        };

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

            // --- 1. Main Trail Logic ---
            // Viscosity: Weighted average for width to simulate liquid
            // Slow = Thick, Fast = Thin
            const targetWidth = Math.max(1, CONFIG.widthBase - Math.min(velocity * 0.8, CONFIG.widthVar));

            // Look at previous point to smooth transitions
            const lastPoint = pointsRef.current[pointsRef.current.length - 1];
            const width = lastPoint ? lastPoint.width * 0.8 + targetWidth * 0.2 : targetWidth;

            const point = {
                x: e.clientX,
                y: e.clientY,
                age: 0,
                life: CONFIG.lifeSpan,
                width: width,
                vx: dx * 0.1, // Momentum for particles
                vy: dy * 0.1
            };
            pointsRef.current.push(point);

            // --- 2. Branching Logic (Fractals) ---
            if (dist > 5 && Math.random() < CONFIG.branchChance) {
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
                // Velocity is approx pixels/ms. 5 is fast, 0.5 is slow.
                // Dynamic range: 50px (tiny) to 800px (massive)
                const speedFactor = Math.min(velocity, 10); // Higher cap
                const length = 50 + (speedFactor * 75) + (Math.random() * 50);

                const endX = e.clientX + Math.cos(branchAngle) * length;
                const endY = e.clientY + Math.sin(branchAngle) * length;

                // Generate fractal path immediately - increase displacement based on length
                // Longer lines = wilder jaggedness (displacement)
                const displacement = length / 8;
                const path = generateFractalPath(e.clientX, e.clientY, endX, endY, displacement);

                branchesRef.current.push({
                    path: path,
                    life: 40,
                    maxLife: 40,
                    width: Math.random() * 5 + 3 // Thick branches (3px to 8px)
                });
            }

            // --- 3. Particle Spawning ---
            if (Math.random() < CONFIG.particleChance) {
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
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Common styles for "Liquid Gold"
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // --- Render Branches ---
            // Pass 1: Glow
            ctx.shadowBlur = 15;
            ctx.shadowColor = CONFIG.goldGlow;

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
                    // We need to draw segments to support tapering width along the branch
                    for (let j = 0; j < branch.path.length - 1; j++) {
                        const pStart = branch.path[j];
                        const pEnd = branch.path[j + 1];

                        // Taper: Width decreases from base to tip
                        const progress = j / (branch.path.length - 1);
                        const segmentWidth = Math.max(0.5, branch.width * (1 - progress));

                        ctx.beginPath();
                        ctx.moveTo(pStart.x, pStart.y);
                        ctx.lineTo(pEnd.x, pEnd.y);

                        // 1. Glow/Shadow (Only draw every few segments to save perf?)
                        // actually, drawing 3 passes per segment is heavy. 
                        // Let's optimize: Draw WHOLE branch 3 times, but with varying width? 
                        // Canvas strokes are constant width. We MUST simulate taper.

                        // Metallic 3-Pass for Each Segment

                        // 1. Glow
                        ctx.globalAlpha = opacity * 0.5;
                        ctx.strokeStyle = CONFIG.goldGlow;
                        ctx.lineWidth = segmentWidth + 4;
                        ctx.stroke();

                        // 2. Base
                        ctx.globalAlpha = opacity;
                        ctx.strokeStyle = CONFIG.goldBase;
                        ctx.lineWidth = segmentWidth;
                        ctx.stroke();

                        // 3. Core
                        ctx.strokeStyle = CONFIG.goldCore;
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
                // We keep the glow simple (one path) for performance and "bloom" consistency
                // Tapering the glow is less critical, but let's try to match the body
                ctx.shadowBlur = 20;
                ctx.shadowColor = CONFIG.goldGlow;
                ctx.strokeStyle = CONFIG.goldGlow;
                ctx.beginPath();
                // Draw as one continuous line for the glow to prevent segment artifacts
                for (let i = 0; i < pointsRef.current.length - 1; i++) {
                    const p1 = pointsRef.current[i];
                    const p2 = pointsRef.current[i + 1];
                    const midX = (p1.x + p2.x) / 2;
                    const midY = (p1.y + p2.y) / 2;
                    if (i === 0) ctx.moveTo(p1.x, p1.y);
                    ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
                }
                ctx.lineCap = 'round';
                ctx.lineWidth = CONFIG.widthBase + 6;
                ctx.globalAlpha = 0.4;
                ctx.stroke();

                // Pass 2 & 3: Liquid Body (Variable Width Segments)
                ctx.shadowBlur = 0;

                for (let i = 0; i < pointsRef.current.length - 1; i++) {
                    const p1 = pointsRef.current[i];
                    const p2 = pointsRef.current[i + 1];

                    // Inverse Taper: Points start sharp and diffuse/widen as they age
                    // Start at 40% width, grow to 120% width before dying
                    const ageProgress = p1.age / p1.life;
                    const widthMultiplier = 0.4 + (ageProgress * 1.5);
                    const currentWidth = p1.width * widthMultiplier;

                    const midX = (p1.x + p2.x) / 2;
                    const midY = (p1.y + p2.y) / 2;

                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
                    ctx.lineTo(p2.x, p2.y);

                    // Base Gold
                    // Opacity still fades out
                    const opacity = 1 - ageProgress;
                    ctx.globalAlpha = opacity;

                    ctx.strokeStyle = CONFIG.goldBase;
                    ctx.lineWidth = Math.max(0.5, currentWidth);
                    ctx.stroke();

                    // Core Highlight (The "Shine")
                    // Core fades faster to look like it's cooling down
                    ctx.globalAlpha = opacity * 0.8;
                    ctx.strokeStyle = CONFIG.goldCore;
                    // Core starts sharp but doesn't widen as much as the base (stays concentrated)
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

                // Physics
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.02; // Gravity (heavy gold dust)

                const opacity = p.life / p.maxLife;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = opacity;

                // Sparkle effect
                if (Math.random() < 0.1) {
                    ctx.globalAlpha = 1;
                    ctx.shadowColor = '#fff';
                    ctx.shadowBlur = 10;
                } else {
                    ctx.shadowBlur = 0;
                }

                ctx.fill();
            }

            // Age points
            pointsRef.current.forEach(p => p.age++);
            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                pointerEvents: 'none',
                zIndex: 9998,
                filter: 'drop-shadow(0 0 5px rgba(218, 165, 32, 0.4))' // CSS post-process bloom
            }}
        />
    );
};

export default KintsugiCursor;
