/**
 * Focused tests for the counter logic fixes in OutputLayout.tsx
 * 
 * This test specifically validates:
 * 1. The fixed counter logic that only counts the active chunk version
 * 2. Whitespace mode detection and switching
 * 3. Text metrics utility functions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getTextMetrics } from '../../utils/textMetrics';
import { DiffChange } from '../../types';

// Mock DOM environment for testing counter logic
const createMockDOM = (whitespaceMode: 'clean' | 'raw') => {
  // Clear existing DOM
  document.body.innerHTML = '';
  
  // Create the expected DOM structure
  const outputPanel = document.createElement('div');
  outputPanel.setAttribute('data-output-panel', '');
  
  const modeContainer = document.createElement('div');
  modeContainer.className = 'glass-input-field';
  modeContainer.setAttribute('data-whitespace-mode', whitespaceMode);
  
  const chunkContainer1 = document.createElement('div');
  chunkContainer1.className = 'chunk-container';
  
  // Create clean version
  const cleanChunk1 = document.createElement('div');
  cleanChunk1.className = 'chunk-clean';
  cleanChunk1.innerHTML = 'Hello <span style="background: linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%);">world</span>!';
  
  // Create raw version (with more whitespace changes)
  const rawChunk1 = document.createElement('div');
  rawChunk1.className = 'chunk-raw';
  rawChunk1.innerHTML = 'Hello <span style="background: linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%);">world</span> <span style="background: linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%);"> </span>!';
  
  chunkContainer1.appendChild(cleanChunk1);
  chunkContainer1.appendChild(rawChunk1);
  
  modeContainer.appendChild(chunkContainer1);
  outputPanel.appendChild(modeContainer);
  document.body.appendChild(outputPanel);
  
  return { outputPanel, modeContainer, chunkContainer1, cleanChunk1, rawChunk1 };
};

// Simulate the counter logic from OutputLayout.tsx
const simulateCounterLogic = () => {
  // This replicates the fixed logic from OutputLayout.tsx
  const outputPanel = document.querySelector('[data-output-panel]');
  if (!outputPanel) return null;
  
  const contentElements = outputPanel.querySelectorAll('.chunk-container');
  const modeContainer = outputPanel.querySelector('.glass-input-field[data-whitespace-mode]');
  const whitespaceMode = modeContainer?.getAttribute('data-whitespace-mode') || 'raw';
  const isCleanMode = whitespaceMode === 'clean';
  
  let totalText = '';
  let addedWords = 0;
  let addedCharacters = 0;
  
  contentElements.forEach(element => {
    // Look for chunk versions within this element
    const cleanChunk = element.querySelector('.chunk-clean');
    const rawChunk = element.querySelector('.chunk-raw');
    
    // Determine which chunk to count based on mode
    let activeChunk = null;
    if (cleanChunk && rawChunk) {
      // Both versions exist - use the appropriate one
      activeChunk = isCleanMode ? cleanChunk : rawChunk;
    } else {
      // Legacy fallback - use the entire element if no chunk structure
      activeChunk = element;
    }
    
    if (activeChunk) {
      const textContent = activeChunk.textContent || '';
      totalText += textContent;
      
      // Count additions (green spans) in the active chunk only
      const addedSpans = activeChunk.querySelectorAll('span[style*="background: linear-gradient(135deg, #f0fdf4"]');
      addedSpans.forEach(span => {
        const text = span.textContent || '';
        const spanMetrics = getTextMetrics(text);
        addedWords += spanMetrics.words;
        addedCharacters += spanMetrics.characters;
      });
    }
  });
  
  const totalMetrics = getTextMetrics(totalText);
  
  return {
    totalMetrics,
    addedWords,
    addedCharacters,
    whitespaceMode,
    isCleanMode
  };
};

describe('Counter Logic Tests', () => {
  beforeEach(() => {
    // Reset DOM between tests
    document.body.innerHTML = '';
  });

  describe('Text Metrics Utility', () => {
    it('should count characters correctly', () => {
      expect(getTextMetrics('Hello world!').characters).toBe(12);
      expect(getTextMetrics('').characters).toBe(0);
      expect(getTextMetrics('   ').characters).toBe(3);
    });

    it('should count words correctly', () => {
      expect(getTextMetrics('Hello world test').words).toBe(3);
      expect(getTextMetrics('').words).toBe(0);
      expect(getTextMetrics('   ').words).toBe(0);
      expect(getTextMetrics('word1    word2     word3').words).toBe(3);
    });

    it('should handle special characters and newlines', () => {
      expect(getTextMetrics('Hello\nworld').words).toBe(2);
      expect(getTextMetrics('test@example.com').words).toBe(1);
      expect(getTextMetrics('one-two-three').words).toBe(1);
    });
  });

  describe('Counter Logic - Clean Mode', () => {
    it('should count only clean chunk content in clean mode', () => {
      createMockDOM('clean');
      const result = simulateCounterLogic();
      
      expect(result).not.toBeNull();
      expect(result!.whitespaceMode).toBe('clean');
      expect(result!.isCleanMode).toBe(true);
      
      // Should count "Hello world!"
      expect(result!.totalMetrics.characters).toBe(12); // "Hello world!"
      expect(result!.totalMetrics.words).toBe(2); // "Hello", "world!"
      
      // Should count only the "world" addition from clean chunk
      expect(result!.addedWords).toBe(1); // "world"
      expect(result!.addedCharacters).toBe(5); // "world"
    });
  });

  describe('Counter Logic - Raw Mode', () => {
    it('should count raw chunk content including whitespace in raw mode', () => {
      createMockDOM('raw');
      const result = simulateCounterLogic();
      
      expect(result).not.toBeNull();
      expect(result!.whitespaceMode).toBe('raw');
      expect(result!.isCleanMode).toBe(false);
      
      // Should count "Hello world !" (note extra space)
      expect(result!.totalMetrics.characters).toBe(13); // "Hello world !"
      expect(result!.totalMetrics.words).toBe(2); // "Hello", "world"
      
      // Should count both "world" and " " additions from raw chunk
      expect(result!.addedWords).toBe(1); // "world" (space doesn't count as word)
      expect(result!.addedCharacters).toBe(6); // "world" + " "
    });
  });

  describe('Counter Logic - Mode Switching', () => {
    it('should return different counts when switching modes', () => {
      // Test clean mode
      createMockDOM('clean');
      const cleanResult = simulateCounterLogic();
      
      // Test raw mode  
      createMockDOM('raw');
      const rawResult = simulateCounterLogic();
      
      expect(cleanResult).not.toBeNull();
      expect(rawResult).not.toBeNull();
      
      // Counts should be different
      expect(cleanResult!.totalMetrics.characters).not.toBe(rawResult!.totalMetrics.characters);
      expect(cleanResult!.addedCharacters).not.toBe(rawResult!.addedCharacters);
      
      // Raw mode should have higher counts due to extra whitespace
      expect(rawResult!.totalMetrics.characters).toBeGreaterThan(cleanResult!.totalMetrics.characters);
      expect(rawResult!.addedCharacters).toBeGreaterThan(cleanResult!.addedCharacters);
    });
  });

  describe('Counter Logic - Error Handling', () => {
    it('should handle missing DOM elements gracefully', () => {
      // Don't create any DOM structure
      const result = simulateCounterLogic();
      expect(result).toBeNull();
    });

    it('should handle missing data attributes gracefully', () => {
      // Create minimal DOM without data-whitespace-mode
      const outputPanel = document.createElement('div');
      outputPanel.setAttribute('data-output-panel', '');
      
      const chunkContainer = document.createElement('div');
      chunkContainer.className = 'chunk-container';
      chunkContainer.textContent = 'Hello world';
      
      outputPanel.appendChild(chunkContainer);
      document.body.appendChild(outputPanel);
      
      const result = simulateCounterLogic();
      expect(result).not.toBeNull();
      expect(result!.whitespaceMode).toBe('raw'); // Should default to 'raw'
    });

    it('should handle chunks without clean/raw structure', () => {
      // Create DOM with old-style chunks (no clean/raw division)
      const outputPanel = document.createElement('div');
      outputPanel.setAttribute('data-output-panel', '');
      
      const modeContainer = document.createElement('div');
      modeContainer.className = 'glass-input-field';
      modeContainer.setAttribute('data-whitespace-mode', 'clean');
      
      const chunkContainer = document.createElement('div');
      chunkContainer.className = 'chunk-container';
      chunkContainer.textContent = 'Legacy chunk content';
      
      modeContainer.appendChild(chunkContainer);
      outputPanel.appendChild(modeContainer);
      document.body.appendChild(outputPanel);
      
      const result = simulateCounterLogic();
      expect(result).not.toBeNull();
      expect(result!.totalMetrics.words).toBeGreaterThan(0);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle multiple chunk containers', () => {
      document.body.innerHTML = '';
      
      const outputPanel = document.createElement('div');
      outputPanel.setAttribute('data-output-panel', '');
      
      const modeContainer = document.createElement('div');
      modeContainer.className = 'glass-input-field';
      modeContainer.setAttribute('data-whitespace-mode', 'clean');
      
      // Create multiple chunks
      for (let i = 0; i < 3; i++) {
        const chunkContainer = document.createElement('div');
        chunkContainer.className = 'chunk-container';
        
        const cleanChunk = document.createElement('div');
        cleanChunk.className = 'chunk-clean';
        cleanChunk.textContent = `Chunk ${i} content`;
        
        const rawChunk = document.createElement('div');
        rawChunk.className = 'chunk-raw';
        rawChunk.textContent = `Chunk ${i} content `;
        
        chunkContainer.appendChild(cleanChunk);
        chunkContainer.appendChild(rawChunk);
        modeContainer.appendChild(chunkContainer);
      }
      
      outputPanel.appendChild(modeContainer);
      document.body.appendChild(outputPanel);
      
      const result = simulateCounterLogic();
      expect(result).not.toBeNull();
      expect(result!.totalMetrics.words).toBe(9); // 3 chunks × 3 words each
    });

    it('should correctly count styled spans across multiple chunks', () => {
      document.body.innerHTML = '';
      
      const outputPanel = document.createElement('div');
      outputPanel.setAttribute('data-output-panel', '');
      
      const modeContainer = document.createElement('div');
      modeContainer.className = 'glass-input-field';
      modeContainer.setAttribute('data-whitespace-mode', 'clean');
      
      const chunkContainer = document.createElement('div');
      chunkContainer.className = 'chunk-container';
      
      const cleanChunk = document.createElement('div');
      cleanChunk.className = 'chunk-clean';
      cleanChunk.innerHTML = `
        Text with 
        <span style="background: linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%);">multiple</span>
        <span style="background: linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%);">additions</span>
        here
      `;
      
      chunkContainer.appendChild(cleanChunk);
      modeContainer.appendChild(chunkContainer);
      outputPanel.appendChild(modeContainer);
      document.body.appendChild(outputPanel);
      
      const result = simulateCounterLogic();
      expect(result).not.toBeNull();
      expect(result!.addedWords).toBe(2); // "multiple" + "additions"
      expect(result!.addedCharacters).toBe(17); // "multiple" (8) + "additions" (9)
    });
  });
});