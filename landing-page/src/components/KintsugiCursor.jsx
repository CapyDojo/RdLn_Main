import React, { useEffect, useRef } from 'react';

const KintsugiCursor = () => {
    const canvasRef = useRef(null);
    const pointsRef = useRef([]);
    const branchesRef = useRef([]);
    const lastPosRef = useRef({ x: 0, y: 0, time: 0 });

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

        const handleMouseMove = (e) => {
            const now = Date.now();
            const dt = Math.max(1, now - lastPosRef.current.time);
            const dx = e.clientX - lastPosRef.current.x;
            const dy = e.clientY - lastPosRef.current.y;
            const dist = Math.hypot(dx, dy);
            const velocity = dist / dt; // pixels per ms

            // Jitter for organic feel
            const jitter = 1.5;
            const jx = (Math.random() - 0.5) * jitter;
            const jy = (Math.random() - 0.5) * jitter;

            // Calculate width: Slow = Thick (pooling), Fast = Thin (streaking)
            // Velocity usually ranges 0.1 to 5+
            const targetWidth = Math.max(1.5, Math.min(6, 8 - velocity * 3));

            const point = {
                x: e.clientX + jx,
                y: e.clientY + jy,
                age: 0,
                life: 40, // Longer life for trail
                width: targetWidth
            };

            pointsRef.current.push(point);

            // Branching logic: "Cracks" shooting off
            // Only branch if moving fast enough to create force
            if (dist > 5 && Math.random() < 0.15) {
                const angle = Math.atan2(dy, dx);
                // Branch roughly perpendicular
                const branchAngle = angle + (Math.random() < 0.5 ? 1.5 : -1.5) + (Math.random() - 0.5) * 0.5;
                const speed = Math.random() * 3 + 1;

                branchesRef.current.push({
                    x: e.clientX,
                    y: e.clientY,
                    vx: Math.cos(branchAngle) * speed,
                    vy: Math.sin(branchAngle) * speed,
                    life: 20,
                    maxLife: 20,
                    width: Math.random() * 2 + 0.5,
                    path: [{ x: e.clientX, y: e.clientY }]
                });
            }

            lastPosRef.current = { x: e.clientX, y: e.clientY, time: now };
        };

        window.addEventListener('mousemove', handleMouseMove);

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // --- Render Branches ---
            // Update branches
            for (let i = branchesRef.current.length - 1; i >= 0; i--) {
                const branch = branchesRef.current[i];
                branch.life--;
                if (branch.life <= 0) {
                    branchesRef.current.splice(i, 1);
                    continue;
                }

                // Grow branch
                branch.x += branch.vx;
                branch.y += branch.vy;
                branch.path.push({ x: branch.x, y: branch.y });

                // Draw branch
                ctx.beginPath();
                ctx.moveTo(branch.path[0].x, branch.path[0].y);
                for (let p of branch.path) {
                    ctx.lineTo(p.x, p.y);
                }
                ctx.strokeStyle = `rgba(202, 138, 4, ${branch.life / branch.maxLife})`;
                ctx.lineWidth = branch.width;
                ctx.stroke();
            }

            // --- Render Main Trail ---
            // Filter dead points
            pointsRef.current = pointsRef.current.filter(p => p.age < p.life);

            if (pointsRef.current.length > 1) {
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#ca8a04'; // Gold glow

                // Draw segments individually to support variable width
                for (let i = 0; i < pointsRef.current.length - 1; i++) {
                    const p1 = pointsRef.current[i];
                    const p2 = pointsRef.current[i + 1];

                    const opacity = 1 - (p1.age / p1.life);

                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);

                    // Use quadratic for smoothness even in segments
                    const midX = (p1.x + p2.x) / 2;
                    const midY = (p1.y + p2.y) / 2;
                    ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
                    ctx.lineTo(p2.x, p2.y);

                    ctx.strokeStyle = `rgba(254, 240, 138, ${opacity})`; // Light gold
                    ctx.lineWidth = p1.width;
                    ctx.stroke();
                }
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
            }}
        />
    );
};

export default KintsugiCursor;
