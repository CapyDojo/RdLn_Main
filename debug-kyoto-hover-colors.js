// Debug script to verify Kyoto theme hover colors match current implementation
console.log('🎨 KYOTO THEME HOVER COLOR VERIFICATION');

// Current CSS implementation colors (extracted from glassmorphism.css)
const currentImplementation = {
  background: 'rgba(28, 25, 23, var(--glass-focus))', // --glass-focus = 0.20
  backgroundResolved: 'rgba(28, 25, 23, 0.20)',
  borderColor: 'rgba(220, 8, 8, 0.6)',
  shadowPrimary: 'rgba(220, 8, 8, 0.7)',
  shadowSecondary: 'rgba(220, 8, 8, 0.5)',
  transform: 'translateY(-3px)'
};

// New semantic color definitions
const semanticColors = {
  glassPanelHover: '#292524',      // neutral.800 - rgba(41, 37, 36, 1)
  glassPanelHoverBorder: '#dc2626', // secondary.600 - rgba(220, 38, 38, 1)
  glassPanelHoverShadow: '#dc2626'  // secondary.600 - rgba(220, 38, 38, 1)
};

// Helper function to convert hex to rgba
function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

console.log('\n📊 COLOR COMPARISON:');
console.log('Current CSS Background:', currentImplementation.backgroundResolved);
console.log('Semantic Color (with opacity):', hexToRgba(semanticColors.glassPanelHover, 0.20));

console.log('\nCurrent CSS Border:', currentImplementation.borderColor);
console.log('Semantic Border Color:', hexToRgba(semanticColors.glassPanelHoverBorder, 0.6));

console.log('\nCurrent CSS Shadow Primary:', currentImplementation.shadowPrimary);
console.log('Semantic Shadow Color:', hexToRgba(semanticColors.glassPanelHoverShadow, 0.7));

console.log('\nCurrent CSS Shadow Secondary:', currentImplementation.shadowSecondary);
console.log('Semantic Shadow Color:', hexToRgba(semanticColors.glassPanelHoverShadow, 0.5));

// Verify color values match
console.log('\n✅ VERIFICATION RESULTS:');

// Check if rgba(28, 25, 23, 0.20) matches our semantic color
const currentBg = [28, 25, 23];
const semanticBg = [41, 37, 36]; // #292524
console.log('Background match:', JSON.stringify(currentBg) === JSON.stringify(semanticBg) ? '❌ MISMATCH' : '⚠️  Different base colors');

// Check if rgba(220, 8, 8, 0.6) matches our semantic border color
const currentBorder = [220, 8, 8];
const semanticBorder = [220, 38, 38]; // #dc2626
console.log('Border match:', JSON.stringify(currentBorder) === JSON.stringify(semanticBorder) ? '❌ MISMATCH' : '⚠️  Different RGB values');

console.log('\n🔍 ANALYSIS:');
console.log('The current CSS uses hardcoded rgba values that don\'t exactly match our semantic colors.');
console.log('Current background: rgba(28, 25, 23, 0.20) - uses glassPanelBg with opacity');
console.log('Current border/shadow: rgba(220, 8, 8, X) - uses a specific red that\'s different from secondary.600');

console.log('\n💡 SOLUTION:');
console.log('We need to update semantic colors to match the EXACT working implementation:');
console.log('- glassPanelHover should use glassPanelBg (#1c1917) with CSS opacity');
console.log('- glassPanelHoverBorder should be #dc0808 (220, 8, 8) to match current');
console.log('- glassPanelHoverShadow should be #dc0808 (220, 8, 8) to match current');

// Test current theme application
console.log('\n🧪 TESTING CURRENT THEME:');
if (typeof document !== 'undefined') {
  const testPanel = document.createElement('div');
  testPanel.className = 'glass-panel';
  testPanel.setAttribute('data-theme', 'kyoto');
  document.body.appendChild(testPanel);
  
  // Simulate hover
  testPanel.style.background = currentImplementation.backgroundResolved;
  testPanel.style.borderColor = currentImplementation.borderColor;
  testPanel.style.boxShadow = `0 30px 80px 0 ${currentImplementation.shadowPrimary}, 0 12px 40px 0 ${currentImplementation.shadowSecondary}`;
  testPanel.style.transform = currentImplementation.transform;
  
  console.log('Test panel created with current hover styles');
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(testPanel);
    console.log('Test panel removed');
  }, 2000);
} else {
  console.log('DOM not available - run this in browser console');
}