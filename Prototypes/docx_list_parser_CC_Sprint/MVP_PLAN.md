# DOCX List Parser MVP - Implementation Plan

**Project**: RdLn DOCX Parsing with Faithful List Reproduction
**Sprint**: docx_list_parser_CC_Sprint
**Created**: 2025-10-16
**Status**: Planning Phase

---

## Executive Summary

**Goal**: Build a minimal viable prototype that can parse DOCX files and faithfully reproduce complex nested numbered and unnumbered lists, replicating MS Word's "copy-paste as plain text" behavior.

**Core Challenge**: DOCX list numbers are **not stored** in the XML—they are **calculated by Word at runtime**. Mammoth.js fails because it doesn't implement this calculation logic.

**Recommended Approach**: Test `@omer-go/docx-parser-converter-ts` library which claims to parse `numbering.xml` and calculate list numbers. If successful, integrate into RdLn. If not, implement custom list calculator or Office.js hybrid approach.

**Timeline**: 5-7 days for MVP demonstration

---

## Research Findings

### 1. Understanding DOCX List Structure

#### How DOCX Stores Lists
DOCX files are ZIP archives containing XML files. List numbering involves three key components:

1. **numbering.xml** - Contains abstract and concrete numbering definitions
   - `<w:abstractNum>` - Blueprint for up to 9 numbering levels
   - `<w:num>` - Concrete instances referencing abstract definitions
   - Defines format (decimal, roman, letter, bullet), alignment, indentation

2. **document.xml** - Contains paragraphs with numbering references
   - `<w:numPr>` - References both numbering ID (`numId`) and level (`ilvl`)
   - Does NOT contain the actual calculated number

3. **styles.xml** - Can define numbering styles

**Critical Insight**: *"The cell value when using a numbered list is not stored in the xml, but calculated by Word when the file is opened."*

#### List Calculation Requirements
To reproduce list numbers, we must:
- Parse `numId` and `ilvl` from document.xml paragraphs
- Look up formatting rules in numbering.xml
- Track list state (current counter per level)
- Handle list continuation vs restart
- Calculate based on format strings (e.g., "%1.%2.%3" for 1.2.3)
- Support various formats: decimal, roman, letter, bullet, custom

---

### 2. Why Mammoth.js Fails

Based on GitHub issue analysis:

**Problem 1: No Numbering Calculation**
- Mammoth.js doesn't calculate list numbers
- Only preserves HTML `<ol>`/`<ul>` structure
- AST nodes lack information to continue numbering

**Problem 2: List Continuation**
- Cannot distinguish between "continue previous list" vs "start new list"
- Lists separated by non-list content incorrectly split into multiple lists

**Problem 3: Nested Sublists**
- Nested list conversion to HTML is problematic
- Doesn't track multi-level numbering state

**Problem 4: Format Support**
- Limited support for complex numbering formats
- Legal outline formats (1.1.1.1) not handled properly

**Conclusion**: Mammoth.js is fundamentally limited—it was designed for HTML conversion, not faithful text extraction with calculated numbering.

---

### 3. How MS Word Does It

#### Copy-Paste Mechanism
When users "Select All → Copy → Paste as Plain Text" in Word:

1. **ConvertNumbersToText Command**
   - Word API: `ListFormat.ConvertNumbersToText`
   - VBA: `ActiveDocument.ConvertNumbersToText`
   - Clears automatic numbering and replaces with static text

2. **Paste Options**
   - "Keep Text Only" converts automatic numbering to static characters
   - Preserves visible numbers while removing formatting properties

3. **Save As Plain Text**
   - Automatically includes calculated numbering in .txt output

**Key Takeaway**: Word **calculates** the numbers on-the-fly, then "flattens" them to text. We need to replicate this calculation.

---

### 4. Alternative Parsing Libraries

