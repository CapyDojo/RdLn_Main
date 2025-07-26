// CSS Protocol Debug Script - FontSizeSelector Color Inheritance
// Following Rule #3: Systematic CSS Debugging to Avoid Deadends

console.log('🔍 CSS DEBUG: FontSizeSelector "Aa" Color Inheritance Issue');
console.log('================================================================');

// 3.1. INSPECT FIRST, CODE SECOND
console.log('\n📋 STEP 1: DOM STRUCTURE INSPECTION');

// Find FontSizeSelector elements
const fontSizeControls = document.querySelectorAll('.font-size-control');
console.log(`Found ${fontSizeControls.length} font-size-control elements (expected: 1)`);

if (fontSizeControls.length === 0) {
  console.log('❌ No .font-size-control elements found');
  console.log('Searching for alternative selectors...');
  
  // Look for segmented controls
  const segmentedControls = document.querySelectorAll('.segmented-control');
  console.log(`Found ${segmentedControls.length} segmented-control elements`);
  
  segmentedControls.forEach((control, i) => {
    console.log(`Segmented Control ${i + 1}:`, {
      classes: control.className,
      hasAaText: control.textContent.includes('Aa'),
      textContent: control.textContent.substring(0, 50)
    });
  });
}

// Focus on the FontSizeSelector specifically
const fontSizeSelector = document.querySelector('.font-size-control') || 
                         Array.from(document.querySelectorAll('.segmented-control'))
                              .find(el => el.textContent.includes('Aa'));

if (!fontSizeSelector) {
  console.log('❌ FontSizeSelector not found in DOM');
  console.log('Available elements with "Aa":');
  const aaElements = Array.from(document.querySelectorAll('*'))
                          .filter(el => el.textContent.includes('Aa'));
  aaElements.forEach((el, i) => {
    console.log(`  Element ${i + 1}:`, {
      tagName: el.tagName,
      classes: el.className,
      textContent: el.textContent.trim()
    });
  });
  return;
}

console.log('✅ FontSizeSelector found:', fontSizeSelector);

// 3.2. IDENTIFY THE REAL PROBLEM
console.log('\n🎯 STEP 2: COMPUTED STYLES ANALYSIS');

// Check theme setting
const htmlElement = document.documentElement;
const currentTheme = htmlElement.getAttribute('data-theme');
console.log(`Current theme: ${currentTheme}`);

// Get computed styles for the container
const containerStyle = getComputedStyle(fontSizeSelector);
console.log('Container (.font-size-control or .segmented-control):');
console.log(`  Color: ${containerStyle.color}`);
console.log(`  Background: ${containerStyle.background}`);
console.log(`  Border: ${containerStyle.border}`);

// Check CSS variables
const htmlStyle = getComputedStyle(htmlElement);
const themeTextBody = htmlStyle.getPropertyValue('--theme-text-body').trim();
const themeSegmentedBg = htmlStyle.getPropertyValue('--theme-segmented-control-bg').trim();
const themeSegmentedBorder = htmlStyle.getPropertyValue('--theme-segmented-control-border').trim();

console.log('\nCSS Variables:');
console.log(`  --theme-text-body: ${themeTextBody}`);
console.log(`  --theme-segmented-control-bg: ${themeSegmentedBg}`);
console.log(`  --theme-segmented-control-border: ${themeSegmentedBorder}`);

// 3.3. VERIFY SELECTOR TARGETING
console.log('\n🔍 STEP 3: SEGMENT BUTTON ANALYSIS');

// Find all segment buttons within the FontSizeSelector
const segmentButtons = fontSizeSelector.querySelectorAll('.segment, button');
console.log(`Found ${segmentButtons.length} segment buttons`);

segmentButtons.forEach((button, i) => {
  const buttonStyle = getComputedStyle(button);
  console.log(`\nSegment Button ${i + 1}:`);
  console.log(`  Classes: ${button.className}`);
  console.log(`  Text content: "${button.textContent.trim()}"`);
  console.log(`  Computed color: ${buttonStyle.color}`);
  console.log(`  Computed background: ${buttonStyle.background}`);
  console.log(`  Font family: ${buttonStyle.fontFamily}`);
  console.log(`  Font size: ${buttonStyle.fontSize}`);
  
  // Check if it has "Aa" text
  if (button.textContent.includes('Aa')) {
    console.log(`  ✅ This is an "Aa" button`);
    
    // Look for the actual "Aa" span
    const aaSpan = button.querySelector('span');
    if (aaSpan) {
      const spanStyle = getComputedStyle(aaSpan);
      console.log(`  Aa Span styles:`);
      console.log(`    Color: ${spanStyle.color}`);
      console.log(`    Font family: ${spanStyle.fontFamily}`);
      console.log(`    Font size: ${spanStyle.fontSize}`);
      console.log(`    Classes: ${aaSpan.className}`);
    }
  }
});

