// Diagnose Output Handle Hover Issue
console.log('🔍 DIAGNOSING OUTPUT HANDLE HOVER ISSUE');
console.log('=====================================');

// Find the output handle
const outputHandle = document.querySelector('[data-resize-handle="output-panel"]');
const outputPanel = document.querySelector('[data-output-panel] .glass-panel');

if (!outputHandle) {
  console.log('❌ Output handle not found');
} else {
  console.log('✅ Output handle found');
  
  // Check current styles
  const handleStyles = window.getComputedStyle(outputHandle);
  console.log('\n🎨 Current Handle Styles:');
  console.log(`Background: ${handleStyles.backgroundColor}`);
  console.log(`Border: ${handleStyles.borderColor}`);
  console.log(`Box Shadow: ${handleStyles.boxShadow}`);
  console.log(`Transform: ${handleStyles.transform}`);
  
  // Test hover state
  console.log('\n🖱️ Testing Handle Hover...');
  outputHandle.classList.add('force-hover');
  
  setTimeout(() => {
    const hoverStyles = window.getComputedStyle(outputHandle);
    console.log('\n🎨 Handle Hover Styles:');
    console.log(`Background: ${hoverStyles.backgroundColor}`);
    console.log(`Border: ${hoverStyles.borderColor}`);
    console.log(`Box Shadow: ${hoverStyles.boxShadow}`);
    console.log(`Transform: ${hoverStyles.transform}`);
    
    outputHandle.classList.remove('force-hover');
  }, 100);
}

if (!outputPanel) {
  console.log('❌ Output panel not found');
} else {
  console.log('✅ Output panel found');
  
  // Check panel hover styles
  const panelStyles = window.getComputedStyle(outputPanel);
  console.log('\n🎨 Current Panel Styles:');
  console.log(`Background: ${panelStyles.backgroundColor}`);
  console.log(`Border: ${panelStyles.borderColor}`);
  console.log(`Box Shadow: ${panelStyles.boxShadow}`);
  console.log(`Transform: ${panelStyles.transform}`);
  
  // Test panel hover state
  console.log('\n🖱️ Testing Panel Hover...');
  outputPanel.classList.add('force-hover');
  
  setTimeout(() => {
    const panelHoverStyles = window.getComputedStyle(outputPanel);
    console.log('\n🎨 Panel Hover Styles:');
    console.log(`Background: ${panelHoverStyles.backgroundColor}`);
    console.log(`Border: ${panelHoverStyles.borderColor}`);
    console.log(`Box Shadow: ${panelHoverStyles.boxShadow}`);
    console.log(`Transform: ${panelHoverStyles.transform}`);
    
    outputPanel.classList.remove('force-hover');
    
    // Compare the two
    console.log('\n🔍 COMPARISON:');
    console.log('The issue is that the handle and panel have different hover effects.');
    console.log('The handle should also get the glass panel shadow effects when hovered.');
    
  }, 100);
}

console.log('\n💡 SOLUTION:');
console.log('Add glass panel hover effects to the output handle hover state');
console.log('This will make the handle participate in the glassmorphism effects');