#### **@omer-go/docx-parser-converter-ts** ⭐ RECOMMENDED
- **Status**: v0.0.1 (early but promising)
- **Capabilities**:
  - Parses numbering.xml and calculates list numbers
  - Handles different levels of nested lists
  - Outputs HTML and plain text
  - Preserves indentation
- **Limitations**:
  - Browser-focused (but Node.js compatible)
  - Early version may have edge case bugs
  - No extensive documentation yet
- **GitHub**: https://github.com/omer-go/docx-parser-converter

#### **Office.js Word API**
- **How it works**:
  - Runs as Word Add-in (desktop/online)
  - Uses `paragraph.listItem.listString` to get calculated numbers
  - Word's own engine handles calculation
- **Pros**:
  - 100% accuracy (Word does the work)
  - Supports all list types/formats
- **Cons**:
  - Requires Word to be running
  - Different UX (add-in vs standalone)
  - Deployment complexity

#### **docx4js**
- JavaScript DOCX parser
- Traverses content without keeping structure
- Visitor pattern for processing
- No explicit list numbering calculation

#### **pizzip + Custom Parser**
- PizZip extracts ZIP contents
- Parse XML with DOMParser
- **Must implement** list calculation logic manually

#### **PowerTools ListItemRetriever** (C#)
- Microsoft's official list calculation module
- Accurately retrieves paragraph text with numbering
- **Could be ported to JavaScript** (long-term project)
- Author Eric White designed Open-XML-SDK-for-JavaScript with porting in mind

---

## Three Strategic Approaches

### **Approach 1: @omer-go/docx-parser-converter-ts** ⭐
**Effort**: Low | **Confidence**: Medium-High | **Timeline**: 2-3 days

#### Why This is the MVP Winner
- Claims to parse numbering.xml and calculate list numbers
- Explicitly handles nested list levels
- Pure JavaScript (no external dependencies)
- Preserves indentation and structure
- TypeScript support

#### Implementation Steps
1. Install package: `npm install @omer-go/docx-parser-converter-ts`
2. Create test suite with 9 complex DOCX fixtures
3. Extract text and validate numbering accuracy
4. Measure performance with large documents
5. If ≥95% accurate, integrate into RdLn
6. If bugs found, fork and patch library

#### Risk Mitigation
- Package is v0.0.1 (early stage)
- Limited documentation
- May fail on edge cases (legal outlines, custom formats)
- **Mitigation**: Comprehensive testing will reveal limitations quickly

#### Code Structure
```typescript
import { DocxToTxtConverter } from '@omer-go/docx-parser-converter-ts';

class DocxListExtractor {
  async extractWithNumbering(file: File): Promise<string> {
    const converter = new DocxToTxtConverter(file);
    const text = await converter.convert({ enableIndentation: true });
    return text;
  }
}
```

---

### **Approach 2: Office.js Word Add-in** (Hybrid Option)
**Effort**: Medium | **Confidence**: High | **Timeline**: 5-7 days

#### How It Works
1. User opens DOCX in Word (desktop/online)
2. RdLn runs as Office Add-in in task pane
3. JavaScript API extracts paragraphs
4. For each paragraph: `paragraph.listItem.listString` returns calculated number
5. Word's own engine does calculation (100% accuracy)

#### API Code Example
```javascript
Word.run(function (context) {
  var paragraphs = context.document.body.paragraphs.load("items");
  var textWithNumbers = [];

  return context.sync()
    .then(function () {
      for (var i = 0; i < paragraphs.items.length; i++) {
        var para = paragraphs.items[i];
        if (para.isListItem) {
          para.listItem.load(['level', 'listString']);
        }
      }
    })
    .then(context.sync)
    .then(function () {
      for (var i = 0; i < paragraphs.items.length; i++) {
        var para = paragraphs.items[i];
        if (para.isListItem) {
          var number = para.listItem.listString; // "1." or "a)" etc.
          textWithNumbers.push(number + " " + para.text);
        } else {
          textWithNumbers.push(para.text);
        }
      }
      return textWithNumbers.join('\n');
    })
});
```

