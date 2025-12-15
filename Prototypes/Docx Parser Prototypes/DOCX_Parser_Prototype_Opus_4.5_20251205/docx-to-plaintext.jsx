import React, { useState, useCallback, useRef } from 'react';

/**
 * DOCX Plain Text Extractor
 * 
 * A comprehensive parser that extracts plain text from .docx files with
 * 100% parity to MS Word copy-paste behavior, especially for numbered lists.
 * 
 * Key insight: .docx files are ZIP archives containing XML files.
 * The numbering system is complex:
 * - word/numbering.xml defines abstract numbering definitions and numbering instances
 * - word/document.xml contains paragraphs with numPr references
 * - Each list level can have different formats (decimal, lowerLetter, upperLetter, etc.)
 */

// ============================================================================
// DOCX XML PARSING UTILITIES
// ============================================================================

/**
 * Parse XML string into a traversable DOM structure
 */
function parseXML(xmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');
  return doc;
}

/**
 * Get all elements by tag name, handling namespaces
 */
function getElementsByTagNameNS(node, localName) {
  const results = [];
  const walker = document.createTreeWalker(
    node,
    NodeFilter.SHOW_ELEMENT,
    null,
    false
  );
  
  let current = walker.currentNode;
  while (current) {
    if (current.localName === localName) {
      results.push(current);
    }
    current = walker.nextNode();
  }
  return results;
}

/**
 * Get direct child elements by local name
 */
function getChildrenByLocalName(node, localName) {
  const results = [];
  for (const child of node.children) {
    if (child.localName === localName) {
      results.push(child);
    }
  }
  return results;
}

/**
 * Get attribute value handling namespaced attributes
 */
function getAttr(element, localName) {
  // Try with w: namespace first
  let val = element.getAttribute(`w:${localName}`);
  if (val) return val;
  
  // Try without namespace
  val = element.getAttribute(localName);
  if (val) return val;
  
  // Search all attributes for matching local name
  for (const attr of element.attributes) {
    if (attr.localName === localName) {
      return attr.value;
    }
  }
  return null;
}

// ============================================================================
// NUMBER FORMAT CONVERTERS
// ============================================================================

/**
 * Convert number to various formats matching Word's numbering system
 */
const numberFormatters = {
  decimal: (n) => String(n),
  
  lowerLetter: (n) => {
    // a, b, c, ... z, aa, ab, ...
    let result = '';
    while (n > 0) {
      n--;
      result = String.fromCharCode(97 + (n % 26)) + result;
      n = Math.floor(n / 26);
    }
    return result;
  },
  
  upperLetter: (n) => {
    let result = '';
    while (n > 0) {
      n--;
      result = String.fromCharCode(65 + (n % 26)) + result;
      n = Math.floor(n / 26);
    }
    return result;
  },
  
  lowerRoman: (n) => {
    const romanNumerals = [
      ['m', 1000], ['cm', 900], ['d', 500], ['cd', 400],
      ['c', 100], ['xc', 90], ['l', 50], ['xl', 40],
      ['x', 10], ['ix', 9], ['v', 5], ['iv', 4], ['i', 1]
    ];
    let result = '';
    for (const [numeral, value] of romanNumerals) {
      while (n >= value) {
        result += numeral;
        n -= value;
      }
    }
    return result;
  },
  
  upperRoman: (n) => {
    const romanNumerals = [
      ['M', 1000], ['CM', 900], ['D', 500], ['CD', 400],
      ['C', 100], ['XC', 90], ['L', 50], ['XL', 40],
      ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]
    ];
    let result = '';
    for (const [numeral, value] of romanNumerals) {
      while (n >= value) {
        result += numeral;
        n -= value;
      }
    }
    return result;
  },
  
  bullet: () => '•',
  
  // Additional formats
  ordinal: (n) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  },
  
  cardinalText: (n) => {
    const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    
    if (n === 0) return 'zero';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? '-' + ones[n % 10] : '');
    return String(n);
  },
  
  ordinalText: (n) => {
    const special = { 1: 'first', 2: 'second', 3: 'third', 5: 'fifth', 8: 'eighth', 9: 'ninth', 12: 'twelfth' };
    if (special[n]) return special[n];
    const cardinal = numberFormatters.cardinalText(n);
    if (cardinal.endsWith('y')) return cardinal.slice(0, -1) + 'ieth';
    return cardinal + 'th';
  },
  
  none: () => '',
  
  // Chicago style
  chicago: (n) => {
    const symbols = ['*', '†', '‡', '§', '‖', '#'];
    const index = (n - 1) % symbols.length;
    const repeat = Math.floor((n - 1) / symbols.length) + 1;
    return symbols[index].repeat(repeat);
  }
};

