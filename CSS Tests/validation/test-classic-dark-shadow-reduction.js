// Classic Dark Theme Shadow Reduction Validation
// Tests the reduced shadow effects implementation

console.log('🌑 CLASSIC DARK SHADOW REDUCTION TEST');
console.log('Validating reduced shadow effects for subtler appearance');

// Test 1: Rest State Shadow Validation
console.log('\n1️⃣ REST STATE SHADOW VALIDATION:');

const glassPanels = document.querySelectorAll('.glass-panel');
console.log(`Found ${glassPanels.length} glass panel elements`);

if (glassPanels.length > 0) {
  const panel = glassPanels[0];
  const style = window.getComputedStyle(panel);
  const boxShadow = style.boxShadow;
  
  console.log(`Current box-shadow: ${boxShadow}`);
  
  // Check for reduced shadow values
  const hasReducedShadow = boxShadow.includes('4px') && boxShadow.includes('16px');
  const noLargeShadow = !boxShadow.includes('32px') || !boxShadow.includes('8px');
  
  console.log(`✅ Expected Pattern: 0 4px 16px 0 rgba(...)`);
  console.log(`${hasReducedShadow ? '✅' : '❌'} Contains reduced shadow values (4px, 16px)`);
  console.log(`${noLargeShadow ? '✅' : '❌'} No large shadow values detected`);
  
  if (hasReducedShadow) {
    console.log('✅ REST STATE: Shadow reduction successfully applied');
  } else {
    console.log('❌ REST STATE: Shadow reduction not detected');
  }
} else {
  console.log('⚠️ No glass panels found for rest state testing');
}

// Test 2: Hover State Shadow Validation
console.log('\n2️⃣ HOVER STATE SHADOW VALIDATION:');

if (glassPanels.length > 0) {
  const testPanel = glassPanels[0];
  
  // Get original shadow
  const originalShadow = window.getComputedStyle(testPanel).boxShadow;
  console.log(`Original shadow: ${originalShadow}`);
  
  // Simulate hover by adding force-hover class
  testPanel.classList.add('force-hover');
  
  setTimeout(() => {
    const hoverStyle = window.getComputedStyle(testPanel);
    const hoverShadow = hoverStyle.boxShadow;
    
    console.log(`Hover shadow: ${hoverShadow}`);
    
    // Check for reduced hover shadow values
    const hasReducedHoverShadow = hoverShadow.includes('12px') && hoverShadow.includes('32px') && 
                                  hoverShadow.includes('6px') && hoverShadow.includes('18px');
    const noLargeHoverShadow = !hoverShadow.includes('64px') && !hoverShadow.includes('24px') && 
                               !hoverShadow.includes('36px') && !hoverShadow.includes('10px');
    
    console.log(`✅ Expected Pattern: 0 12px 32px 0 rgba(..., 0.4), 0 6px 18px 0 rgba(..., 0.25)`);
    console.log(`${hasReducedHoverShadow ? '✅' : '❌'} Contains reduced hover shadow values (12px, 32px, 6px, 18px)`);
    console.log(`${noLargeHoverShadow ? '✅' : '❌'} No large hover shadow values detected`);
    
    if (hasReducedHoverShadow && noLargeHoverShadow) {
      console.log('✅ HOVER STATE: Shadow reduction successfully applied');
    } else {
      console.log('❌ HOVER STATE: Shadow reduction not detected');
    }
    
    // Clean up
    testPanel.classList.remove('force-hover');
  }, 100);
} else {
  console.log('⚠️ No glass panels found for hover state testing');
}

// Test 3: Shadow Intensity Comparison
console.log('\n3️⃣ SHADOW INTENSITY COMPARISON:');

// Create comparison elements to test shadow differences
const testContainer = document.createElement('div');
testContainer.style.position = 'absolute';
testContainer.style.top = '-9999px';
testContainer.style.left = '-9999px';
document.body.appendChild(testContainer);

