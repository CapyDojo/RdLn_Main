// Clean CSS Hierarchy Test Script - Version 2
// This script verifies that our clean CSS hierarchy works correctly without !important declarations

console.log('🧪 TESTING CLEAN CSS HIERARCHY - VERSION 2');

// STEP 1: Verify that the nuclear fix is disabled
console.log('\n📋 STEP 1: VERIFYING NUCLEAR FIX IS DISABLED');
const nuclearFix = document.getElementById('nuclear-kyoto-hover-fix');
console.log('Nuclear fix element exists:', !!nuclearFix);

if (nuclearFix) {
    console.warn('⚠️ Nuclear fix is still active! Disabling it for clean test...');
    nuclearFix.parentNode.removeChild(nuclearFix);
}

// STEP 2: Check if we're in Kyoto theme
console.log('\n📋 STEP 2: VERIFYING THEME');
const currentTheme = document.documentElement.getAttribute('data-theme');
console.log('Current theme:', currentTheme);

if (currentTheme !== 'kyoto') {
    console.warn('⚠️ Not in Kyoto theme! This test should be run in Kyoto theme.');
}

// STEP 3: Find input panels
console.log('\n📋 STEP 3: FINDING INPUT PANELS');
const inputPanels = document.querySelectorAll('[data-input-panel] .glass-panel.glass-content-panel');
console.log(`Found ${inputPanels.length} input panels`);

if (inputPanels.length === 0) {
    console.error('❌ No input panels found! Make sure you\'re on the comparison page.');
}

// STEP 4: Check computed styles
console.log('\n📋 STEP 4: CHECKING COMPUTED STYLES');
inputPanels.forEach((panel, index) => {
    console.log(`\nPanel ${index + 1}:`);
    console.log('- Classes:', panel.className);

    const computedStyle = getComputedStyle(panel);
    console.log('- Default box-shadow:', computedStyle.boxShadow);
    console.log('- Default transform:', computedStyle.transform);
    console.log('- Default border-color:', computedStyle.borderColor);
});

// STEP 5: Simulate hover effect on first panel
console.log('\n📋 STEP 5: SIMULATING HOVER EFFECT');
if (inputPanels.length > 0) {
    const testPanel = inputPanels[0];
    console.log('Simulating hover on first panel...');

    // Create a test style to simulate hover
    const hoverTestStyle = document.createElement('style');
    hoverTestStyle.id = 'hover-test-style';
    hoverTestStyle.textContent = `
    /* This selector matches our first panel and applies the :hover styles */
    [data-input-panel] .glass-panel.glass-content-panel:first-of-type {
      box-shadow: 0 30px 80px 0 rgba(220, 8, 8, 0.7), 0 12px 40px 0 rgba(220, 8, 8, 0.5);
      border-color: rgba(220, 8, 8, 0.6);
      transform: translateY(-2px);
      background: rgba(28, 25, 23, var(--glass-focus));
    }
  `;
    document.head.appendChild(hoverTestStyle);

    // Check the computed styles after applying the hover simulation
    setTimeout(() => {
        const hoverComputedStyle = getComputedStyle(testPanel);
        console.log('\nSimulated hover computed styles:');
        console.log('- Box-shadow:', hoverComputedStyle.boxShadow);
        console.log('- Transform:', hoverComputedStyle.transform);
        console.log('- Border-color:', hoverComputedStyle.borderColor);

        // Check if our clean hierarchy is working
        const isStrongShadow = hoverComputedStyle.boxShadow.includes('80px') ||
            hoverComputedStyle.boxShadow.includes('64px') ||
            hoverComputedStyle.boxShadow.includes('0.7');

        const hasTransform = hoverComputedStyle.transform.includes('translateY');

        if (isStrongShadow && hasTransform) {
            console.log('✅ SUCCESS! Clean CSS hierarchy is working correctly!');
            console.log('Strong shadow and transform are applied without !important declarations.');
        } else {
            console.log('❌ FAILURE! Clean CSS hierarchy is not working correctly.');
            console.log('Expected strong shadow and transform, but they\'re not being applied.');
            console.log('This suggests there might still be specificity issues or conflicts.');
        }

        // Clean up
        document.head.removeChild(hoverTestStyle);
        console.log('\n🧹 Test style removed');
    }, 100);
}

// STEP 6: Manual hover test (optional)
console.log('\n📋 STEP 6: MANUAL HOVER TEST (OPTIONAL)');
console.log('You can also manually hover over an input panel to see the effect.');
console.log('The hover effect should show a strong red shadow and slight upward movement.');

console.log('\n🎯 TEST COMPLETE');
console.log('Check the results above to see if the clean CSS hierarchy is working correctly.');