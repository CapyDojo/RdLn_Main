# Coding Agent Execution Prompt

Read the status tracking section in this document first.

- If the task is to continue the original MVP implementation, execute only tasks marked `Outstanding` in the `Task Tracker`.
- If the task is to perform the UX refinement pass, execute the `EWC-UX-*` tasks only unless a dependency explicitly requires otherwise.
- Do not re-implement tasks already marked `Completed` unless required to support the requested scope.

Important repo rules:
- Read and follow [Agent_Rules.md](C:/temp/RdLn_MVP_Stream/docs/DevRules/Agent_Rules.md) and [DEVELOPMENT_GUIDELINES.md](C:/temp/RdLn_MVP_Stream/docs/DevRules/DEVELOPMENT_GUIDELINES.md) first.
- Prefer native Windows commands.
- Do not run `git clean -fdx`.
- Do not start the dev server in chat.
- Do not modify `src/algorithms/MyersAlgorithm.ts`.
- Keep changes minimal, surgical, and non-regressive.
- Tauri is on hold. Do not touch `src-tauri/**`.

Task:
Implement a guarded MVP for `Launch Microsoft Word for Native Compare` in the real Electron app.

Goal:
Add an optional `Launch Microsoft Word for Native Compare` action for file-based `.docx` to `.docx` workflows in the Windows Electron app only, behind a feature flag, without affecting RdLn's native comparison pipeline.

Strict scope:
- Windows only
- Electron only
- DOCX to DOCX as the supported path; local PDF inputs may be enabled for experimental testing
- File-based inputs only
- Launch local Microsoft Word compare
- Result stays in Word
- No web app support
- No browser/PDF rendering promise inside RdLn; any PDF-involved Word launch is experimental only
- No import of Word result back into RdLn
- No changes to Myers/native compare logic

Requirements:
1. Add a feature flag, recommended name: `ENABLE_EXTERNAL_WORD_COMPARE`.
2. Show the action only when appropriate, or disable it with a clear reason:
   - Electron runtime
   - Windows platform
   - both inputs are real local files
   - both files are `.docx`
3. Implement Electron-side validation for:
   - both files exist
   - both are `.docx`
   - files are different
4. Implement the desktop launch path in the Electron layer only.
5. Keep Word-specific launch logic isolated from the web runtime path.
6. Ensure failure to launch Word does not break the app.
7. Use plain-English success/failure messages.
8. Preserve existing RdLn compare behavior completely.

Architecture guidance:
- Renderer/UI collects intent and displays action/state.
- Preload exposes minimal safe API.
- Electron main process owns validation and launch.
- Keep Word integration out of `useComparison` and out of the native result pipeline.

Before coding:
- Inspect current file-input flow and identify where file metadata/path is currently tracked.
- Find the best existing UI location for a secondary compare action in the file-based workflow.
- Confirm how to safely distinguish file inputs from pasted text inputs.

Implementation notes:
- You may use the standalone prototype at `Prototypes/20260330_Prototype_A_External_Word_Compare_Mock` as reference only.
- Do not blindly copy prototype structure if it does not fit the app.
- Prefer the app-owned automation bridge approach from the plan for MVP.
- Keep the code path modular and reversible.

Testing/verification:
- Run targeted verification where feasible without starting the dev server in chat.
- At minimum, run syntax/type/lint checks relevant to changed files if possible.
- If full runtime verification requires the app to be launched externally, say exactly what the user should test manually.

Deliverables:
- Implemented feature-flagged MVP
- concise summary of what changed
- file references for key changes
- any risks or limitations remaining
- exact manual QA steps for the user to run externally

Be pragmatic. Keep the implementation narrow.

---

# 20260330 Launch Microsoft Word for Native Compare MVP Plan

## Status

In progress.

Standalone prototype validated.
Core production MVP implemented and manually validated in Electron dev.
UX polish implementation completed.
Final external Electron QA still pending.

## Task Tracker

### MVP Tasks

