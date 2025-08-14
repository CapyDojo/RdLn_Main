# Testing Instructions for Litera to DOCX Converter

## Quick Start

1. **Open the application**: Double-click `index.html` or open it in any modern web browser
2. **Test with example PDF**: Use `../TempFiles/Litera_markup.pdf` as a test file
3. **Convert**: Click "Convert to DOCX" and download the result

## Test File Location

The example Litera markup PDF is located at:
```
C:\temp\RdLn_MVP_Stream\TempFiles\Litera_markup.pdf
```

This file contains:
- Litera Compare for Word 11.7.0.54 output
- 36 total changes (19 additions, 13 deletions)
- Legal document markup with underlines and strikethroughs

## Expected Results

When processing the test file, you should see:
- ✅ Summary information extracted (tool version, filenames, change counts)
- ✅ PDF text parsed and styled markup detected
- ✅ DOCX file generated with native Word track changes
- ✅ Downloadable file: `Tender_NDA_MRPL_tracked_changes_YYYYMMDD_HHMM.docx`

## Validation Steps

After conversion, open the generated DOCX in Microsoft Word and verify:

1. **Track Changes are enabled** - You should see the review tab with track changes active
2. **Insertions show as underlined blue text** - These were underlined in the PDF
3. **Deletions show as strikethrough red text** - These were struck through in the PDF
4. **Unchanged text appears normal** - Regular text from the PDF
5. **You can accept/reject changes** - Use Word's review tools normally

## Browser Compatibility

Tested on:
- ✅ Chrome 90+
- ✅ Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+

## Troubleshooting

### Common Issues:

**"PDF.js library not found"**
- Check internet connection (CDN dependencies)
- Try refreshing the page

**"JSZip library not found"**
- Check internet connection (CDN dependencies)  
- Try refreshing the page

**"No text content found in PDF"**
- PDF may be image-based (scanned document)
- PDF may not be a Litera markup document
- Try a different PDF file

**"Conversion failed"**
- Check browser console for detailed error messages
- Ensure PDF is not password protected
- Verify file is not corrupted

### Debug Mode:

Open browser developer tools (F12) and check the Console tab for detailed logging during conversion.

## Performance Notes

- **File size limit**: 50MB maximum
- **Processing time**: ~1-5 seconds for typical legal documents
- **Memory usage**: Processed entirely in browser memory
- **Privacy**: No files uploaded to servers - 100% client-side processing

## Advanced Testing

### Test Different PDF Types:

1. **Simple markup**: Single page with few changes
2. **Complex markup**: Multi-page documents with many changes
3. **Mixed content**: Documents with tables, headers, footers
4. **Color variations**: Different highlight/markup colors

### Performance Testing:

1. **Large files**: Test with 20-50 page documents
2. **Many changes**: Documents with 100+ tracked changes
3. **Multiple conversions**: Process several files in sequence

### Integration Testing:

1. **Word compatibility**: Open in different Word versions (2016, 2019, 365)
2. **Cross-platform**: Test Word documents on Windows/Mac
3. **Review workflow**: Accept/reject changes and save

## Development Mode

For development, you can run a local server:

```bash
npm install
npm run dev
```

Then open http://localhost:8080 in your browser.

## Reporting Issues

If you encounter problems:

1. Check browser console for error messages
2. Note the specific PDF file that failed
3. Record browser version and operating system
4. Include any error messages displayed in the UI