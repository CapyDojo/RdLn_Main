import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDropdown } from '@/hooks/useDropdown';

describe('useDropdown', () => {
  beforeEach(() => {
    // Reset DOM event listeners
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with closed state by default', () => {
      const { result } = renderHook(() => useDropdown());

      expect(result.current.isOpen).toBe(false);
      expect(result.current.state.isOpen).toBe(false);
      expect(result.current.status.ready).toBe(true);
    });

    it('should initialize with open state when specified', () => {
      const { result } = renderHook(() => useDropdown({ initialOpen: true }));

      expect(result.current.isOpen).toBe(true);
      expect(result.current.state.isOpen).toBe(true);
    });

    it('should provide refs for reference and popper elements', () => {
      const { result } = renderHook(() => useDropdown());

      expect(result.current.referenceRef).toBeDefined();
      expect(result.current.popperRef).toBeDefined();
      expect(result.current.referenceRef.current).toBeNull();
      expect(result.current.popperRef.current).toBeNull();
    });
  });

  describe('toggle functionality', () => {
    it('should toggle from closed to open', () => {
      const { result } = renderHook(() => useDropdown());

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('should toggle from open to closed', () => {
      const { result } = renderHook(() => useDropdown({ initialOpen: true }));

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('should call onToggle callback when provided', () => {
      const onToggle = vi.fn();
      const { result } = renderHook(() => useDropdown({ onToggle }));

      act(() => {
        result.current.toggle();
      });

      expect(onToggle).toHaveBeenCalledWith(true);

      act(() => {
        result.current.toggle();
      });

      expect(onToggle).toHaveBeenCalledWith(false);
      expect(onToggle).toHaveBeenCalledTimes(2);
    });
  });

  describe('open functionality', () => {
    it('should open when closed', () => {
      const { result } = renderHook(() => useDropdown());

      act(() => {
        result.current.open();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('should not trigger onToggle when already open', () => {
      const onToggle = vi.fn();
      const { result } = renderHook(() => useDropdown({ initialOpen: true, onToggle }));

      act(() => {
        result.current.open();
      });

      expect(onToggle).not.toHaveBeenCalled();
      expect(result.current.isOpen).toBe(true);
    });

    it('should call onToggle when opening from closed state', () => {
      const onToggle = vi.fn();
      const { result } = renderHook(() => useDropdown({ onToggle }));

      act(() => {
        result.current.open();
      });

      expect(onToggle).toHaveBeenCalledWith(true);
    });
  });

  describe('close functionality', () => {
    it('should close when open', () => {
      const { result } = renderHook(() => useDropdown({ initialOpen: true }));

      act(() => {
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('should not trigger onToggle when already closed', () => {
      const onToggle = vi.fn();
      const { result } = renderHook(() => useDropdown({ onToggle }));

      act(() => {
        result.current.close();
      });

      expect(onToggle).not.toHaveBeenCalled();
      expect(result.current.isOpen).toBe(false);
    });

    it('should call onToggle when closing from open state', () => {
      const onToggle = vi.fn();
      const { result } = renderHook(() => useDropdown({ initialOpen: true, onToggle }));

      act(() => {
        result.current.close();
      });

      expect(onToggle).toHaveBeenCalledWith(false);
    });
  });

  describe('keyboard interactions', () => {
    it('should close on Escape key when open', () => {
      const { result } = renderHook(() => useDropdown({ initialOpen: true }));

      act(() => {
        const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
        document.dispatchEvent(escapeEvent);
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('should not respond to Escape key when closed', () => {
      const onToggle = vi.fn();
      const { result } = renderHook(() => useDropdown({ onToggle }));

      act(() => {
        const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
        document.dispatchEvent(escapeEvent);
      });

      expect(result.current.isOpen).toBe(false);
      expect(onToggle).not.toHaveBeenCalled();
    });

    it('should ignore other key presses', () => {
      const { result } = renderHook(() => useDropdown({ initialOpen: true }));

      act(() => {
        const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
        document.dispatchEvent(enterEvent);
      });

      expect(result.current.isOpen).toBe(true);
    });
  });

  describe('click outside behavior', () => {
    beforeEach(() => {
      // Create mock elements for refs
      document.body.innerHTML = `
        <div id="reference">Reference</div>
        <div id="popper">Popper</div>
        <div id="outside">Outside</div>
      `;
    });

    it('should close when clicking outside both reference and popper', () => {
      const { result } = renderHook(() => useDropdown({ initialOpen: true }));
      
      // Mock the refs to point to actual DOM elements
      const referenceElement = document.getElementById('reference')!;
      const popperElement = document.getElementById('popper')!;
      const outsideElement = document.getElementById('outside')!;
      
      Object.defineProperty(result.current.referenceRef, 'current', {
        value: referenceElement,
        writable: true
      });
      
      Object.defineProperty(result.current.popperRef, 'current', {
        value: popperElement,
        writable: true
      });

      act(() => {
        const mouseEvent = new MouseEvent('mousedown', { 
          bubbles: true,
          target: outsideElement 
        } as any);
        Object.defineProperty(mouseEvent, 'target', {
          value: outsideElement,
          writable: false
        });
        document.dispatchEvent(mouseEvent);
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('should not close when clicking on reference element', () => {
      const { result } = renderHook(() => useDropdown({ initialOpen: true }));
      
      const referenceElement = document.getElementById('reference')!;
      const popperElement = document.getElementById('popper')!;
      
      Object.defineProperty(result.current.referenceRef, 'current', {
        value: referenceElement,
        writable: true
      });
      
      Object.defineProperty(result.current.popperRef, 'current', {
        value: popperElement,
        writable: true
      });

      act(() => {
        const mouseEvent = new MouseEvent('mousedown', { 
          bubbles: true,
          target: referenceElement 
        } as any);
        Object.defineProperty(mouseEvent, 'target', {
          value: referenceElement,
          writable: false
        });
        document.dispatchEvent(mouseEvent);
      });

      expect(result.current.isOpen).toBe(true);
    });
  });

  describe('structured interface', () => {
    it('should provide both legacy flat structure and new structured interface', () => {
      const { result } = renderHook(() => useDropdown());

      // Legacy flat structure
      expect(typeof result.current.isOpen).toBe('boolean');
      expect(typeof result.current.toggle).toBe('function');
      expect(typeof result.current.open).toBe('function');
      expect(typeof result.current.close).toBe('function');

      // New structured interface
      expect(result.current.state).toBeDefined();
      expect(result.current.actions).toBeDefined();
      expect(result.current.status).toBeDefined();

      expect(result.current.state.isOpen).toBe(result.current.isOpen);
      expect(result.current.actions.toggle).toBe(result.current.toggle);
      expect(result.current.actions.open).toBe(result.current.open);
      expect(result.current.actions.close).toBe(result.current.close);
    });

    it('should have consistent status indicators', () => {
      const { result } = renderHook(() => useDropdown());

      expect(result.current.status.ready).toBe(true);
      expect(result.current.status.loading).toBe(false);
      expect(result.current.status.error).toBeNull();
    });
  });

  describe('cleanup', () => {
    it('should remove event listeners when hook is unmounted', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      const { unmount } = renderHook(() => useDropdown({ initialOpen: true }));

      // Should have added listeners for open dropdown
      expect(addEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      unmount();

      // Should have removed listeners on unmount
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should not add listeners when dropdown is closed', () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

      renderHook(() => useDropdown({ initialOpen: false }));

      // Should not have added listeners for closed dropdown
      expect(addEventListenerSpy).not.toHaveBeenCalled();
    });
  });
});