#### Advantages
- Word calculates numbers perfectly
- Supports all numbering formats (roman, letter, custom)
- No custom calculation logic needed
- Leverages existing Word infrastructure

#### Limitations
- Requires Word to be running (not standalone)
- Different UX (add-in vs web app)
- Office Add-in deployment (manifest.xml, AppSource or sideload)
- May not fit RdLn's "fully client-side" value prop

#### Best For
- Enterprise users with Office 365
- Hybrid deployment model
- High accuracy requirements

---

### **Approach 3: Custom List Calculator** (Long-term Solution)
**Effort**: High | **Confidence**: High | **Timeline**: 10-14 days

#### Implementation Strategy
Port PowerTools ListItemRetriever C# logic to JavaScript:

1. **Extract XML Files**
   ```typescript
   import PizZip from 'pizzip';
   const zip = new PizZip(docxBuffer);
   const documentXml = zip.file('word/document.xml').asText();
   const numberingXml = zip.file('word/numbering.xml').asText();
   ```

2. **Parse Numbering Definitions**
   ```typescript
   class NumberingParser {
     parseAbstractNums(xml: string): Map<string, AbstractNum> {
       // Parse <w:abstractNum> elements
       // Extract levels, formats, start values
     }

     parseNums(xml: string): Map<string, Num> {
       // Parse <w:num> elements
       // Link to abstract definitions
       // Handle overrides
     }
   }
   ```

3. **Track List State**
   ```typescript
   class ListStateTracker {
     private counters: Map<string, number[]> = new Map();

     getNumber(numId: string, level: number): number {
       // Track current count per list per level
       // Handle restart vs continuation
     }

     formatNumber(num: number, format: NumberFormat): string {
       // decimal: "1", "2", "3"
       // upperRoman: "I", "II", "III"
       // lowerLetter: "a", "b", "c"
       // custom: apply format string "%1.%2.%3"
     }
   }
   ```

4. **Calculate List Numbers**
   ```typescript
   class ListItemRetriever {
     getListString(numId: string, level: number): string {
       const numDef = this.numbering.getNums().get(numId);
       const abstractNum = this.numbering.getAbstractNums().get(numDef.abstractNumId);
       const levelDef = abstractNum.levels[level];

       const currentNum = this.stateTracker.getNumber(numId, level);
       const formatted = this.stateTracker.formatNumber(currentNum, levelDef.format);

       // Apply level format string
       return this.applyFormatString(levelDef.formatString, level, formatted);
     }
   }
   ```

#### Complexity Areas
- **Roman Numerals**: Conversion to/from decimal (I, IV, IX, XL, etc.)
- **Letter Sequences**: Handling a-z, then aa, ab, etc.
- **Multi-level Formatting**: Format strings like "%1.%2.%3" (1.2.3)
- **List Continuation**: Detecting restart vs continuation
- **Overrides**: Num definitions can override abstract num properties
- **Custom Formats**: Text prefix/suffix (e.g., "Article %1 -")

#### Advantages
- Complete control over calculation logic
- No external dependencies on proprietary engines
- Can handle any DOCX structure
- Fully client-side

#### Implementation Phases
**Phase 1** (Days 1-3): Simple decimal lists
**Phase 2** (Days 4-6): Nested multi-level (1.1.1)
**Phase 3** (Days 7-9): Roman numerals and letters
**Phase 4** (Days 10-12): Custom formats and overrides
**Phase 5** (Days 13-14): Edge cases and optimization

---

## Recommended MVP Architecture

### Phase 1: Quick Win with @omer-go (Week 1)

