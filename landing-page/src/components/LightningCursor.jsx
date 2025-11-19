import React, { useEffect, useRef } from 'react';

const LightningCursor = () => {
    const canvasRef = useRef(null);
    const boltsRef = useRef([]);
    const lastPosRef = useRef({ x: 0, y: 0 });

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

        const createBolt = (x1, y1, x2, y2, life = 1) => {
            const dx = x2 - x1;
            const dy = y2 - y1;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 10) return; // Too short

            const steps = Math.floor(dist / 10);
            const points = [{ x: x1, y: y1 }];

            for (let i = 1; i < steps; i++) {
                const t = i / steps;
                const spread = 10; // Jaggedness
                points.push({
                    x: x1 + dx * t + (Math.random() - 0.5) * spread,
                    y: y1 + dy * t + (Math.random() - 0.5) * spread
                });
            }
            points.push({ x: x2, y: y2 });

            boltsRef.current.push({
                points,
                life,
                maxLife: life,
                color: `rgba(202, 138, 4, ${Math.random() * 0.5 + 0.5})` // Gold/Electric color
            });
        };

        const handleMouseMove = (e) => {
            const { x: lastX, y: lastY } = lastPosRef.current;
            const currentX = e.clientX;
            const currentY = e.clientY;

            // Only create bolt if moved enough
            const dist = Math.hypot(currentX - lastX, currentY - lastY);
            if (dist > 20) {
                createBolt(lastX, lastY, currentX, currentY, 20);
                lastPosRef.current = { x: currentX, y: currentY };
            } else if (Math.random() > 0.9) {
                // Random static sparks when idle/slow
                createBolt(
                    currentX,
                    currentY,
                    currentX + (Math.random() - 0.5) * 30,
                    currentY + (Math.random() - 0.5) * 30,
                    10
                );
            }
        };

        window.addEventListener('mousemove', handleMouseMove);

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Update and draw bolts
            for (let i = boltsRef.current.length - 1; i >= 0; i--) {
                const bolt = boltsRef.current[i];
                bolt.life--;

                if (bolt.life <= 0) {
                    boltsRef.current.splice(i, 1);
                    continue;
                }

                const opacity = bolt.life / bolt.maxLife;
                ctx.beginPath();
                ctx.moveTo(bolt.points[0].x, bolt.points[0].y);

                for (let j = 1; j < bolt.points.length; j++) {
                    ctx.lineTo(bolt.points[j].x, bolt.points[j].y);
                }

                ctx.strokeStyle = `rgba(254, 240, 138, ${opacity})`; // Light yellow/white core
                ctx.lineWidth = 2;
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#ca8a04'; // Gold glow
                ctx.stroke();

                // Secondary glow
                ctx.strokeStyle = `rgba(202, 138, 4, ${opacity * 0.5})`;
                ctx.lineWidth = 4;
                ctx.stroke();
            }

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
                zIndex: 9998, // Just below the spotlight overlay
            }}
        />
    );
};

export default LightningCursor;
