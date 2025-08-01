import { useEffect, useState } from 'react';

export const useZoom = () => {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        
        const delta = e.deltaY;
        const zoomFactor = delta > 0 ? 0.9 : 1.1;
        
        setZoom(prevZoom => {
          const newZoom = prevZoom * zoomFactor;
          // Clamp between 0.5x and 3x zoom
          return Math.max(0.5, Math.min(3, newZoom));
        });
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        setZoom(1); // Reset zoom
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    document.body.style.transform = `scale(${zoom})`;
    document.body.style.transformOrigin = 'top left';
    document.body.style.width = `${100 / zoom}%`;
    document.body.style.height = `${100 / zoom}%`;
  }, [zoom]);

  return { zoom, setZoom };
};