#### Directory Structure
```
/prototypes/docx_list_parser_CC_Sprint/
├── MVP_PLAN.md                    # This file
├── PROGRESS.md                    # Sprint progress tracking
├── README.md                      # Quick start guide
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html                     # Standalone demo page
├── src/
│   ├── core/
│   │   ├── DocxListExtractor.ts   # Wrapper around @omer-go
│   │   ├── ListValidator.ts       # Compare output vs expected
│   │   └── types.ts               # TypeScript definitions
│   ├── ui/
│   │   ├── DemoApp.tsx            # React demo interface
│   │   ├── FileUpload.tsx
│   │   ├── TextPreview.tsx
│   │   └── AccuracyReport.tsx
│   └── utils/
│       ├── docxHelpers.ts
│       └── textComparison.ts
├── tests/
│   ├── fixtures/                  # Test DOCX files
│   │   ├── 01_simple-numbered.docx
│   │   ├── 02_nested-3-levels.docx
│   │   ├── 03_mixed-bullets-numbers.docx
│   │   ├── 04_roman-numerals.docx
│   │   ├── 05_letter-sequence.docx
│   │   ├── 06_legal-outline.docx
│   │   ├── 07_list-continuation.docx
│   │   ├── 08_restart-numbering.docx
│   │   └── 09_custom-format.docx
│   ├── expected/                  # Expected output (Word's own)
│   │   ├── 01_simple-numbered.txt
│   │   └── ... (corresponding .txt files)
│   ├── integration.test.ts
│   ├── accuracy.test.ts
│   └── performance.test.ts
└── docs/
    ├── RESEARCH.md                # Detailed research findings
    ├── API.md                     # API documentation
    └── TROUBLESHOOTING.md
```

#### Success Criteria
- ✅ Extract text with **≥95% accurate list numbering**
- ✅ Handle **3+ nesting levels**
- ✅ Preserve list continuation across non-list paragraphs
- ✅ Process typical documents in **<2 seconds**
- ✅ Pass all 9 test fixtures

---

### Phase 2: Fallback Strategy (Week 2)

If @omer-go library fails critical tests:

#### **Option A: Fork and Patch**
- Clone https://github.com/omer-go/docx-parser-converter
- Debug specific numbering calculation issues
- Submit PRs to upstream
- Use patched fork in RdLn

#### **Option B: Hybrid Office.js**
- Detect if Word is available (browser agent, user selection)
- If Word available: Use Office.js extraction
- If standalone: Fall back to @omer-go or custom

#### **Option C: Begin Custom Calculator**
- Start with **Phase 1: Simple decimal lists only**
- Expand incrementally based on user needs
- Use learnings from @omer-go code inspection

---

### Phase 3: RdLn Integration (Week 3)

Once list extraction is proven reliable:

#### New Components
```typescript
// src/components/DocxUploadPanel.tsx
interface DocxUploadPanelProps {
  onDocxLoaded: (text: string, metadata: DocxMetadata) => void;
  side: 'left' | 'right';
}

// src/components/DocxPreviewPanel.tsx
// Shows extracted text before comparison
// User can verify list numbering is correct

// src/components/ListFormatToggle.tsx
// Option to preserve vs flatten numbering
```

#### Integration Steps
1. Add DOCX file type to `ComparisonInterface.tsx`
2. Create `DocxInputPanel` alongside text/OCR inputs
3. Extract text using `DocxListExtractor`
4. Feed to existing Myers Algorithm
5. Display in `RedlineOutput.tsx`

#### Comparison Modes
- **DOCX vs DOCX**: Both sides extracted with numbering
- **DOCX vs Plain Text**: DOCX extracted, text as-is
- **DOCX vs OCR**: DOCX extracted, image OCR'd

---

## Test Strategy

### Critical Test Cases

#### 1. Simple Numbered List
```
1. First item
2. Second item
3. Third item
```

#### 2. Nested 3 Levels
```
1. Level 1
   1.1. Level 2
        1.1.1. Level 3
        1.1.2. Level 3
   1.2. Level 2
2. Level 1
```

#### 3. Mixed Bullets and Numbers
```
1. Numbered item
   • Bullet sub-item
   • Bullet sub-item
2. Numbered item
```

