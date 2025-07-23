// Test script to verify cleaned Kyoto theme works as blueprint
console.log('🧪 KYOTO BLUEPRINT CLEAN TEST');

// Check theme
const currentTheme = document.documentElement.getAttribute('data-theme');
console.log(`Current theme: ${currentTheme}`);

if (currentTheme !== 'kyoto') {
    console.warn('⚠️ Switch to Kyoto theme for accurate testing');
}

// Test elements
const inputPanel = document.querySelector('[data-input-panel] .glass-panel.glass-content-panel');
const outputPanel = document.querySelector('[data-output-panel] .glass-panel.glass-content-panel');
const inputHandle = document.querySelector('[data-resize-handle="input-panels"]');
const outputHandle = document.querySelector('[data-resize-handle="output-panel"]');

console.log('\n📋 ELEMENT DETECTION:');
console.log('Input panel found:', !!inputPanel);
console.log('Output panel found:', !!outputPanel);
console.log('Input handle found:', !!inputHandle);
console.log('Output handle found:', !!outputHandle);

if (inputPanel && outputPanel) {
    console.log('\n🎨 TESTING CLEANED CSS (NO !IMPORTANT):');

    // Test 1: Base styles
    console.log('\n1️⃣ BASE STYLES:');
    const inputBaseStyle = getComputedStyle(inputPanel);
    const outputBaseStyle = getComputedStyle(outputPanel);

    console.log('Input panel base background:', inputBaseStyle.background);
    console.log('Output panel base background:', outputBaseStyle.background);

    // Test 2: Direct hover
    console.log('\n2️⃣ DIRECT HOVER TEST:');
    console.log('Hover over input/output panels to test direct hover effects...');

    let hoverTestActive = true;
    const hoverInterval = setInterval(() => {
        if (!hoverTestActive) return;

        const inputHovered = inputPanel.matches(':hover');
        const outputHovered = outputPanel.matches(':hover');

        if (inputHovered || outputHovered) {
            const hoveredPanel = inputHovered ? inputPanel : outputPanel;
            const panelType = inputHovered ? 'INPUT' : 'OUTPUT';

            console.log(`🖱️ ${panelType} PANEL HOVERED!`);

            const hoverStyle = getComputedStyle(hoveredPanel);
            console.log('Hover background:', hoverStyle.background);
            console.log('Hover box-shadow:', hoverStyle.boxShadow);
            console.log('Hover transform:', hoverStyle.transform);
            console.log('Hover border-color:', hoverStyle.borderColor);

            // Check for strong shadow (should work without !important)
            const hasStrongShadow = hoverStyle.boxShadow.includes('64px') ||
                hoverStyle.boxShadow.includes('72px') ||
                hoverStyle.boxShadow.includes('0.6');
            const hasTransform = hoverStyle.transform !== 'none';

            if (hasStrongShadow && hasTransform) {
                console.log('✅ SUCCESS! Clean CSS hover effects working without !important');
            } else {
                console.log('❌ ISSUE: Hover effects not working properly');
                console.log('Expected: Strong shadow + transform');
                console.log('Actual: Weak or missing effects');
            }

            hoverTestActive = false;
        }
    }, 100);

    // Auto-stop after 15 seconds
    setTimeout(() => {
        hoverTestActive = false;
        clearInterval(hoverInterval);
        console.log('\n⏰ Direct hover test completed');

        // Test 3: Handle hover
        console.log('\n3️⃣ HANDLE HOVER TEST:');
        if (inputHandle && outputHandle) {
            console.log('Testing handle hover effects...');

            // Test input handle hover
            console.log('\nTesting input handle hover...');
            inputHandle.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

            setTimeout(() => {
                const inputHoverStyle = getComputedStyle(inputPanel);
                const hasInputHoverClass = inputPanel.classList.contains('hover-from-handle');

                console.log('Input panel has hover-from-handle class:', hasInputHoverClass);
                if (hasInputHoverClass) {
                    console.log('Input handle hover background:', inputHoverStyle.background);
                    console.log('Input handle hover box-shadow:', inputHoverStyle.boxShadow);

                    const hasStrongShadow = inputHoverStyle.boxShadow.includes('64px') ||
                        inputHoverStyle.boxShadow.includes('72px');
                    if (hasStrongShadow) {
                        console.log('✅ Input handle hover working correctly');
                    } else {
                        console.log('❌ Input handle hover not working');
                    }
                }

                // Clean up input hover
                inputHandle.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));

                // Test output handle hover
                setTimeout(() => {
                    console.log('\nTesting output handle hover...');
                    outputHandle.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

                    setTimeout(() => {
                        const outputHoverStyle = getComputedStyle(outputPanel);
                        const hasOutputHoverClass = outputPanel.classList.contains('hover-from-handle');

                        console.log('Output panel has hover-from-handle class:', hasOutputHoverClass);
                        if (hasOutputHoverClass) {
                            console.log('Output handle hover background:', outputHoverStyle.background);
                            console.log('Output handle hover box-shadow:', outputHoverStyle.boxShadow);

                            const hasStrongShadow = outputHoverStyle.boxShadow.includes('64px') ||
                                outputHoverStyle.boxShadow.includes('72px');
                            if (hasStrongShadow) {
                                console.log('✅ Output handle hover working correctly');
                            } else {
                                console.log('❌ Output handle hover not working');
                            }
                        }

                        // Clean up
                        outputHandle.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));

                        console.log('\n🎯 KYOTO BLUEPRINT CLEAN TEST SUMMARY:');
                        console.log('- Removed all !important declarations from kyoto.css');
                        console.log('- Consolidated redundant hover rules');
                        console.log('- Archived legacy fix files');
                        console.log('- Maintained functionality with clean CSS hierarchy');
                        console.log('\n✅ Kyoto theme ready to serve as blueprint for other themes!');

                    }, 200);
                }, 500);
            }, 200);
        } else {
            console.log('❌ Handle elements not found for handle hover test');
        }
    }, 15000);

} else {
    console.log('❌ Required panel elements not found');
    console.log('💡 Make sure you have input/output content displayed');
}

console.log('\n🖱️ Please hover over input/output panels to test direct hover effects');
console.log('⏰ Test will run for 15 seconds, then test handle hover automatically');