// Direct XML Parsing Implementation for DOCX Files
// This implementation shows how to properly parse DOCX files and preserve list formatting

class DocxXmlParser {
  /**
   * Extract text from DOCX file with proper list formatting
   */
  static async extractWithProperLists(file) {
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
      
      return {
        content: text,
        hasLists: Object.keys(numberingDefs).length > 0,
        processingTime: 0 // In a real implementation, we'd measure this
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
    
    // Parse numbering definitions
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
        
        levels[ilvl] = {
          format: numFmt, // decimal, lowerLetter, upperRoman, etc.
          text: lvlText   // Pattern like "%1.", "(%1)", etc.
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
    
    return defs;
  }
  
  /**
   * Extract formatted text with proper list handling
   */
  static extractFormattedText(documentXml, numberingDefs) {
    let result = '';
    let listState = {}; // Track current list counters
    
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
        }
      }
      
      // Extract paragraph text
      const textElements = paragraph.querySelectorAll('w\\:t');
      textElements.forEach(textEl => {
        result += textEl.textContent || '';
      });
    });
    
    return result;
  }
  
  /**
   * Generate list marker based on numbering definition
   */
  static generateListMarker(numberingDef, listState, level) {
    // Reset counters for deeper levels when moving to a new list item
    for (let i = parseInt(level) + 1; i <= 9; i++) {
      if (listState[i]) delete listState[i];
    }
    
    // Increment counter for current level
    if (!listState[level]) listState[level] = 0;
    listState[level]++;
    
    // Generate marker based on format
    const counter = listState[level];
    const format = numberingDef.format;
    const pattern = numberingDef.text || '%1.';
    
    let marker = pattern.replace('%1', this.formatNumber(counter, format));
    return marker;
  }
  
  /**
   * Format number according to specified format
   */
  static formatNumber(num, format) {
    switch (format) {
      case 'decimal': return num.toString();
      case 'lowerLetter': return String.fromCharCode(96 + num); // a, b, c
      case 'upperLetter': return String.fromCharCode(64 + num); // A, B, C
      case 'lowerRoman': return this.toRoman(num).toLowerCase();
      case 'upperRoman': return this.toRoman(num);
      default: return num.toString();
    }
  }
  
  /**
   * Convert number to Roman numerals
   */
  static toRoman(num) {
    // Simple roman numeral conversion
    const roman = {M:1000,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1};
    let result = '';
    for (let key in roman) {
      while (num >= roman[key]) {
        result += key;
        num -= roman[key];
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
  } catch (error) {
    console.error('Failed to process DOCX file:', error);
  }
}
*/

export default DocxXmlParser;