#### 4. Roman Numerals
```
I. First
II. Second
III. Third
IV. Fourth
```

#### 5. Letter Sequence
```
a) First
b) Second
c) Third
```

#### 6. Legal Outline Format
```
1.1. Section
1.1.1. Subsection
1.1.1.1. Sub-subsection
1.2. Section
```

#### 7. List Continuation
```
1. First item
2. Second item

Intervening paragraph

3. Third item (continues list)
```

#### 8. Restart Numbering
```
1. First list item
2. Second list item

1. New list starts (restart)
2. Second item
```

#### 9. Custom Number Format
```
Article 1 - First
Article 2 - Second
Article 3 - Third
```

---

### Validation Methodology

#### Ground Truth Generation
For each test case:
1. Create DOCX in Microsoft Word
2. Select All (Ctrl+A)
3. Copy (Ctrl+C)
4. Open Notepad
5. Paste (Ctrl+V)
6. Save as `expected/XX_test-name.txt`

**Rationale**: Word's own flattening is the gold standard.

#### Accuracy Measurement
```typescript
interface AccuracyMetrics {
  testCase: string;
  expectedLines: string[];
  actualLines: string[];
  matchedLines: number;
  totalLines: number;
  accuracy: number; // percentage
  differences: Diff[];
}

function calculateAccuracy(expected: string, actual: string): AccuracyMetrics {
  // Line-by-line comparison
  // Character-level diff for mismatches
  // Calculate percentage accuracy
}
```

#### Performance Benchmarks
- **Small doc** (5 pages, 50 list items): <500ms
- **Medium doc** (20 pages, 200 list items): <1.5s
- **Large doc** (100 pages, 1000 list items): <5s

---

## Deliverables

### 1. Standalone MVP Demo
**Path**: `/prototypes/docx_list_parser_CC_Sprint/`

**Features**:
- Drag-and-drop DOCX upload
- Display extracted text with preserved numbering
- Side-by-side comparison with original
- Accuracy report with percentage
- Export extracted text

**Tech Stack**:
- React + TypeScript
- Vite for bundling
- @omer-go/docx-parser-converter-ts
- Vitest for testing

### 2. Comprehensive Test Suite
**Deliverables**:
- 9 DOCX test fixtures
- 9 expected output .txt files (Word-generated)
- Automated accuracy validation
- Performance benchmarks
- CI/CD integration ready

### 3. Technical Report
**Sections**:
- What works (supported list types)
- What doesn't work (known limitations)
- Accuracy metrics per list type
- Performance characteristics
- Recommendation for production
- Risk assessment

**Format**: Markdown with charts/tables

### 4. RdLn Integration Prototype
**Conditional**: Only if Phase 1 achieves ≥95% accuracy

**Features**:
- DOCX upload in `ComparisonInterface`
- DOCX vs DOCX comparison
- DOCX vs plain text comparison
- Preview extracted text before comparison
- Option to preserve vs flatten numbering

---

## Risk Assessment

### High Risks

#### Risk 1: @omer-go Library Insufficient
**Probability**: Medium | **Impact**: High

**Mitigation**:
- Comprehensive testing in Phase 1 (Days 1-3)
- Early go/no-go decision (Day 3)
- Fallback to Approach 2 or 3
- Time buffer in sprint

#### Risk 2: Edge Cases Not Handled
**Probability**: High | **Impact**: Medium

**Examples**:
- Custom numbering formats
- Multilevel legal outlines (1.1.1.1.1)
- List restarts with specific numbers
- Complex format strings

**Mitigation**:
- MVP focuses on common cases (cover 80% use cases)
- Document limitations clearly
- Incremental improvement post-MVP

#### Risk 3: Performance Issues with Large Documents
**Probability**: Low | **Impact**: Medium

**Mitigation**:
- Performance benchmarks in test suite
- Chunked processing if needed
- Web Worker for heavy parsing

### Medium Risks

#### Risk 4: Browser Compatibility
**Probability**: Low | **Impact**: Low