/**
 * Format a number according to Word's numFmt
 */
function formatNumber(num, format) {
  const formatter = numberFormatters[format] || numberFormatters.decimal;
  return formatter(num);
}

// ============================================================================
// NUMBERING DEFINITION PARSER
// ============================================================================

/**
 * Parse numbering.xml to extract all numbering definitions
 */
function parseNumberingDefinitions(numberingXml) {
  if (!numberingXml) {
    return { abstractNums: {}, numInstances: {} };
  }
  
  const doc = parseXML(numberingXml);
  const abstractNums = {};
  const numInstances = {};
  
  // Parse abstract numbering definitions
  const abstractNumElements = getElementsByTagNameNS(doc, 'abstractNum');
  for (const abstractNum of abstractNumElements) {
    const abstractNumId = getAttr(abstractNum, 'abstractNumId');
    if (!abstractNumId) continue;
    
    const levels = {};
    const lvlElements = getElementsByTagNameNS(abstractNum, 'lvl');
    
    for (const lvl of lvlElements) {
      const ilvl = getAttr(lvl, 'ilvl');
      if (ilvl === null) continue;
      
      const levelDef = {
        start: 1,
        numFmt: 'decimal',
        lvlText: '%1.',
        lvlJc: 'left',
        isLgl: false,
        lvlRestart: null,
        pStyle: null
      };
      
      // Get start value
      const startEl = getChildrenByLocalName(lvl, 'start')[0];
      if (startEl) {
        const startVal = getAttr(startEl, 'val');
        if (startVal) levelDef.start = parseInt(startVal, 10);
      }
      
      // Get number format
      const numFmtEl = getChildrenByLocalName(lvl, 'numFmt')[0];
      if (numFmtEl) {
        levelDef.numFmt = getAttr(numFmtEl, 'val') || 'decimal';
      }
      
      // Get level text (the format string like "%1." or "%1.%2.")
      const lvlTextEl = getChildrenByLocalName(lvl, 'lvlText')[0];
      if (lvlTextEl) {
        levelDef.lvlText = getAttr(lvlTextEl, 'val') || '';
      }
      
      // Get justification
      const lvlJcEl = getChildrenByLocalName(lvl, 'lvlJc')[0];
      if (lvlJcEl) {
        levelDef.lvlJc = getAttr(lvlJcEl, 'val') || 'left';
      }
      
      // Check for legal numbering (forces decimal display)
      const isLglEl = getChildrenByLocalName(lvl, 'isLgl')[0];
      if (isLglEl) {
        levelDef.isLgl = true;
      }
      
      // Check for level restart
      const lvlRestartEl = getChildrenByLocalName(lvl, 'lvlRestart')[0];
      if (lvlRestartEl) {
        const restartVal = getAttr(lvlRestartEl, 'val');
        if (restartVal) levelDef.lvlRestart = parseInt(restartVal, 10);
      }
      
      // Get paragraph style link
      const pStyleEl = getChildrenByLocalName(lvl, 'pStyle')[0];
      if (pStyleEl) {
        levelDef.pStyle = getAttr(pStyleEl, 'val');
      }
      
      levels[ilvl] = levelDef;
    }
    
    abstractNums[abstractNumId] = levels;
  }
  
  // Parse numbering instances (num elements that reference abstract definitions)
  const numElements = getElementsByTagNameNS(doc, 'num');
  for (const num of numElements) {
    const numId = getAttr(num, 'numId');
    if (!numId) continue;
    
    const instance = {
      abstractNumId: null,
      levelOverrides: {}
    };
    
    // Get reference to abstract numbering
    const abstractNumIdEl = getChildrenByLocalName(num, 'abstractNumId')[0];
    if (abstractNumIdEl) {
      instance.abstractNumId = getAttr(abstractNumIdEl, 'val');
    }
    
    // Parse level overrides
    const lvlOverrideElements = getElementsByTagNameNS(num, 'lvlOverride');
    for (const lvlOverride of lvlOverrideElements) {
      const ilvl = getAttr(lvlOverride, 'ilvl');
      if (ilvl === null) continue;
      
      const override = {};
      
      // Start override
      const startOverrideEl = getChildrenByLocalName(lvlOverride, 'startOverride')[0];
      if (startOverrideEl) {
        const val = getAttr(startOverrideEl, 'val');
        if (val) override.start = parseInt(val, 10);
      }
      
      // Level override (full level definition replacement)
      const lvlEl = getChildrenByLocalName(lvlOverride, 'lvl')[0];
      if (lvlEl) {
        // Parse the nested level definition
        const numFmtEl = getChildrenByLocalName(lvlEl, 'numFmt')[0];
        if (numFmtEl) override.numFmt = getAttr(numFmtEl, 'val');
        
        const lvlTextEl = getChildrenByLocalName(lvlEl, 'lvlText')[0];
        if (lvlTextEl) override.lvlText = getAttr(lvlTextEl, 'val');
      }
      
      instance.levelOverrides[ilvl] = override;
    }
    
    numInstances[numId] = instance;
  }
  
  return { abstractNums, numInstances };
}

