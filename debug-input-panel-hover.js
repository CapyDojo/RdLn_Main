// Debug script to check input panel hover behavior
console.log('🔍 INPUT PANEL HOVER DEBUG');

// Check if we're in Kyoto theme
const currentTheme = document.documentElement.getAttribute('data-theme');
console.log('Current theme:', currentTheme);

// Find input panels
const inputPanels = document.querySelectorAll('[data-input-panel]');
console.log('Found input panels:', inputPanels.length);

inputPanels.forEach((panel, index) => {
    console.log(`\nInput Panel ${index + 1}:`);
    console.log('- Element:', panel);
    console.log('- Classes:', panel.className);

    // Find glass panels inside
    const glassPanels = panel.querySelectorAll('.glass-panel.glass-content-panel');
    console.log('- Glass content panels inside:', glassPanels.length);

    glassPanels.forEach((glassPanel, glassIndex) => {
        console.log(`  Glass Panel ${glassIndex + 1}:`);
        console.log('  - Classes:', glassPanel.className);
        console.log('  - Current box-shadow:', getComputedStyle(glassPanel).boxShadow);
        console.log('  - Current transform:', getComputedStyle(glassPanel).transform);
        console.log('  - Current border-color:', getComputedStyle(glassPanel).borderColor);
    });
});

// Test CSS selector matching
console.log('\n🎯 CSS SELECTOR TESTING:');

// Test the selectors we're using
const selector1 = '[data-theme="kyoto"][data-input-panel] .glass-panel.glass-content-panel';
const selector2 = '[data-theme="kyoto"] [data-input-panel] .glass-panel.glass-content-panel';

console.log('Selector 1 matches:', document.querySelectorAll(selector1).length);
console.log('Selector 2 matches:', document.querySelectorAll(selector2).length);

// Check if the theme attribute is on the right element
console.log('Theme on html:', document.documentElement.getAttribute('data-theme'));
console.log('Theme on body:', document.body.getAttribute('data-theme'));

// Manual hover test
console.log('\n🧪 MANUAL HOVER TEST:');
const testPanel = document.querySelector('[data-input-panel] .glass-panel.glass-content-panel');
if (testPanel) {
    console.log('Test panel found:', testPanel);

    // Apply hover styles manually
    testPanel.style.borderColor = 'rgba(220, 8, 8, 0.6)';
    testPanel.style.boxShadow = '0 30px 80px 0 rgba(220, 8, 8, 0.7), 0 12px 40px 0 rgba(220, 8, 8, 0.5)';
    testPanel.style.transform = 'translateY(-2px)';

    console.log('Applied manual hover styles - check if shadow is now stronger');

    // Remove after 3 seconds
    setTimeout(() => {
        testPanel.style.borderColor = '';
        testPanel.style.boxShadow = '';
        testPanel.style.transform = '';
        console.log('Removed manual hover styles');
    }, 3000);
} else {
    console.log('No test panel found');
}

// Check CSS rule specificity
console.log('\n📊 CSS RULE ANALYSIS:');
console.log('Our rule should have high specificity due to:');
console.log('- [data-theme="kyoto"] = attribute selector');
console.log('- [data-input-panel] = attribute selector');
console.log('- .glass-panel.glass-content-panel = 2 class selectors');
console.log('- :hover = pseudo-class');
console.log('- !important = highest priority');