**@omer-go is browser-focused, may have issues in Node.js**

**Mitigation**:
- Test in both browser and Node.js
- Use browser build if Node.js fails
- Consider Electron for desktop builds

#### Risk 5: Library Maintenance
**Probability**: Medium | **Impact**: Medium

**Package is v0.0.1, uncertain maintenance**

**Mitigation**:
- Fork early if issues found
- Contribute fixes upstream
- Prepare to maintain fork long-term

---

## Timeline and Milestones

### Week 1: MVP Development

#### Day 1 (Monday)
- [x] Research DOCX structure
- [x] Research why mammoth.js fails
- [x] Research alternative libraries
- [x] Create MVP plan
- [ ] Set up prototype directory
- [ ] Install dependencies

#### Day 2 (Tuesday)
- [ ] Create 9 test DOCX fixtures in Word
- [ ] Generate expected outputs (Word copy-paste)
- [ ] Build DocxListExtractor wrapper
- [ ] Build basic demo UI

#### Day 3 (Wednesday)
- [ ] Run all 9 test cases
- [ ] Calculate accuracy metrics
- [ ] **GO/NO-GO DECISION**
- [ ] If GO: Optimize and refine
- [ ] If NO-GO: Pivot to Approach 2 or 3

#### Day 4 (Thursday)
- [ ] Performance benchmarks
- [ ] Edge case testing
- [ ] Bug fixes
- [ ] Documentation

#### Day 5 (Friday)
- [ ] Finalize demo application
- [ ] Write technical report
- [ ] Record demo video
- [ ] Present to stakeholders

---

### Week 2: Iteration (If Needed)

#### Scenario A: @omer-go Success (≥95% accuracy)
- [ ] Polish demo UI
- [ ] Add advanced features
- [ ] Begin RdLn integration planning

#### Scenario B: @omer-go Partial Success (80-94% accuracy)
- [ ] Debug specific failures
- [ ] Fork and patch library
- [ ] Re-test with fixes

#### Scenario C: @omer-go Failure (<80% accuracy)
- [ ] Pivot to Office.js hybrid approach
- [ ] OR Begin custom calculator (Phase 1: Decimal only)

---

### Week 3: RdLn Integration (Optional)

Only proceed if Phase 1 successful:

- [ ] Design DOCX input UI
- [ ] Integrate DocxListExtractor into RdLn
- [ ] Create DocxUploadPanel component
- [ ] Add DOCX vs DOCX comparison mode
- [ ] Test with real documents
- [ ] User acceptance testing

---

## Progress Tracking

### Sprint Status: 🟡 Planning

**Current Phase**: Phase 0 - Research and Planning
**Next Phase**: Phase 1 - MVP Development
**Target Completion**: 2025-10-23

### Task Checklist

#### Research Phase ✅ COMPLETE
- [x] Understand DOCX list structure (numbering.xml, document.xml)
- [x] Identify why mammoth.js fails
- [x] Research MS Word's copy-paste mechanism
- [x] Survey alternative libraries
- [x] Evaluate Office.js Word API
- [x] Design three strategic approaches
- [x] Create comprehensive MVP plan

#### Setup Phase ⏳ IN PROGRESS
- [x] Create prototype directory structure
- [ ] Initialize npm project
- [ ] Install dependencies (@omer-go, React, Vite, Vitest)
- [ ] Set up TypeScript configuration
- [ ] Set up Vite build
- [ ] Create basic project structure

#### Test Fixture Phase 🔜 UPCOMING
- [ ] Generate 01: Simple numbered list
- [ ] Generate 02: Nested 3 levels
- [ ] Generate 03: Mixed bullets/numbers
- [ ] Generate 04: Roman numerals
- [ ] Generate 05: Letter sequence
- [ ] Generate 06: Legal outline format
- [ ] Generate 07: List continuation
- [ ] Generate 08: Restart numbering
- [ ] Generate 09: Custom format
- [ ] Generate expected outputs (Word copy-paste to .txt)

