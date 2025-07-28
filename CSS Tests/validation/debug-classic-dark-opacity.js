// Debug Classic Dark opacity system
console.log('🔍 DEBUGGING CLASSIC DARK OPACITY SYSTEM');

// 1. Check what CSS variables are actually set
console.log('\n📊 CSS Variables:');
const root = document.documentElement;
const glassOpacity = getComputedStyle(root).getPropertyValue('--glass-opacity').trim();
const glassBlur = getComputedStyle(root).getPropertyValue('--glass-blur').trim();
const glassPanel = getComputedStyle(root).getPropertyValue('--glass-panel').trim();
const glassBg = getComputedStyle(root).getPropertyValue('--glass-bg').trim();

console.log('--glass-opacity:', glassOpacity);
console.log('--glass-blur:', glassBlur);
console.log('--glass-panel:', glassPanel);
console.log('--glass-bg:', glassBg);

// 2. Check if glassmorphism.css .glass-panel rule exists
console.log('\n🎨 CSS Rules Analysis:');
const allRules = Array.from(document.styleSheets).flatMap(sheet => {
    try {
        return Array.from(sheet.cssRules || []);
    } catch (e) {
        return [];
    }
});

const glassPanelRules = allRules.filter(rule =>
    rule.selectorText && rule.selectorText.includes('.glass-panel')
);

console.log(`Found ${glassPanelRules.length} .glass-panel rules:`);
glassPanelRules.forEach((rule, i) => {
    console.log(`${i + 1}. ${rule.selectorText}`);
    if (rule.style.background) {
        console.log(`   background: ${rule.style.background}`);
    }
});

// 3. Check actual computed styles on a glass panel
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

// 4. Test the expected background calculation
console.log('\n🧮 Expected Background Calculation:');
if (glassBg && glassPanel) {
    console.log(`Expected: rgba(${glassBg}, ${glassPanel})`);
    console.log(`With opacity=1: rgba(${glassBg}, 1) = solid background`);
} else {
    console.log('Missing variables for calculation');
}