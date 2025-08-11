import React, { useRef, useEffect, useState } from 'react';
import { CustomTooltip } from './CustomTooltip';
import { useFontSize } from '../contexts/FontSizeContext';
import { BaseComponentProps } from '../types/components';

type FontSize = 'small' | 'medium' | 'large';

interface FontSizeOption {
  size: FontSize;
  label: string;
  displaySize: string;
  shortLabel: string;
}

const fontSizeOptions: FontSizeOption[] = [
  { size: 'small', label: 'Small', displaySize: '16px', shortLabel: 'S' },
  { size: 'medium', label: 'Medium', displaySize: '23px', shortLabel: 'M' },
  { size: 'large', label: 'Large', displaySize: '30px', shortLabel: 'L' },
];


export const FontSizeSelector: React.FC<BaseComponentProps> = ({ style, className }) => {
  const { fontSize, setFontSize } = useFontSize();
  const segmentedControlRef = useRef<HTMLDivElement>(null);
  const [segmentTx, setSegmentTx] = useState<number[]>([]);
  const [squareSize, setSquareSize] = useState<number>(0);

  const handleSelectFontSize = (size: FontSize) => {
    setFontSize(size);
  };

  // Get current size index for sliding indicator
  const getCurrentSizeIndex = () => {
    return fontSizeOptions.findIndex(option => option.size === fontSize);
  };

  // Handle keyboard navigation  
  const handleKeyDown = (e: React.KeyboardEvent, size: FontSize) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelectFontSize(size);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const currentIndex = getCurrentSizeIndex();
      let newIndex;
      
      if (e.key === 'ArrowLeft') {
        newIndex = currentIndex > 0 ? currentIndex - 1 : fontSizeOptions.length - 1;
      } else {
        newIndex = currentIndex < fontSizeOptions.length - 1 ? currentIndex + 1 : 0;
      }
      
      handleSelectFontSize(fontSizeOptions[newIndex].size);
    }
  };

  // Measure button widths and offsets so the sliding indicator matches the actual text width
  useEffect(() => {
    const el = segmentedControlRef.current;
    if (!el) return;

    const measure = () => {
      const buttons = Array.from(el.querySelectorAll<HTMLButtonElement>('button.segment'));
      if (buttons.length === 0) return;
      const containerRect = el.getBoundingClientRect();
      const padLeft = parseFloat(getComputedStyle(el).paddingLeft || '0');
      const centers: number[] = [];
      const txs: number[] = [];
      let maxSpanW = 0;
      let btnH = 0;
      buttons.forEach((btn) => {
        const btnRect = btn.getBoundingClientRect();
        const span = btn.querySelector('span');
        const spanRect = span ? span.getBoundingClientRect() : btnRect;
        const centerAbs = spanRect.left + spanRect.width / 2;
        const centerRel = (centerAbs - containerRect.left - padLeft); // relative to content-left
        centers.push(centerRel);
        maxSpanW = Math.max(maxSpanW, spanRect.width);
        btnH = btnRect.height; // all equal
      });
      // Choose square size: nearly full button height with a small 4px vertical inset
      const rec = Math.round(Math.min(btnH - 4, Math.max(maxSpanW + 12, 32)));
      const evenRec = rec % 2 === 0 ? rec : rec + 1;
      centers.forEach((c) => {
        txs.push(c - evenRec / 2);
      });
      setSquareSize(evenRec);
      setSegmentTx(txs);
    };

    measure();

    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [segmentedControlRef]);

  const currentIndex = fontSizeOptions.findIndex(opt => opt.size === fontSize);

  return (
    <div className={`${className || ''}`} style={style}>
      <div 
        className="segmented-control font-size-control" 
        ref={segmentedControlRef} 
        role="group" 
        aria-label="Text Size Selection"
      >
        {fontSizeOptions.map((option) => {
          const isActive = fontSize === option.size;
          
          return (
            <CustomTooltip key={option.size} content={`Set text size to ${option.label}`}>
              <button
                onClick={() => handleSelectFontSize(option.size)}
                onKeyDown={(e) => handleKeyDown(e, option.size)}
                className={`segment ${isActive ? 'active' : ''}`}
                aria-pressed={isActive}
                aria-label={`${option.label} - ${option.displaySize}`}
              >
              <span 
                className="font-bold leading-none font-serif libertinus-math-text"
                style={{ fontSize: option.displaySize }}
              >
                Aa
              </span>
              </button>
            </CustomTooltip>
          );
        })}
        
        {/* Sliding indicator: fixed square, centered under each 'Aa' */}
        {(() => {
          const tx = (segmentTx[currentIndex] ?? 0) - 2 + 1; // base left: 2px in CSS, +1px visual centering fudge
          const size = squareSize || 42; // slightly larger fallback to better fill height
          return (
            <div
              className={`sliding-indicator`}
              aria-hidden="true"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                top: '50%',
                transform: `translate(${tx}px, -50%)`
              }}
            />
          );
        })()}
      </div>
    </div>
  );
};