// 3.4. SYSTEMATIC APPROACH CHECKLIST
console.log('\n📋 STEP 4: CSS CASCADE ANALYSIS');

// Test what CSS rules are actually being applied
const testButton = segmentButtons[0];
if (testButton) {
  console.log('Testing CSS rule application on first segment button:');
  
  // Check if theme-specific rules are applying
  const expectedSelectors = [
    `html[data-theme="${currentTheme}"] .segmented-control`,
    `html[data-theme="${currentTheme}"] .segmented-control button`,
    `html[data-theme="${currentTheme}"] .segment`,
    `html[data-theme="${currentTheme}"]` // For inherited color
  ];
  
  expectedSelectors.forEach(selector => {
    try {
      const elements = document.querySelectorAll(selector);
      console.log(`  ${selector}: ${elements.length} matches`);
    } catch (e) {
      console.log(`  ${selector}: Invalid selector`);
    }
  });
}

// 3.5. CHECK FOR OVERRIDING STYLES
console.log('\n🎨 STEP 5: STYLE OVERRIDE DETECTION');

// Check if there are any inline styles or higher specificity rules
segmentButtons.forEach((button, i) => {
  if (button.textContent.includes('Aa')) {
    console.log(`\nAa Button ${i + 1} Override Analysis:`);
    console.log(`  Inline style: ${button.style.cssText || 'none'}`);
    
    // Check for Tailwind classes that might override color
    const classes = button.className.split(' ');
    const colorClasses = classes.filter(cls => 
      cls.includes('text-') || cls.includes('color-') || cls.startsWith('text-')
    );
    console.log(`  Color-related classes: ${colorClasses.join(', ') || 'none'}`);
    
    // Check the span inside
    const span = button.querySelector('span');
    if (span) {
      console.log(`  Span inline style: ${span.style.cssText || 'none'}`);
      const spanClasses = span.className.split(' ');
      const spanColorClasses = spanClasses.filter(cls => 
        cls.includes('text-') || cls.includes('color-') || cls.startsWith('text-')
      );
      console.log(`  Span color classes: ${spanColorClasses.join(', ') || 'none'}`);
    }
  }
});

// 3.6. SOLUTION RECOMMENDATIONS
console.log('\n💡 STEP 6: SOLUTION ANALYSIS');

console.log('Potential issues identified:');

// Check if the color is being inherited properly
const expectedColor = themeTextBody;
const actualColors = Array.from(segmentButtons)
  .filter(btn => btn.textContent.includes('Aa'))
  .map(btn => getComputedStyle(btn).color);

console.log(`Expected color (--theme-text-body): ${expectedColor}`);
console.log(`Actual colors: ${actualColors.join(', ')}`);

const isInheriting = actualColors.some(color => color === expectedColor);
console.log(`${isInheriting ? '✅' : '❌'} Color inheritance working: ${isInheriting}`);

if (!isInheriting) {
  console.log('\n🔧 DEBUGGING RECOMMENDATIONS:');
  console.log('1. Check if theme CSS is loaded and applied');
  console.log('2. Look for higher specificity rules overriding color');
  console.log('3. Check for Tailwind utility classes setting color');
  console.log('4. Verify CSS variable is properly defined');
  console.log('5. Check for inline styles overriding color');
  
  // Suggest specific CSS fix
  console.log('\n🎯 SUGGESTED CSS FIX:');
  console.log(`html[data-theme="${currentTheme}"] .segmented-control .segment,`);
  console.log(`html[data-theme="${currentTheme}"] .segmented-control button {`);
  console.log(`  color: var(--theme-text-body) !important;`);
  console.log(`}`);
}

console.log('\n🏁 DEBUG COMPLETE');
console.log('Check console output above for detailed analysis');