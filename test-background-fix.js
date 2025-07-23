// Quick Background Fix Test
// Test if glass panels now show dark theme background

(function() {
  'use strict';
  
  console.log('🧪 BACKGROUND FIX TEST');
  console.log('='.repeat(30));
  
  if (typeof document === 'undefined') {
    console.error('❌ Run in browser');
    return;
  }
  
  const currentTheme = document.documentElement.getAttribute('data-theme');
  console.log(`Current theme: ${currentTheme}`);
  
  const glassPanels = document.querySelectorAll('.glass-panel');
  console.log(`Found ${glassPanels.length} glass panels`);
  
  if (glassPanels.length > 0) {
    const testPanel = glassPanels[0];
    const computedStyle = getComputedStyle(testPanel);
    const background = computedStyle.backgroundColor;
    
    console.log(`\nPanel background: ${background}`);
    
    if (currentTheme === 'kyoto') {
      const isDarkTheme = background.includes('28') && background.includes('25') && background.includes('23');
      const isWhiteBase = background.includes('255, 255, 255');
      
      console.log(`✅ Dark theme background: ${isDarkTheme}`);
      console.log(`❌ White base background: ${isWhiteBase}`);
      
      if (isDarkTheme && !isWhiteBase) {
        console.log('🎉 BACKGROUND FIX SUCCESS!');
      } else {
        console.log('🚨 BACKGROUND FIX FAILURE - Still showing base colors');
      }
    }
  }
  
})();