- `EWC-MVP-01` Completed: Standalone Electron prototype created and validated at `Prototypes/20260330_Prototype_A_External_Word_Compare_Mock`
- `EWC-MVP-02` Completed: Production feature flag introduced as `ENABLE_EXTERNAL_WORD_COMPARE`
- `EWC-MVP-03` Completed: Electron-only launch path implemented in `src-electron/main.cjs`
- `EWC-MVP-04` Completed: Secure preload bridge implemented in `src-electron/preload.cjs`
- `EWC-MVP-05` Completed: Windows/Electron/DOCX/local-file gating implemented in app UI
- `EWC-MVP-06` Completed: Local file source tracking implemented for DOCX input flows
- `EWC-MVP-07` Completed: Source metadata preserved across swap operations
- `EWC-MVP-08` Completed: Compare action integrated into desktop and mobile controls
- `EWC-MVP-09` Completed: Electron detection bug fixed for dev with `contextBridge.exposeInMainWorld('isElectron', true)`
- `EWC-MVP-10` Completed: Core feature manually verified working in `npm run electron:dev`

### UX Polish Tasks

- `EWC-UX-01` Completed: Renamed live UX from `External Word Compare` to `Launch Microsoft Word for Native Compare`
- `EWC-UX-02` Completed: Applied hide-vs-disable behavior refinement
- `EWC-UX-03` Completed: Added linked source chips near input headers
- `EWC-UX-04` Completed: Added edited/disconnected inline messaging after manual text edits
- `EWC-UX-05` Completed: Improved helper/status copy near the Word action
- `EWC-UX-06` Completed: Added first-use confirmation modal with persistence
- `EWC-UX-07` Completed: Refined success/failure copy to approved final wording

### QA Tasks

- `EWC-QA-01` Completed: Core manual validation completed in Electron dev
- `EWC-QA-02` Blocked: Run final polish QA in Electron after UX updates and confirm manually

### Follow-On Polish Tasks

- `EWC-UX-08` Completed: Adjusted linked source filename presentation so the UI grows to fit the full filename with no truncation in visible UI. Wrapping is acceptable.
- `EWC-UX-09` Completed: Removed the entire inline Word-action helper/status layer from the UI, including ready, launching, success, and disabled text. Explanations now remain in tooltip/state logic only.
- `EWC-UX-10` Parked: Revisit the edited/disconnected provenance state model. The disconnected indicator should not disappear after continued typing, but the desired long-term behavior needs more refinement before implementation.
- `EWC-UX-11` Completed: File-based document imports now replace the entire panel content rather than inserting at the caret. This applies to DOCX, PDF, and TXT file imports via drag/drop and clipboard file paste.
- `EWC-MVP-11` Outstanding: Expand launch eligibility to allow local PDF inputs for experimental testing in Microsoft Word native compare.
- `EWC-UX-12` Outstanding: Add explicit experimental warning copy whenever a Word native compare launch includes one or more PDF inputs.

## UX Polish Execution Brief

Implement the UX polish pass for the existing Electron-only Word integration feature.

Core product direction:
- Canonical feature label: `Launch Microsoft Word for Native Compare`
- This remains Windows + Electron + file-based-only, with DOCX as the trusted path and local PDF inputs eligible for experimental testing
- Result stays in Microsoft Word
- RdLn native compare remains unchanged

Required UX changes:

`EWC-UX-01` Rename visible UI copy
- Replace current visible feature wording with:
  - Full label: `Launch Microsoft Word for Native Compare`
  - Short/mobile label: `Word Compare`
- Update tooltips, helper text, success text, and disabled text to use `Word native compare` phrasing where appropriate
- Keep internal implementation names only if changing them would create unnecessary churn, but user-facing copy should match the new naming

`EWC-UX-02` Hide vs disable behavior
- Hide the feature entirely when:
  - feature flag is off
  - not running in Electron
  - not on Windows
