# Expected Output Files

This directory contains expected text output generated from Word's copy-paste mechanism.

## Purpose

These files serve as **ground truth** for validating the accuracy of our DOCX parser. They represent exactly how Microsoft Word itself flattens list numbering when copying and pasting as plain text.

## Generating Expected Files

For each test fixture in `../fixtures/`:

1. **Open** the DOCX file in Microsoft Word
2. **Select All**: Press `Ctrl+A`
3. **Copy**: Press `Ctrl+C`
4. **Open** Notepad (or any plain text editor)
5. **Paste**: Press `Ctrl+V`
6. **Save** as `.txt` with the same base name

### Example

```
fixtures/01_simple-numbered.docx
  ↓ (Open in Word → Ctrl+A → Ctrl+C → Paste in Notepad)
expected/01_simple-numbered.txt
```

## File Naming Convention

Expected files must have the exact same base name as their corresponding fixture:

```
01_simple-numbered.docx  →  01_simple-numbered.txt
02_nested-3-levels.docx  →  02_nested-3-levels.txt
03_mixed-bullets-numbers.docx → 03_mixed-bullets-numbers.txt
...
```

## What These Files Contain

The expected files contain:
- ✓ Calculated list numbers (not formatting codes)
- ✓ Proper indentation
- ✓ Nested list structure preserved
- ✓ Exactly as Word renders the numbers

Example for nested list:
```
1. Level 1
    1.1. Level 2
        1.1.1. Level 3
```

## Quality Assurance

✓ Always generate from Word's copy-paste (don't hand-write)
✓ Save as plain text (UTF-8 encoding)
✓ No manual formatting or corrections
✓ Preserve exact spacing and indentation from Word

## Why This Approach?

Microsoft Word is the **authoritative source** for DOCX list rendering. By using Word's own copy-paste mechanism, we ensure our parser matches Word's behavior exactly.
