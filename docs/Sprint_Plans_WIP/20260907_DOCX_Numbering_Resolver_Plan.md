# DOCX numbering resolver prototype

Execution prompt: Work only in `Prototypes/Docx Parser Prototypes/20260907_Prototype_A_NumberingResolver/` and this plan. Read the task tracker and validation evidence first. Do not integrate into `src/`, modify existing prototypes, or reimplement completed work. Main-app integration is a separate future step.

Current status (2026-09-10): the first real-document bullet and indentation fixes are complete, with 80 passing tests recorded in the 2026-09-09 validation below. All 27 Merger Agt 1 list labels now resolve. The remaining `MAIN_STORY_ONLY` warning still makes `complete=false` and blocks text export. The next work is DNR-ITER-04 and DNR-QA-05/06; read **Next iteration and acceptance criteria** before executing those tasks.

## Objective and scope

Reconstruct single-level and multilevel DOCX paragraph numbering from XML, retaining paragraph text, list identity, level, exact label, separator, and indentation metadata before plain-text serialization. Ship a reusable TypeScript core, local test fixtures, an exact comparison harness, and an offline inspection page. Reuse existing workspace dependencies; no main-app changes or development server.

## Task tracker

| ID | Task | Status |
| --- | --- | --- |
| DNR-MVP-01 | Create isolated workspace, reproducible XML/DOCX fixtures and Word reference capture | Completed |
| DNR-MVP-02 | Implement namespace-aware XML, styles, numbering definitions and counters | Completed |
| DNR-MVP-03 | Preserve ordered paragraphs, table context, inline text and diagnostics | Completed |
| DNR-MVP-04 | Provide CLI comparison and offline inspection harness | Completed |
| DNR-QA-01 | Run exact semantic regressions and strict TypeScript/lint checks | Completed |
| DNR-QA-02 | Capture actual Microsoft Word labels and compare supported fixtures exactly | Completed |
| DNR-QA-03 | Verify offline browser upload and save screenshots | Completed |
| DNR-QA-04 | Confirm isolation and record limits, results and reproduction commands | Completed |
| DNR-ITER-01 | Resolve verified nonnumeric list glyphs and retain raw label provenance | Completed |
| DNR-ITER-02 | Correct list-level versus inherited-style indentation precedence | Completed |
| DNR-ITER-03 | Recheck Merger Agt 1 against Word and rebuild the offline inspector | Completed |
| DNR-ITER-04 | Distinguish separator-only note parts from substantive omitted stories when determining completeness | Outstanding |
| DNR-QA-05 | Add completeness regressions and recheck the real fixture and existing suite after DNR-ITER-04 | Outstanding |
| DNR-QA-06 | Verify the rebuilt inspector's upload, glyph display, diagnostics and text-export behavior in a browser | Outstanding |

Initial prototype implementation completed 2026-09-08; the first real-document fixes completed 2026-09-09. Follow-up completeness and browser verification tasks remain outstanding. It is not integrated into the app or certified for arbitrary Word documents.

## Design decisions

- Word fidelity is the target. Captured behavior and documented Word deviations take precedence over ISO-only assumptions. Divergences are recorded below; the captured build is not a universal guarantee across Word versions or compatibility modes.
- Direct paragraph properties and inherited style properties are resolved before counting. `numId=0` suppresses numbering.
- Counters retain state through prose, other lists, and tables. Captured Word behavior shares counters across instances referencing the same underlying abstract definition. Each instance's start overrides apply on first use, followed by shared continuation. Different abstract definitions have independent state.
- Keep paragraph records separate from plain-text output. Plain text uses structural indentation, not a claim of pixel-perfect Word layout or clipboard equivalence.
- Unsupported or ambiguous constructs produce explicit diagnostics; never replace missing formats with guessed decimal labels.
- Word expectations must be captured independently from Word, carry fixture hashes and Word version, and never be generated from this resolver. Synthetic expected values alone are not Word validation.
- Initial scope is the main document story. Headers, notes, floating text boxes, fields requiring calculation, complex revision acceptance, picture/unmapped font-dependent bullets, and Word layout are not a full document-rendering implementation.

## Investigation evidence

The main app calls Mammoth `extractRawText()` in `src/services/DocxProcessor.ts:44`; a browser-library probe confirmed automatic labels are absent. The December 2025 Opus prototype reproduced incorrect never-restart numbering, numbering restored after explicit cancellation, lost table numbering, and duplicate hyperlink text. Existing prototypes remain untouched.

## Standards references

