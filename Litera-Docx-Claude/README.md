# Litera to DOCX Converter

A standalone web application that converts PDF Litera redlines to native Word DOCX files with track changes.

## Features

- **Client-side processing**: No server required, all processing happens in your browser
- **Native track changes**: Generates proper Word track changes, not just visual markup
- **Litera format support**: Specifically designed for Litera Compare for Word output PDFs
- **Standalone**: Independent component with minimal dependencies

## How it works

1. **PDF Analysis**: Uses PDF.js to parse Litera markup PDFs and extract text with formatting
2. **Redline Detection**: Identifies underlines (insertions) and strikethroughs (deletions) based on PDF graphics operations
3. **DOCX Generation**: Converts the parsed changes to proper Word track changes format
4. **Download**: Provides native DOCX file with embedded revision history

## Usage

1. Open `index.html` in a web browser
2. Select a Litera markup PDF file (e.g., output from "Litera Compare for Word")
3. Click "Convert to DOCX"
4. Download the generated Word document with native track changes

## Technical Architecture

- **PDF Parsing**: PDF.js for text extraction and graphics analysis
- **Change Detection**: Analyzes PDF operator lists to detect underlines and strikethroughs
- **DOCX Generation**: Creates valid Open XML with track changes markup
- **No Dependencies**: Pure client-side implementation using CDN resources

## File Structure

```
Litera-Docx-Claude/
├── index.html              # Main web app interface
├── src/
│   ├── LiteraDocxConverter.js    # Main conversion logic
│   ├── DocxExporter.js           # DOCX generation utilities
│   └── PdfAnalyzer.js            # PDF parsing and analysis
├── styles/
│   └── app.css                   # Application styling
├── package.json                  # Project metadata
└── README.md                     # This file
```

## Browser Compatibility

- Modern browsers with PDF.js support
- JavaScript ES6+ features required
- File API support for local file handling

## Development

```bash
npm install
npm run dev  # Starts local HTTP server on port 8080
```

Then open http://localhost:8080 in your browser.

## License

MIT License - Feel free to use and modify as needed.