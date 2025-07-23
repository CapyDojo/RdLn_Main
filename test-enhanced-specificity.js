// Enhanced Specificity Test - Quick Validation
// Test that ultra-high specificity selectors override base styles

(function() {
  'use strict';
  
  console.log('🧪 ENHANCED SPECIFICITY TEST');
  console.log('='.repeat(40));
  
  if (typeof document === 'undefined') {
    console.error('❌ Run in browser console');
    return;
  }
  
  const currentTheme = document.documentElement.getAttribute('data-theme');
  console.log(`Current theme: ${currentTheme}`);
  
  // Test glass panel background
  const glassPanels = document.querySelectorAll('.glass-panel');
  if (glassPanels.length > 0) {
    const panel = glassPanels[0];
    const style = getComputedStyle(panel);
    const background = style.backgroundColor;
    
    console.log(`\nGlass Panel Background: ${background}`);
    
    const isDarkTheme = background.includes('28') && background.includes('25') && background.includes('23');
    const isWhiteBase = background.includes('255, 255, 255');
    
    console.log(`✅ Dark theme background: ${isDarkTheme}`);
    console.log(`❌ White base background: ${isWhiteBase}`);
    
    if (isDarkTheme) {
      console.log('🎉 ENHANCED SPECIFICITY SUCCESS');
    } else {
      console.log('🚨 ENHANCED SPECIFICITY FAILURE - Need even higher specificity');
    }
  }
  
  // Test hover effect
  if (glassPanels.length > 0) {
    const panel = glassPanels[0];
    panel.classList.add('hover-from-handle');
    
    const hoverStyle = getComputedStyle(panel);
    const hoverBackground = hoverStyle.backgroundColor;
    const hoverTransform = hoverStyle.transform;
    
    console.log(`\nHover Background: ${hoverBackground}`);
    console.log(`Hover Transform: ${hoverTransform}`);
    
    const hasTransform = hoverTransform.includes('translateY') || hoverTransform.includes('matrix');
    console.log(`✅ Transform applied: ${hasTransform}`);
    
    panel.classList.remove('hover-from-handle');
  }
  
})();