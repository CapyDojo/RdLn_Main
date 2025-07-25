/**
 * Neon Night Shadow Debug Script
 * Compares shadow intensities across themes to verify the fix
 */

console.log('🌙 NEON NIGHT SHADOW INTENSITY DEBUG');
console.log('===================================');

// Shadow color comparisons
const themes = {
  'Kyoto': '220, 8, 8',
  'Professional': '30, 64, 175', 
  'Neon Night (OLD)': '139, 92, 246',
  'Neon Night (NEW)': '76, 29, 149'
};

console.log('\n🎨 SHADOW COLOR COMPARISON:');
Object.entries(themes).forEach(([theme, rgb]) => {
  const [r, g, b] = rgb.split(', ').map(Number);
  
  // Calculate perceived brightness (0-255 scale)
  const brightness = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  
  // Calculate color intensity (distance from gray)
  const gray = (r + g + b) / 3;
  const intensity = Math.round(Math.sqrt(
    Math.pow(r - gray, 2) + 
    Math.pow(g - gray, 2) + 
    Math.pow(b - gray, 2)
  ));
  
  console.log(`${theme.padEnd(20)} | RGB: ${rgb.padEnd(12)} | Brightness: ${brightness.toString().padStart(3)} | Intensity: ${intensity.toString().padStart(3)}`);
});

console.log('\n📊 ANALYSIS:');
console.log('• Lower brightness = stronger shadow effect');
console.log('• Higher intensity = more vibrant color');
console.log('• Neon Night NEW should now match Professional/Kyoto shadow strength');

console.log('\n🔍 HOVER EFFECT PREVIEW:');
console.log('box-shadow: 0 24px 64px 0 rgba(76, 29, 149, 0.6), 0 10px 36px 0 rgba(76, 29, 149, 0.4);');
console.log('This creates a deep purple neon glow that should be much more visible than before.');

console.log('\n✅ EXPECTED RESULT:');
console.log('Neon Night hover shadows should now feel as strong as Kyoto and Professional themes');