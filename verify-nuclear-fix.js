// Verify that our nuclear fix is working
console.log('🧪 VERIFYING NUCLEAR CSS FIX');

// Check if the nuclear fix style element exists
const nuclearFix = document.getElementById('nuclear-kyoto-hover-fix');
console.log('Nuclear fix style element exists:', !!nuclearFix);

// Find all input panels
const inputPanels = document.querySelectorAll('[data-input-panel] .glass-panel.glass-content-panel');
console.log(`Found ${inputPanels.length} input panels`);

// Check computed styles for each panel
inputPanels.forEach((panel, index) => {
  console.log(`\nPanel ${index + 1}:`);
  
  // Get computed styles
  const computedStyle = getComputedStyle(panel);
  console.log('Default box-shadow:', computedStyle.boxShadow);
  
  // Simulate hover
  console.log('\nSimulating hover...');
  const hoverStyle = document.createElement('style');
  hoverStyle.textContent = `
    [data-input-panel] .glass-panel.glass-content-panel:nth-of-type(${index + 1}):hover {
      box-shadow: 0 30px 80px 0 rgba(220, 8, 8, 0.7), 0 12px 40px 0 rgba(220, 8, 8, 0.5) !important;
    }
  `;
  document.head.appendChild(hoverStyle);
  
  // Check if our style is applied
  console.log('Hover style added, check if panel shows strong shadow on hover');
  
  // Clean up after 5 seconds
  setTimeout(() => {
    document.head.removeChild(hoverStyle);
    console.log(`Hover style removed from panel ${index + 1}`);
  }, 5000);
});

// If nuclear fix is not present, apply it manually
if (!nuclearFix) {
  console.log('Nuclear fix not found, applying manually...');
  
  const style = document.createElement('style');
  style.id = 'nuclear-kyoto-hover-fix';
  
  style.textContent = `
    /* NUCLEAR CSS FIX FOR KYOTO HOVER */
    html[data-theme="kyoto"] [data-input-panel] .glass-panel.glass-content-panel:hover,
    html[data-theme="kyoto"] [data-input-panel] .glass-panel.glass-content-panel.shadow-lg:hover,
    html[data-theme="kyoto"] [data-input-panel] .glass-panel.glass-content-panel.shadow-md:hover,
    html[data-theme="kyoto"] [data-input-panel] .glass-panel.glass-content-panel.shadow-sm:hover,
    html[data-theme="kyoto"] div[data-input-panel] .glass-panel.glass-content-panel:hover,
    html[data-theme="kyoto"] div[data-input-panel="true"] .glass-panel.glass-content-panel:hover {
      background: rgba(28, 25, 23, var(--glass-focus)) !important;
      box-shadow: 0 30px 80px 0 rgba(220, 8, 8, 0.7), 0 12px 40px 0 rgba(220, 8, 8, 0.5) !important;
      border-color: rgba(220, 8, 8, 0.6) !important;
      transform: translateY(-2px) !important;
    }
  `;
  
  document.head.appendChild(style);
  console.log('Nuclear fix applied manually');
}