- Show disabled with explanation when:
  - one or both sides do not have valid local DOCX sources
  - same file is loaded on both sides
  - compare is currently processing
  - Word launch is in progress

`EWC-UX-03` Add source chips for linked DOCX files
- Show compact source chips beneath or near each input panel header
- Format:
  - `Original: {filename}`
  - `Revised: {filename}`
- Show only when that side has a valid linked local DOCX source
- Truncate long names visually if needed, but preserve full name in tooltip/title
- Keep styling aligned with the current app UI language

`EWC-UX-04` Add edited/disconnected messaging
- If a DOCX source was imported and then the user manually edits the text, show inline messaging explaining why Word native compare is no longer available
- Use this approved copy:
  - `Text was edited in RdLn. Word native compare requires the original local DOCX files.`
- This should be tied to the actual source-disconnect behavior, not shown generically

`EWC-UX-05` Improve helper / status copy near the Word action
- Add a small inline helper/status line near the Word action when the feature is visible
- Use these approved copy patterns as appropriate:
  - `Opens Microsoft Word on this computer and runs Word’s native compare.`
  - `Ready to launch Word native compare.`
  - `Microsoft Word is launching...`
  - `Microsoft Word opened with a native comparison.`

`EWC-UX-06` Add first-use confirmation modal
- Before first launch only, show a confirmation modal
- Use:
  - Title: `Launch Microsoft Word for Native Compare?`
  - Body: `RdLn will open Microsoft Word on this computer and run Word’s native compare using your two source DOCX files. The comparison result will open in Word, not inside RdLn.`
  - Checkbox: `Don’t show this again`
  - Buttons: `Launch Word`, `Cancel`
- Persist the dismissal choice appropriately in existing local storage patterns/config if feasible
- Keep this implementation narrow and local

`EWC-UX-07` Refine success and failure copy
- Prefer plain-English messages over raw technical messages
- Use these approved strings where they fit:
  - `Microsoft Word opened with a native comparison.`
  - `RdLn could not launch Microsoft Word. Please try again.`
  - `Microsoft Word does not appear to be installed on this computer.`
  - `One or both source files could not be found.`
  - `Only DOCX files are supported for Word native compare.`
  - `Choose two different DOCX files to continue.`

Implementation notes:
- The Electron detection fix in `src-electron/preload.cjs` is already working; preserve it
- The source tracking bug fix across DOCX import paths is already working; build on it, do not regress it
- Keep Word integration out of the native compare pipeline
- Reuse existing UI patterns/components where sensible rather than introducing a large new framework

Likely files to inspect:
- `src/components/ComparisonInterface.tsx`
- `src/components/DesktopControlsPanel.tsx`
- `src/components/MobileControlsPanel.tsx`
- `src/components/TextInputPanel.tsx`
- `src/components/DesktopInputLayout.tsx`
- `src/components/MobileInputLayout.tsx`
- `src/config/appConfig.ts`
- `src-electron/main.cjs`
- `src-electron/preload.cjs`

Verification:
- Run targeted lint/syntax/type checks on changed files where feasible
- Do not start the dev server in chat
- Provide exact manual QA steps for external Electron testing
- Mark `EWC-QA-02` complete only after external QA confirms the polish pass works as intended

## Follow-On Execution Prompts

Execute these one at a time, in order.

### `EWC-UX-11` Execution Prompt

Implement `EWC-UX-11` only from this sprint plan.

First read and follow:
- [Agent_Rules.md](C:/temp/RdLn_MVP_Stream/docs/DevRules/Agent_Rules.md)
- [DEVELOPMENT_GUIDELINES.md](C:/temp/RdLn_MVP_Stream/docs/DevRules/DEVELOPMENT_GUIDELINES.md)

Constraints:
- Prefer native Windows commands
- Do not run `git clean -fdx`
- Do not start the dev server in chat
- Do not touch `src-tauri/**`
- Do not modify `src/algorithms/MyersAlgorithm.ts`
- Keep the current working Electron Word launch path intact
- Keep changes minimal and non-regressive

