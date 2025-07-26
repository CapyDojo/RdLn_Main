// Analyze the mysterious rgb(22, 101, 52) color in Kyoto active button

console.log('🔍 ANALYZING KYOTO ACTIVE BUTTON COLOR');
console.log('====================================');

// Convert rgb(22, 101, 52) to hex
const r = 22;
const g = 101;
const b = 52;

const toHex = (n) => {
  const hex = n.toString(16);
  return hex.length === 1 ? '0' + hex : hex;
};

const hexColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
console.log(`rgb(${r}, ${g}, ${b}) = ${hexColor}`);

// Check if this matches any common CSS color names or Tailwind colors
const commonGreenColors = {
  'green-800': '#166534',  // Tailwind green-800
  'green-700': '#15803d',  // Tailwind green-700
  'green-900': '#14532d',  // Tailwind green-900
  'emerald-800': '#065f46', // Tailwind emerald-800
  'emerald-700': '#047857', // Tailwind emerald-700
};

console.log('\nComparing with common green colors:');
Object.entries(commonGreenColors).forEach(([name, color]) => {
  const matches = color.toLowerCase() === hexColor.toLowerCase();
  console.log(`${matches ? '🎯 MATCH!' : '  '} ${name}: ${color} ${matches ? '← THIS IS IT!' : ''}`);
});

// Check if it's a Tailwind class being applied
console.log('\n🔍 LIKELY SOURCE:');
if (hexColor.toLowerCase() === '#166534') {
  console.log('🎯 This is Tailwind green-800 (#166534)!');
  console.log('The active button is likely getting a Tailwind class like:');
  console.log('  - text-green-800');
  console.log('  - or some CSS rule applying green-800 color');
} else {
  console.log(`Unknown color: ${hexColor}`);
  console.log('This might be a custom color or calculated value');
}

// Search for where this might be applied
console.log('\n💡 INVESTIGATION SUGGESTIONS:');
console.log('1. Check if .segment.active has any CSS rules');
console.log('2. Look for Tailwind classes on the active button');
console.log('3. Check for JavaScript applying colors dynamically');
console.log('4. Look for any CSS that targets active states');

// Test if we can find the actual CSS rule
console.log('\n🔍 CHECKING FOR ACTIVE STATE CSS RULES...');

// Set theme and find active button
document.documentElement.setAttribute('data-theme', 'kyoto');

setTimeout(() => {
  const activeButton = document.querySelector('.segment.active');
  if (activeButton) {
    console.log('Active button found:', activeButton);
    console.log('Classes:', activeButton.className);
    
    // Check computed styles
    const computedStyle = getComputedStyle(activeButton);
    console.log('Computed color:', computedStyle.color);
    
    // Try to find what CSS rule is setting this color
    console.log('\nTrying to identify the CSS rule...');
    
    // Check if removing 'active' class changes the color
    activeButton.classList.remove('active');
    const colorWithoutActive = getComputedStyle(activeButton).color;
    console.log('Color without .active class:', colorWithoutActive);
    
    // Restore active class
    activeButton.classList.add('active');
    const colorWithActive = getComputedStyle(activeButton).color;
    console.log('Color with .active class restored:', colorWithActive);
    
    const activeClassChangesColor = colorWithoutActive !== colorWithActive;
    console.log(`Active class changes color: ${activeClassChangesColor}`);
    
    if (activeClassChangesColor) {
      console.log('🎯 CONFIRMED: The .active class is applying the green color!');
      console.log('Look for CSS rules targeting .segment.active or .active');
    }
  } else {
    console.log('❌ No active button found');
  }
}, 100);

console.log('Analysis complete. Check results above.');