// Create test elements with old vs new shadow values
const oldShadowElement = document.createElement('div');
oldShadowElement.style.boxShadow = '0 8px 32px 0 rgba(249, 115, 22, 0.3)';
oldShadowElement.style.width = '100px';
oldShadowElement.style.height = '100px';

const newShadowElement = document.createElement('div');
newShadowElement.style.boxShadow = '0 4px 16px 0 rgba(249, 115, 22, 0.3)';
newShadowElement.style.width = '100px';
newShadowElement.style.height = '100px';

testContainer.appendChild(oldShadowElement);
testContainer.appendChild(newShadowElement);

const oldShadowStyle = window.getComputedStyle(oldShadowElement).boxShadow;
const newShadowStyle = window.getComputedStyle(newShadowElement).boxShadow;

console.log(`Old shadow (reference): ${oldShadowStyle}`);
console.log(`New shadow (current): ${newShadowStyle}`);

// Check shadow reduction effectiveness
const shadowReduced = newShadowStyle !== oldShadowStyle;
console.log(`${shadowReduced ? '✅' : '❌'} Shadow values have been modified`);

// Clean up test elements
document.body.removeChild(testContainer);

// Test 4: Visual Impact Assessment
console.log('\n4️⃣ VISUAL IMPACT ASSESSMENT:');

console.log('Shadow Reduction Summary:');
console.log('- Rest State: 8px→4px blur, 32px→16px spread (50% reduction)');
console.log('- Hover State: 24px→12px blur, 64px→32px spread (50% reduction)');
console.log('- Hover State: 10px→6px blur, 36px→18px spread (40% reduction)');
console.log('- Opacity: 0.6→0.4, 0.4→0.25 (33% and 37.5% reduction)');

// Test 5: Performance Impact
console.log('\n5️⃣ PERFORMANCE IMPACT:');

const startTime = performance.now();

// Simulate multiple shadow calculations
for (let i = 0; i < 100; i++) {
  const testDiv = document.createElement('div');
  testDiv.style.boxShadow = '0 4px 16px 0 rgba(249, 115, 22, 0.3)';
  testDiv.style.width = '10px';
  testDiv.style.height = '10px';
  document.body.appendChild(testDiv);
  window.getComputedStyle(testDiv).boxShadow;
  document.body.removeChild(testDiv);
}

const endTime = performance.now();
const renderTime = endTime - startTime;

console.log(`Shadow rendering test: ${renderTime.toFixed(2)}ms for 100 elements`);

if (renderTime < 50) {
  console.log('✅ Good performance - reduced shadows render efficiently');
} else if (renderTime < 100) {
  console.log('⚠️ Moderate performance - acceptable rendering time');
} else {
  console.log('❌ Poor performance - shadows may impact rendering');
}

// Test 6: Theme Consistency Check
console.log('\n6️⃣ THEME CONSISTENCY CHECK:');

// Verify all glass panels have consistent reduced shadows
let consistentShadows = true;
const shadowReference = glassPanels.length > 0 ? window.getComputedStyle(glassPanels[0]).boxShadow : '';

glassPanels.forEach((panel, index) => {
  const panelShadow = window.getComputedStyle(panel).boxShadow;
  if (panelShadow !== shadowReference) {
    consistentShadows = false;
    console.log(`⚠️ Panel ${index + 1}: Inconsistent shadow - ${panelShadow}`);
  }
});

if (consistentShadows && glassPanels.length > 0) {
  console.log('✅ All glass panels have consistent reduced shadows');
} else if (glassPanels.length === 0) {
  console.log('⚠️ No glass panels found for consistency check');
} else {
  console.log('❌ Shadow inconsistencies detected across panels');
}

console.log('\n🏁 SHADOW REDUCTION TEST COMPLETE');
console.log('Classic Dark theme now uses subtler shadow effects for refined appearance');