Task:
Implement `EWC-UX-11`: treat file-based imports as document-import actions that replace the entire panel content, rather than text-insertion actions that insert at the current cursor position.

Required behavior changes:

1. These file-based import flows must replace the entire panel content:
- DOCX drag/drop
- DOCX clipboard file paste
- PDF drag/drop
- PDF clipboard file paste
- TXT drag/drop
- TXT clipboard file paste

2. For those file-based import flows:
- replace the full panel content
- do not insert at `selectionStart` / `selectionEnd`
- keep or refresh file provenance where appropriate
- clear prior disconnected/import state when a new document import replaces the panel

3. Do NOT change these behaviors:
- plain text paste should still insert at the current selection
- OCR/image-derived text should still insert at the current selection

Implementation guidance:
- Focus on `src/components/TextInputPanel.tsx`
- Prefer creating a narrow helper for “replace panel content from imported file”
- Reuse it across DOCX/PDF/TXT file import paths
- Do not widen Word compare eligibility yet
- Do not add PDF warning UX yet
- Do not solve the broader `EWC-UX-10` persistence redesign in this pass unless a minimal change is required to keep import state coherent

Important verification goals:
- file object imports replace the panel
- plain text paste still inserts at cursor
- OCR/image insertion still inserts at cursor
- existing DOCX provenance still works after replace-style import
- no regression in swap/reset behavior

Likely files:
- `src/components/TextInputPanel.tsx`
- `src/components/ComparisonInterface.tsx` only if a minimal provenance-state adjustment is required
- `src/components/DesktopInputLayout.tsx`
- `src/components/MobileInputLayout.tsx`

Verification:
- run targeted lint/syntax checks on changed files
- do not start the dev server in chat
- provide exact external manual QA steps

Manual QA should include:
1. DOCX drag/drop replaces the whole panel instead of inserting at cursor.
2. DOCX clipboard file paste replaces the whole panel instead of inserting at cursor.
3. PDF drag/drop replaces the whole panel instead of inserting at cursor.
4. PDF clipboard file paste replaces the whole panel instead of inserting at cursor.
5. TXT drag/drop replaces the whole panel instead of inserting at cursor.
6. TXT clipboard file paste replaces the whole panel instead of inserting at cursor.
7. Plain text paste still inserts at the cursor.
8. OCR/image-derived insertion still inserts at the cursor.

Deliverables:
- implemented `EWC-UX-11`
- concise summary
- key file references
- any remaining limitations
- manual QA steps

### `EWC-MVP-11` Execution Prompt

Implement `EWC-MVP-11` only after `EWC-UX-11` is complete and manually checked.

Task:
Expand `Launch Microsoft Word for Native Compare` eligibility to allow local PDF inputs for experimental testing.

Required behavior changes:
- DOCX + DOCX remains the trusted/supported path
- PDF + PDF is allowed as experimental
- DOCX + PDF is allowed as experimental
- PDF + DOCX is allowed as experimental

Implementation guidance:
- broaden renderer-side gating in `src/components/ComparisonInterface.tsx`
- preserve existing supported-context hiding behavior
- broaden Electron-side validation in `src-electron/main.cjs`
- keep file existence and same-file checks intact
- keep plain-English errors
- do not add the experimental warning copy in this pass; that belongs to `EWC-UX-12`

Likely files:
- `src/components/ComparisonInterface.tsx`
- `src-electron/main.cjs`
- `src-electron/preload.cjs` only if interface changes are required

Verification:
- run targeted lint/syntax checks on changed files
- provide exact external manual QA steps

Manual QA should include:
1. DOCX + DOCX still launches successfully.
2. PDF + PDF can attempt launch.
3. DOCX + PDF can attempt launch.
4. PDF + DOCX can attempt launch.
5. Same-file validation still blocks.
6. Missing-file validation still blocks.
7. Unsupported file combinations remain blocked.

Deliverables:
- implemented `EWC-MVP-11`
- concise summary
- key file references
- remaining limitations
- manual QA steps

