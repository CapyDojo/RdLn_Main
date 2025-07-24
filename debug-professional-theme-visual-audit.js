// Professional Theme Visual Audit Script
// Run this in browser console BEFORE architectural changes
// This captures the current visual state to prevent regressions

console.log('🔍 PROFESSIONAL THEME VISUAL AUDIT - PRE-REBUILD');
console.log('================================================');

// 1. Check theme is active
const currentTheme = document.documentElement.getAttribute('data-theme');
console.log(`Current theme: ${currentTheme}`);

if (currentTheme !== 'professional') {
  console.warn('⚠️ Professional theme not active! Switch to professional theme first.');
}

// 2. Audit glass panels
const glassPanels = document.querySelectorAll('.glass-panel');
console.log(`\n📋 Found ${glassPanels.length} glass panels`);

glassPanels.forEach((panel, i) => {
  const computed = window.getComputedStyle(panel);
  console.log(`Panel ${i + 1}:`, {
    background: computed.background,
    border: computed.border,
    boxShadow: computed.boxShadow,
    backdropFilter: computed.backdropFilter,
    color: computed.color,
    visible: panel.offsetParent !== null
  });
});

// 3. Test hover effects (simulate hover)
console.log('\n🎯 Testing hover effects...');
if (glassPanels.length > 0) {
  const firstPanel = glassPanels[0];
  
  // Get normal state
  const normalState = {
    background: window.getComputedStyle(firstPanel).background,
    border: window.getComputedStyle(firstPanel).border,
    boxShadow: window.getComputedStyle(firstPanel).boxShadow,
    transform: window.getComputedStyle(firstPanel).transform
  };
  
  // Simulate hover
  firstPanel.classList.add('force-hover');
  setTimeout(() => {
    const hoverState = {
      background: window.getComputedStyle(firstPanel).background,
      border: window.getComputedStyle(firstPanel).border,
      boxShadow: window.getComputedStyle(firstPanel).boxShadow,
      transform: window.getComputedStyle(firstPanel).transform
    };
    
    console.log('Normal state:', normalState);
    console.log('Hover state:', hoverState);
    
    // Check if hover effects work
    const hoverWorks = normalState.boxShadow !== hoverState.boxShadow || 
                      normalState.border !== hoverState.border ||
                      normalState.transform !== hoverState.transform;
    
    console.log(`Hover effects working: ${hoverWorks ? '✅' : '❌'}`);
    
    firstPanel.classList.remove('force-hover');
  }, 100);
}

// 4. Audit text colors
console.log('\n📝 Text color audit...');
const textElements = {
  body: document.querySelectorAll('.text-body, body'),
  headers: document.querySelectorAll('h1, h2, h3, .text-header'),
  secondary: document.querySelectorAll('.text-secondary'),
  interactive: document.querySelectorAll('.text-interactive, a, button:not(.glass-panel)'),
  success: document.querySelectorAll('.text-success, .text-active')
};

Object.entries(textElements).forEach(([type, elements]) => {
  if (elements.length > 0) {
    const color = window.getComputedStyle(elements[0]).color;
    console.log(`${type}: ${color} (${elements.length} elements)`);
  }
});

// 5. Audit input fields
console.log('\n📝 Input field audit...');
const inputFields = document.querySelectorAll('.glass-input-field, input, textarea');
console.log(`Found ${inputFields.length} input fields`);

if (inputFields.length > 0) {
  const input = inputFields[0];
  const inputStyles = window.getComputedStyle(input);
  console.log('Input styles:', {
    background: inputStyles.background,
    border: inputStyles.border,
    color: inputStyles.color,
    backdropFilter: inputStyles.backdropFilter
  });
}

// 6. Check for broken CSS variables
console.log('\n🔧 CSS Variable validation...');
const testElement = document.createElement('div');
testElement.style.display = 'none';
document.body.appendChild(testElement);

const brokenVariables = [];
const testVariables = [
  '--color-primary-200-rgb',
  '--color-primary-300-rgb', 
  '--color-primary-500-rgb',
  '--color-primary-600-rgb',
  '--color-neutral-800-rgb',
  '--color-neutral-600-rgb'
];

testVariables.forEach(varName => {
  testElement.style.color = `rgb(var(${varName}))`;
  const computed = window.getComputedStyle(testElement).color;
  if (computed === 'rgb(var(--color-primary-200-rgb))' || computed.includes('var(')) {
    brokenVariables.push(varName);
  }
});

document.body.removeChild(testElement);

if (brokenVariables.length > 0) {
  console.warn('❌ Broken CSS variables detected:', brokenVariables);
} else {
  console.log('✅ All tested CSS variables working');
}

// 7. Generate visual snapshot data
console.log('\n📸 Visual snapshot for comparison...');
const snapshot = {
  theme: currentTheme,
  timestamp: new Date().toISOString(),
  glassPanelCount: glassPanels.length,
  glassPanelStyles: glassPanels.length > 0 ? {
    background: window.getComputedStyle(glassPanels[0]).background,
    border: window.getComputedStyle(glassPanels[0]).border,
    boxShadow: window.getComputedStyle(glassPanels[0]).boxShadow
  } : null,
  textColors: Object.fromEntries(
    Object.entries(textElements).map(([type, elements]) => [
      type, 
      elements.length > 0 ? window.getComputedStyle(elements[0]).color : 'none'
    ])
  ),
  brokenVariables
};

console.log('SNAPSHOT DATA (save this for comparison):');
console.log(JSON.stringify(snapshot, null, 2));

console.log('\n✅ Visual audit complete. Save the snapshot data above!');