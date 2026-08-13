# Execution status

**Do not execute this file.** Remaining Tour work has been copied into [`20260813_0.6.3_Last_Mile.md`](./20260813_0.6.3_Last_Mile.md) as WAVE-3. This document is frozen: original diagnosis and architect review. Do not run a second Tour sprint from here.

---

# 20260414 — Tour Overhaul Sprint

## Agent Execution Prompt

Read this document top-to-bottom before starting. The **Task Tracker** section is the authoritative source of truth for what is done and what remains. Do not re-implement completed tasks. Execute tasks in group order (TOUR-INF → TOUR-CONT → TOUR-APP → TOUR-COMP). Within each group, tasks are independent and may be done in parallel. **Do not add new steps (GROUP 5) — that is deferred to the follow-up sprint.**

---

## Problem Summary

The RdLn onboarding tour is broken and outdated:
- 3 of 5 targeted tour steps silently fail to highlight any element (wrong/invalid selectors)
- Step 4 highlights the entire `<main>` element (entire viewport — misleading)
- Step content contains factual errors (wrong OCR language count, wrong export format names)
- First-run flow is broken: new users after beta agreement see a restart button, not the actual tour
- `TourRestartButton` renders a literal `?` character instead of an icon
- Tour restart uses `window.location.reload()` destroying all app state
- Duplicate Escape key handlers fire twice on each keypress
- Spotlight CSS class can leak onto DOM elements after tour unmount

Additional issues identified by architect review:
- Hardcoded `tooltipWidth/Height` in positioning math (use better estimates, not dynamic measurement)
- Dead analytics tracking code that is never consumed (low priority — do not touch in this sprint)
- Redundant scroll/resize listeners in both `OnboardingTour.tsx` and `TourTooltip.tsx` (low priority)

---

## Diagnosis (Reviewed & Confirmed)

**Root causes:**

1. **Selector staleness**: Tour was authored with old placeholder text and custom string "selectors" (`filing-cabinet-button`, `theme-selector-button`) that were never valid CSS. The app evolved but the tour config was not updated.

2. **Wiring anti-patterns in App.tsx**: `window.location.reload()` for restart, React batching-unsafe `setTimeout(10ms)` double-toggle for start, and `setShowTourRestart(true)` being called before the user has ever taken the tour.

3. **Component-level oversights**: Duplicate keyboard handlers, missing cleanup of spotlight class on unmount, placeholder icon never replaced.

**Architect review corrections to original diagnosis:**
- `theme-selector-button` fallback will actually work (aria-label substring match is reliable) — not "marginal"
- SVG mask + CSS clipPath is progressive enhancement, not a conflict — real issue is the SVG `<defs>` being inside a `visibility:hidden` element (may not be referenced reliably by fragment ID)
- First-run entry point exists: StatusBar "Take Tour" button (`data-testid="take-tour-button"`) — tour is user-initiated by design, but showing restart button before first run is the bug

---

## Fix Plans (Reviewed & Approved)

### Decisions from architect review:
- Merge TOUR-APP-01 + TOUR-APP-02 into single task (partial fix without tourKey counter is worse than no fix)
- Skip dynamic tooltip sizing (TOUR-COMP-03 deferred) — update hardcoded height estimate to ~190px instead
- Defer GROUP 5 (new steps) to follow-up sprint — ship infra fixes first
- After GROUP 1 is complete, delete dead fallback strategies 3-5 from `findTargetElement`

---

## Task Tracker

### GROUP 1 — Selector Infrastructure (P0, do first)

| ID | Task | Status |
|----|------|--------|
| TOUR-INF-01 | Add `data-testid` to all tour target elements | Outstanding |
| TOUR-INF-02 | Update all tour step `targetElement` selectors to use new data-testids | Outstanding |
| TOUR-INF-03 | Remove dead fallback strategies 3-5 from `findTargetElement` (filing-cabinet heuristic, theme-selector heuristic, text: search) | Outstanding |

**TOUR-INF-01 details:**

File | Element | data-testid to add
-----|---------|-------------------
`src/components/DesktopInputLayout.tsx` | Original panel `<div data-input-panel>` (line 64) | `data-testid="input-panel-original"`
`src/components/MobileInputLayout.tsx` | Original panel equivalent div | `data-testid="input-panel-original"`
`src/components/RdLnMemoryEdgeTab.tsx` | The `<button>` inside the edge tab component | `data-testid="memory-edge-tab"`
`src/components/ThemeSelector.tsx` | The main `<button>` (line 153) | `data-testid="theme-selector-button"`
`src/components/FontSizeSelector.tsx` | Main button/control element | `data-testid="font-size-selector"`
`src/components/DesktopControlsPanel.tsx` | Compare button (line 58, already has `data-compare-button`) | Add `data-testid="compare-button"` alongside
`src/components/OutputLayout.tsx` | The result output panel wrapper | `data-testid="output-panel"`