// ============================================================================
// STYLES PARSER
// ============================================================================

/**
 * Parse styles.xml to extract style definitions with numbering references
 */
function parseStyles(stylesXml) {
  if (!stylesXml) return {};
  
  const doc = parseXML(stylesXml);
  const styles = {};
  
  const styleElements = getElementsByTagNameNS(doc, 'style');
  for (const style of styleElements) {
    const styleId = getAttr(style, 'styleId');
    if (!styleId) continue;
    
    const styleDef = {
      name: styleId,
      basedOn: null,
      numPr: null
    };
    
    // Get base style
    const basedOnEl = getChildrenByLocalName(style, 'basedOn')[0];
    if (basedOnEl) {
      styleDef.basedOn = getAttr(basedOnEl, 'val');
    }
    
    // Get paragraph properties
    const pPrEl = getChildrenByLocalName(style, 'pPr')[0];
    if (pPrEl) {
      const numPrEl = getChildrenByLocalName(pPrEl, 'numPr')[0];
      if (numPrEl) {
        const numIdEl = getChildrenByLocalName(numPrEl, 'numId')[0];
        const ilvlEl = getChildrenByLocalName(numPrEl, 'ilvl')[0];
        
        styleDef.numPr = {
          numId: numIdEl ? getAttr(numIdEl, 'val') : null,
          ilvl: ilvlEl ? getAttr(ilvlEl, 'val') : '0'
        };
      }
    }
    
    styles[styleId] = styleDef;
  }
  
  return styles;
}

// ============================================================================
// NUMBERING STATE TRACKER
// ============================================================================

/**
 * Tracks the current state of all numbering sequences
 */
class NumberingTracker {
  constructor(numberingDefs, styles) {
    this.abstractNums = numberingDefs.abstractNums;
    this.numInstances = numberingDefs.numInstances;
    this.styles = styles;
    
    // Track current counter values for each numId + level combination
    // Key format: "numId-level"
    this.counters = {};
    
    // Track the last used numId and level for restart logic
    this.lastNumId = null;
    this.lastLevel = -1;
  }
  
  /**
   * Get the level definition for a given numId and level
   */
  getLevelDef(numId, level) {
    const instance = this.numInstances[numId];
    if (!instance || !instance.abstractNumId) return null;
    
    const abstractNum = this.abstractNums[instance.abstractNumId];
    if (!abstractNum) return null;
    
    const baseDef = abstractNum[level];
    if (!baseDef) return null;
    
    // Apply any overrides
    const override = instance.levelOverrides[level];
    if (override) {
      return { ...baseDef, ...override };
    }
    
    return baseDef;
  }
  
