/**
 * Parent Container Debug Script
 * Investigates parent containers and background layers causing gray appearance
 * Run this in browser console to get detailed info
 */

console.log('🔍 PARENT CONTAINER DEBUG - Gray Background Investigation');
console.log('========================================================');

// Find all text areas (input fields)
const textAreas = document.querySelectorAll('.glass-input-field');
console.log(`\n📊 Found ${textAreas.length} text areas to analyze`);

textAreas.forEach((textArea, index) => {
  console.log(`\n🔍 TEXT AREA ${index + 1} ANALYSIS:`);
  console.log('================================');
  
  // Text area itself
  const computedStyle = window.getComputedStyle(textArea);
  console.log(`📋 Text Area Direct Styles:`);
  console.log(`  Background: ${computedStyle.background}`);
  console.log(`  Background-color: ${computedStyle.backgroundColor}`);
  console.log(`  Backdrop-filter: ${computedStyle.backdropFilter}`);
  console.log(`  Classes: ${textArea.className}`);
  
  // Walk up the parent chain
  let currentElement = textArea.parentElement;
  let level = 1;
  
  console.log(`\n🏗️  PARENT CONTAINER CHAIN:`);
  
  while (currentElement && level <= 5) {
    const parentStyle = window.getComputedStyle(currentElement);
    const hasBackground = parentStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
                         parentStyle.backgroundColor !== 'transparent';
    
    console.log(`\n  📦 LEVEL ${level} PARENT:`);
    console.log(`    Tag: ${currentElement.tagName}`);
    console.log(`    Classes: ${currentElement.className}`);
    console.log(`    Background: ${parentStyle.background}`);
    console.log(`    Background-color: ${parentStyle.backgroundColor}`);
    console.log(`    Has Background: ${hasBackground ? '🔴 YES' : '✅ NO'}`);
    console.log(`    Backdrop-filter: ${parentStyle.backdropFilter}`);
    console.log(`    Opacity: ${parentStyle.opacity}`);
    
    // Check for specific problematic classes
    const problematicClasses = [
      'bg-theme-neutral', 'bg-gray', 'bg-slate', 'glass-content-panel',
      'bg-white', 'bg-black', 'bg-transparent'
    ];
    
    const foundProblematic = problematicClasses.filter(cls => 
      currentElement.className.includes(cls)
    );
    
    if (foundProblematic.length > 0) {
      console.log(`    🚨 Problematic classes: ${foundProblematic.join(', ')}`);
    }
    
    currentElement = currentElement.parentElement;
    level++;
  }
  
  console.log(`\n🎯 SUMMARY FOR TEXT AREA ${index + 1}:`);
  console.log(`  Direct background: ${computedStyle.backgroundColor}`);
  console.log(`  Direct backdrop-filter: ${computedStyle.backdropFilter}`);
});

// Check for global CSS variables
console.log(`\n🌐 GLOBAL CSS VARIABLES CHECK:`);
const rootStyle = window.getComputedStyle(document.documentElement);
console.log(`  --theme-glass-bg: ${rootStyle.getPropertyValue('--theme-glass-bg')}`);
console.log(`  --glass-panel: ${rootStyle.getPropertyValue('--glass-panel')}`);
console.log(`  --glass-subtle: ${rootStyle.getPropertyValue('--glass-subtle')}`);

// Check theme
const htmlElement = document.documentElement;
const currentTheme = htmlElement.getAttribute('data-theme');
console.log(`\n🎨 CURRENT THEME: ${currentTheme}`);

// Look for any elements with gray backgrounds
console.log(`\n🔍 SCANNING FOR GRAY BACKGROUNDS:`);
const allElements = document.querySelectorAll('*');
const grayElements = [];

Array.from(allElements).forEach(el => {
  const style = window.getComputedStyle(el);
  const bgColor = style.backgroundColor;
  
  // Check if background is grayish
  if (bgColor.includes('128') || bgColor.includes('169') || bgColor.includes('156') ||
      bgColor.includes('gray') || bgColor.includes('grey') ||
      (bgColor.includes('rgb') && bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/) &&
       Math.abs(parseInt(RegExp.$1) - parseInt(RegExp.$2)) < 20 &&
       Math.abs(parseInt(RegExp.$2) - parseInt(RegExp.$3)) < 20)) {
    
    grayElements.push({
      tag: el.tagName,
      classes: el.className,
      background: bgColor
    });
  }
});

console.log(`Found ${grayElements.length} elements with gray backgrounds:`);
grayElements.slice(0, 10).forEach((el, i) => {
  console.log(`  ${i + 1}. ${el.tag} - ${el.background} - ${el.classes}`);
});

// Test backdrop filter effect
console.log(`\n🧪 BACKDROP FILTER TEST:`);
console.log('To test if backdrop-filter is causing gray appearance:');
console.log('1. Run: document.querySelectorAll(".glass-input-field").forEach(el => el.style.backdropFilter = "none")');
console.log('2. Check if gray appearance disappears');

// Test opacity threshold
console.log(`\n🧪 OPACITY THRESHOLD TEST:`);
console.log('To test browser opacity threshold:');
console.log('1. Run: document.querySelectorAll(".glass-input-field").forEach(el => el.style.background = "rgba(8, 8, 12, 0)")');
console.log('2. Check if background disappears completely');

console.log(`\n🎯 INVESTIGATION COMPLETE`);
console.log('Look for 🔴 YES indicators in parent backgrounds above!');