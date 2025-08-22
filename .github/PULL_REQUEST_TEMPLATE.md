# PR Title

## Summary
- Briefly explain the purpose, scope, and context.
- Note if this is user-facing, internal refactor, tests, or docs.

## Linked Issues
- Closes #<id>
- Relates to #<id>

## Type
- [ ] feat
- [ ] fix
- [ ] refactor
- [ ] perf
- [ ] test
- [ ] docs
- [ ] chore

## Screenshots / Recordings (UI changes)
- Before/after images or short clips for UI updates.

## Test Plan
- Commands run locally:
  - `npm run lint`
  - `npm test`
  - `npm run test:e2e` (if UI flow changed)
  - `npm run test:ocr` (only if OCR logic changed)
- Notes on coverage or affected areas:

## Packaging (Desktop)
- Electron: built with `npm run electron:build:win` (Windows). Output at `dist-electron-new/win-unpacked/RdLn.exe`.
- Tauri: on hold — do not build.

## Risks & Rollback
- Known risks:
- Rollback plan:

## Checklist
- [ ] Lint passes (`npm run lint`)
- [ ] Tests pass (`npm test`); updated/added tests where needed
- [ ] No changes to `src-tauri/**` (Tauri on hold) unless explicitly approved
- [ ] No secrets or large binaries committed; OCR assets handled via scripts
- [ ] Docs updated (`README.md`, `AGENTS.md`, or relevant files)
- [ ] Followed `docs/DevRules/Agent_Rules.md` and `docs/DevRules/DEVELOPMENT_GUIDELINES.md`