### `EWC-UX-12` Execution Prompt

Implement `EWC-UX-12` only after `EWC-MVP-11` is complete and manually checked.

Task:
Add explicit experimental warning copy whenever a Word native compare launch includes one or more PDF inputs.

Required behavior changes:
- if either side is a PDF, show an explicit experimental warning before launch
- keep the current confirmation modal if practical
- branch the modal copy based on file types
- DOCX-only launches should keep the normal confirmation copy

Approved warning direction:
- `Experimental: Microsoft Word may convert PDF files before comparing. Results can vary.`
- keep the explanation that the comparison opens in Word, not in RdLn

Implementation guidance:
- reuse the existing confirmation modal in `src/components/ComparisonInterface.tsx` if practical
- avoid creating a second competing modal unless necessary
- keep warning copy clear and concise

Verification:
- run targeted lint/syntax checks on changed files
- provide exact external manual QA steps

Manual QA should include:
1. DOCX-only launch shows the normal confirmation copy.
2. PDF + PDF launch shows experimental warning copy.
3. DOCX + PDF launch shows experimental warning copy.
4. PDF + DOCX launch shows experimental warning copy.
5. The rest of the launch flow still behaves as before.

Deliverables:
- implemented `EWC-UX-12`
- concise summary
- key file references
- remaining limitations
- manual QA steps

## Follow-On Decisions

- `EWC-UX-08`: Linked source filenames are legally significant and should remain fully visible in the UI. The presentation may grow vertically or horizontally as needed. Wrapping is acceptable; truncation in visible UI is not.
- `EWC-UX-09`: Inline Word-action helper/status text is not desired. This includes the current ready, launching, success, and disabled inline messages. Explanations should live in tooltip/state handling only.
- `EWC-UX-10`: The edited/disconnected state needs a more deliberate persistence model and is intentionally parked for now rather than patched narrowly.
- `EWC-UX-11`: File-based document imports should behave as document imports, not text insertions. DOCX, PDF, and TXT file imports via drag/drop or clipboard file paste should replace the entire panel content rather than inserting at the caret. Plain-text paste and OCR-derived text insertion should continue to insert at the current selection.
- `EWC-MVP-11`: Local PDF inputs should be eligible for `Launch Microsoft Word for Native Compare` for experimental testing, even though DOCX remains the trusted path.
- `EWC-UX-12`: Any Word native compare launch involving one or more PDF files should present explicit experimental-warning copy because Word may convert PDFs before comparing and the results can be lossy or inconsistent.

## Objective

Add an optional `Launch Microsoft Word for Native Compare` path for file-based document workflows in the Windows Electron app, without changing RdLn's core native comparison engine.

This feature is intended to:

- give users a trusted fallback for Word-native comparison
- improve confidence for legal file-based workflows
- keep RdLn as the primary product experience while allowing external comparison when desired

## Product Positioning

This is not a replacement for RdLn compare.

This is an alternative secondary action for users who have loaded two supported local documents and want to compare them using locally installed Microsoft Word.

Recommended UX framing:

- Primary: `Compare`
- Secondary: `Launch Microsoft Word for Native Compare`
- Helper copy: `Opens Microsoft Word on this computer and runs Word's native compare.`

## Recommended MVP Scope

### In scope

- Windows only
- Electron app only
- `.docx` to `.docx` as the supported path
- local `.pdf` inputs eligible for experimental testing in Word native compare
- File-based inputs only
- Launch local Microsoft Word compare
- Keep comparison result in Word
- Feature-flagged / experimental release
- Clear validation and user-facing error states

### Out of scope

- Web app support
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

For that reason, DOCX remains the trusted path and any PDF-involved launch should be treated as explicitly experimental.

## Prototype Learnings

A standalone prototype was built at:

- `Prototypes/20260330_Prototype_A_External_Word_Compare_Mock`

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

