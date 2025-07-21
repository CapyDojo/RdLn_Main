// JavaScript solution to fix Kyoto input panel hover effects
console.log('🔧 APPLYING KYOTO INPUT PANEL HOVER FIX');

// Target shadow values (same as handle hover)
const STRONG_SHADOW = '0 30px 80px 0 rgba(220, 8, 8, 0.7), 0 12px 40px 0 rgba(220, 8, 8, 0.5)';
const STRONG_BORDER = 'rgba(220, 8, 8, 0.6)';
const STRONG_BACKGROUND = 'rgba(28, 25, 23, 0.20)';
const HOVER_TRANSFORM = 'translateY(-2px)';

// Function to apply strong hover effects
function applyStrongHover(panel) {
  panel.style.boxShadow = STRONG_SHADOW;
  panel.style.borderColor = STRONG_BORDER;
  panel.style.background = STRONG_BACKGROUND;
  panel.style.transform = HOVER_TRANSFORM;
  panel.style.transition = 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)';
}

// Function to remove strong hover effects
function removeStrongHover(panel) {
  panel.style.boxShadow = '';
  panel.style.borderColor = '';
  panel.style.background = '';
  panel.style.transform = '';
}

// Apply to all input panels in Kyoto theme
function setupKyotoInputHover() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  
  if (currentTheme !== 'kyoto') {
    console.log('Not in Kyoto theme, skipping');
    return;
  }
  
  const inputPanels = document.querySelectorAll('[data-input-panel] .glass-panel.glass-content-panel');
  console.log(`Found ${inputPanels.length} input panels to enhance`);
  
  inputPanels.forEach((panel, index) => {
    // Remove existing hover listeners to avoid duplicates
    panel.removeEventListener('mouseenter', panel._kyotoHoverEnter);
    panel.removeEventListener('mouseleave', panel._kyotoHoverLeave);
    
    // Create new hover handlers
    const hoverEnter = () => applyStrongHover(panel);
    const hoverLeave = () => removeStrongHover(panel);
    
    // Store references for cleanup
    panel._kyotoHoverEnter = hoverEnter;
    panel._kyotoHoverLeave = hoverLeave;
    
    // Add event listeners
    panel.addEventListener('mouseenter', hoverEnter);
    panel.addEventListener('mouseleave', hoverLeave);
    
    console.log(`Enhanced panel ${index + 1}`);
  });
  
  console.log('✅ Kyoto input panel hover enhancement complete!');
}

// Run the setup
setupKyotoInputHover();

// Also set up a theme change listener to reapply when switching to Kyoto
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
      setTimeout(setupKyotoInputHover, 100); // Small delay to ensure theme is fully applied
    }
  });
});

observer.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['data-theme']
});

console.log('🎯 Theme change observer set up - will reapply on theme switches');