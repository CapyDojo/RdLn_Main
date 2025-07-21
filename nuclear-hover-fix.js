// Nuclear approach to fix Kyoto input panel hover
console.log('💥 NUCLEAR KYOTO HOVER FIX');

// Function to force styles with maximum priority
function forceStrongHover(panel) {
    // Use setProperty with important priority to override everything
    panel.style.setProperty('box-shadow', '0 30px 80px 0 rgba(220, 8, 8, 0.7), 0 12px 40px 0 rgba(220, 8, 8, 0.5)', 'important');
    panel.style.setProperty('border-color', 'rgba(220, 8, 8, 0.6)', 'important');
    panel.style.setProperty('background', 'rgba(28, 25, 23, 0.20)', 'important');
    panel.style.setProperty('transform', 'translateY(-2px)', 'important');
    panel.style.setProperty('transition', 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)', 'important');

    console.log('Applied nuclear hover to:', panel);
}

function removeStrongHover(panel) {
    panel.style.removeProperty('box-shadow');
    panel.style.removeProperty('border-color');
    panel.style.removeProperty('background');
    panel.style.removeProperty('transform');

    console.log('Removed nuclear hover from:', panel);
}

// Test on first panel immediately
const testPanel = document.querySelector('[data-input-panel] .glass-panel.glass-content-panel');
if (testPanel) {
    console.log('Testing nuclear hover on first panel...');
    forceStrongHover(testPanel);

    setTimeout(() => {
        removeStrongHover(testPanel);
        console.log('Test complete - did you see the strong shadow?');
    }, 3000);
}

// Set up permanent hover handlers
const inputPanels = document.querySelectorAll('[data-input-panel] .glass-panel.glass-content-panel');
console.log(`Setting up nuclear hover on ${inputPanels.length} panels`);

inputPanels.forEach((panel, index) => {
    // Remove any existing listeners
    if (panel._nuclearEnter) panel.removeEventListener('mouseenter', panel._nuclearEnter);
    if (panel._nuclearLeave) panel.removeEventListener('mouseleave', panel._nuclearLeave);

    // Create nuclear hover handlers
    const nuclearEnter = () => {
        console.log(`Nuclear hover ENTER on panel ${index + 1}`);
        forceStrongHover(panel);
    };

    const nuclearLeave = () => {
        console.log(`Nuclear hover LEAVE on panel ${index + 1}`);
        removeStrongHover(panel);
    };

    // Store references
    panel._nuclearEnter = nuclearEnter;
    panel._nuclearLeave = nuclearLeave;

    // Add listeners
    panel.addEventListener('mouseenter', nuclearEnter);
    panel.addEventListener('mouseleave', nuclearLeave);

    console.log(`Nuclear hover set up on panel ${index + 1}`);
});

console.log('💥 Nuclear hover fix complete! Try hovering over input panels now.');