#### Implementation Phase 🔜 UPCOMING
- [ ] Build DocxListExtractor class
- [ ] Build ListValidator class
- [ ] Create demo UI (FileUpload, TextPreview, AccuracyReport)
- [ ] Implement accuracy calculation
- [ ] Add performance monitoring

#### Testing Phase 🔜 UPCOMING
- [ ] Run test 01: Simple numbered (target: 100%)
- [ ] Run test 02: Nested 3 levels (target: 95%)
- [ ] Run test 03: Mixed bullets/numbers (target: 95%)
- [ ] Run test 04: Roman numerals (target: 90%)
- [ ] Run test 05: Letter sequence (target: 90%)
- [ ] Run test 06: Legal outline (target: 85%)
- [ ] Run test 07: List continuation (target: 90%)
- [ ] Run test 08: Restart numbering (target: 85%)
- [ ] Run test 09: Custom format (target: 80%)
- [ ] Calculate overall accuracy
- [ ] Performance benchmarks (small/medium/large)

#### Decision Point: GO/NO-GO ⚠️ CRITICAL
**Target Date**: Day 3 (Wednesday)
**Criteria**: Overall accuracy ≥95%

- [ ] Review test results
- [ ] Assess accuracy metrics
- [ ] Evaluate performance
- [ ] Identify limitations
- [ ] **DECISION**: Proceed with @omer-go / Pivot to Approach 2 / Pivot to Approach 3

#### Documentation Phase 🔜 UPCOMING
- [ ] Write technical report
- [ ] Document API usage
- [ ] Create troubleshooting guide
- [ ] Write README with quick start
- [ ] Record demo video
- [ ] Prepare stakeholder presentation

#### RdLn Integration Phase 🔜 OPTIONAL
**Conditional**: Only if GO decision made

- [ ] Design DOCX input UI
- [ ] Create DocxUploadPanel component
- [ ] Create DocxPreviewPanel component
- [ ] Integrate into ComparisonInterface
- [ ] Add DOCX file type support
- [ ] Implement DOCX vs DOCX mode
- [ ] Implement DOCX vs Text mode
- [ ] Test integration
- [ ] User acceptance testing

---

## Success Metrics

### MVP Success Criteria
- [ ] **Accuracy**: ≥95% across all test cases
- [ ] **Performance**: <2s for typical documents
- [ ] **Coverage**: Handle 9/9 common list types
- [ ] **Integration**: Proof-of-concept in RdLn working
- [ ] **Documentation**: Complete technical report

### Stretch Goals
- [ ] **Accuracy**: 98%+ on common cases (1-6)
- [ ] **Performance**: <1s for typical documents
- [ ] **Edge Cases**: Handle custom formats and overrides
- [ ] **UI/UX**: Polished demo with preview and export
- [ ] **Testing**: CI/CD pipeline with automated validation

---

## Next Steps

### Immediate Actions (Post-Approval)
1. Initialize npm project in prototype directory
2. Install dependencies
3. Set up TypeScript + Vite
4. Create basic project structure
5. Generate test fixtures in MS Word

### First Code to Write
```typescript
// src/core/DocxListExtractor.ts
import { DocxToTxtConverter } from '@omer-go/docx-parser-converter-ts';

export class DocxListExtractor {
  async extractText(file: File): Promise<string> {
    try {
      const converter = new DocxToTxtConverter(file);
      const text = await converter.convert({
        enableIndentation: true
      });
      return text;
    } catch (error) {
      throw new Error(`DOCX extraction failed: ${error.message}`);
    }
  }
}
```

