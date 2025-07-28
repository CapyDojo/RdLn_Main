// Debug Classic Dark opacity system - AFTER glassmorphism: true
console.log('🔍 DEBUGGING CLASSIC DARK OPACITY SYSTEM - V2');

// 1. Check what CSS variables are actually set
console.log('\n📊 CSS Variables:');
const root = document.documentElement;
const glassOpacity = getComputedStyle(root).getPropertyValue('--glass-opacity').trim();
const glassBlur = getComputedStyle(root).getPropertyValue('--glass-blur').trim();
const glassPanel = getComputedStyle(root).getPropertyValue('--glass-panel').trim();
const glassBg = getComputedStyle(root).getPropertyValue('--glass-bg').trim();
const themeGlassBg = getComputedStyle(root).getPropertyValue('--theme-glass-bg').trim();

console.log('--glass-opacity:', glassOpacity);
console.log('--glass-blur:', glassBlur);
console.log('--glass-panel:', glassPanel);
console.log('--glass-bg:', glassBg);
console.log('--theme-glass-bg:', themeGlassBg);

// 2. Check actual computed styles on a glass panel
console.log('\n🔬 Actual Glass Panel Styles:');
const glassPanelElement = document.querySelector('.glass-panel');
if (glassPanelElement) {
  const computed = getComputedStyle(glassPanelElement);
  console.log('background:', computed.background);
  console.log('backgroundColor:', computed.backgroundColor);
  console.log('backdropFilter:', computed.backdropFilter);
} else {
  console.log('No .glass-panel elements found');
}

// 3. Test the expected background calculation
console.log('\n🧮 Expected Background Calculation:');
if (themeGlassBg && glassPanel) {
  console.log(`Expected: rgba(${themeGlassBg}, ${glassPanel})`);
  console.log(`With backgroundOpacity=1: Should be rgba(${themeGlassBg}, 1) = solid background`);
} else {
  console.log('Missing variables for calculation');
  console.log('themeGlassBg:', themeGlassBg);
  console.log('glassPanel:', glassPanel);
}

// 4. Check if theme changed properly
console.log('\n🎨 Theme Check:');
const currentTheme = document.documentElement.getAttribute('data-theme');
console.log('Current theme:', currentTheme);