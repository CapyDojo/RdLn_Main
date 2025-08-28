# Test File Requirements for DOCX Extraction Prototype

## Test Document Categories

### 1. Simple Text Document (simple-text.docx)
- Plain paragraphs with no special formatting
- Multiple paragraphs with line breaks
- Basic punctuation and special characters
- Purpose: Baseline functionality test

### 2. Numbered Lists Document (numbered-lists.docx)
- Decimal numbering (1., 2., 3.)
- Letter numbering (a., b., c.)
- Roman numeral numbering (i., ii., iii.)
- Parenthetical numbering (1), (a), (i))
- Purpose: Test numbering format recognition

### 3. Nested Lists Document (nested-lists.docx)
- Multi-level numbered lists (3+ levels deep)
- Mixed numbering formats at different levels
- Bullet points with sub-bullets
- Combined numbered and bulleted lists
- Purpose: Test hierarchy preservation

### 4. Complex Formatting Document (complex-formatting.docx)
- Mixed list types in single document
- Lists with custom formatting
- Long paragraphs between lists
- Lists with special characters
- Purpose: Real-world complexity testing

### 5. Edge Cases Document (edge-cases.docx)
- Empty list items
- Lists at document start/end
- Single-item lists
- Lists with very long text
- Purpose: Boundary condition testing

## Validation Criteria

For each test document:
1. Open in Microsoft Word
2. Select All (Ctrl+A)
3. Copy (Ctrl+C)
4. Paste into Notepad
5. Save as reference text file
6. Process through prototype
7. Compare outputs for exact match

## Expected Outcomes

### Success Criteria
- ✅ Identical text output to Word → Notepad workflow
- ✅ All list numbering preserved correctly
- ✅ Proper indentation for nested items
- ✅ Line breaks and paragraph structure maintained
- ✅ No extra or missing characters

### Failure Indicators
- ❌ Missing or incorrect list numbers
- ❌ Wrong indentation levels
- ❌ Extra or missing line breaks
- ❌ Garbled special characters
- ❌ Lost paragraph structure