# Testing Guide

## Overview

This guide explains how to test the DOCX List Parser MVP and validate its accuracy.

## Quick Start

```bash
# Start the demo application
npm run dev

# Open browser to http://localhost:5174
```

## Manual Testing Flow

### Step 1: Generate Test Fixtures

1. Open Microsoft Word
2. Create each of the 9 test cases (see `tests/fixtures/README.md`)
3. Save as `.docx` files in `tests/fixtures/` directory

### Step 2: Generate Expected Outputs

For each DOCX file:

1. Open in Microsoft Word
2. Select All (`Ctrl+A`)
3. Copy (`Ctrl+C`)
4. Open Notepad
5. Paste (`Ctrl+V`)
6. Save as `.txt` in `tests/expected/` directory

### Step 3: Test in Demo Application

1. **Upload DOCX**: Drag and drop or click to select
2. **Upload Expected .txt**: Upload corresponding expected file
3. **View Results**:
   - Extracted text preview
   - Expected text preview
   - Accuracy metrics
   - Detailed differences

## Evaluation Criteria

### Accuracy Targets

| Test Case | Target Accuracy | Priority |
|-----------|----------------|----------|
| 01. Simple Numbered | 100% | HIGH |
| 02. Nested 3 Levels | 95% | HIGH |
| 03. Mixed Bullets/Numbers | 95% | HIGH |
| 04. Roman Numerals | 90% | MEDIUM |
| 05. Letter Sequence | 90% | MEDIUM |
| 06. Legal Outline | 85% | MEDIUM |
| 07. List Continuation | 90% | MEDIUM |
| 08. Restart Numbering | 85% | LOW |
| 09. Custom Format | 80% | LOW |

**Overall Target: ≥95% average accuracy**

### Performance Targets

| Document Size | Target Time |
|--------------|-------------|
| Small (<5 pages) | <500ms |
| Medium (<20 pages) | <1.5s |
| Large (<100 pages) | <5s |

## GO/NO-GO Decision (Day 3)

### GO Criteria (Proceed with Approach 1)

- ✅ Overall accuracy ≥95%
- ✅ High-priority tests ≥95%
- ✅ Performance within targets
- ✅ No critical bugs

### NO-GO Criteria (Pivot to Approach 2 or 3)

- ❌ Overall accuracy <80%
- ❌ High-priority tests failing
- ❌ Performance >3x targets
- ❌ Critical bugs (crashes, data loss)

### Partial Success (80-95%)

If accuracy is between 80-95%:

**Option A**: Debug and patch @omer-go library
- Identify specific failure patterns
- Fork and fix issues
- Re-test

**Option B**: Hybrid approach
- Use Office.js for complex cases
- Fall back to @omer-go for simple cases

## Automated Testing (Coming Soon)

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run accuracy tests
npm run test:accuracy

# Run performance benchmarks
npm run test:performance
```

## Common Issues and Troubleshooting

### Issue: Numbers Don't Match

**Possible Causes:**
- List continuation logic different
- Numbering restart not detected
- Format string interpretation differs

**Debug Steps:**
1. Check actual vs expected side-by-side
2. Identify pattern (all numbers off by X, or specific levels)
3. Review library's numbering calculation logic

### Issue: Indentation Wrong

**Possible Causes:**
- Indentation option not enabled
- Tab vs space differences
- Level calculation incorrect

**Debug Steps:**
1. Verify `enableIndentation: true` in converter options
2. Compare character-by-character (use diff tool)
3. Check if spaces vs tabs consistent

### Issue: Extra/Missing Lines

**Possible Causes:**
- Empty paragraph handling
- Line break normalization
- List separator paragraphs

**Debug Steps:**
1. Count lines in both outputs
2. Identify which lines missing/extra
3. Check if empty lines preserved

## Reporting Results

After testing each fixture, record:

```markdown
### Test: 01_simple-numbered

- **Accuracy**: 98.5%
- **Matched Lines**: 197/200
- **Processing Time**: 234ms
- **Status**: ✅ PASS
- **Notes**: Minor whitespace differences only

**Differences:**
- Line 45: Expected "3.", got "3. "
- Line 102: Missing trailing space
```

## Next Steps After Testing

1. **If GO**: Continue to Phase 2 (optimization and polish)
2. **If NO-GO**: Begin Approach 2 (Office.js) or Approach 3 (custom calculator)
3. **If Partial**: Debug and patch, then re-test

## Success Metrics

The MVP is considered successful if:

- ✅ 95%+ accuracy on 7 out of 9 test cases
- ✅ 90%+ overall average accuracy
- ✅ Performance targets met
- ✅ No critical bugs
- ✅ Clear path to integrate into RdLn

---

**Timeline**: Complete testing by end of Day 3 (Wednesday) for GO/NO-GO decision.