### First Test to Run
```typescript
// tests/integration.test.ts
import { DocxListExtractor } from '../src/core/DocxListExtractor';
import { readFileSync } from 'fs';

describe('DocxListExtractor', () => {
  it('should extract simple numbered list correctly', async () => {
    const docxBuffer = readFileSync('./tests/fixtures/01_simple-numbered.docx');
    const expectedText = readFileSync('./tests/expected/01_simple-numbered.txt', 'utf-8');

    const extractor = new DocxListExtractor();
    const actualText = await extractor.extractText(new File([docxBuffer], 'test.docx'));

    expect(actualText.trim()).toBe(expectedText.trim());
  });
});
```

---

## Resources and References

### Libraries
- **@omer-go/docx-parser-converter-ts**: https://www.npmjs.com/package/@omer-go/docx-parser-converter-ts
- **GitHub Repo**: https://github.com/omer-go/docx-parser-converter
- **Office.js Word API**: https://learn.microsoft.com/en-us/javascript/api/word
- **PizZip**: https://www.npmjs.com/package/pizzip
- **Mammoth.js**: https://github.com/mwilliamson/mammoth.js (reference for what NOT to do)

### Documentation
- **Office Open XML Numbering**: http://officeopenxml.com/WPnumbering.php
- **DOCX Anatomy**: http://officeopenxml.com/anatomyofOOXML.php
- **MS-DOCX Spec**: https://learn.microsoft.com/en-us/openspecs/office_standards/ms-docx
- **Eric White's Blog**: http://www.ericwhite.com/blog/ (PowerTools for Open XML)

### Related Issues
- **mammoth.js #267**: Retain numbering id in list paragraphs
- **mammoth.js #74**: Numbered sublist converted to HTML strangely
- **mammoth.js #121**: Single list incorrectly being split into multiple lists

---

## Appendix

### A. DOCX Structure Example

#### numbering.xml
```xml
<w:numbering>
  <w:abstractNum w:abstractNumId="1">
    <w:lvl w:ilvl="0">
      <w:start w:val="1"/>
      <w:numFmt w:val="decimal"/>
      <w:lvlText w:val="%1."/>
      <w:lvlJc w:val="left"/>
    </w:lvl>
    <w:lvl w:ilvl="1">
      <w:start w:val="1"/>
      <w:numFmt w:val="decimal"/>
      <w:lvlText w:val="%1.%2."/>
      <w:lvlJc w:val="left"/>
    </w:lvl>
  </w:abstractNum>

  <w:num w:numId="2">
    <w:abstractNumId w:val="1"/>
  </w:num>
</w:numbering>
```

#### document.xml
```xml
<w:p>
  <w:pPr>
    <w:numPr>
      <w:ilvl w:val="0"/>
      <w:numId w:val="2"/>
    </w:numPr>
  </w:pPr>
  <w:r>
    <w:t>First item</w:t>
  </w:r>
</w:p>
```

**Note**: The actual number "1." does NOT appear in XML—it's calculated from the numbering definition.

---

### B. Number Format Types

| Format Code | Description | Example |
|-------------|-------------|---------|
| decimal | Arabic numerals | 1, 2, 3 |
| upperRoman | Uppercase Roman | I, II, III |
| lowerRoman | Lowercase Roman | i, ii, iii |
| upperLetter | Uppercase letters | A, B, C |
| lowerLetter | Lowercase letters | a, b, c |
| ordinal | Ordinal numbers | 1st, 2nd, 3rd |
| cardinalText | Cardinal text | One, Two, Three |
| ordinalText | Ordinal text | First, Second, Third |
| bullet | Bullet character | •, ◦, ▪ |

---

### C. Format String Examples

- `"%1."` → "1.", "2.", "3."
- `"%1.%2."` → "1.1.", "1.2.", "2.1."
- `"%1.%2.%3."` → "1.1.1.", "1.1.2.", "1.2.1."
- `"Article %1 -"` → "Article 1 -", "Article 2 -"
- `"(%1)"` → "(1)", "(2)", "(3)"
- `"Chapter %1:"` → "Chapter 1:", "Chapter 2:"

---

## Document Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-16 | Claude Code | Initial MVP plan created |

---

**End of MVP Plan**
