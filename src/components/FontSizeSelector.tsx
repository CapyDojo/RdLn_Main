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
  // Per-slot horizontal offsets to center each label over its slot's indicator centerline
  const [spanOffsetXs, setSpanOffsetXs] = useState<number[]>([0, 0, 0]);

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

  // Measure per-slot centers and compute horizontal offsets to align each label center
  useEffect(() => {
    const el = segmentedControlRef.current;
    if (!el) return;

    const measure = () => {
      const buttons = Array.from(el.querySelectorAll<HTMLButtonElement>('button.segment'));
      if (buttons.length !== 3) return;
      const indEl = el.querySelector<HTMLDivElement>('.sliding-indicator');
      if (!indEl) return;
      // Temporarily reset inline adjustments on spans
      const spans = buttons.map(b => b.querySelector('span') as HTMLElement);
      const prevML = spans.map(sp => sp?.style.marginLeft ?? '');
      const prevTF = spans.map(sp => sp?.style.transform ?? '');
      spans.forEach(sp => { if (sp) { sp.style.marginLeft = '0px'; sp.style.transform = 'none'; } });

      const offsets: number[] = [0, 0, 0];
      const prevIndTransform = indEl.style.transform;
      const prevIndTransition = indEl.style.transition;
      // Disable transition to measure instantaneous positions
      indEl.style.transition = 'none';
      const forceReflow = () => indEl.getBoundingClientRect();
      for (let i = 0; i < 3; i++) {
        indEl.style.transform = `translateX(${i * 100}%)`;
        forceReflow();
        const sp = spans[i];
        const sr = sp.getBoundingClientRect();
        const ir = indEl.getBoundingClientRect();
        const spanCenter = sr.left + sr.width / 2;
        const indCenter = ir.left + ir.width / 2;
        const delta = indCenter - spanCenter; // shift needed to align span center to indicator center
        offsets[i] = Math.round(delta * 10) / 10;
      }
      // Restore indicator transform and transition
      indEl.style.transform = prevIndTransform;
      // force one more reflow before restoring transition to avoid jump
      forceReflow();
      indEl.style.transition = prevIndTransition;

      // Restore previous values immediately to reduce flicker; React will apply new ones after state set
      spans.forEach((sp, i) => { if (sp) { sp.style.marginLeft = prevML[i]; sp.style.transform = prevTF[i]; } });
      setSpanOffsetXs(offsets);
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
        {fontSizeOptions.map((option, idx) => {
          const isActive = fontSize === option.size;
          // Preserve existing tiny vertical baseline tweaks from CSS, but move into inline for a single transform
          const vY = option.displaySize === '16px' ? 0 : option.displaySize === '23px' ? -1 : -0.6;
          const shiftX = spanOffsetXs[idx] ?? 0;
          
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
                style={{ fontSize: option.displaySize, transform: `translate(${shiftX}px, ${vY}px)` }}
              >
                Aa
              </span>
              </button>
            </CustomTooltip>
          );
        })}
        
        {/* Sliding indicator: fixed square, centered under each 'Aa' */}
        {(() => {
          // Simplified: indicator spans 1/3 of container and slides by segment index
          const txPercent = currentIndex * 100;
          return (
            <div
              className={`sliding-indicator`}
              aria-hidden="true"
              style={{
                width: '32.5%',
                transform: `translateX(${txPercent}%)`
              }}
            />
          );
        })()}
      </div>
    </div>
  );
};