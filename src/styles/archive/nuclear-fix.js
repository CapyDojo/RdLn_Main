// Nuclear CSS fix for Kyoto hover
// This script injects a style element with the highest specificity CSS rules
// DISABLED: This file is now disabled in favor of a clean CSS hierarchy approach

/*
function applyNuclearCSSFix() {
  // Create style element
  const style = document.createElement('style');
  style.id = 'nuclear-kyoto-hover-fix';
  
  // Add the CSS rules with maximum specificity
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
  
  // Append to head
  document.head.appendChild(style);
  console.log('Nuclear CSS fix applied for Kyoto hover');
}

// Apply the fix when the document is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyNuclearCSSFix);
} else {
  applyNuclearCSSFix();
}

// Also apply when theme changes
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
      applyNuclearCSSFix();
    }
  });
});

observer.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['data-theme']
});
*/

// Export a dummy function that does nothing
export default function disabledNuclearFix() {
  console.log('Nuclear CSS fix is disabled');
  return null;
}