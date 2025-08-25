## DOCX input - Future Feature Improvements - Options Paper

Date: 20250825 - Qwen3



Current Implementation

  Input Processing (DocxProcessor.ts)
  The current implementation uses mammoth.js with extractRawText() method:

- Only extracts the final text content after changes are applied

- Ignores track changes, comments, and revision information

- Focuses on clean text extraction without formatting details
  
  Output Generation (docxExport.ts)
  The application has a custom DOCX export functionality that:

- Creates new DOCX files with track changes from HTML diff content

- Uses jszip and xmlbuilder2 to generate proper Word track changes markup

- Supports insertions (<w:ins>) and deletions (<w:del>) with proper XML structure
  
  Available Options for Handling Track Changes
  
  1. Continue with Current Approach (Recommended)
     Pros:

- Simple and reliable text extraction

- Works well for comparing document content

- Lightweight processing

- No dependency on complex XML parsing
  
  Cons:

- Loses track change information from input files

- Only works one-way (export track changes, but can't import them)
  
  2. Modify Input Processing to Use Mammoth's Advanced Features
     Mammoth.js has some capabilities that could be leveraged:
  
  Option A: Use `mammoth.convertToHtml()` instead of `extractRawText()`
  
  1 // This could preserve some formatting information that might help identify changes
  2 const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
  
  Option B: Use Style Maps to Identify Track Changes
  
  1 // Custom style map to identify insertions/deletions
  2 const styleMap = [
  3   "s:Ins[style-name='Insertion']",
  4   "s:Del[style-name='Deletion']"
  5 ];
  6 const result = await mammoth.extractRawText({
  7   arrayBuffer: arrayBuffer,
  8   styleMap: styleMap
  9 });
  
  Pros:

- Might capture some track change information

- Still uses the existing mammoth.js library
  
  Cons:

- Limited support for track changes in mammoth.js

- Would require significant parsing of HTML output to reconstruct changes

- Not guaranteed to work reliably
  
  3. Replace Mammoth.js with a More Comprehensive DOCX Library
  
  Option A: Use `docxtemplater` with `docxtemplater/jszip`

- More comprehensive DOCX parsing capabilities

- Better access to document structure

- Can potentially access revision information
  
  Option B: Use `officeparser`

- Specifically designed for extracting content from Office documents

- May have better track change support
  
  Option C: Custom XML Parsing

- Directly parse the DOCX file structure (ZIP archive with XML parts)

- Access word/document.xml and word/revision.xml directly

- Full control over what information is extracted
  
  Pros:

- Full access to all document features

- Can preserve track changes information

- Can handle complex document structures
  
  Cons:

- Much more complex implementation

- Larger bundle size

- More maintenance overhead

- Requires deep understanding of DOCX format
  
  4. Hybrid Approach (Recommended Enhancement)
     Combine the current approach with selective enhancement:
1. Primary Processing: Continue using mammoth.js for reliable text extraction

2. Secondary Analysis: Add optional XML parsing for track change detection

3. User Choice: Allow users to choose between simple text extraction and full track change preservation
   
   1 // Enhanced DocxProcessor with track change awareness
   2 class EnhancedDocxProcessor {
   3   async extractText(docxFile: File, options: { preserveTrackChanges?: boolean } = {}) {
   4     if (options.preserveTrackChanges) {
   5       // Use XML parsing approach to preserve track changes
   6       return await this.extractWithTrackChanges(docxFile);
   7     } else {
   8       // Use current mammoth.js approach for simple text extraction
   9       return await this.extractRawText(docxFile);
   10     }
   11   }
   12
   13   private async extractWithTrackChanges(docxFile: File) {
   14     // Custom XML parsing to extract track changes
   15     // Implementation would parse the DOCX structure directly
   16   }
   17 }
   
   5. External Service Integration
      For the most robust solution:
   
   Option: Use a dedicated document processing service
- Microsoft Graph API (for Office documents)

- Google Docs API

- Specialized document processing services
  
  Pros:

- Most accurate track change handling

- Professional-grade processing

- Handles all edge cases
  
  Cons:

- Introduces external dependencies

- Potential privacy concerns

- Requires internet connectivity

- Adds cost/complexity
  
  Recommendation
  
  Based on the current implementation and requirements, I recommend:
1. Keep the current approach for general document processing as it's reliable and efficient

2. Add a specialized track change import feature using direct XML parsing for users who specifically need to
    preserve track changes

3. Enhance the UI to inform users when track changes are detected but not preserved

4. Provide clear documentation about the limitations of the current approach
   
   This would maintain the application's performance for general use while providing advanced functionality
   for users who specifically need track change preservation.
