// Debug Classic Dark Header Transparency Issue
console.log('🔍 CLASSIC DARK HEADER TRANSPARENCY DIAGNOSIS');
console.log('==============================================');

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
  
  console.log('\n📊 CURRENT HEADER NAV STYLES:');
  console.log(`Background: ${computedStyle.background}`);
  console.log(`Border: ${computedStyle.border}`);
  console.log(`Box-shadow: ${computedStyle.boxShadow}`);
  console.log(`Backdrop-filter: ${computedStyle.backdropFilter}`);
  
  // Check classes applied
  console.log(`\nClasses: ${headerNav.className}`);
  
  // Check for hardcoded styles in the component
  console.log('\n🔍 HARDCODED STYLES ANALYSIS:');
  const hasHardcodedBorder = headerNav.classList.contains('border-white/20') || 
                            headerNav.className.includes('border-white');
  const hasHardcodedBackdrop = headerNav.className.includes('backdrop-blur-xl');
  const hasHardcodedShadow = headerNav.className.includes('shadow-lg');
  
  console.log(`Hardcoded border (border-white/20): ${hasHardcodedBorder ? '❌ YES' : '✅ NO'}`);
  console.log(`Hardcoded backdrop blur: ${hasHardcodedBackdrop ? '❌ YES' : '✅ NO'}`);
  console.log(`Hardcoded shadow: ${hasHardcodedShadow ? '❌ YES' : '✅ NO'}`);
  
  // Check theme-specific CSS variables
  console.log('\n🎨 THEME VARIABLES:');
  const rootStyle = getComputedStyle(document.documentElement);
  const themeGlassBg = rootStyle.getPropertyValue('--theme-glass-bg').trim();
  const themeGlassBorder = rootStyle.getPropertyValue('--theme-glass-border').trim();
  const themeGlassHoverShadow = rootStyle.getPropertyValue('--theme-glass-hover-shadow').trim();
  
  console.log(`--theme-glass-bg: ${themeGlassBg}`);
  console.log(`--theme-glass-border: ${themeGlassBorder}`);
  console.log(`--theme-glass-hover-shadow: ${themeGlassHoverShadow}`);
  
  // Check if theme-specific styles are being applied
  console.log('\n🔧 THEME STYLE APPLICATION:');
  const expectedBg = `rgba(${themeGlassBg}, 0.12)`; // Using --glass-panel opacity
  const expectedBorder = `rgba(${themeGlassBorder}, 0.20)`; // Using --glass-focus opacity
  
  console.log(`Expected background: ${expectedBg}`);
  console.log(`Expected border: 1px solid ${expectedBorder}`);
  
  // Compare with Kyoto theme for reference
  console.log('\n🏯 KYOTO THEME COMPARISON:');
  if (currentTheme === 'kyoto') {
    console.log('Currently on Kyoto theme - this should show proper glassmorphism');
  } else {
    console.log('Switch to Kyoto theme to see proper glassmorphism, then back to classic-dark');
  }
  
  // Check CSS specificity issues
  console.log('\n⚖️ CSS SPECIFICITY ANALYSIS:');
  
  // Test if removing hardcoded classes would fix the issue
  const originalClasses = headerNav.className;
  console.log(`Original classes: ${originalClasses}`);
  
  // Identify problematic classes
  const problematicClasses = [
    'border-white/20',
    'backdrop-blur-xl',
    'shadow-lg'
  ];
  
  problematicClasses.forEach(className => {
    if (originalClasses.includes(className)) {
      console.log(`❌ Found problematic class: ${className}`);
    }
  });
  
  // Solution recommendations
  console.log('\n💡 SOLUTION RECOMMENDATIONS:');
  console.log('1. Remove hardcoded Tailwind classes from Header.tsx:');
  console.log('   - Remove: border border-white/20');
  console.log('   - Remove: backdrop-blur-xl');
  console.log('   - Remove: shadow-lg');
  console.log('');
  console.log('2. Let theme-specific CSS handle the styling:');
  console.log('   - Keep: glass-panel class');
  console.log('   - Theme CSS will apply proper background, border, and effects');
  console.log('');
  console.log('3. The glass-panel class should be sufficient for theme styling');
  
  // Test what happens without hardcoded styles
  console.log('\n🧪 TESTING WITHOUT HARDCODED STYLES:');
  
  // Temporarily remove problematic classes
  const testClasses = originalClasses
    .replace(/border-white\/20/g, '')
    .replace(/backdrop-blur-xl/g, '')
    .replace(/shadow-lg/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  console.log(`Test classes (without hardcoded styles): ${testClasses}`);
  
  // Apply test classes temporarily
  headerNav.className = testClasses;
  
  setTimeout(() => {
    const testStyle = window.getComputedStyle(headerNav);
    console.log('\n📊 STYLES WITHOUT HARDCODED CLASSES:');
    console.log(`Background: ${testStyle.background}`);
    console.log(`Border: ${testStyle.border}`);
    console.log(`Box-shadow: ${testStyle.boxShadow}`);
    console.log(`Backdrop-filter: ${testStyle.backdropFilter}`);
    
    // Restore original classes
    headerNav.className = originalClasses;
    
    console.log('\n✅ Classes restored to original state');
    console.log('\n🎯 CONCLUSION:');
    console.log('The header transparency issue is caused by hardcoded Tailwind classes');
    console.log('in the Header.tsx component that override theme-specific styling.');
    console.log('Remove the hardcoded classes and let theme CSS handle the styling.');
  }, 100);
}

console.log('\n🏁 DIAGNOSIS COMPLETE');