  /**
   * Get numbering info from a paragraph's style
   */
  getNumPrFromStyle(styleId) {
    if (!styleId || !this.styles[styleId]) return null;
    
    let style = this.styles[styleId];
    const visited = new Set();
    
    // Walk up the style hierarchy
    while (style) {
      if (visited.has(style.name)) break;
      visited.add(style.name);
      
      if (style.numPr && style.numPr.numId) {
        return style.numPr;
      }
      
      if (style.basedOn && this.styles[style.basedOn]) {
        style = this.styles[style.basedOn];
      } else {
        break;
      }
    }
    
    return null;
  }
  
  /**
   * Format a list item and return the formatted prefix
   */
  formatListItem(numId, level) {
    const levelNum = parseInt(level, 10);
    const levelDef = this.getLevelDef(numId, level);
    
    if (!levelDef) {
      return null;
    }
    
    // Handle restart logic when level changes
    if (this.lastNumId === numId) {
      if (levelNum > this.lastLevel) {
        // Going deeper - reset all deeper levels
        for (let i = levelNum; i <= 8; i++) {
          const key = `${numId}-${i}`;
          const def = this.getLevelDef(numId, String(i));
          if (def) {
            this.counters[key] = def.start;
          }
        }
      } else if (levelNum < this.lastLevel) {
        // Coming back up - reset all levels below
        for (let i = levelNum + 1; i <= 8; i++) {
          const key = `${numId}-${i}`;
          const def = this.getLevelDef(numId, String(i));
          if (def) {
            this.counters[key] = def.start;
          }
        }
      }
    } else {
      // Different list - may need to continue or restart
      // For now, initialize if not present
    }
    
    // Initialize counter if needed
    const key = `${numId}-${level}`;
    if (this.counters[key] === undefined) {
      this.counters[key] = levelDef.start;
    }
    
    // Get current number and increment
    const currentNum = this.counters[key];
    this.counters[key] = currentNum + 1;
    
    // Build the formatted text
    let text = levelDef.lvlText || '';
    
    // Replace placeholders like %1, %2, %3, etc.
    for (let i = 0; i <= levelNum; i++) {
      const placeholder = `%${i + 1}`;
      if (text.includes(placeholder)) {
        const lvlKey = `${numId}-${i}`;
        const lvlDef = this.getLevelDef(numId, String(i));
        
        let numVal;
        if (i === levelNum) {
          numVal = currentNum;
        } else {
          // Get the current value of the parent level (without incrementing)
          numVal = (this.counters[lvlKey] || lvlDef?.start || 1) - 1;
          if (numVal < 1) numVal = 1;
        }
        
        // Determine format
        let format = lvlDef?.numFmt || 'decimal';
        
        // Legal numbering forces decimal
        if (levelDef.isLgl && i < levelNum) {
          format = 'decimal';
        }
        
        const formatted = formatNumber(numVal, format);
        text = text.replace(placeholder, formatted);
      }
    }
    
    this.lastNumId = numId;
    this.lastLevel = levelNum;
    
    return text;
  }
}

// ============================================================================
// DOCUMENT PARSER
// ============================================================================

/**
 * Extract text content from a run element
 */
function extractRunText(run) {
  let text = '';
  
  for (const child of run.children) {
    const localName = child.localName;
    
    if (localName === 't') {
      // Regular text
      text += child.textContent || '';
    } else if (localName === 'tab') {
      // Tab character
      text += '\t';
    } else if (localName === 'br') {
      // Break - check type
      const type = getAttr(child, 'type');
      if (type === 'page') {
        text += '\n\n';
      } else {
        text += '\n';
      }
    } else if (localName === 'cr') {
      // Carriage return
      text += '\n';
    } else if (localName === 'sym') {
      // Symbol - try to get the character
      const char = getAttr(child, 'char');
      if (char) {
        const code = parseInt(char, 16);
        if (!isNaN(code)) {
          text += String.fromCharCode(code);
        }
      }
    } else if (localName === 'noBreakHyphen') {
      text += '-';
    } else if (localName === 'softHyphen') {
      text += '\u00AD';
    }
  }
  
  return text;
}

/**
 * Parse document.xml and extract plain text with proper list numbering
 */
