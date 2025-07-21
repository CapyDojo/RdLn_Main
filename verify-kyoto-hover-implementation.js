// Verification script to ensure formalized Kyoto hover colors match current implementation
console.log('🔬 KYOTO HOVER COLOR IMPLEMENTATION VERIFICATION');

// Current working CSS values (from glassmorphism.css)
const currentCSS = {
  background: 'rgba(28, 25, 23, 0.20)', // var(--glass-focus) = 0.20
  borderColor: 'rgba(220, 8, 8, 0.6)',
  shadowPrimary: 'rgba(220, 8, 8, 0.7)',
  shadowSecondary: 'rgba(220, 8, 8, 0.5)',
  transform: 'translateY(-3px)'
};

// New semantic colors (formalized)
const semanticColors = {
  glassPanelHover: '#1c1917',    // rgba(28, 25, 23, 1)
  glassPanelHoverBorder: '#dc0808', // rgba(220, 8, 8, 1)
  glassPanelHoverShadow: '#dc0808'  // rgba(220, 8, 8, 1)
};

// Helper function to convert hex to rgba
function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

console.log('\n🎯 EXACT MATCH VERIFICATION:');

// Test background color
const semanticBgWithOpacity = hexToRgba(semanticColors.glassPanelHover, 0.20);
console.log('Current CSS Background:', currentCSS.background);
console.log('Semantic Background (0.20):', semanticBgWithOpacity);
console.log('Background Match:', currentCSS.background === semanticBgWithOpacity ? '✅ EXACT MATCH' : '❌ MISMATCH');

// Test border color
const semanticBorderWithOpacity = hexToRgba(semanticColors.glassPanelHoverBorder, 0.6);
console.log('\nCurrent CSS Border:', currentCSS.borderColor);
console.log('Semantic Border (0.6):', semanticBorderWithOpacity);
console.log('Border Match:', currentCSS.borderColor === semanticBorderWithOpacity ? '✅ EXACT MATCH' : '❌ MISMATCH');

// Test shadow colors
const semanticShadowPrimary = hexToRgba(semanticColors.glassPanelHoverShadow, 0.7);
const semanticShadowSecondary = hexToRgba(semanticColors.glassPanelHoverShadow, 0.5);
console.log('\nCurrent CSS Shadow Primary:', currentCSS.shadowPrimary);
console.log('Semantic Shadow (0.7):', semanticShadowPrimary);
console.log('Shadow Primary Match:', currentCSS.shadowPrimary === semanticShadowPrimary ? '✅ EXACT MATCH' : '❌ MISMATCH');

console.log('\nCurrent CSS Shadow Secondary:', currentCSS.shadowSecondary);
console.log('Semantic Shadow (0.5):', semanticShadowSecondary);
console.log('Shadow Secondary Match:', currentCSS.shadowSecondary === semanticShadowSecondary ? '✅ EXACT MATCH' : '❌ MISMATCH');

// Visual test function
function createVisualTest() {
  if (typeof document === 'undefined') {
    console.log('\n⚠️  DOM not available. Run this in browser console for visual test.');
    return;
  }

  console.log('\n🎨 CREATING VISUAL TEST...');

  // Create test container
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    gap: 20px;
    padding: 20px;
    background: rgba(0, 0, 0, 0.8);
    border-radius: 8px;
    color: white;
    font-family: monospace;
    font-size: 12px;
  `;

  // Create current implementation panel
  const currentPanel = document.createElement('div');
  currentPanel.innerHTML = '<div>Current CSS</div>';
  currentPanel.style.cssText = `
    width: 150px;
    height: 100px;
    background: ${currentCSS.background};
    border: 1px solid ${currentCSS.borderColor};
    box-shadow: 0 30px 80px 0 ${currentCSS.shadowPrimary}, 0 12px 40px 0 ${currentCSS.shadowSecondary};
    transform: ${currentCSS.transform};
    backdrop-filter: blur(24px) saturate(1.6);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #f8b4b4;
  `;

  // Create semantic implementation panel
  const semanticPanel = document.createElement('div');
  semanticPanel.innerHTML = '<div>Semantic Colors</div>';
  semanticPanel.style.cssText = `
    width: 150px;
    height: 100px;
    background: ${semanticBgWithOpacity};
    border: 1px solid ${semanticBorderWithOpacity};
    box-shadow: 0 30px 80px 0 ${semanticShadowPrimary}, 0 12px 40px 0 ${semanticShadowSecondary};
    transform: ${currentCSS.transform};
    backdrop-filter: blur(24px) saturate(1.6);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #f8b4b4;
  `;

  container.appendChild(currentPanel);
  container.appendChild(semanticPanel);
  document.body.appendChild(container);

  console.log('✅ Visual test panels created. Check top-right corner of page.');
  console.log('Both panels should look identical if semantic colors are correct.');

  // Auto-remove after 10 seconds
  setTimeout(() => {
    document.body.removeChild(container);
    console.log('🧹 Visual test panels removed.');
  }, 10000);
}

// Run visual test
createVisualTest();

console.log('\n📋 SUMMARY:');
console.log('Semantic colors have been formalized to match the exact working CSS implementation.');
console.log('- glassPanelHover: #1c1917 (same as glassPanelBg, opacity applied via CSS)');
console.log('- glassPanelHoverBorder: #dc0808 (exact match for rgba(220, 8, 8, X))');
console.log('- glassPanelHoverShadow: #dc0808 (exact match for rgba(220, 8, 8, X))');