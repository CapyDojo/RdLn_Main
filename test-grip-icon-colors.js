// Test Grip Icon Color Consistency
console.log('🎨 TESTING GRIP ICON COLOR CONSISTENCY');
console.log('=====================================');

// Find both handles
const inputHandle = document.querySelector('[data-resize-handle="input-panels"]');
const outputHandle = document.querySelector('[data-resize-handle="output-panel"]');

console.log('\n🔍 Handle Detection:');
console.log(`Input handle found: ${inputHandle ? '✅' : '❌'}`);
console.log(`Output handle found: ${outputHandle ? '✅' : '❌'}`);

// Test grip icon colors
function testGripIconColor(handle, handleName) {
  if (!handle) return null;
  
  const gripIcon = handle.querySelector('svg, .lucide-grip-horizontal');
  if (!gripIcon) {
    console.log(`${handleName}: No grip icon found`);
    return null;
  }
  
  const styles = window.getComputedStyle(gripIcon);
  return {
    color: styles.color,
    opacity: styles.opacity,
    visibility: styles.visibility
  };
}

console.log('\n🎨 Normal State Colors:');
const inputGripNormal = testGripIconColor(inputHandle, 'Input handle');
const outputGripNormal = testGripIconColor(outputHandle, 'Output handle');

if (inputGripNormal) {
  console.log(`Input grip: color=${inputGripNormal.color}, opacity=${inputGripNormal.opacity}`);
}
if (outputGripNormal) {
  console.log(`Output grip: color=${outputGripNormal.color}, opacity=${outputGripNormal.opacity}`);
}

// Check if colors match
const colorsMatch = inputGripNormal && outputGripNormal && 
                   inputGripNormal.color === outputGripNormal.color &&
                   inputGripNormal.opacity === outputGripNormal.opacity;

console.log(`Normal state colors match: ${colorsMatch ? '✅' : '❌'}`);

// Test hover state colors
console.log('\n🎯 Hover State Colors:');

if (inputHandle) {
  inputHandle.dispatchEvent(new MouseEvent('mouseenter'));
  setTimeout(() => {
    const inputGripHover = testGripIconColor(inputHandle, 'Input handle hover');
    if (inputGripHover) {
      console.log(`Input grip hover: color=${inputGripHover.color}, opacity=${inputGripHover.opacity}`);
    }
    inputHandle.dispatchEvent(new MouseEvent('mouseleave'));
  }, 50);
}

if (outputHandle) {
  outputHandle.dispatchEvent(new MouseEvent('mouseenter'));
  setTimeout(() => {
    const outputGripHover = testGripIconColor(outputHandle, 'Output handle hover');
    if (outputGripHover) {
      console.log(`Output grip hover: color=${outputGripHover.color}, opacity=${outputGripHover.opacity}`);
    }
    outputHandle.dispatchEvent(new MouseEvent('mouseleave'));
    
    // Final comparison after both hover tests
    setTimeout(() => {
      console.log('\n📊 CONSISTENCY CHECK:');
      console.log('=====================');
      
      // Check expected colors from CSS variables
      const expectedSecondary = getComputedStyle(document.documentElement).getPropertyValue('--theme-text-secondary').trim();
      const expectedBody = getComputedStyle(document.documentElement).getPropertyValue('--theme-text-body').trim();
      
      console.log(`Expected secondary color: ${expectedSecondary}`);
      console.log(`Expected body color: ${expectedBody}`);
      
      const normalStateCorrect = inputGripNormal && outputGripNormal &&
                                inputGripNormal.color === `rgb(71, 85, 105)` && // --theme-text-secondary
                                outputGripNormal.color === `rgb(71, 85, 105)` &&
                                inputGripNormal.opacity === '0.6' &&
                                outputGripNormal.opacity === '0.6';
      
      console.log(`Normal state styling correct: ${normalStateCorrect ? '✅' : '❌'}`);
      console.log(`Both handles use consistent grip icon colors: ${colorsMatch ? '✅' : '❌'}`);
      
      console.log('\n✅ Grip icon color consistency test complete!');
    }, 100);
  }, 50);
}

console.log('\n⏳ Testing hover states...');