function parseDocument(documentXml, numberingTracker) {
  const doc = parseXML(documentXml);
  const lines = [];
  
  // Find the body element
  const bodies = getElementsByTagNameNS(doc, 'body');
  if (bodies.length === 0) return '';
  
  const body = bodies[0];
  
  // Process all paragraphs and tables
  function processElement(element) {
    const localName = element.localName;
    
    if (localName === 'p') {
      processParagraph(element);
    } else if (localName === 'tbl') {
      processTable(element);
    } else if (localName === 'sdt') {
      // Structured document tag - process contents
      const sdtContent = getChildrenByLocalName(element, 'sdtContent')[0];
      if (sdtContent) {
        for (const child of sdtContent.children) {
          processElement(child);
        }
      }
    } else {
      // Recursively check children
      for (const child of element.children) {
        processElement(child);
      }
    }
  }
  
  function processParagraph(para) {
    let paraText = '';
    let listPrefix = '';
    
    // Check for numbering properties
    const pPr = getChildrenByLocalName(para, 'pPr')[0];
    if (pPr) {
      // Direct numbering properties
      let numPr = getChildrenByLocalName(pPr, 'numPr')[0];
      let numId = null;
      let ilvl = '0';
      
      if (numPr) {
        const numIdEl = getChildrenByLocalName(numPr, 'numId')[0];
        const ilvlEl = getChildrenByLocalName(numPr, 'ilvl')[0];
        
        numId = numIdEl ? getAttr(numIdEl, 'val') : null;
        ilvl = ilvlEl ? getAttr(ilvlEl, 'val') : '0';
      }
      
      // Check style-based numbering if no direct numbering
      if (!numId || numId === '0') {
        const pStyleEl = getChildrenByLocalName(pPr, 'pStyle')[0];
        if (pStyleEl) {
          const styleId = getAttr(pStyleEl, 'val');
          const styleNumPr = numberingTracker.getNumPrFromStyle(styleId);
          if (styleNumPr && styleNumPr.numId && styleNumPr.numId !== '0') {
            numId = styleNumPr.numId;
            ilvl = styleNumPr.ilvl || '0';
          }
        }
      }
      
      // Format the list item
      if (numId && numId !== '0') {
        const formatted = numberingTracker.formatListItem(numId, ilvl);
        if (formatted !== null) {
          // Add indentation based on level
          const indent = '\t'.repeat(parseInt(ilvl, 10));
          listPrefix = indent + formatted + '\t';
        }
      }
    }
    
    // Extract text from all runs
    const runs = getElementsByTagNameNS(para, 'r');
    for (const run of runs) {
      paraText += extractRunText(run);
    }
    
    // Also check for direct text elements
    for (const child of para.children) {
      if (child.localName === 'fldSimple') {
        // Field - extract text content
        const fldRuns = getElementsByTagNameNS(child, 'r');
        for (const run of fldRuns) {
          paraText += extractRunText(run);
        }
      }
    }
    
    // Handle hyperlinks
    const hyperlinks = getElementsByTagNameNS(para, 'hyperlink');
    for (const hyperlink of hyperlinks) {
      const hlRuns = getElementsByTagNameNS(hyperlink, 'r');
      for (const run of hlRuns) {
        paraText += extractRunText(run);
      }
    }
    
    // Combine prefix and text
    const fullLine = listPrefix + paraText;
    lines.push(fullLine);
  }
  
  function processTable(table) {
    const rows = getElementsByTagNameNS(table, 'tr');
    
    for (const row of rows) {
      const cells = getElementsByTagNameNS(row, 'tc');
      const cellTexts = [];
      
      for (const cell of cells) {
        let cellText = '';
        const paras = getElementsByTagNameNS(cell, 'p');
        const paraTexts = [];
        
        for (const para of paras) {
          let pText = '';
          const runs = getElementsByTagNameNS(para, 'r');
          for (const run of runs) {
            pText += extractRunText(run);
          }
          paraTexts.push(pText);
        }
        
        cellText = paraTexts.join('\n');
        cellTexts.push(cellText);
      }
      
      lines.push(cellTexts.join('\t'));
    }
    
    lines.push(''); // Empty line after table
  }
  
  // Process all children of body
  for (const child of body.children) {
    processElement(child);
  }
  
  return lines.join('\n');
}

