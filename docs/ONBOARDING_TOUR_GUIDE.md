# 🎯 How to Enable the Onboarding Tour

Here's a step-by-step guide to enable and test the new onboarding tour:

## 1. Start the Development Server
Since you manage the dev server externally, make sure it's running:
```bash
npm run dev
```
The app should be available at `http://localhost:5173`

## 2. Enable the Feature Flag

### Option A: Easy Button Method (Recommended)
1. **Enable the feature flag first** (one-time setup):
   - Open Browser Developer Tools (`F12`)
   - Go to Console tab
   - Run: `localStorage.setItem("experimental-features", JSON.stringify({enableOnboardingTour: true}))`
   - Refresh the page (`F5`)

2. **Look for the "Take Tour" button** next to "Quick Demo" in the beta status bar
3. **Click "Take Tour"** - it will automatically start the onboarding tour

### Option B: Manual Method
If you don't see the button, follow the original method:

1. **Open Browser Developer Tools**:
   - **Chrome/Edge**: Press `F12` or `Ctrl+Shift+I`
   - **Firefox**: Press `F12` or `Ctrl+Shift+I`
   - **Safari**: Press `Cmd+Option+I` (Mac)

2. **Go to the Console tab**

3. **Run this command**:
   ```javascript
   localStorage.setItem("experimental-features", JSON.stringify({enableOnboardingTour: true}))
   ```

4. **Refresh the page** (`F5` or `Ctrl+R`)

## 3. What You Should See

### First Visit Experience:
1. **Beta Agreement Dialog** appears first (if not already accepted)
2. **Accept the beta terms**
3. **Wait 2 seconds** - the tour will start automatically
4. **Welcome tooltip** appears in the center of the screen

### Tour Flow:
- **Step 1**: Welcome message (center screen)
- **Step 2**: Input panels explanation (highlights text areas)
- **Step 3**: Quick Demo button (highlights the demo button)
- **Step 4**: Results panel (shows where output appears)
- **Step 5**: RdLn Memory (highlights the filing cabinet)
- **Step 6**: Customization (highlights theme/text size controls)

### Navigation:
- **Next/Previous**: Click buttons or use arrow keys
- **Skip**: Click "Skip tour" or press `Escape`
- **Complete**: Final step shows "Get Started" button

## 4. Restart the Tour

You have multiple ways to restart the tour:

### Method 1: Take Tour Button (Easiest)
1. **Click the "Take Tour" button** in the beta status bar (next to Quick Demo)
2. The tour will restart immediately

### Method 2: Floating Help Button
1. **Look for the "?" button** in the bottom-right corner (appears after completing/skipping tour)
2. **Click it** to restart the tour anytime

### OR manually reset:
```javascript
localStorage.removeItem('tour-rdln-welcome-tour-completed');
localStorage.removeItem('tour-rdln-welcome-tour-skipped');
location.reload();
```

## 5. Disable the Feature
To turn off the tour:
```javascript
localStorage.setItem("experimental-features", JSON.stringify({enableOnboardingTour: false}))
```
Then refresh the page.

## 6. Troubleshooting

### Tour Not Starting?
- Check console for errors (F12 → Console tab)
- Verify feature flag: `JSON.parse(localStorage.getItem("experimental-features"))`
- Make sure you accepted beta terms first

### Elements Not Highlighting?
- Some UI elements might not be loaded yet
- Try clicking "Quick Demo" first to populate the interface
- The tour has fallback positioning if elements aren't found

### Reset Everything:
```javascript
localStorage.clear();
location.reload();
```

## 7. Testing Different Scenarios

### New User Flow:
1. Clear localStorage: `localStorage.clear()`
2. Refresh page
3. Accept beta terms
4. Tour should auto-start

### Returning User:
1. Tour won't auto-start (already completed)
2. Use the "?" button to restart
3. Or manually reset completion status

### Skip Testing:
1. Start tour
2. Press `Escape` or click "Skip tour"
3. Check that "?" button appears

## 8. Technical Implementation Details

### Feature Flag System
The onboarding tour uses RdLn's experimental features system:
- **Flag Name**: `enableOnboardingTour`
- **Default Value**: `false` (safe for production)
- **Storage**: `localStorage` under `experimental-features` key

### Tour Configuration
The tour is defined in `src/components/experimental/onboarding/OnboardingTour.tsx`:
- **6 Progressive Steps**: Welcome → Input → Demo → Results → Memory → Customization
- **Smart Element Targeting**: Multiple fallback strategies for finding UI elements
- **Theme Integration**: Fully compatible with RdLn's glassmorphism design

### Files Added
```
src/components/experimental/onboarding/
├── OnboardingTour.tsx          # Main tour orchestrator
├── TourTooltip.tsx            # Floating tooltip component
├── TourStep.tsx               # Individual step wrapper
├── hooks/
│   └── useOnboardingTour.ts   # Tour state management
├── types/
│   └── onboarding.types.ts    # TypeScript definitions
└── styles/
    └── onboarding.css         # Tour-specific styles
```

### Integration Points
- **App.tsx**: Main integration with feature flag checks and tour handlers
- **ExperimentalLayoutContext.tsx**: Feature flag definition
- **StatusBar.tsx**: Added tour button and targeting attributes
  - `data-testid="quick-demo-button"` for tour targeting
  - `data-testid="take-tour-button"` for easy access
  - Conditional "Take Tour" button (only visible when feature flag enabled)

### Safety Features
- **Zero Impact When Disabled**: No performance or UI impact when flag is off
- **Error Boundaries**: Graceful failure handling
- **Accessibility**: Full keyboard navigation and screen reader support
- **Mobile Responsive**: Adaptive layouts for all screen sizes

## 9. Analytics & Tracking

The tour automatically tracks:
- **Completion Rate**: How many users complete the full tour
- **Drop-off Points**: Which steps users skip or abandon
- **Interaction Time**: How long users spend on each step
- **Navigation Patterns**: Previous/Next vs Skip behavior

View logs in browser console during development.

## 10. Future Enhancements

Potential improvements for future versions:
- **Personalized Tours**: Different tours for different user types
- **Interactive Hotspots**: Clickable demonstrations during tour
- **Progress Persistence**: Resume tour from where user left off
- **A/B Testing**: Multiple tour variants for optimization
- **Mobile-Specific Tours**: Simplified flows for mobile devices

---

The tour is designed to be **safe and non-intrusive** - it only appears when the feature flag is enabled and won't interfere with normal app usage when disabled. 🚀

## Quick Reference Commands

```javascript
// Enable tour
localStorage.setItem("experimental-features", JSON.stringify({enableOnboardingTour: true}))

// Disable tour
localStorage.setItem("experimental-features", JSON.stringify({enableOnboardingTour: false}))

// Reset tour completion
localStorage.removeItem('tour-rdln-welcome-tour-completed');
localStorage.removeItem('tour-rdln-welcome-tour-skipped');
location.reload();

// Check current settings
JSON.parse(localStorage.getItem("experimental-features"))

// Complete reset
localStorage.clear();
location.reload();
```