import React, { useState } from 'react';

interface SpotlightProps {
  children: React.ReactNode;
  /** Size of the spotlight in pixels */
  size?: number;
  /** Color of the spotlight */
  color?: string;
  /** Opacity of the spotlight */
  opacity?: number;
}

export const Spotlight: React.FC<SpotlightProps> = ({
  children,
  size = 600,
  color = 'rgba(29, 78, 216)',
  opacity = 0.15
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    setPosition({ x: e.clientX, y: e.clientY });
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <div 
      className="relative"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <div 
        className="pointer-events-none fixed inset-0 transition-opacity duration-300 z-[-1]"
        style={{
          background: `radial-gradient(
            ${size}px at ${position.x}px ${position.y}px,
            ${color}, ${opacity}),
            transparent 80%
          )`,
          opacity: isVisible ? 1 : 0,
          transform: 'translateZ(0)'
        }}
      />
    </div>
  );
};