1. User loads two supported local files into Original and Revised.
2. RdLn validates that both inputs are valid local files in the allowed Word-launch set.
3. RdLn displays both compare options:
   - `Compare`
   - `Launch Microsoft Word for Native Compare`
4. User clicks `Launch Microsoft Word for Native Compare`.
5. Electron main process validates:
   - both files exist
   - both are in the allowed launch set
   - files are different
   - feature is enabled
   - platform is Windows desktop
6. RdLn launches Word compare.
7. Word opens the generated comparison document.
8. RdLn shows a success or failure status message.

## UX Recommendations

### Visibility conditions

Show `Launch Microsoft Word for Native Compare` only when:

- app is running in Electron
- platform is Windows
- both inputs came from actual local files
- both inputs are in the allowed Word-launch set

Otherwise either hide the action or show a disabled state with exact reason.

### Recommended copy

Button label:

- `Launch Microsoft Word for Native Compare`

Helper copy:

- `Opens Microsoft Word on this computer and runs Word's native compare.`

Failure examples:

- `Only supported local DOCX or PDF files can be used for Word native compare.`
- `RdLn could not launch Microsoft Word. Please try again.`
- `Choose two different DOCX files to continue.`
- `Experimental: Microsoft Word may convert PDF files before comparing. Results can vary.`

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
- users may over-trust PDF support or assume Word preserves PDF fidelity
- users may assume the feature works in browser/web mode
- users may expect RdLn to import and render the Word redline automatically

### Support risks

- environment-specific Word errors may be hard to reproduce
- support burden may rise if failure states are vague

## Risk Mitigations

- release behind a feature flag
- keep DOCX as the trusted path and treat PDF-involved launches as explicitly experimental
- scope to Windows Electron only
- keep output in Word only
- provide plain-English validation and failure messages
- do not advertise as cross-platform or web-compatible
- log launch attempts and failure categories in desktop diagnostics if implemented

## Feature Flag Recommendation

Recommended initial flag:

- `ENABLE_EXTERNAL_WORD_COMPARE`

Behavior:

- off by default in production until validated
- available in internal/test builds first
- can be enabled selectively for user trials

## Acceptance Criteria For MVP

### Functional

- User can load two supported local files and choose `Launch Microsoft Word for Native Compare`
- RdLn blocks unsupported file types
- RdLn blocks missing files
- RdLn blocks same-file input
- On supported Windows Electron installs, Word compare launches successfully
- Result remains open in Word

### UX

- Feature is clearly labeled as `Launch Microsoft Word for Native Compare`
- User gets an understandable status message for success or failure
- Action appears only when relevant or is clearly disabled with reason
- PDF-involved launches are explicitly labeled as experimental

### Safety

- No changes to RdLn native compare pipeline
- No changes to Myers algorithm
- No web runtime regression
- Failure to launch Word does not destabilize the app

## Definition Of Done For Production MVP

- feature flag implemented
- Electron-only integration path implemented
- UI integrated into file-based document workflow
- validation and error handling implemented
- manual QA on Windows with local Word installed
- manual QA on Windows without usable Word launch path
- docs updated for scope and limitations

## Manual QA Scenarios

1. Valid `.docx` + `.docx` launches Word compare.
2. Same file selected twice is blocked.
3. Unsupported file combinations hide or disable the action.
4. Missing or moved file is blocked with clear message.
5. Feature hidden or unavailable in unsupported runtime contexts.
6. Failure to launch Word produces user-safe error copy.
7. PDF-involved launch paths show experimental warning copy before launch.

## Open Decisions

1. Should `Launch Microsoft Word for Native Compare` be hidden when unavailable, or shown disabled with explanation?
2. Should the feature appear only after both files are selected, or persist as a disabled action until then?
3. Should launch events/failures be logged to desktop diagnostics from day one?
4. Should the feature be exposed only in a beta/experimental settings mode initially?

## Recommended Next Step

Move from prototype to a guarded production integration plan for the Electron app only, behind a feature flag, without touching the RdLn native comparison pipeline.


