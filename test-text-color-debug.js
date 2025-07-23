// Debug Text Color Issue
// Find exactly which elements are showing green instead of orange

(function() {
  'use strict';
  
  console.log('🔍 TEXT COLOR DEBUG');
  console.log('='.repeat(30));
  
  if (typeof document === 'undefined') {
    console.error('❌ Run in browser');
    return;
  }
  
  // Find elements that should be orange but might be green
  const potentialOrangeElements = document.querySelectorAll('h1, h2, h3, .text-header, .text-primary, .text-theme-primary-900');
  
  console.log(`Found ${potentialOrangeElements.length} potential elements`);
  
  potentialOrangeElements.forEach((element, index) => {
    const computedStyle = getComputedStyle(element);
    const color = computedStyle.color;
    const textContent = element.textContent.trim();
    
    // Check if this should be orange (contains "Original", "Revised", "Compared")
    const shouldBeOrange = textContent.includes('Original') || 
                          textContent.includes('Revised') || 
                          textContent.includes('Compared') ||
                          textContent.includes('Redline');
    
    // Check current color
    const isGreen = color.includes('134') && color.includes('239') && color.includes('172');
    const isOrange = color.includes('238') && color.includes('143') && color.includes('28');
    
    if (shouldBeOrange || textContent.length < 50) { // Show short text elements
      console.log(`\nElement ${index + 1}:`);
      console.log(`  Text: "${textContent}"`);
      console.log(`  Classes: ${element.className}`);
      console.log(`  Tag: ${element.tagName}`);
      console.log(`  Color: ${color}`);
      console.log(`  Should be orange: ${shouldBeOrange}`);
      console.log(`  Is green: ${isGreen}`);
      console.log(`  Is orange: ${isOrange}`);
      
      if (shouldBeOrange && isGreen) {
        console.log(`  🚨 PROBLEM: Should be orange but is green!`);
        
        // Check parent elements
        let parent = element.parentElement;
        let parentClasses = [];
        while (parent && parentClasses.length < 3) {
          if (parent.className) {
            parentClasses.push(parent.className);
          }
          parent = parent.parentElement;
        }
        console.log(`  Parent classes: ${parentClasses.join(' -> ')}`);
      }
    }
  });
  
})();