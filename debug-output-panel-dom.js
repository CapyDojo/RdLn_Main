// Debug script to understand output panel DOM structure
console.log('🔍 OUTPUT PANEL DOM STRUCTURE DEBUG');

// Find output handle and panel
const outputHandle = document.querySelector('[data-resize-handle="output-panel"]');
const outputPanel = document.querySelector('[data-output-panel] .glass-panel.glass-content-panel');

console.log('Output handle found:', !!outputHandle);
console.log('Output panel found:', !!outputPanel);

if (outputHandle && outputPanel) {
    console.log('\n📋 DOM STRUCTURE ANALYSIS:');

    // Analyze handle
    console.log('\n🔧 OUTPUT HANDLE:');
    console.log('Handle element:', outputHandle.tagName);
    console.log('Handle classes:', outputHandle.className);
    console.log('Handle parent:', outputHandle.parentElement?.tagName, outputHandle.parentElement?.className);

    // Analyze panel
    console.log('\n📱 OUTPUT PANEL:');
    console.log('Panel element:', outputPanel.tagName);
    console.log('Panel classes:', outputPanel.className);
    console.log('Panel parent:', outputPanel.parentElement?.tagName, outputPanel.parentElement?.className);
    console.log('Panel grandparent:', outputPanel.parentElement?.parentElement?.tagName, outputPanel.parentElement?.parentElement?.className);

    // Find relationship
    console.log('\n🔗 RELATIONSHIP ANALYSIS:');

    // Check if panel is a sibling of handle
    const handleParent = outputHandle.parentElement;
    const panelParent = outputPanel.parentElement;

    console.log('Handle parent === Panel parent:', handleParent === panelParent);
    console.log('Handle parent === Panel grandparent:', handleParent === outputPanel.parentElement?.parentElement);
    console.log('Handle grandparent === Panel parent:', outputHandle.parentElement?.parentElement === panelParent);

    // Check siblings
    const handleSiblings = Array.from(handleParent?.children || []);
    const handleIndex = handleSiblings.indexOf(outputHandle);
    console.log('Handle is child #', handleIndex + 1, 'of', handleSiblings.length);

    // Find the correct path from handle to panel
    console.log('\n🎯 PATH FROM HANDLE TO PANEL:');

    let current = outputHandle;
    let path = [];
    let found = false;

    // Try different traversal paths
    const paths = [
        'nextElementSibling',
        'parentElement.nextElementSibling',
        'parentElement.parentElement.querySelector("[data-output-panel]")',
        'parentElement.querySelector("[data-output-panel] .glass-panel")',
        'parentElement.parentElement.querySelector("[data-output-panel] .glass-panel")'
    ];

    paths.forEach((pathStr, i) => {
        try {
            let result;
            if (pathStr.includes('querySelector')) {
                const parts = pathStr.split('.querySelector');
                const base = parts[0] === 'parentElement.parentElement' ?
                    outputHandle.parentElement?.parentElement :
                    outputHandle.parentElement;
                result = base?.querySelector(parts[1].replace(/[()'"]/g, ''));
            } else {
                result = pathStr.split('.').reduce((el, prop) => el?.[prop], outputHandle);
            }

            console.log(`Path ${i + 1}: ${pathStr}`);
            console.log('  Result:', !!result, result?.tagName, result?.className);

            if (result && result.contains(outputPanel)) {
                console.log('  ✅ This path leads to output panel!');
                found = true;
            }
        } catch (e) {
            console.log(`Path ${i + 1}: ${pathStr} - ERROR:`, e.message);
        }
    });

    if (!found) {
        console.log('\n🔍 MANUAL SEARCH:');
        // Manual traversal to find the exact relationship
        let testElement = outputHandle;
        let steps = 0;
        while (testElement && steps < 10) {
            testElement = testElement.parentElement;
            steps++;
            const foundPanel = testElement?.querySelector('[data-output-panel] .glass-panel.glass-content-panel');
            if (foundPanel === outputPanel) {
                console.log(`✅ Found panel by going up ${steps} levels and querying down`);
                console.log('Correct CSS selector would be something like:');
                console.log(`[data-resize-handle="output-panel"]${''.padStart(steps * 20, ' .parentElement')} [data-output-panel] .glass-panel.glass-content-panel`);
                break;
            }
        }
    }

} else {
    console.log('❌ Could not find required elements');
}