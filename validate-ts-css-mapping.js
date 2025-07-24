// TypeScript to CSS Mapping Validation
// Ensures the generated CSS exactly matches the TypeScript theme definition

console.log('🔍 VALIDATING TYPESCRIPT TO CSS MAPPING');
console.log('======================================');

// Expected values from professional.ts semanticColors
const expectedSemanticColors = {
  // Text colors
  textBody: '#1e293b',
  textHeader: '#0f172a', 
  textSecondary: '#475569',
  textInteractive: '#c2410c',
  textSuccess: '#1d4ed8',
  
  // Glass panel colors
  glassPanelBg: '#ffffff',
  glassPanelBorder: '#bfdbfe',
  glassPanelShadow: '#1e40af',
  glassPanelHover: '#f8fafc',
  
  // Input field colors
  inputBg: '#ffffff',
  inputBorder: '#93c5fd',
  inputFocus: '#3b82f6',
  inputPlaceholder: '#64748b',
  
  // Button colors
  buttonPrimary: '#1d4ed8',
  buttonSecondary: '#e2e8f0',
  buttonText: '#ffffff',
  buttonHover: '#1e40af',
  
  // Resize handle colors
  resizeHandleBg: '#bfdbfe',
  resizeHandleBorder: '#1e40af',
  resizeHandleShadow: '#1e40af',
  resizeHandleHoverBg: '#93c5fd',
  resizeHandleHoverBorder: '#1e3c72',
  resizeHandleHoverShadow: '#1e3c72'
};

// Helper function to convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Helper function to format RGB for CSS variables
function formatRgbForCSS(hex) {
  const rgb = hexToRgb(hex);
  return rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : null;
}

// Test CSS variable mappings
console.log('\n🔧 Testing CSS variable mappings...');

const cssVariableTests = {
  // Text colors (direct hex values)
  '--theme-text-body': expectedSemanticColors.textBody,
  '--theme-text-header': expectedSemanticColors.textHeader,
  '--theme-text-secondary': expectedSemanticColors.textSecondary,
  '--theme-text-interactive': expectedSemanticColors.textInteractive,
  '--theme-text-success': expectedSemanticColors.textSuccess,
  
  // Glass panel colors (RGB format)
  '--theme-glass-bg': formatRgbForCSS(expectedSemanticColors.glassPanelBg),
  '--theme-glass-border': formatRgbForCSS(expectedSemanticColors.glassPanelBorder),
  '--theme-glass-shadow': formatRgbForCSS(expectedSemanticColors.glassPanelShadow),
  '--theme-glass-hover-bg': formatRgbForCSS(expectedSemanticColors.glassPanelHover),
  
  // Input colors (RGB format for some)
  '--theme-input-bg': formatRgbForCSS(expectedSemanticColors.inputBg),
  '--theme-input-border': formatRgbForCSS(expectedSemanticColors.inputBorder),
  '--theme-input-focus': formatRgbForCSS(expectedSemanticColors.inputFocus),
  '--theme-input-placeholder': formatRgbForCSS(expectedSemanticColors.inputPlaceholder),
  
  // Resize handle colors (RGB format)
  '--theme-resize-handle-bg': formatRgbForCSS(expectedSemanticColors.resizeHandleBg),
  '--theme-resize-handle-border': formatRgbForCSS(expectedSemanticColors.resizeHandleBorder),
  '--theme-resize-handle-shadow': formatRgbForCSS(expectedSemanticColors.resizeHandleShadow),
  '--theme-resize-handle-hover-bg': formatRgbForCSS(expectedSemanticColors.resizeHandleHoverBg),
  '--theme-resize-handle-hover-border': formatRgbForCSS(expectedSemanticColors.resizeHandleHoverBorder),
  '--theme-resize-handle-hover-shadow': formatRgbForCSS(expectedSemanticColors.resizeHandleHoverShadow)
};

let mappingErrors = 0;
let mappingSuccess = 0;

Object.entries(cssVariableTests).forEach(([cssVar, expectedValue]) => {
  const actualValue = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  
  if (actualValue === expectedValue) {
    console.log(`✅ ${cssVar}: ${actualValue}`);
    mappingSuccess++;
  } else {
    console.error(`❌ ${cssVar}:`);
    console.error(`   Expected: ${expectedValue}`);
    console.error(`   Actual:   ${actualValue}`);
    mappingErrors++;
  }
});

// Test that semantic colors are properly applied to elements
console.log('\n📝 Testing semantic color application...');

const elementTests = [
  { selector: 'body, .text-body', expectedColor: expectedSemanticColors.textBody, name: 'Body text' },
  { selector: 'h1, h2, h3, .text-header', expectedColor: expectedSemanticColors.textHeader, name: 'Header text' },
  { selector: '.text-secondary', expectedColor: expectedSemanticColors.textSecondary, name: 'Secondary text' },
  { selector: '.text-interactive, a', expectedColor: expectedSemanticColors.textInteractive, name: 'Interactive text' },
  { selector: '.text-success', expectedColor: expectedSemanticColors.textSuccess, name: 'Success text' }
];

let elementErrors = 0;
let elementSuccess = 0;

elementTests.forEach(test => {
  const element = document.querySelector(test.selector);
  if (element) {
    const actualColor = window.getComputedStyle(element).color;
    const expectedRgb = hexToRgb(test.expectedColor);
    const expectedColorString = `rgb(${expectedRgb.r}, ${expectedRgb.g}, ${expectedRgb.b})`;
    
    if (actualColor === expectedColorString) {
      console.log(`✅ ${test.name}: ${actualColor}`);
      elementSuccess++;
    } else {
      console.error(`❌ ${test.name}:`);
      console.error(`   Expected: ${expectedColorString}`);
      console.error(`   Actual:   ${actualColor}`);
      elementErrors++;
    }
  } else {
    console.warn(`⚠️ ${test.name}: No element found with selector "${test.selector}"`);
  }
});

// Generate final report
console.log('\n📊 MAPPING VALIDATION REPORT');
console.log('============================');
console.log(`CSS Variables: ${mappingSuccess} passed, ${mappingErrors} failed`);
console.log(`Element Colors: ${elementSuccess} passed, ${elementErrors} failed`);

const overallStatus = (mappingErrors === 0 && elementErrors === 0) ? 'PASS' : 'FAIL';
console.log(`Overall Status: ${overallStatus}`);

if (overallStatus === 'PASS') {
  console.log('✅ CSS perfectly matches TypeScript theme definition!');
} else {
  console.log('❌ CSS mapping has errors that need to be fixed.');
}

// Export results
window.mappingValidation = {
  cssVariableTests: mappingErrors === 0,
  elementColorTests: elementErrors === 0,
  overallStatus,
  mappingErrors,
  elementErrors,
  mappingSuccess,
  elementSuccess
};

console.log('\n✅ Mapping validation complete!');