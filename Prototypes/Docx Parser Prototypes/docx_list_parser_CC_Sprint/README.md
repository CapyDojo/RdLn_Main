# DOCX List Parser MVP

**Version 1.1.0** - Now with pre-processing for corporate documents!

A minimal viable prototype for parsing DOCX files with faithful list numbering reproduction, replicating MS Word's "copy-paste as plain text" behavior.

## 🆕 What's New in v1.1.0

- ✅ **Automatic sanitization** of negative indentation values
- ✅ **Blackstone-Micron NDA** document now parses successfully
- ✅ **Corporate documents with tables** work correctly
- ✅ **Enhanced warnings** explain document quirks clearly

See [VERSION_1.1_SUMMARY.md](VERSION_1.1_SUMMARY.md) for complete details.

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Project Structure

```
├── src/
│   ├── core/
│   │   ├── types.ts                 # TypeScript type definitions
│   │   ├── DocxListExtractor.ts     # Main extraction logic
│   │   └── ListValidator.ts         # Accuracy validation
│   ├── ui/
│   │   ├── DemoApp.tsx              # Main application component
│   │   ├── FileUpload.tsx           # File upload with drag-and-drop
│   │   ├── TextPreview.tsx          # Text display with line numbers
│   │   ├── AccuracyReport.tsx       # Accuracy metrics display
│   │   └── DemoApp.css              # Application styles
│   └── main.tsx                     # Application entry point
├── tests/
│   ├── fixtures/                    # Test DOCX files
│   └── expected/                    # Expected output files
├── docs/                            # Documentation
├── index.html                       # HTML template
├── vite.config.ts                   # Vite configuration
├── tsconfig.json                    # TypeScript configuration
└── package.json                     # Project dependencies

```

## How to Use

1. **Upload a DOCX file** with numbered or bulleted lists
2. **Optionally upload expected output** (generated from Word's copy-paste) for validation
3. **View extracted text** and accuracy metrics

## Test Cases

The MVP targets these common list types:

1. ✓ Simple numbered lists (1, 2, 3)
2. ✓ Nested 3 levels (1.1, 1.2, 1.2.1)
3. ✓ Mixed bullets and numbers
4. ✓ Roman numerals (I, II, III)
5. ✓ Letter sequences (a, b, c)
6. ✓ Legal outline format (1.1.1.1)
7. ✓ List continuation across breaks
8. ✓ Restart numbering
9. ✓ Custom number formats

## Generating Test Fixtures

To create expected output files:

1. Open DOCX in Microsoft Word
2. Press `Ctrl+A` (Select All)
3. Press `Ctrl+C` (Copy)
4. Open Notepad
5. Press `Ctrl+V` (Paste)
6. Save as `.txt` file in `tests/expected/`

This captures Word's own list flattening behavior as ground truth.

## Success Criteria

- **Target Accuracy**: ≥95% across all test cases
- **Performance**: <2 seconds for typical documents
- **Coverage**: Handle all 9 common list types

## Technologies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **@omer-go/docx-parser-converter-ts** - DOCX parsing library
- **Vitest** - Testing framework

## Development

### Available Scripts

- `npm run dev` - Start development server on port 5174
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:coverage` - Run with coverage

### Port Configuration

Development server runs on port **5174** to avoid conflicts with the main RdLn application (port 5173).

## Next Steps

See [MVP_PLAN.md](MVP_PLAN.md) for:
- Detailed implementation strategy
- Three alternative approaches
- Complete timeline and milestones
- Risk assessment
- RdLn integration plan

## Version 1.1.0 Documentation

### Implementation Guides
- **[VERSION_1.1_SUMMARY.md](VERSION_1.1_SUMMARY.md)** - Quick overview and testing guide
- **[NEGATIVE_INDENT_FIX.md](NEGATIVE_INDENT_FIX.md)** - Technical implementation details
- **[BLACKSTONE_MICRON_ANALYSIS.md](BLACKSTONE_MICRON_ANALYSIS.md)** - Root cause investigation
- **[CHANGELOG.md](CHANGELOG.md)** - Complete version history

### Testing Tools
- **diagnose-docx.js** - Quick DOCX structure diagnostic
- **diagnose-detailed.js** - Deep numbering and indent analysis
- **test-blackstone.js** - Automated test for Blackstone-Micron document

### Testing the Fix

```bash
# Interactive demo
npm run dev
# Upload: input files/Blackstone - Micron (NDA) - FN.docx

# Command-line diagnostic
node diagnose-detailed.js "input files/Blackstone - Micron (NDA) - FN.docx"

# Automated test
node test-blackstone.js
```

## License

ISC
