// Test Input Panel Handle Visibility
console.log('👁️ TESTING INPUT PANEL HANDLE VISIBILITY');
console.log('========================================');

// Find input panel resize handle
const inputHandle = document.querySelector('[data-resize-handle="input-panels"]');
const outputHandle = document.querySelector('[data-resize-handle="output-panel"]');

console.log('\n🔍 Resize Handle Detection:');
console.log(`Input handle found: ${inputHandle ? '✅' : '❌'}`);
console.log(`Output handle found: ${outputHandle ? '✅' : '❌'}`);

if (inputHandle) {
  const inputStyles = window.getComputedStyle(inputHandle);
  const isHidden = inputStyles.display === 'none' || inputStyles.visibility === 'hidden';
  
  console.log('\n📋 Input Handle Styles:');
  console.log(`  Display: ${inputStyles.display}`);
  console.log(`  Visibility: ${inputStyles.visibility}`);
  console.log(`  Opacity: ${inputStyles.opacity}`);
  console.log(`  Is Hidden: ${isHidden ? '✅' : '❌'}`);
  
  if (!isHidden) {
    console.log('  Background: ', inputStyles.backgroundColor);
    console.log('  Border: ', inputStyles.borderColor);
  }
} else {
  console.log('❌ Input handle not found in DOM');
}

if (outputHandle) {
  const outputStyles = window.getComputedStyle(outputHandle);
  const isVisible = outputStyles.display !== 'none' && outputStyles.visibility !== 'hidden';
  
  console.log('\n📋 Output Handle Styles:');
  console.log(`  Display: ${outputStyles.display}`);
  console.log(`  Visibility: ${outputStyles.visibility}`);
  console.log(`  Is Visible: ${isVisible ? '✅' : '❌'}`);
  
  if (isVisible) {
    console.log('  Background: ', outputStyles.backgroundColor);
    console.log('  Border: ', outputStyles.borderColor);
  }
}

// Check all resize handles
console.log('\n🔧 All Resize Handles:');
const allHandles = document.querySelectorAll('[data-resize-handle]');
allHandles.forEach((handle, i) => {
  const handleType = handle.getAttribute('data-resize-handle');
  const styles = window.getComputedStyle(handle);
  const isVisible = styles.display !== 'none' && styles.visibility !== 'hidden';
  
  console.log(`Handle ${i + 1} (${handleType}): ${isVisible ? 'Visible ✅' : 'Hidden ❌'}`);
});

console.log('\n📊 SUMMARY:');
console.log('===========');
const inputHidden = inputHandle ? window.getComputedStyle(inputHandle).display === 'none' : false;
const outputVisible = outputHandle ? window.getComputedStyle(outputHandle).display !== 'none' : false;

// Check if input handle is seamless (transparent background, no border)
const inputSeamless = inputHandle ? (
  window.getComputedStyle(inputHandle).backgroundColor === 'rgba(0, 0, 0, 0)' ||
  window.getComputedStyle(inputHandle).backgroundColor === 'transparent'
) : false;

// Check if grip icon is visible and styled
const gripIcon = inputHandle ? inputHandle.querySelector('svg, .lucide-grip-horizontal') : null;
const gripVisible = gripIcon ? (
  window.getComputedStyle(gripIcon).opacity !== '0' &&
  window.getComputedStyle(gripIcon).visibility !== 'hidden'
) : false;

console.log(`Input panel handle seamless: ${inputSeamless ? '✅' : '❌'}`);
console.log(`Grip icon visible: ${gripVisible ? '✅' : '❌'}`);
console.log(`Output panel handle visible: ${outputVisible ? '✅' : '❌'}`);
console.log(`Perfect setup: ${inputSeamless && gripVisible && outputVisible ? '✅' : '❌'}`);

if (gripIcon) {
  console.log(`Grip icon color: ${window.getComputedStyle(gripIcon).color}`);
  console.log(`Grip icon opacity: ${window.getComputedStyle(gripIcon).opacity}`);
}

console.log('\n✅ Handle seamless appearance with grip test complete!');