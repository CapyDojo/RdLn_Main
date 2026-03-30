# 20260330 Compare In Word MVP Plan

## Status

Proposed. Prototype validated in standalone Electron mock app. No production app integration yet.

## Objective

Add an optional `Compare in Word` path for file-based `.docx` workflows in the Windows Electron app, without changing RdLn's core native comparison engine.

This feature is intended to:

- give users a trusted fallback for Word-native comparison
- improve confidence for legal file-based workflows
- keep RdLn as the primary product experience while allowing external comparison when desired

## Product Positioning

This is not a replacement for RdLn compare.

This is an alternative secondary action for users who have loaded two supported Word documents and want to compare them using locally installed Microsoft Word.

Recommended UX framing:

- Primary: `Compare in RdLn`
- Secondary: `Compare in Word`
- Helper copy: `Launches Microsoft Word on this computer to run Word's native compare.`

## Recommended MVP Scope

### In scope

- Windows only
- Electron app only
- `.docx` to `.docx` only
- File-based inputs only
- Launch local Microsoft Word compare
- Keep comparison result in Word
- Feature-flagged / experimental release
- Clear validation and user-facing error states

### Out of scope

- Web app support
- `.pdf` support
- pasted text converted to temp files for Word compare
- importing Word comparison result back into RdLn
- macOS support
- browser support
- Word Online / Microsoft 365 compare flows
- deep post-launch control of Word sessions

## Why MVP Should Be Narrow

A narrow first version captures the useful product value while avoiding several high-risk edges:

- PDF conversion in Word can be lossy and misleading
- web browsers cannot reliably launch local Word compare
- round-tripping Word output back into RdLn adds significant complexity
- Office automation behavior may vary across installations and enterprise environments

## Prototype Learnings

A standalone prototype was built at:

- `Prototypes/20260330_Prototype_A_Word_Compare_Mock`

The prototype validated:

- file selection flow works
- drag-and-drop flow works
- swap original/revised inputs is useful
- Word compare launch from a desktop-owned flow is feasible
- the interaction is understandable in an RdLn-like UI

Important technical note:

- the prototype owns the workflow in Electron but still uses a Windows automation bridge for Word launch
- the repo does not currently contain a native Node COM integration library

## Proposed User Flow

1. User loads two `.docx` files into Original and Revised.
2. RdLn validates that both inputs are valid local DOCX files.
3. RdLn displays both compare options:
   - `Compare in RdLn`
   - `Compare in Word`
4. User clicks `Compare in Word`.
5. Electron main process validates:
   - both files exist
   - both are `.docx`
   - files are different
   - feature is enabled
   - platform is Windows desktop
6. RdLn launches Word compare.
7. Word opens the generated comparison document.
8. RdLn shows a success or failure status message.

## UX Recommendations

### Visibility conditions

Show `Compare in Word` only when:

- app is running in Electron
- platform is Windows
- both inputs came from actual local files
- both inputs are `.docx`

Otherwise either hide the action or show a disabled state with exact reason.

### Recommended copy

Button label:

- `Compare in Word`

Helper copy:

- `Uses Microsoft Word on this computer to generate a native Word comparison.`

Failure examples:

- `Compare in Word is available only for DOCX files.`
- `Microsoft Word could not be launched on this computer.`
- `Choose two different DOCX files to use Compare in Word.`

### UI placement

Recommended placement is alongside the primary compare action, but visually secondary.

Avoid making it look like the default or recommended path for all users.

## Technical Architecture Recommendation

### Separation of concerns

Keep Word integration out of:

- `src/hooks/useComparison.ts`
- `src/algorithms/MyersAlgorithm.ts`
- the RdLn native comparison result pipeline

Instead, create a dedicated desktop integration path.

### Recommended high-level flow

- Renderer: collects file metadata and user intent
- Preload: exposes a minimal safe desktop API
- Electron main: validates, launches Word, maps errors to user-safe messages
- Word integration boundary: isolated Windows-specific launch/automation logic

### Suggested module boundaries for real app

Potential production file areas:

- `src/components/...` or controls panel area for the secondary action
- `src/services/...` for front-end feature gating state only
- `src-electron/...` for actual Word launch and OS integration

Do not let Word-specific launch details leak into the web runtime path.

## Integration Strategy Options

### Option A: App-owned automation bridge

Description:

- Electron main process owns the launch flow and invokes a Windows automation bridge internally

Pros:

- pragmatic
- fast to ship
- keeps integration isolated from front-end logic
- easiest next step from current prototype

Cons:

- still depends on Windows automation behavior
- harder to describe as fully native integration

### Option B: True native direct integration

Description:

- Electron/Node talks to Word through a dedicated native COM-capable dependency

Pros:

- cleaner long-term architecture in theory
- more direct control over automation lifecycle

Cons:

- more implementation risk
- likely packaging and maintenance overhead
- not justified for MVP yet

### Recommendation

Use Option A for MVP and revisit Option B only if the feature proves valuable and reliable enough to deserve harder infrastructure.

## Key Risks

### Technical risks

- Microsoft Word may not be installed
- Office version differences may change behavior
- enterprise policy may restrict automation
- readonly / locked / synced files may behave inconsistently
- temp and path handling may fail for some edge cases

### Product risks

- users may confuse Word output with RdLn output
- users may expect PDF support immediately
- users may assume the feature works in browser/web mode
- users may expect RdLn to import and render the Word redline automatically

### Support risks

- environment-specific Word errors may be hard to reproduce
- support burden may rise if failure states are vague

## Risk Mitigations

- release behind a feature flag
- scope to DOCX only
- scope to Windows Electron only
- keep output in Word only
- provide plain-English validation and failure messages
- do not advertise as cross-platform or web-compatible
- log launch attempts and failure categories in desktop diagnostics if implemented

## Feature Flag Recommendation

Recommended initial flag:

- `ENABLE_COMPARE_IN_WORD`

Behavior:

- off by default in production until validated
- available in internal/test builds first
- can be enabled selectively for user trials

## Acceptance Criteria For MVP

### Functional

- User can load two DOCX files and choose `Compare in Word`
- RdLn blocks unsupported file types
- RdLn blocks missing files
- RdLn blocks same-file input
- On supported Windows Electron installs, Word compare launches successfully
- Result remains open in Word

### UX

- Feature is clearly labeled as external Word compare
- User gets an understandable status message for success or failure
- Action appears only when relevant or is clearly disabled with reason

### Safety

- No changes to RdLn native compare pipeline
- No changes to Myers algorithm
- No web runtime regression
- Failure to launch Word does not destabilize the app

## Definition Of Done For Production MVP

- feature flag implemented
- Electron-only integration path implemented
- UI integrated into file-based DOCX workflow
- validation and error handling implemented
- manual QA on Windows with local Word installed
- manual QA on Windows without usable Word launch path
- docs updated for scope and limitations

## Manual QA Scenarios

1. Valid `.docx` + `.docx` launches Word compare.
2. Same file selected twice is blocked.
3. Non-DOCX input hides or disables the action.
4. Missing or moved file is blocked with clear message.
5. Feature hidden or unavailable in unsupported runtime contexts.
6. Failure to launch Word produces user-safe error copy.

## Open Decisions

1. Should `Compare in Word` be hidden when unavailable, or shown disabled with explanation?
2. Should the feature appear only after both files are selected, or persist as a disabled action until then?
3. Should launch events/failures be logged to desktop diagnostics from day one?
4. Should the feature be exposed only in a beta/experimental settings mode initially?

## Recommended Next Step

Move from prototype to a guarded production integration plan for the Electron app only, behind a feature flag, without touching the RdLn native comparison pipeline.