- [Level text and placeholders](https://learn.microsoft.com/en-us/dotnet/api/documentformat.openxml.wordprocessing.leveltext?view=openxml-3.0.1)
- [Word restart deviations](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-oi29500/140a2cd9-2f26-456d-9760-ae6ecef4e8b5): restart when the trigger level or an earlier level occurs; ignore restart inside level overrides.
- [Word start deviations](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-oi29500/8f145055-5422-4df0-933d-e67a81c633cd): documentation says nested level-override start is ignored. The captured Word build used it in our fixture; see the evidence below.
- [Word style level caveat](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-oi29500/6a8f14ff-df90-4154-9bc9-e0e88ae5e641): style ilvl behavior is not reliably specified by Word.
- [Legal numbering](https://learn.microsoft.com/en-us/openspecs/office_standards/ms-oe376/0bc0cf1e-4f08-43d2-ad5d-5c36b807dd5f): affects the current level too; none remains none.
- [Word ListString reference API](https://learn.microsoft.com/en-us/office/vba/api/word.listformat.liststring)

## Usage

Open `Prototypes/Docx Parser Prototypes/20260907_Prototype_A_NumberingResolver/dist/inspector.html` in Chrome or Edge. It is a self-contained, offline file; no development server is needed. Click **Load Word example**, or select/drop a DOCX. The example's expected labels come from the captured Word reference, not the resolver. An optional one-label-per-paragraph field highlights exact mismatches. JSON export retains diagnostic and paragraph metadata; text export is disabled for incomplete extraction.

Commands from the repository root (PowerShell):

```powershell
Set-Location 'Prototypes/Docx Parser Prototypes/20260907_Prototype_A_NumberingResolver'
npm run build
npm test
npm run lint
npm run verify:word
npm run inspect -- 'C:\path\document.docx' --json
```

No additional install is needed in this workspace. The prototype reuses the repository's TypeScript, JSZip, jsdom, ESLint and esbuild (via Vite) installations. Main-app package/lock files are unchanged. `npm run build` regenerates the ignored offline HTML and compiled core.

To regenerate reference DOCX files and recapture their numbering on a Windows machine with Word:

```powershell
npm run fixtures
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/capture-word.ps1
npm run verify:word
```

The capture script opens only generated fixture files read-only in its own hidden Word automation instance, disables macros, and closes it without saving source documents. It records Word version/build, capture time, per-fixture source hashes, paragraph text, labels, levels and row-marker flags. The verifier rejects missing/stale references. Table row markers are excluded using Word's `IsEndOfRowMark`; real empty cell paragraphs remain in the comparison.

## Module map

- `src/index.ts`: reusable public entry point, `extractDocx`, `extractXml`, `serializeParagraphs` and public types.
- `src/xml.ts`: namespace-aware readers, XML validation, numeric/on-off properties and indentation values.
- `src/numbering.ts`: style inheritance, numbering-style links, overrides and Word-compatible sequence state.
- `src/formats.ts`: bounded decimal, decimalZero, letter and Roman formatters. Word's alphabetic sequence repeats letters after z: aa, bb, cc.
- `src/document.ts`: ordered main-story traversal including nested tables, content controls, inline text and diagnostics.
- `src/docx.ts`: ZIP adapter resolving main/style/numbering parts through package relationships. It does not fetch external resources.
- `src/viewer.ts` and `inspector.html`: isolated UI; `scripts/build-viewer.mjs` bundles a self-contained `dist/inspector.html`.
- `tests/fixtures.mjs`: reproducible XML fixture definitions and small DOCX generator; `tests/word-reference.json`: captured, independent Word results.
- `scripts/inspect.mjs`: read-only CLI (`0` = complete scoped extraction, `2` = incomplete, `1` = failed).

## Validation evidence (2026-09-08)

- Prototype regression suite: **55 passed, 0 failed**. Includes exact fixtures, Word reference checks, namespace changes, style cycles, duplicate/missing definitions, unsupported formats, field/hyperlink text order, revisions, empty paragraphs, nested tables, negative indents, package relationship paths, concurrent-import isolation, and a 1,000-paragraph case.
- Word reference: **30 supported fixtures / 120 paragraphs**, exact matches for labels, levels, text and order against **Word 16.0, build 16.0.20326**. One additional captured fixture referencing a deeper level in its label template is deliberately unsupported and returns an explicit diagnostic, rather than a guessed label. It is not counted among the 30 matching fixtures.
- `npm run build`: passed strict TypeScript compilation and offline bundling.
- Prototype `npm run lint`: passed with no errors or warnings.
- Browser checks: passed in headless Chrome using the existing Playwright library. The installed MCP package did not provide the skill's CLI, so verification used direct browser automation without adding dependencies or a test-framework configuration. Checked example loading, incorrect expected labels, DOCX upload, table continuation, unsupported diagnostics, incomplete text-export blocking, corrupt-file recovery, text download and narrow layout. No browser errors and no HTTP(S) requests during the successful run.
- CSS protocol: inspected the single visible table, its computed minimum width and scroll container at a 390px viewport. Applied `min-width: 640px` inside the existing horizontal scroll container. Verified the body stays 390px wide and table content scrolls within its container.
- Screenshots: `artifacts/output/playwright/01-empty.png`, `02-word-example.png`, `03-table-upload.png`, `04-unsupported.png`, and `05-mobile.png`. Desktop and final mobile captures visually reviewed. These show the new inspector; no before/after main-app changes exist.
- Existing repository fixtures were also imported read-only: `numbered_list_test_in_small.docx` (15 paragraphs, 13 numbered) and `numbered list test.docx` (65 paragraphs, 21 numbered), both with zero unresolved labels. They report cached-field/main-story scope diagnostics. These are smoke checks, **not** Word parity certification for those real files. The older Qoder complex fixture imported with 19 paragraphs and no XML numbering references.
- Repository `npm run lint`: exit 0, **0 errors / 434 existing warnings**.
- Repository `npm test -- --run`: **180 passed / 18 failed**, 5 failed files / 6 passed files; includes existing CopyButton timeouts and clipboard utility failures. Root tests/config/source were not changed and the prototype is outside root test globs. Full output is in `artifacts/root-tests.log`; lint output is in `artifacts/root-lint.log`. These baseline failures are not repaired in this isolated task.
- Isolation: no `src/`, `src-electron/`, `src-tauri/`, root package/lock, root tests or existing prototype changes. Existing user changes in `.serena/project.yml`, `QWEN.md` and TempFiles remain untouched. Generated DOCX binaries/build outputs/screenshots/logs are ignored; no commit was made.

## Word behavior established by the reference fixtures

1. Same abstract definition, distinct numIds: labels continue `1, 2, 3, 4` in document order. Distinct abstracts count independently.
2. Switching to a new numId with a start override applies its start once; returning to earlier instances continues the shared sequence. Two overrides of 4 and 8 produce `4, 8, 9, 10` when interleaved.
3. Entering a deeper level initializes ancestor counters. A first clause `4.3.1` followed later by the first explicit top-level paragraph produces `5`, not `4`.
4. In this Word build a nested override start of 8 wins over startOverride=4, while a nested override without start uses 4. The nested restart=0 is ignored and the abstract restart rule still applies. This differs from the documented start behavior and must be rechecked across compatibility modes before general integration.
5. A paragraph style with numId but no ilvl uses level 0 in the captured fixtures, even when the abstract level has a pStyle link. Explicit style ilvl is inherited through basedOn. This follows measured Word behavior, not an ISO-only pStyle substitution assumption.
6. `xml:space="preserve"` retains boundary whitespace. In the fixture without it, Word discards the trailing space before a hyperlink. Text walking handles this and visits each run once.

## First real-document iteration (2026-09-09)

Implementation and regression verification are complete for DNR-ITER-01 through DNR-ITER-03. The local repository is `C:\temp\RdLn_MVP_Stream`; the prototype remains in the isolated folder named at the top of this plan. Reload its rebuilt `dist/inspector.html` before retesting.

- `src/formats.ts`: added a bounded, font-specific map for 19 legacy glyph codes across Symbol, Wingdings, Wingdings 2 and Webdings. Includes bullets, squares, diamonds, arrows, stars and check marks. Handles the legacy byte and Windows U+F000-offset representations. Sources: [Adobe Symbol mapping](https://www.unicode.org/Public/MAPPINGS/VENDORS/ADOBE/symbol.txt), [WG2 source references for existing Unicode dingbats](https://www.unicode.org/wg2/docs/n4363.pdf), and [Microsoft symbol-font conventions](https://learn.microsoft.com/en-us/typography/opentype/otspec183/recom). This is a selected map, not comprehensive font coverage.
- `src/numbering.ts`: reads the explicit list-symbol font, preserves ordinary Unicode bullet text and literal percent sequences, and resolves mapped glyphs without changing the sequence engine. Unknown private-use glyphs (including supplementary private-use planes), unsupported legacy codes, ambiguous font slots and picture bullets still report unresolved. Intentionally empty labels remain empty. The literal Unicode output is a textual equivalent, not a claim of identical glyph artwork.
- `src/types.ts`: additive optional `labelSource` records the raw template text and the unambiguous explicit font when available. Existing label/status/counter fields retain their meaning.
- `src/numbering.ts`: list-level indentation now overrides inherited paragraph-style indentation; direct paragraph properties still override the list. The prior order incorrectly let `ListParagraph`'s left=720 replace each level's value.
- `tests/resolver.test.mjs`: 25 additional test cases cover selected font mappings, mixed bullet/letter lists, raw metadata, native Unicode literals, suffixes, empty labels, unsupported glyphs, font ambiguity and indentation precedence. Total: **80 passed, 0 failed**, including the unchanged independent Word-reference checks (30 supported fixtures / 120 paragraphs). Strict compilation, prototype lint and offline build passed. No UI layout code changed; no new manual browser or visual glyph-artwork review was performed in this iteration.
- Real fixture: `C:\Users\edsiu\Downloads\Lists - Merger Agt 1.json` compared against `G:\My Drive\{CapyDojo}\MP003 - Rdln\Testing\Docx Test docs\Lists test docs\Lists - Merger Agt 1.docx`. A scratch copy was read in Microsoft Word, read-only with macros disabled. The updated extraction has **27 resolved list labels**, including Unicode bullets at indices 9 and 11; all 25 previously resolved labels and all 36 paragraph texts remain unchanged. All 27 left/hanging indents match the Word measurements. The 16 formerly incorrect left indents are corrected.
- Word's unusual `i.` at index 31 followed by `(ii)` at index 32 is preserved. It is established source behavior, not an error.
- The remaining `MAIN_STORY_ONLY` warning still sets `complete=false` and keeps full text export disabled: `src/docx.ts` flags the existence of note-story relationships, even though this document's note parts contain only separator records. CLI exit 2 therefore remains expected. This iteration fixes numbering; it does not change story-completeness policy. A useful next focused iteration is to distinguish empty separator-only note parts from substantive omitted story content while retaining diagnostics for real omissions.
- The updated JSON is saved in the Codex task's `outputs/Lists - Merger Agt 1 - fixed inspection.json`. Source DOCX/JSON and existing user edits were not changed. Only the four prototype files and this plan were edited; ignored build files were regenerated. No commit, main-app integration, dependency change or development server.

## Next iteration and acceptance criteria

Documentation reconciled on 2026-09-10 against the current prototype source and the saved fixed inspection JSON. The JSON contains 36 paragraphs, 27 resolved list labels, no unresolved numbering labels, and only `MAIN_STORY_ONLY`; `complete` remains false. This documentation update does not rerun tests or implement the outstanding tasks.

1. **DNR-ITER-04 — completeness for separator-only notes.** In `src/docx.ts`, the current presence-only check treats every header/footer/footnote/endnote relationship as an omission. Refine the note-part check so verified separator-only footnote/endnote parts do not make an otherwise complete extraction incomplete. Preserve diagnostics and incomplete status for substantive omitted content; do not suppress warnings for unknown, unreadable or unsupported parts. Keep substantive story extraction and main-app integration outside this iteration.
2. **DNR-QA-05 — regression evidence.** Cover separator-only footnotes and endnotes, substantive note content, omitted headers/footers, and missing or malformed related parts. Reinspect Merger Agt 1: all 36 paragraph texts, all 27 resolved labels, and the corrected indentation must remain unchanged. With only verified separator records outside the main story, expect `complete=true` and CLI exit 0. Retain incomplete status and text-export blocking for fixtures with genuine omissions or unresolved labels. Run the prototype tests, lint, build and existing independent Word-reference checks, then record actual results here.
3. **DNR-QA-06 — browser and glyph verification.** Reload the rebuilt offline `dist/inspector.html`, upload Merger Agt 1, and check the displayed bullets, diagnostics, JSON download and text download. Check representative mapped squares, arrows and check marks, plus an unmapped glyph that must remain unresolved. Record the browser and observed results before marking this task completed; Unicode mapping tests alone do not establish visual glyph fidelity. No development server is required.

The earlier 80-test result and the 2026-09-08 browser evidence remain historical validation of their respective versions. Neither constitutes completion of these new QA tasks. Further font mappings should be added only with an identified source and a regression case; comprehensive font coverage and picture-bullet conversion remain future scope.

## Known limits and next stage

The current deliverable is a prototype for numbered main-story paragraphs, not a general Word renderer or a claim of 100% clipboard parity. Paragraph/table context and raw indentation properties are preserved; the text view uses tabs for structural list levels and does not emulate hanging indent positions or Word tab stops.

Explicitly diagnosed limits include missing/cyclic definitions, unsupported/custom/localized number formats, picture or unmapped private-use/font-dependent bullets, numbered labels referencing deeper levels, section-break restart extensions, field calculation, drawing/text-box content, header/footer/note stories, alternate content and deleted-paragraph-mark merging. The formatters bound exceptionally large letter/Roman values. ZIP size checks are prototype limits, not a fully hardened decompression budget for untrusted production input.

Before a separate integration task: expand the Word reference corpus to representative legal documents and compatibility modes; investigate the unsupported template and ambiguous Word-versus-spec cases; extend formats and document-story/revision handling according to actual needs. Preserve the current fixtures and captured references as regression tests. Main-app integration must be requested separately.
