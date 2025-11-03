# Test Fixtures

This directory contains DOCX test files for validating list numbering extraction.

## Generating Test Fixtures

Create these 9 test cases in Microsoft Word:

### 1. Simple Numbered List (`01_simple-numbered.docx`)
```
1. First item
2. Second item
3. Third item
4. Fourth item
```

### 2. Nested 3 Levels (`02_nested-3-levels.docx`)
```
1. Level 1
   1.1. Level 2
        1.1.1. Level 3
        1.1.2. Level 3
   1.2. Level 2
2. Level 1
```

### 3. Mixed Bullets and Numbers (`03_mixed-bullets-numbers.docx`)
```
1. Numbered item
   • Bullet sub-item
   • Bullet sub-item
2. Numbered item
   • Bullet sub-item
```

### 4. Roman Numerals (`04_roman-numerals.docx`)
```
I. First
II. Second
III. Third
IV. Fourth
V. Fifth
```

### 5. Letter Sequence (`05_letter-sequence.docx`)
```
a) First
b) Second
c) Third
d) Fourth
```

### 6. Legal Outline Format (`06_legal-outline.docx`)
```
1.1. Section
1.1.1. Subsection
1.1.1.1. Sub-subsection
1.1.2. Subsection
1.2. Section
```

### 7. List Continuation (`07_list-continuation.docx`)
```
1. First item
2. Second item

This is a regular paragraph

3. Third item (continues list)
4. Fourth item
```

### 8. Restart Numbering (`08_restart-numbering.docx`)
```
1. First list item
2. Second list item

1. New list starts (restart)
2. Second item of new list
```

### 9. Custom Number Format (`09_custom-format.docx`)
```
Article 1 - First
Article 2 - Second
Article 3 - Third
```

## Steps to Create Each Fixture

1. Open Microsoft Word
2. Create the list as specified above
3. Save as `.docx` in this directory
4. Use Word's numbering tools (Home → Numbering/Bullets)
5. For nested lists, use Tab to indent
6. For custom formats, use Define New Number Format

## After Creating Fixtures

Generate expected output files:
1. Open each DOCX in Word
2. Select All (Ctrl+A)
3. Copy (Ctrl+C)
4. Open Notepad
5. Paste (Ctrl+V)
6. Save as corresponding `.txt` file in `tests/expected/` directory

Example:
- `01_simple-numbered.docx` → `../expected/01_simple-numbered.txt`