**TOUR-INF-02 details — new selectors for `RDLN_WELCOME_TOUR` in `OnboardingTour.tsx`:**

Step ID | Old selector | New selector
--------|-------------|-------------
`input-method` | `'textarea[placeholder*="original text here"]'` | `'[data-testid="input-panel-original"]'`
`results-preview` | `'main'` | `'[data-testid="output-panel"]'`
`memory-system` | `'filing-cabinet-button'` | `'[data-testid="memory-edge-tab"]'`
`customization` | `'theme-selector-button'` | `'[data-testid="theme-selector-button"]'`

**TOUR-INF-03 details — in `findTargetElement` in `OnboardingTour.tsx`:**
- Keep strategies: 1 (direct `querySelector`), 2 (data-testid extraction), 6 (class extraction fallback)
- Remove strategies: 3 (text: prefix handling), 4 (filing-cabinet emoji/text heuristic), 5 (theme-selector aria-label heuristic)
- After removal, `strategies` array should have 3 entries

---

### GROUP 2 — Content Rewrites (P1)

| ID | Task | Status |
|----|------|--------|
| TOUR-CONT-01 | Rewrite all 6 step content blocks in `RDLN_WELCOME_TOUR` | Outstanding |

**TOUR-CONT-01 details — new content per step:**

**Step 1 `welcome`:**
- Title: `Welcome to RdLn™`
- Content: `Compare documents instantly with professional redlining. Type or paste text, import DOCX or PDF files, or paste screenshots — let's take a quick tour.`

**Step 2 `input-method`:**
- Title: `Add Your Documents`
- Content: `Paste or type text directly, drag and drop DOCX or PDF files, or paste a screenshot to extract text with OCR in 50+ languages.`

**Step 3 `quick-demo`:**
- Title: `Try It Instantly`
- Content: `Click "Quick Demo" to load sample legal text and see RdLn in action immediately.`
- (No changes needed — accurate)

**Step 4 `results-preview`:**
- Title: `Professional Results`
- Content: `Your redlined output appears here with additions and deletions clearly marked. Copy to clipboard, copy for Word, or download as a DOCX file.`

**Step 5 `memory-system`:**
- Title: `RdLn Memory`
- Content: `Save, load, export and import comparison sessions. Your work is stored locally in your browser — fully private.`

**Step 6 `customization`:**
- Title: `Personalize Your Experience`
- Content: `Choose from 10+ professional themes using the palette icon (top right), and adjust text size using the font controls (top left).`

---

### GROUP 3 — App-level Wiring Fixes (P1)

| ID | Task | Status |
|----|------|--------|
| TOUR-APP-01+02 | Replace `window.location.reload()` restart AND fix `shouldStartTour` double-toggle with `tourStartKey` counter | Outstanding |
| TOUR-APP-03 | Fix first-run flow: call `handleStartTour()` after beta agreement acceptance; remove premature restart button | Outstanding |

**TOUR-APP-01+02 details (merged):**

In `App.tsx`:
- Replace `shouldStartTour: boolean` state with `tourStartKey: number` (init to `0`)
- `handleStartTour`: replace `setShouldStartTour(false); setTimeout(() => setShouldStartTour(true), 10)` with `setTourStartKey(k => k + 1)`
- `handleTourRestart`: remove `window.location.reload()`; clear localStorage keys, then call `setTourStartKey(k => k + 1)`
- Update `<OnboardingTour>` prop: `shouldStart={shouldStartTour}` → `tourStartKey={tourStartKey}`

In `OnboardingTour.tsx`:
- Update `OnboardingTourProps` interface: replace `shouldStart?: boolean` with `tourStartKey?: number`
- Update the `useEffect` that watches `shouldStart` (line 288): change dependency to `[tourStartKey]` and trigger on any non-zero key value (or on any key change from previous)
- Remove the `resetTour()` + `setTimeout(10)` logic inside that effect; simply call `navigationHandlers.resetTour()` then `navigationHandlers.startTour()` directly

**TOUR-APP-03 details:**

