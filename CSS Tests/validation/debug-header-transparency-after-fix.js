// Debug Header Transparency After Fix
console.log('🔍 HEADER TRANSPARENCY DEBUG - AFTER FIX');
console.log('==========================================');

// Find the header nav element
const headerNav = document.querySelector('header.floating-header nav.glass-panel');

if (!headerNav) {
  console.log('❌ Header nav element not found');
} else {
  console.log('✅ Header nav element found');
  
  // Check current theme
  const currentTheme = document.documentElement.getAttribute('data-theme');
  console.log(`Current theme: ${currentTheme}`);
  
  // Get computed styles
  const computedStyle = window.getComputedStyle(headerNav);
  
  console.log('\n📊 CURRENT HEADER STYLES AFTER FIX:');
  console.log(`Background: ${computedStyle.background}`);
  console.log(`Border: ${computedStyle.border}`);
  console.log(`Box-shadow: ${computedStyle.boxShadow}`);
  console.log(`Backdrop-filter: ${computedStyle.backdropFilter}`);
  console.log(`Opacity: ${computedStyle.opacity}`);
  
  // Check classes applied
  console.log(`\nClasses: ${headerNav.className}`);
  
  // Check CSS variables
  console.log('\n🎨 CSS VARIABLES:');
  const rootStyle = getComputedStyle(document.documentElement);
  
  const variables = [
    '--effect-backdropBlur',
    '--theme-glass-bg',
    '--theme-glass-border',
    '--glass-panel',
    '--glass-focus',
    '--glass-subtle'
  ];
  
  variables.forEach(variable => {
    const value = rootStyle.getPropertyValue(variable).trim();
    console.log(`${variable}: ${value || 'NOT DEFINED'}`);
  });
  
  // Check if background is actually transparent
  console.log('\n🔍 TRANSPARENCY ANALYSIS:');
  
  const bgColor = computedStyle.backgroundColor;
  const bgImage = computedStyle.backgroundImage;
  
  console.log(`Background color: ${bgColor}`);
  console.log(`Background image: ${bgImage}`);
  
  // Parse RGBA values
  const rgbaMatch = bgColor.match(/rgba?\(([^)]+)\)/);
  if (rgbaMatch) {
    const values = rgbaMatch[1].split(',').map(v => v.trim());
    console.log(`RGBA breakdown: R=${values[0]}, G=${values[1]}, B=${values[2]}, A=${values[3] || '1'}`);
    
    const alpha = parseFloat(values[3] || '1');
    if (alpha < 0.1) {
      console.log('❌ PROBLEM: Alpha value too low - appears transparent');
    } else if (alpha < 0.3) {
      console.log('⚠️ WARNING: Alpha value quite low - may appear too transparent');
    } else {
      console.log('✅ Alpha value should be visible');
    }
  }
  
  // Check if backdrop filter is working
  const backdropFilter = computedStyle.backdropFilter;
  console.log(`\nBackdrop filter: ${backdropFilter}`);
  
  if (backdropFilter.includes('blur(0px)')) {
    console.log('❌ PROBLEM: Backdrop blur is 0px - no glass effect');
  } else if (backdropFilter.includes('blur(')) {
    console.log('✅ Backdrop blur is active');
  } else {
    console.log('⚠️ No backdrop blur detected');
  }
  
  // Test if there's content behind the header
  console.log('\n🖼️ BACKGROUND CONTENT CHECK:');
  const headerRect = headerNav.getBoundingClientRect();
  console.log(`Header position: top=${headerRect.top}, left=${headerRect.left}`);
  
  // Check if there's actually content behind the header to blur
  const elementsBelow = document.elementsFromPoint(
    headerRect.left + headerRect.width / 2,
    headerRect.top + headerRect.height / 2
  );
  
  console.log('Elements behind header:');
  elementsBelow.slice(1, 5).forEach((el, i) => {
    console.log(`  ${i + 1}. ${el.tagName.toLowerCase()}${el.className ? '.' + el.className.split(' ')[0] : ''}`);
  });
  
  // Check if the issue is with the parent container
  console.log('\n🏠 PARENT CONTAINER CHECK:');
  const header = headerNav.closest('header');
  if (header) {
    const headerStyle = window.getComputedStyle(header);
    console.log(`Header container background: ${headerStyle.background}`);
    console.log(`Header container opacity: ${headerStyle.opacity}`);
  }
  
  // Final diagnosis
  console.log('\n🎯 DIAGNOSIS:');
  
  const hasBackground = !bgColor.includes('rgba(0, 0, 0, 0)') && bgColor !== 'transparent';
  const hasBlur = !backdropFilter.includes('blur(0px)');
  const hasOpacity = computedStyle.opacity !== '0';
  
  console.log(`Has background: ${hasBackground ? '✅' : '❌'}`);
  console.log(`Has blur effect: ${hasBlur ? '✅' : '❌'}`);
  console.log(`Has opacity: ${hasOpacity ? '✅' : '❌'}`);
  
  if (!hasBackground && !hasBlur) {
    console.log('\n💡 LIKELY ISSUE: Both background and blur are missing/transparent');
  } else if (!hasBackground) {
    console.log('\n💡 LIKELY ISSUE: Background is transparent');
  } else if (!hasBlur) {
    console.log('\n💡 LIKELY ISSUE: Backdrop blur is not working');
  } else {
    console.log('\n💡 STYLES LOOK CORRECT: Issue might be elsewhere');
  }
}

console.log('\n🏁 DEBUG COMPLETE');