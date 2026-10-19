# Two-file drop import — 19 October 2026

Execution prompt: Read the task tracker and verification notes first. The feature is implemented; do not re-implement the import handler or alter the diff engine. Keep this document as the sprint source of truth. Address repository-wide test/type-check debt separately from this feature.

## Behaviour

- Drop exactly two DOCX, PDF or TXT files together onto either input panel: the older modification timestamp goes to Original and the newer to Revised. Mixed document types are supported.
- Equal, zero, missing or non-finite timestamps preserve file-list order, with feedback asking the user to check the order and use Swap if needed. Filenames are shown in each panel, including on the web.
- One-file drops retain existing document replacement and image OCR behaviour. Images are not supported as part of a two-file import.
- More than two files reject the whole drop before extraction, preserving both panels. Approved copy: “Oops, you dropped more than two files! Drop files individually into your preferred panels, or drop two together and RdLn will place the newer file in Revised.”
- Both files are validated and read before either input is replaced. Extraction is sequential to limit peak memory. Failed, unsupported, oversized or textless files preserve the current comparison and identify the failed file.
- A successful import offers a single Undo import action that restores texts, filenames and live/disconnected native Word source links. Subsequent input changes, Swap, Clear or session/sample loads retire that undo checkpoint.
- Modification dates are used only for this drop; edits, Swap and later individual drops do not trigger reordering.
- Auto-compare pauses during extraction, receives the complete imported pair once, and respects its existing on/off setting. Successful import clears stale results. Pair imports while a comparison is running are rejected with feedback.
- A new drop, edit, Clear, session/sample load or component unmount invalidates pending work. Late extraction results are discarded.

## Task tracker

| ID | Status | Work |
| --- | --- | --- |
| PFI-MVP-01 | Completed | Shared pair importer, ordering, validation and count guard |
| PFI-MVP-02 | Completed | Atomic text replacement and auto-compare coordination |
| PFI-UX-01 | Completed | Filenames, loading/success/error feedback and Undo import |
| PFI-QA-01 | Completed | 23 targeted unit tests covering import and live comparison |
| PFI-QA-02 | Completed | External Edge browser checks, desktop/mobile screenshots and visual inspection |
| PFI-QA-03 | Completed | Full-suite failures compared against an unchanged HEAD archive; failure lists match |
| PFI-QA-04 | Blocked | Full app TypeScript check stops at existing TS1127 in src/tests/preprocessing-test-utils.ts:60; file is unchanged |

## Implementation

- `src/hooks/useFilePairImport.ts`: shared import lifecycle, generation-based stale-result protection, validation, file timestamps, native file provenance and undo snapshot.
- `src/hooks/useComparison.ts`: `replaceTexts` updates both inputs and clears old results together; `setInputImportPending` suspends pending live comparison during extraction. Atomic replacement retires the completed comparison's cooldown so a fast successive import still compares.
- `src/components/ComparisonInterface.tsx`: captures multi-file drops before panel handlers, commits the pair/source metadata, renders feedback and undo, and invalidates pending imports on competing actions.
- `DesktopInputLayout.tsx`, `MobileInputLayout.tsx`, `TextInputPanel.tsx`: optional imported filenames using existing theme utilities.
- No diff-engine, OCR-engine, package/dependency, shared type-definition or Tauri changes.

## Verification

- Targeted command: `node node_modules/vitest/vitest.mjs run tests/unit/hooks/20261019_File_A_file-pair-import.test.tsx tests/unit/hooks/20261019_File_B_pair-auto-compare.test.tsx --maxWorkers=2` — **23 passed**.
- Full suite: **200 passed, 18 failed, one failed suite** (12 files). Unchanged HEAD archive: **180 passed, the same 18 failed and the same failed suite** (11 files). Exact failure lists match. Existing failures concern file validation, Myers expectations, CopyButton/clipboard tests and performance-suite setup. Three atomic-comparison tests were added and passed separately after that full-suite run.
- Production build: passed. Existing Browserslist/chunk-size warnings remain.
- ESLint: passes with no errors; existing warnings remain. Temporary baseline archive was removed before final linting.
- `tsc --noEmit` at the solution root does not check the referenced app project. The correct app-project command, `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.app.json`, stops at the existing TS1127 parser error noted above; do not claim a clean app type check.
- Browser verification uses an isolated Edge profile against the locally running app, with seeded test-only onboarding state. Checks: either drop target, reversed file-list order, visible filenames, Undo, Swap, too-many-files rejection, empty-second-file preservation, tied dates, unchanged single-file replacement, live comparison and a distinct mobile import. No browser page errors were observed.
- Browser script: `output/playwright/20261019-pair-import-check.mjs`. Screenshots: `20261019-pair-import-before.png`, `20261019-pair-import-after.png`, `20261019-pair-import-too-many.png`, `20261019-pair-import-mobile.png`, all in `output/playwright/`.
- Native Electron source paths and undo are unit-tested; an actual Electron/Word launch was not exercised.

## Remaining work

No feature implementation tasks remain. Optional user acceptance testing can use `http://127.0.0.1:5173/` while the dev server is running. Repository-wide test failures and the existing TypeScript parser error need separate maintenance work.
