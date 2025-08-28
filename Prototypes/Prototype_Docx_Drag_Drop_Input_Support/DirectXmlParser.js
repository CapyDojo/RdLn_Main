// Direct XML Parsing Implementation for DOCX Files
// This is a complete implementation without using Mammoth

class DocxXmlParser {
  /**
   * Extract text from DOCX file with proper list formatting
   */
  static async extractWithProperLists(file) {
    const startTime = Date.now();
    
    try {
      // Check if this is actually a DOCX file
      if (!file.type.includes('wordprocessingml') && !file.name.toLowerCase().endsWith('.docx')) {
        throw new Error('File is not a DOCX file');
      }
      
      // Import JSZip dynamically
      const JSZip = (await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js')).default;
      
      // Convert file to array buffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Parse the DOCX file as a ZIP archive
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(arrayBuffer);
      
      // Extract key XML files
      const documentXml = await zipContent.file('word/document.xml')?.async('string');
      if (!documentXml) {
        throw new Error('Invalid DOCX file: Could not find document.xml');
      }
      
      // Try to extract numbering.xml (may not exist in all documents)
      let numberingXml = null;
      try {
        numberingXml = await zipContent.file('word/numbering.xml')?.async('string');
      } catch (e) {
        console.log('No numbering.xml found in document');
      }
      
      // Try to extract styles.xml
      let stylesXml = null;
      try {
        stylesXml = await zipContent.file('word/styles.xml')?.async('string');
      } catch (e) {
        console.log('No styles.xml found in document');
      }
      
      // Parse XML
      const parser = new DOMParser();
      const doc = parser.parseFromString(documentXml, 'application/xml');
      
      // Check for parsing errors
      if (doc.querySelector('parsererror')) {
        throw new Error('Failed to parse document.xml');
      }
      
      // Parse numbering definitions if available
      let numberingDefs = {};
      if (numberingXml) {
        const numbering = parser.parseFromString(numberingXml, 'application/xml');
        numberingDefs = this.extractNumberingDefinitions(numbering);
      }
      
      // Extract text with proper formatting
      const text = this.extractFormattedText(doc, numberingDefs);
      
      const processingTime = Date.now() - startTime;
      
      return {
        content: text,
        hasLists: Object.keys(numberingDefs).length > 0,
        processingTime: processingTime
      };
      
    } catch (error) {
      console.error('Error extracting DOCX content:', error);
      throw error;
    }
  }
  
  /**
   * Extract numbering definitions from numbering.xml
   */
  static extractNumberingDefinitions(numberingXml) {
    const defs = {};
    
    try {
      // Parse abstract numbering definitions
      const abstractNums = numberingXml.querySelectorAll('w\\:abstractNum');
      abstractNums.forEach(abstractNum => {
        const abstractNumId = abstractNum.getAttribute('w:abstractNumId');
        const levels = {};
        
        // Get numbering levels and formats
        const lvlElements = abstractNum.querySelectorAll('w\\:lvl');
        lvlElements.forEach(lvl => {
          const ilvl = lvl.getAttribute('w:ilvl');
          const numFmt = lvl.querySelector('w\\:numFmt')?.getAttribute('w:val');
          const lvlText = lvl.querySelector('w\\:lvlText')?.getAttribute('w:val');
          const start = lvl.querySelector('w\\:start')?.getAttribute('w:val') || '1';
          
          levels[ilvl] = {
            format: numFmt, // decimal, lowerLetter, upperRoman, etc.
            text: lvlText,   // Pattern like "%1.", "(%1)", etc.
            start: start     // Starting number
          };
        });
        
        defs[abstractNumId] = levels;
      });
      
      // Map concrete numbering to abstract numbering
      const numElements = numberingXml.querySelectorAll('w\\:num');
      numElements.forEach(num => {
        const numId = num.getAttribute('w:numId');
        const abstractNumId = num.querySelector('w\\:abstractNumId')?.getAttribute('w:val');
        if (abstractNumId && defs[abstractNumId]) {
          defs[numId] = defs[abstractNumId];
        }
      });
    } catch (error) {
      console.error('Error parsing numbering definitions:', error);
    }
    
    return defs;
  }
  
  /**
   * Extract formatted text with proper list handling
   */
  static extractFormattedText(documentXml, numberingDefs) {
    let result = '';
    let listState = {}; // Track current list counters
    
    try {
      // Process paragraphs
      const paragraphs = documentXml.querySelectorAll('w\\:p');
      paragraphs.forEach((paragraph, index) => {
        if (index > 0) result += '\n';
        
        // Check for numbering
        const numPr = paragraph.querySelector('w\\:numPr');
        if (numPr) {
          const numId = numPr.querySelector('w\\:numId')?.getAttribute('w:val');
          const ilvl = numPr.querySelector('w\\:ilvl')?.getAttribute('w:val');
          
          if (numId && ilvl && numberingDefs[numId] && numberingDefs[numId][ilvl]) {
            // Generate proper list marker
            const listMarker = this.generateListMarker(numberingDefs[numId][ilvl], listState, ilvl);
            result += listMarker + ' ';
          } else {
            // Fallback numbering
            result += '1. ';
          }
        }
        
        // Extract paragraph text
        const textElements = paragraph.querySelectorAll('w\\:t');
        textElements.forEach(textEl => {
          result += textEl.textContent || '';
        });
      });
    } catch (error) {
      console.error('Error extracting formatted text:', error);
      // Fallback to simple text extraction
      result = 'Error processing document structure. Extracting raw text...\n';
      const textElements = documentXml.querySelectorAll('w\\:t');
      textElements.forEach(textEl => {
        result += textEl.textContent || '';
      });
    }
    
    return result;
  }
  
  /**
   * Generate list marker based on numbering definition
   */
  static generateListMarker(numberingDef, listState, level) {
    try {
      // Reset counters for deeper levels when moving to a new list item
      for (let i = parseInt(level) + 1; i <= 9; i++) {
        if (listState[i]) delete listState[i];
      }
      
      // Increment counter for current level
      if (!listState[level]) {
        listState[level] = parseInt(numberingDef.start) || 1;
      } else {
        listState[level]++;
      }
      
      // Generate marker based on format
      const counter = listState[level];
      const format = numberingDef.format;
      const pattern = numberingDef.text || '%1.';
      
      let marker = pattern.replace('%1', this.formatNumber(counter, format));
      return marker;
    } catch (error) {
      console.error('Error generating list marker:', error);
      return '1.';
    }
  }
  
  /**
   * Format number according to specified format
   */
  static formatNumber(num, format) {
    try {
      switch (format) {
        case 'decimal': 
          return num.toString();
        case 'lowerLetter': 
          return String.fromCharCode(96 + num); // a, b, c
        case 'upperLetter': 
          return String.fromCharCode(64 + num); // A, B, C
        case 'lowerRoman': 
          return this.toRoman(num).toLowerCase();
        case 'upperRoman': 
          return this.toRoman(num);
        case 'bullet':
          return '•';
        default: 
          return num.toString();
      }
    } catch (error) {
      console.error('Error formatting number:', error);
      return num.toString();
    }
  }
  
  /**
   * Convert number to Roman numerals
   */
  static toRoman(num) {
    if (num <= 0) return num.toString();
    
    // Simple roman numeral conversion
    const romanNumerals = [
      { value: 1000, numeral: 'M' },
      { value: 900, numeral: 'CM' },
      { value: 500, numeral: 'D' },
      { value: 400, numeral: 'CD' },
      { value: 100, numeral: 'C' },
      { value: 90, numeral: 'XC' },
      { value: 50, numeral: 'L' },
      { value: 40, numeral: 'XL' },
      { value: 10, numeral: 'X' },
      { value: 9, numeral: 'IX' },
      { value: 5, numeral: 'V' },
      { value: 4, numeral: 'IV' },
      { value: 1, numeral: 'I' }
    ];
    
    let result = '';
    for (const { value, numeral } of romanNumerals) {
      while (num >= value) {
        result += numeral;
        num -= value;
      }
    }
    return result;
  }
}

// Example usage:
/*
async function handleDocxFile(file) {
  try {
    const result = await DocxXmlParser.extractWithProperLists(file);
    console.log('Extracted content:', result.content);
    console.log('Has lists:', result.hasLists);
    console.log('Processing time:', result.processingTime, 'ms');
  } catch (error) {
    console.error('Failed to process DOCX file:', error);
  }
}
*/

export default DocxXmlParser;