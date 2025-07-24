// Incremental Professional Theme Rebuild Strategy
// Implements changes step-by-step with validation at each step

console.log('🔧 INCREMENTAL PROFESSIONAL THEME REBUILD');
console.log('=========================================');

// Step 1: Add new CSS variables without changing existing styles
function step1_addCSSVariables() {
  console.log('Step 1: Adding new CSS variables...');
  
  const newVariables = `
    /* New architectural CSS variables */
    --theme-glass-bg: 255, 255, 255;
    --theme-glass-border: 191, 219, 254;
    --theme-glass-hover-border: 147, 197, 253;
    --theme-glass-hover-shadow: 30, 64, 175;
    --theme-glass-panel-hover-rgb: 248, 250, 252;
    --theme-glass-panel-hover-border-rgb: 147, 197, 253;
    --theme-glass-panel-hover-shadow-rgb: 30, 64, 175;
  `;
  
  // Add variables to existing theme
  const existingStyle = document.querySelector('style[data-theme="professional"]');
  if (existingStyle) {
    existingStyle.textContent = newVariables + '\n' + existingStyle.textContent;
  }
  
  console.log('✅ Step 1 complete - CSS variables added');
  return validateVisualState('After adding CSS variables');
}

// Step 2: Update glass panel base styles
function step2_updateGlassPanels() {
  console.log('Step 2: Updating glass panel styles...');
  
  // Test new glass panel styles
  const testCSS = `
    html[data-theme="professional"] .glass-panel {
      background: rgba(var(--theme-glass-bg), var(--glass-panel)) !important;
      border: 1px solid rgba(var(--theme-glass-border), var(--glass-focus));
      box-shadow: 0 8px 32px 0 rgba(var(--theme-glass-hover-shadow), var(--glass-panel));
    }
  `;
  
  addTestCSS(testCSS, 'glass-panels');
  return validateVisualState('After updating glass panels');
}

// Step 3: Update hover effects
function step3_updateHoverEffects() {
  console.log('Step 3: Updating hover effects...');
  
  const hoverCSS = `
    html[data-theme="professional"] .glass-panel:hover {
      background: rgba(var(--theme-glass-panel-hover-rgb), var(--glass-focus));
      border-color: rgba(var(--theme-glass-panel-hover-border-rgb), var(--glass-strong));
      box-shadow: 0 12px 40px 0 rgba(var(--theme-glass-panel-hover-shadow-rgb), var(--glass-strong));
    }
  `;
  
  addTestCSS(hoverCSS, 'hover-effects');
  return validateVisualState('After updating hover effects');
}

// Validation function
function validateVisualState(stepName) {
  console.log(`🔍 Validating: ${stepName}`);
  
  const glassPanels = document.querySelectorAll('.glass-panel');
  if (glassPanels.length === 0) {
    console.warn('⚠️ No glass panels found for validation');
    return false;
  }
  
  const panel = glassPanels[0];
  const styles = window.getComputedStyle(panel);
  
  // Check if styles are applied and not broken
  const isValid = !styles.background.includes('var(--') && 
                  !styles.border.includes('var(--') &&
                  styles.background !== 'rgba(0, 0, 0, 0)';
  
  console.log(`${isValid ? '✅' : '❌'} Visual validation: ${stepName}`);
  
  if (!isValid) {
    console.error('Validation failed - styles contain unresolved variables or are broken');
    console.log('Background:', styles.background);
    console.log('Border:', styles.border);
  }
  
  return isValid;
}

// Helper function to add test CSS
function addTestCSS(css, identifier) {
  // Remove previous test CSS with same identifier
  const existing = document.querySelector(`style[data-test="${identifier}"]`);
  if (existing) existing.remove();
  
  // Add new test CSS
  const style = document.createElement('style');
  style.setAttribute('data-test', identifier);
  style.textContent = css;
  document.head.appendChild(style);
}

// Rollback function for specific step
function rollbackStep(stepIdentifier) {
  const testStyle = document.querySelector(`style[data-test="${stepIdentifier}"]`);
  if (testStyle) {
    testStyle.remove();
    console.log(`🔄 Rolled back: ${stepIdentifier}`);
  }
}

// Main execution function
function executeIncrementalRebuild() {
  console.log('🚀 Starting incremental rebuild...');
  
  if (!step1_addCSSVariables()) {
    console.error('❌ Step 1 failed - stopping rebuild');
    return false;
  }
  
  if (!step2_updateGlassPanels()) {
    console.error('❌ Step 2 failed - rolling back');
    rollbackStep('glass-panels');
    return false;
  }
  
  if (!step3_updateHoverEffects()) {
    console.error('❌ Step 3 failed - rolling back');
    rollbackStep('hover-effects');
    rollbackStep('glass-panels');
    return false;
  }
  
  console.log('✅ Incremental rebuild completed successfully!');
  return true;
}

// Export functions for manual testing
window.professionalThemeRebuild = {
  step1_addCSSVariables,
  step2_updateGlassPanels,
  step3_updateHoverEffects,
  validateVisualState,
  rollbackStep,
  executeIncrementalRebuild
};

console.log('✅ Incremental rebuild tools ready. Use professionalThemeRebuild.executeIncrementalRebuild() to start.');