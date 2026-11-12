# Markdown input support — 12 November 2026

**Execution prompt.** Read the scope, behaviour and task tracker before making further changes. Use this document to track the sprint. Markdown input uses the existing text reader, two-file import and redline.

## Scope

Accept `.md` files as inputs on the web and in Electron. Show the literal Markdown source in the existing text redline. For example, changing `# Terms` to `## Terms` highlights the added `#`, and `**bold**` appears with its asterisks. Embedded HTML and links appear as source text.

The sprint covers input and the initial **Clean Whitespace** setting. Use the text redline’s existing Copy and Word export actions. Native **Compare in Word** applies to eligible DOCX/PDF sources. Formatted Markdown preview, structure-aware comparison and Markdown export would be separate features.

## Behaviour

- Recognise `.md` case-insensitively by filename. Accept common file type values for `.md` such as `text/markdown`, `text/plain`, an empty value and `application/octet-stream`.
- Accept a single file dropped into either input panel, a pasted `.md` file attachment when the clipboard exposes it as a file, and two-file drops with one or two Markdown files. Mixed pairs can include TXT, DOCX or PDF. Use the existing file size limit, ordering by modification date, failed-import handling and **Undo import** behaviour.
- Feed the decoded source through the TXT reader. Preserve Markdown markers, link targets, indentation, trailing spaces and line breaks at import. Use the existing redline to display the source as text. Add `.MD` to the visible supported-file hints and applicable errors.
- Start **Clean Whitespace** at **Off** when either input comes from a successful `.md` import. Two trailing spaces can create a Markdown line break, so whitespace-only edits should be highlighted by default. Keep the toggle available. [CommonMark hard line breaks](https://spec.commonmark.org/0.31.2/#hard-line-breaks)
- Treat a successful file replacement as a new input pair for the default. Keep the user’s choice during text edits, Swap, reruns and changes of results view. A failed import leaves the current choice in place. **Undo import** restores the previous pair and its choice.
- Track Markdown origin from successful file imports on each side. Clear it for a cleared or replaced input and move it with Swap. Clear All, sample loads and saved text sessions use the standard **On** default when there is no Markdown file origin. **Undo Clear** follows the existing text-only restore. Pasted text alone uses the normal text flow.

## Task tracker

| ID | Status | Work |
| --- | --- | --- |
| MD-MVP-01 | Completed | Recognise `.md` and route single drops, pasted file attachments and pair drops through the TXT reader. |
| MD-MVP-02 | Completed | Track Markdown origin on each side through import, replacement, edits, Swap, Clear and pair-import undo. |
| MD-UX-01 | Completed | Apply the Markdown whitespace default and share the user’s choice across results views. |
| MD-UX-02 | Completed | Update supported-file hints, import errors and the relevant feature documentation. |
| MD-QA-01 | Completed | Cover file detection, source fidelity, pair import and whitespace-setting regressions with targeted tests. |
| MD-QA-02 | Completed | Verify the user flows in a browser and Windows Electron, and capture before/after screenshots. |
| MD-QA-03 | Completed | Run lint, build and repository test checks and record results against the baseline. |

## Implementation notes

- **MD-MVP-01** — Extend `src/services/FileTypeDetector.ts` so Markdown uses the existing text category and `TxtProcessor`. Reuse the shared detector in the text-file checks in `TextInputPanel.tsx` for paste and drop. `useFilePairImport.ts` already uses the shared detector. Keep the existing document/image priority and pair validation. Prefer a Markdown filename predicate for origin tracking and keep the existing processing result and Word source types.
- **MD-MVP-02** — Pass Markdown origin to `ComparisonInterface.tsx` when each file import succeeds. Include per-side origin and the current whitespace choice in the pair snapshot so the atomic commit and undo can restore them. Track origin independently of the Electron path and the filename label, which can disappear on edits. Update origin alongside the text in replacement and Swap flows.
- **MD-UX-01** — `ComparisonInterface.tsx` owns the whitespace choice, including the current value for undo, and passes it to the normal, overlay and fullscreen results. The existing toggle switches between clean and raw display. Results views share the choice for all input formats. A new ordinary pair starts with cleanup On.
- **MD-UX-02** — Update the desktop and mobile drop hints, the two-file unsupported-type message and the file service’s supported-format copy. Describe Markdown as text input in the user-facing docs.

## Verification

- **Import** — Cover `.md` and `.MD` with the four file type values above. Exercise a single drop on each side, a pasted file attachment, and both Markdown/Markdown and Markdown/TXT pairs. Verify newer-to-Revised ordering, both filename labels on pair import, whole-pair failure on an unreadable or unsupported second file, and Undo import. Spot-check an existing TXT, DOCX, PDF and image OCR import.
- **Source redline** — Use samples with a heading marker change, a changed link target, fenced code, a nested list, a two-space hard break and embedded HTML. Verify literal display, visible whitespace highlights with cleanup Off and escaped HTML. Include a Unicode and CRLF import fixture for the text reader.
- **Toggle and lifecycle** — Verify the first `.md` result defaults to Off and a regular text comparison defaults to On. Turn cleanup back on and check that edits, Swap, manual reruns, Live Compare and switching results views respect that choice. Verify a successful replacement re-evaluates the default, a failed replacement preserves the current choice, and pair-import undo restores the previous choice. Check desktop and mobile layouts plus Electron.
- **Release checks** — Run `npm run lint`, `npm run test:run` and `npm run build`, plus targeted end-to-end checks for the changed flows. Use the production build for isolated QA or an externally started development server for interactive QA. Capture screenshots of literal Markdown and a visible whitespace-only change. Record any existing suite failures separately from new regressions.

## Investigation and known limitations

- An in-memory prototype accepted `.md` through the TXT reader with all four file type values above and preserved the sample source, including Unicode and CRLF. Direct engine probes found the expected changes in headings, URLs, fences and whitespace.
- Live Compare deduplicates on trimmed inputs in `src/hooks/useComparison.ts`. An edit confined to the start or end of a file can be skipped until the user runs **Compare** manually. The sprint changes the default display of whitespace differences. The Live Compare scheduling edge case is follow-up work.
- The targeted pre-change run had 54 passes and five failures across four suites. Four failures were existing Myers assertions and one was a PDF rejection expectation in the file-processing suite. Compare results against the baseline before attributing failures to Markdown input.

## Implementation verification

- The three targeted Vitest files passed all 30 tests, including literal Unicode/CRLF file reads, the file size limit, Markdown pairs and undo snapshots.
- The production build passed. ESLint reported zero errors and 434 warnings. The full Vitest run passed 210 tests and reproduced the same 18 failures and one suite transform failure as the pre-change run, which passed 203 tests. The app type check stops at the pre-existing `TS1127` in `src/tests/preprocessing-test-utils.ts:60`.
- Edge verified single drops, pasted attachments, literal and escaped Markdown, the visible two-space change, the default and toggle across fullscreen, edits, Swap and manual/live comparison, pair ordering and Undo, failed pair handling, TXT replacement and the mobile layout. The previous build supplied the before screenshot. The current build passed DOCX, PDF and image OCR drop smoke checks.
- A Windows Electron harness loaded the production renderer and the app’s preload. It verified both local Markdown file paths, the raw redline and the native Word comparison eligibility guard.
- Screenshots show the [previous text redline](../../output/playwright/20261112-markdown-before.png), [Markdown input redline](../../output/playwright/20261112-markdown-after.png) and [mobile redline](../../output/playwright/20261112-markdown-mobile.png).