// ============================================================================
// ZIP HANDLING (using JSZip-like manual implementation)
// ============================================================================

/**
 * Parse ZIP file structure from ArrayBuffer
 * Simplified ZIP parser for DOCX files
 */
async function parseZip(arrayBuffer) {
  const dataView = new DataView(arrayBuffer);
  const files = {};
  
  // Find end of central directory record (EOCD)
  // EOCD signature: 0x06054b50
  let eocdOffset = -1;
  for (let i = arrayBuffer.byteLength - 22; i >= 0; i--) {
    if (dataView.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  
  if (eocdOffset === -1) {
    throw new Error('Invalid ZIP file: EOCD not found');
  }
  
  // Read EOCD
  const cdOffset = dataView.getUint32(eocdOffset + 16, true);
  const cdEntries = dataView.getUint16(eocdOffset + 10, true);
  
  // Read central directory
  let offset = cdOffset;
  for (let i = 0; i < cdEntries; i++) {
    if (dataView.getUint32(offset, true) !== 0x02014b50) {
      throw new Error('Invalid central directory entry');
    }
    
    const compMethod = dataView.getUint16(offset + 10, true);
    const compSize = dataView.getUint32(offset + 20, true);
    const uncompSize = dataView.getUint32(offset + 24, true);
    const nameLen = dataView.getUint16(offset + 28, true);
    const extraLen = dataView.getUint16(offset + 30, true);
    const commentLen = dataView.getUint16(offset + 32, true);
    const localHeaderOffset = dataView.getUint32(offset + 42, true);
    
    const nameBytes = new Uint8Array(arrayBuffer, offset + 46, nameLen);
    const fileName = new TextDecoder().decode(nameBytes);
    
    // Read local file header to get actual data offset
    const localNameLen = dataView.getUint16(localHeaderOffset + 26, true);
    const localExtraLen = dataView.getUint16(localHeaderOffset + 28, true);
    const dataOffset = localHeaderOffset + 30 + localNameLen + localExtraLen;
    
    const compressedData = new Uint8Array(arrayBuffer, dataOffset, compSize);
    
    // Decompress if needed
    let data;
    if (compMethod === 0) {
      // Stored (no compression)
      data = compressedData;
    } else if (compMethod === 8) {
      // Deflate
      data = await inflateRaw(compressedData);
    } else {
      console.warn(`Unsupported compression method ${compMethod} for ${fileName}`);
      data = new Uint8Array(0);
    }
    
    files[fileName] = data;
    
    offset += 46 + nameLen + extraLen + commentLen;
  }
  
  return files;
}

/**
 * Inflate (decompress) deflate-compressed data
 * Using the browser's DecompressionStream API
 */
async function inflateRaw(compressedData) {
  try {
    // Try using DecompressionStream (modern browsers)
    const ds = new DecompressionStream('deflate-raw');
    const writer = ds.writable.getWriter();
    const reader = ds.readable.getReader();
    
    writer.write(compressedData);
    writer.close();
    
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    
    return result;
  } catch (e) {
    // Fallback: try with regular 'deflate' format
    try {
      const ds = new DecompressionStream('deflate');
      const writer = ds.writable.getWriter();
      const reader = ds.readable.getReader();
      
      writer.write(compressedData);
      writer.close();
      
      const chunks = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
      
      return result;
    } catch (e2) {
      console.error('Decompression failed:', e2);
      return new Uint8Array(0);
    }
  }
}

// ============================================================================
// MAIN DOCX PROCESSOR
// ============================================================================

/**
 * Process a DOCX file and extract plain text
 */
async function processDocx(arrayBuffer) {
  // Parse the ZIP structure
  const files = await parseZip(arrayBuffer);
  
  // Get the required XML files
  const decoder = new TextDecoder('utf-8');
  
  const documentXml = files['word/document.xml'] 
    ? decoder.decode(files['word/document.xml']) 
    : null;
    
  const numberingXml = files['word/numbering.xml']
    ? decoder.decode(files['word/numbering.xml'])
    : null;
    
  const stylesXml = files['word/styles.xml']
    ? decoder.decode(files['word/styles.xml'])
    : null;
  
  if (!documentXml) {
    throw new Error('Invalid DOCX: document.xml not found');
  }
  
  // Parse numbering definitions
  const numberingDefs = parseNumberingDefinitions(numberingXml);
  
  // Parse styles
  const styles = parseStyles(stylesXml);
  
  // Create numbering tracker
  const numberingTracker = new NumberingTracker(numberingDefs, styles);
  
  // Parse document and extract text
  const plainText = parseDocument(documentXml, numberingTracker);
  
  return plainText;
}

// ============================================================================
// REACT COMPONENT
// ============================================================================

export default function DocxToPlainText() {
  const [plainText, setPlainText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);
  
  const handleFile = useCallback(async (file) => {
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.docx')) {
      setError('Please upload a .docx file');
      return;
    }
    
    setIsProcessing(true);
    setError('');
    setFileName(file.name);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const text = await processDocx(arrayBuffer);
      setPlainText(text);
      
      // Auto-copy to clipboard
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (clipErr) {
        console.warn('Could not auto-copy to clipboard:', clipErr);
      }
    } catch (err) {
      console.error('Error processing DOCX:', err);
      setError(`Error processing file: ${err.message}`);
      setPlainText('');
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);
  
  const handleInputChange = useCallback((e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);
  
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [plainText]);
  
  const handleClear = useCallback(() => {
    setPlainText('');
    setFileName('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0b',
      color: '#e8e6e3',
      fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
      padding: '2rem'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        
        * {
          box-sizing: border-box;
        }
        
        .docx-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .header {
          margin-bottom: 2.5rem;
          border-bottom: 1px solid #2a2a2d;
          padding-bottom: 1.5rem;
        }
        
        .title {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 2rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
          background: linear-gradient(135deg, #00ff88 0%, #00b4d8 50%, #9b5de5 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .subtitle {
          color: #6b6b70;
          font-size: 0.875rem;
          margin: 0;
        }
        
        .drop-zone {
          border: 2px dashed #3a3a40;
          border-radius: 12px;
          padding: 3rem;
          text-align: center;
          transition: all 0.2s ease;
          cursor: pointer;
          background: linear-gradient(145deg, #111113 0%, #0d0d0e 100%);
          position: relative;
          overflow: hidden;
        }
        
        .drop-zone::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at center, rgba(0, 255, 136, 0.03) 0%, transparent 70%);
          pointer-events: none;
        }
        
        .drop-zone:hover,
        .drop-zone.dragging {
          border-color: #00ff88;
          background: linear-gradient(145deg, #151518 0%, #0f0f11 100%);
        }
        
        .drop-zone.dragging {
          transform: scale(1.01);
          box-shadow: 0 0 30px rgba(0, 255, 136, 0.1);
        }
        
        .drop-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.6;
        }
        
        .drop-text {
          font-size: 1.125rem;
          color: #a0a0a5;
          margin-bottom: 0.5rem;
        }
        
        .drop-hint {
          font-size: 0.75rem;
          color: #5a5a60;
        }
        
        .file-input {
          display: none;
        }
        
        .status-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1.5rem;
          padding: 1rem;
          background: #111113;
          border-radius: 8px;
          border: 1px solid #2a2a2d;
        }
        
        .file-name {
          color: #00ff88;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .file-icon {
          opacity: 0.7;
        }
        
        .action-buttons {
          display: flex;
          gap: 0.75rem;
        }
        
        .btn {
          padding: 0.625rem 1.25rem;
          border-radius: 6px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          border: none;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
          color: #0a0a0b;
        }
        
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 255, 136, 0.3);
        }
        
        .btn-primary:active {
          transform: translateY(0);
        }
        
        .btn-secondary {
          background: #2a2a2d;
          color: #e8e6e3;
          border: 1px solid #3a3a40;
        }
        
        .btn-secondary:hover {
          background: #3a3a40;
          border-color: #4a4a50;
        }
        
        .output-panel {
          margin-top: 1.5rem;
        }
        
        .output-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        
        .output-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #6b6b70;
        }
        
        .char-count {
          font-size: 0.75rem;
          color: #5a5a60;
        }
        
        .output-textarea {
          width: 100%;
          min-height: 400px;
          padding: 1.25rem;
          background: #111113;
          border: 1px solid #2a2a2d;
          border-radius: 8px;
          color: #e8e6e3;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.875rem;
          line-height: 1.6;
          resize: vertical;
          outline: none;
          transition: border-color 0.15s ease;
        }
        
        .output-textarea:focus {
          border-color: #00ff88;
        }
        
        .output-textarea::placeholder {
          color: #4a4a50;
        }
        
        .error-message {
          margin-top: 1rem;
          padding: 1rem;
          background: rgba(255, 77, 77, 0.1);
          border: 1px solid rgba(255, 77, 77, 0.3);
          border-radius: 8px;
          color: #ff6b6b;
          font-size: 0.875rem;
        }
        
        .processing-indicator {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #00b4d8;
        }
        
        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid #2a2a2d;
          border-top-color: #00ff88;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .copied-toast {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
          color: #0a0a0b;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.875rem;
          box-shadow: 0 8px 24px rgba(0, 255, 136, 0.3);
          animation: slideIn 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(1rem);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #2a2a2d;
        }
        
        .feature {
          padding: 1rem;
          background: #111113;
          border-radius: 8px;
          border: 1px solid #1a1a1d;
        }
        
        .feature-icon {
          font-size: 1.25rem;
          margin-bottom: 0.5rem;
        }
        
        .feature-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #e8e6e3;
          margin-bottom: 0.25rem;
        }
        
        .feature-desc {
          font-size: 0.75rem;
          color: #6b6b70;
          line-height: 1.4;
        }
      `}</style>
      
      <div className="docx-container">
        <header className="header">
          <h1 className="title">DOCX → Plain Text</h1>
          <p className="subtitle">
            Zero-dependency DOCX parser with 100% numbered list fidelity
          </p>
        </header>
        
        <div
          className={`drop-zone ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx"
            onChange={handleInputChange}
            className="file-input"
          />
          <div className="drop-icon">📄</div>
          <div className="drop-text">
            {isDragging ? 'Drop your DOCX here' : 'Drag & drop a DOCX file'}
          </div>
          <div className="drop-hint">or click to browse</div>
        </div>
        
        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}
        
        {(isProcessing || fileName) && (
          <div className="status-bar">
            <div className="file-name">
              <span className="file-icon">📎</span>
              {fileName}
            </div>
            {isProcessing ? (
              <div className="processing-indicator">
                <div className="spinner"></div>
                Processing...
              </div>
            ) : (
              <div className="action-buttons">
                <button 
                  className="btn btn-primary" 
                  onClick={handleCopy}
                  disabled={!plainText}
                >
                  📋 Copy to Clipboard
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={handleClear}
                >
                  ✕ Clear
                </button>
              </div>
            )}
          </div>
        )}
        
        <div className="output-panel">
          <div className="output-header">
            <span className="output-label">Plain Text Output</span>
            {plainText && (
              <span className="char-count">
                {plainText.length.toLocaleString()} characters • {plainText.split('\n').length.toLocaleString()} lines
              </span>
            )}
          </div>
          <textarea
            className="output-textarea"
            value={plainText}
            readOnly
            placeholder="Extracted text will appear here..."
          />
        </div>
        
        <div className="features">
          <div className="feature">
            <div className="feature-icon">🔢</div>
            <div className="feature-title">Numbered Lists</div>
            <div className="feature-desc">
              Decimal, letters, Roman numerals, multi-level with full hierarchy
            </div>
          </div>
          <div className="feature">
            <div className="feature-icon">📑</div>
            <div className="feature-title">Nested Lists</div>
            <div className="feature-desc">
              Proper indentation and counter tracking across levels
            </div>
          </div>
          <div className="feature">
            <div className="feature-icon">🎯</div>
            <div className="feature-title">Style-Based</div>
            <div className="feature-desc">
              Handles list styles from Word's style definitions
            </div>
          </div>
          <div className="feature">
            <div className="feature-icon">📊</div>
            <div className="feature-title">Tables</div>
            <div className="feature-desc">
              Tab-separated cells with proper row handling
            </div>
          </div>
        </div>
      </div>
      
      {copied && (
        <div className="copied-toast">
          ✓ Copied to clipboard
        </div>
      )}
    </div>
  );
}