In `App.tsx` `handleBetaAgreementAccept`:
- Remove `setTimeout(() => setShowTourRestart(true), 2000)`
- Add: call `handleStartTour()` after the dialog close animation (~400ms delay, matching the dialog's close transition)
- The `showTourRestart` button should only be set to `true` in `handleTourComplete` and `handleTourSkip` (already done correctly there)
- Check existing `useEffect` at lines 256-264 that shows restart button: also correct (only fires if both betaAcceptance AND tour completed/skipped are in localStorage)

---

### GROUP 4 — Component-level Bug Fixes (P1-P2)

| ID | Task | Status |
|----|------|--------|
| TOUR-COMP-01 | Replace `?` literal in `TourRestartButton` with `HelpCircle` icon from lucide-react | Outstanding |
| TOUR-COMP-02 | Remove duplicate Escape key handler from `TourTooltip.tsx` | Outstanding |
| TOUR-COMP-03 | Update hardcoded `tooltipHeight` estimate in `TourTooltip.tsx` | Outstanding |
| TOUR-COMP-04 | Add sweep cleanup of `.onboarding-spotlight` class on `OnboardingTour` unmount | Outstanding |

**TOUR-COMP-01 details:**
- In `OnboardingTour.tsx` `TourRestartButton` (line 409): replace `?` with `<HelpCircle className="w-5 h-5" />`
- Add `import { HelpCircle } from 'lucide-react'` at top of file

**TOUR-COMP-02 details:**
- In `TourTooltip.tsx`, remove the entire `useEffect` block that handles `keydown` (lines 156-165)
- The hook (`useOnboardingTour.ts` lines 313-354) already handles Escape, ArrowKeys, and Enter

**TOUR-COMP-03 details:**
- In `TourTooltip.tsx`, change `tooltipHeight = 200` to `tooltipHeight = 190` (closer to actual rendered height)
- No `useLayoutEffect` measurement needed

**TOUR-COMP-04 details:**
- In `OnboardingTour.tsx`, in the `useEffect` that manages spotlight (lines 237-255), update the cleanup return:
  ```ts
  return () => {
    // Sweep all spotlight classes on unmount
    document.querySelectorAll('.onboarding-spotlight').forEach(el => {
      el.classList.remove('onboarding-spotlight');
    });
  };
  ```

---

### DEFERRED (not this sprint)

| ID | Task | Reason |
|----|------|--------|
| TOUR-STEP-01 | Add new tour steps for: Compare button, Quick Compare, Export options, Font Size | Additive; ship infra fixes first |
| TOUR-COMP-03-DYN | Dynamic tooltip sizing via `useLayoutEffect` + `getBoundingClientRect` | Over-engineered for current need |
| TOUR-ANALYTICS | Remove/wire up dead analytics tracking in `useOnboardingTour` | Low priority cleanup |

---

## QA Checklist (must complete before marking sprint done)

- [ ] TOUR-INF: All 4 updated tour steps correctly highlight the intended element
- [ ] TOUR-INF: Step 1 (welcome) and Step 3 (quick-demo) still work as before
- [ ] TOUR-INF: `findTargetElement` fallback strategies 3-5 are removed, no console warnings for step targeting
- [ ] TOUR-CONT: All 6 step content blocks display correct copy (verify in browser)
- [ ] TOUR-APP-01+02: "Restart Tour" no longer reloads the page; tour restarts in-place
- [ ] TOUR-APP-01+02: Clicking "Take Tour" from StatusBar starts correctly on fresh state
- [ ] TOUR-APP-03: New user accepting beta agreement sees tour auto-start (not restart button)
- [ ] TOUR-COMP-01: Restart button shows HelpCircle icon, not `?`
- [ ] TOUR-COMP-02: Pressing Escape during tour fires skip exactly once (not twice)
- [ ] TOUR-COMP-03: Tooltip positioning is reasonable across all 6 steps
- [ ] TOUR-COMP-04: After closing/skipping tour, no `.onboarding-spotlight` class remains on any DOM element (check via browser devtools)
- [ ] Full tour flow: Start → complete all 6 steps → Get Started button → tour closes correctly
- [ ] Full tour flow: Start → press Escape → tour closes, restart button appears
- [ ] Full tour flow: Desktop and mobile viewports both verified

---

## Files Touched (expected)

- `src/components/DesktopInputLayout.tsx` — data-testid
- `src/components/MobileInputLayout.tsx` — data-testid
- `src/components/RdLnMemoryEdgeTab.tsx` — data-testid
- `src/components/ThemeSelector.tsx` — data-testid
- `src/components/FontSizeSelector.tsx` — data-testid
- `src/components/DesktopControlsPanel.tsx` — data-testid (additive alongside existing `data-compare-button`)
- `src/components/OutputLayout.tsx` — data-testid
- `src/components/experimental/onboarding/OnboardingTour.tsx` — selectors, `tourStartKey` prop, `findTargetElement` cleanup, `TourRestartButton` icon, spotlight cleanup
- `src/components/experimental/onboarding/types/onboarding.types.ts` — `shouldStart → tourStartKey` prop type
- `src/components/experimental/onboarding/TourTooltip.tsx` — remove duplicate Escape handler, update height estimate
- `src/App.tsx` — `tourStartKey` state, `handleTourRestart`, `handleBetaAgreementAccept`, `handleStartTour`
