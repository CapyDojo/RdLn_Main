// CSS Cascade Hierarchy Analysis - Baseline Report
// Task 1: Analyze current CSS cascade conflicts and create baseline
// 
// USAGE: Copy and paste this entire script into browser console
// Make sure you're on a page with Kyoto theme active

(function() {
  'use strict';
  
  console.log('🔍 CSS CASCADE HIERARCHY ANALYSIS - BASELINE REPORT');
  console.log('='.repeat(60));
  
  // Check if we're in browser environment
  if (typeof document === 'undefined') {
    console.error('❌ This script must be run in a browser environment');
    console.log('📝 Instructions:');
    console.log('1. Open your application in browser');
    console.log('2. Switch to Kyoto theme');
    console.log('3. Open browser console (F12)');
    console.log('4. Copy and paste this entire script');
    return;
  }

// Helper function to calculate CSS specificity
function calculateSpecificity(selector) {
  const ids = (selector.match(/#[a-zA-Z][\w-]*/g) || []).length;
  const classes = (selector.match(/\.[a-zA-Z][\w-]*/g) || []).length;
  const attributes = (selector.match(/\[[^\]]*\]/g) || []).length;
  const pseudoClasses = (selector.match(/:[a-zA-Z][\w-]*/g) || []).length;
  const elements = (selector.match(/^[a-zA-Z][\w-]*|(?:\s+[a-zA-Z][\w-]*)/g) || []).length;
  
  return {
    inline: 0, // We're not checking inline styles
    ids: ids,
    classes: classes + attributes + pseudoClasses,
    elements: elements,
    specificity: `${0},${ids},${classes + attributes + pseudoClasses},${elements}`,
    numericValue: (ids * 100) + ((classes + attributes + pseudoClasses) * 10) + elements
  };
}

// 1. GLASS PANEL BASE STYLING ANALYSIS
console.log('\n📋 1. GLASS PANEL BASE STYLING ANALYSIS');
console.log('-'.repeat(40));

const glassPanels = document.querySelectorAll('.glass-panel');
console.log(`Found ${glassPanels.length} glass panels`);

glassPanels.forEach((panel, index) => {
  const computedStyle = getComputedStyle(panel);
  const isKyotoTheme = document.documentElement.getAttribute('data-theme') === 'kyoto';
  
  console.log(`\nPanel ${index + 1}:`);
  console.log(`  Classes: ${panel.className}`);
  console.log(`  Background: ${computedStyle.backgroundColor}`);
  console.log(`  Border: ${computedStyle.border}`);
  console.log(`  Box Shadow: ${computedStyle.boxShadow}`);
  console.log(`  Backdrop Filter: ${computedStyle.backdropFilter}`);
  
  // Check if background is white (base style) vs dark (theme style)
  const bgColor = computedStyle.backgroundColor;
  const isWhiteBackground = bgColor.includes('255, 255, 255') || bgColor.includes('rgb(255, 255, 255)');
  const isDarkBackground = bgColor.includes('28, 25, 23') || bgColor.includes('rgb(28, 25, 23)');
  
  console.log(`  ❌ Issue: White background detected (base override): ${isWhiteBackground}`);
  console.log(`  ✅ Expected: Dark background (theme applied): ${isDarkBackground}`);
  
  if (isKyotoTheme && isWhiteBackground) {
    console.log(`  🚨 CASCADE CONFLICT: Base glassmorphism.css overriding kyoto.css`);
  }
});

// 2. TEXT HIERARCHY COLOR ANALYSIS
console.log('\n📝 2. TEXT HIERARCHY COLOR ANALYSIS');
console.log('-'.repeat(40));

const textElements = [
  { selector: '.text-body', expectedColor: '#f8b4b4', description: 'Body text (peach)' },
  { selector: 'h1, h2, h3, .text-header', expectedColor: '#86efac', description: 'Headers (green)' },
  { selector: '.text-secondary', expectedColor: '#fef7e6', description: 'Secondary text (wheat)' },
  { selector: 'textarea', expectedColor: '#f8b4b4', description: 'Textarea (peach)' },
  { selector: 'input', expectedColor: '#f8b4b4', description: 'Input fields (peach)' }
];

textElements.forEach(({ selector, expectedColor, description }) => {
  const elements = document.querySelectorAll(selector);
  console.log(`\n${description} (${selector}):`);
  console.log(`  Found ${elements.length} elements`);
  
  elements.forEach((el, index) => {
    const computedStyle = getComputedStyle(el);
    const actualColor = computedStyle.color;
    const isCorrectColor = actualColor.includes(expectedColor.replace('#', '')) || 
                          actualColor === expectedColor;
    
    console.log(`  Element ${index + 1}: ${actualColor}`);
    console.log(`  Expected: ${expectedColor}`);
    console.log(`  ✅ Correct: ${isCorrectColor}`);
    
    if (!isCorrectColor) {
      console.log(`  🚨 CASCADE CONFLICT: Text color not matching theme`);
    }
  });
});

// 3. HOVER EFFECTS ANALYSIS
console.log('\n🎯 3. HOVER EFFECTS ANALYSIS');
console.log('-'.repeat(40));

// Test direct hover
const testPanel = glassPanels[0];
if (testPanel) {
  console.log('\nTesting direct hover effects:');
  
  // Simulate hover
  testPanel.dispatchEvent(new MouseEvent('mouseenter'));
  const hoverStyle = getComputedStyle(testPanel);
  
  console.log(`  Hover Background: ${hoverStyle.backgroundColor}`);
  console.log(`  Hover Border: ${hoverStyle.borderColor}`);
  console.log(`  Hover Shadow: ${hoverStyle.boxShadow}`);
  console.log(`  Hover Transform: ${hoverStyle.transform}`);
  
  // Check for strong shadow effects (Kyoto theme should have dramatic shadows)
  const hasStrongShadow = hoverStyle.boxShadow.includes('64px') || hoverStyle.boxShadow.includes('72px');
  console.log(`  ✅ Strong shadow effects: ${hasStrongShadow}`);
  
  // Remove hover
  testPanel.dispatchEvent(new MouseEvent('mouseleave'));
}

// Test programmatic hover (hover-from-handle)
console.log('\nTesting programmatic hover effects:');
if (testPanel) {
  testPanel.classList.add('hover-from-handle');
  const programmaticHoverStyle = getComputedStyle(testPanel);
  
  console.log(`  Programmatic Hover Background: ${programmaticHoverStyle.backgroundColor}`);
  console.log(`  Programmatic Hover Border: ${programmaticHoverStyle.borderColor}`);
  console.log(`  Programmatic Hover Shadow: ${programmaticHoverStyle.boxShadow}`);
  
  testPanel.classList.remove('hover-from-handle');
}

// 4. CSS SPECIFICITY ANALYSIS
console.log('\n⚖️ 4. CSS SPECIFICITY ANALYSIS');
console.log('-'.repeat(40));

const criticalSelectors = [
  // Base styles (glassmorphism.css)
  { selector: '.glass-panel', type: 'base', file: 'glassmorphism.css' },
  { selector: '.glass-panel:hover', type: 'base', file: 'glassmorphism.css' },
  { selector: '.glass-panel.hover-from-handle', type: 'base', file: 'glassmorphism.css' },
  
  // Theme styles (kyoto.css)
  { selector: 'html[data-theme="kyoto"] .glass-panel', type: 'theme', file: 'kyoto.css' },
  { selector: 'html[data-theme="kyoto"] .glass-panel:hover', type: 'theme', file: 'kyoto.css' },
  { selector: 'html[data-theme="kyoto"] .text-body', type: 'theme', file: 'kyoto.css' },
  
  // Layout styles (current-layout.css)
  { selector: '[data-theme="kyoto"] .layout-current .hover-from-handle', type: 'layout', file: 'current-layout.css' }
];

console.log('\nSpecificity Analysis:');
criticalSelectors.forEach(({ selector, type, file }) => {
  const spec = calculateSpecificity(selector);
  console.log(`\n${selector}`);
  console.log(`  File: ${file}`);
  console.log(`  Type: ${type}`);
  console.log(`  Specificity: ${spec.specificity}`);
  console.log(`  Numeric Value: ${spec.numericValue}`);
});

// 5. IMPORTANT DECLARATIONS AUDIT
console.log('\n❗ 5. !IMPORTANT DECLARATIONS AUDIT');
console.log('-'.repeat(40));

// Get all stylesheets
const stylesheets = Array.from(document.styleSheets);
const importantRules = [];

stylesheets.forEach((stylesheet, sheetIndex) => {
  try {
    const rules = Array.from(stylesheet.cssRules || stylesheet.rules || []);
    rules.forEach((rule, ruleIndex) => {
      if (rule.style) {
        for (let i = 0; i < rule.style.length; i++) {
          const property = rule.style[i];
          const priority = rule.style.getPropertyPriority(property);
          if (priority === 'important') {
            importantRules.push({
              selector: rule.selectorText,
              property: property,
              value: rule.style.getPropertyValue(property),
              stylesheet: stylesheet.href || 'inline'
            });
          }
        }
      }
    });
  } catch (e) {
    console.log(`  Cannot access stylesheet ${sheetIndex}: ${e.message}`);
  }
});

console.log(`\nFound ${importantRules.length} !important declarations:`);
importantRules.forEach((rule, index) => {
  console.log(`\n${index + 1}. ${rule.selector}`);
  console.log(`   Property: ${rule.property}: ${rule.value} !important`);
  console.log(`   File: ${rule.stylesheet}`);
});

// 6. THEME SWITCHING TEST
console.log('\n🔄 6. THEME SWITCHING VALIDATION');
console.log('-'.repeat(40));

const currentTheme = document.documentElement.getAttribute('data-theme');
console.log(`Current theme: ${currentTheme}`);

// Test if theme-specific CSS variables are properly set
const rootStyles = getComputedStyle(document.documentElement);
console.log('\nCSS Variables:');
console.log(`  --glass-panel: ${rootStyles.getPropertyValue('--glass-panel')}`);
console.log(`  --glass-focus: ${rootStyles.getPropertyValue('--glass-focus')}`);
console.log(`  --glass-strong: ${rootStyles.getPropertyValue('--glass-strong')}`);

// 7. PERFORMANCE IMPACT ANALYSIS
console.log('\n⚡ 7. PERFORMANCE IMPACT ANALYSIS');
console.log('-'.repeat(40));

const startTime = performance.now();

// Count total CSS rules
let totalRules = 0;
stylesheets.forEach(stylesheet => {
  try {
    totalRules += (stylesheet.cssRules || stylesheet.rules || []).length;
  } catch (e) {
    // Cross-origin stylesheet
  }
});

const endTime = performance.now();
console.log(`Total CSS rules: ${totalRules}`);
console.log(`Analysis time: ${(endTime - startTime).toFixed(2)}ms`);

// 8. SUMMARY AND RECOMMENDATIONS
console.log('\n📊 8. SUMMARY AND RECOMMENDATIONS');
console.log('-'.repeat(40));

console.log('\nIdentified Issues:');
console.log('1. Base glassmorphism.css styles using !important declarations');
console.log('2. Insufficient specificity in kyoto.css theme selectors');
console.log('3. Potential conflicts between layout and theme hover effects');
console.log('4. Text hierarchy colors may not be applying consistently');

console.log('\nRecommended Solutions:');
console.log('1. Remove !important from base styles where possible');
console.log('2. Enhance theme selector specificity with html[data-theme="kyoto"] prefix');
console.log('3. Consolidate hover effects into single, high-specificity rules');
console.log('4. Implement comprehensive text selector coverage');

console.log('\n✅ Baseline analysis complete. Ready for implementation phase.');

})(); // End of IIFE