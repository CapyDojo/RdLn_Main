// Test the specificity fix for text-theme-primary-900 elements
console.log('🔧 SPECIFICITY FIX VALIDATION');
console.log('==============================');

// Find all elements with text-theme-primary-900 class
const primaryElements = document.querySelectorAll('.text-theme-primary-900');
console.log(`Found ${primaryElements.length} elements with text-theme-primary-900 class`);

let fixedCount = 0;
let stillBrokenCount = 0;

primaryElements.forEach((el, i) => {
  const computedColor = window.getComputedStyle(el).color;
  const isOrange = computedColor.includes('238, 143, 28') || computedColor === 'rgb(238, 143, 28)';
  const isGreen = computedColor.includes('134, 239, 172') || computedColor === 'rgb(134, 239, 172)';
  
  console.log(`\nElement ${i + 1}:`);
  console.log(`  Text: "${el.textContent.trim()}"`);
  console.log(`  Tag: ${el.tagName}`);
  console.log(`  Classes: ${el.className}`);
  console.log(`  Color: ${computedColor}`);
  console.log(`  Is Orange: ${isOrange}`);
  console.log(`  Is Green: ${isGreen}`);
  
  if (isOrange) {
    console.log(`  ✅ FIXED: Now showing orange as expected!`);
    fixedCount++;
  } else if (isGreen) {
    console.log(`  ❌ STILL BROKEN: Still showing green`);
    stillBrokenCount++;
  } else {
    console.log(`  ⚠️  UNEXPECTED COLOR: ${computedColor}`);
  }
});

console.log(`\n📊 SUMMARY:`);
console.log(`✅ Fixed: ${fixedCount}`);
console.log(`❌ Still broken: ${stillBrokenCount}`);
console.log(`📝 Total: ${primaryElements.length}`);

if (stillBrokenCount === 0 && fixedCount > 0) {
  console.log(`\n🎉 SUCCESS! All text-theme-primary-900 elements are now orange!`);
} else if (stillBrokenCount > 0) {
  console.log(`\n⚠️  Some elements still need fixing. Check CSS specificity.`);
}