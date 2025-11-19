/**
 * Detailed DOCX Diagnostic Tool
 * Deep analysis of numbering structure and mismatches
 */

import JSZip from 'jszip';
import { readFile, writeFile } from 'fs/promises';
import { DOMParser } from '@xmldom/xmldom';

async function analyzeDetailedDOCX(filePath) {
  console.log('📄 DETAILED ANALYSIS:', filePath);
  console.log('═'.repeat(80));

  const buffer = await readFile(filePath);
  const zip = await JSZip.loadAsync(buffer);

  // ========================================
  // PART 1: NUMBERING.XML ANALYSIS
  // ========================================
  const numberingFile = zip.file('word/numbering.xml');

  if (!numberingFile) {
    console.log('❌ numbering.xml MISSING - document has no lists');
    return;
  }

  const numberingXml = await numberingFile.async('string');

  // Save numbering.xml for inspection
  await writeFile('numbering-extracted.xml', numberingXml);
  console.log('💾 Saved numbering.xml to: numbering-extracted.xml');

  // Parse XML
  const parser = new DOMParser();
  const numberingDoc = parser.parseFromString(numberingXml, 'text/xml');

  // Extract abstract numbering definitions
  const abstractNums = numberingDoc.getElementsByTagName('w:abstractNum');
  console.log(`\n📚 ABSTRACT NUMBERING DEFINITIONS: ${abstractNums.length}`);

  const abstractMap = {};
  for (let i = 0; i < abstractNums.length; i++) {
    const abstractNum = abstractNums[i];
    const abstractNumId = abstractNum.getAttribute('w:abstractNumId');

    // Count levels
    const levels = abstractNum.getElementsByTagName('w:lvl');
    abstractMap[abstractNumId] = levels.length;

    if (i < 5 || abstractNumId === '0') { // Show first 5 and abstractNumId 0
      console.log(`   abstractNumId="${abstractNumId}": ${levels.length} levels`);
    }
  }
  if (abstractNums.length > 5) {
    console.log(`   ... (${abstractNums.length - 5} more) ...`);
  }

  // Extract concrete numbering instances
  const nums = numberingDoc.getElementsByTagName('w:num');
  console.log(`\n🔢 CONCRETE NUMBERING INSTANCES: ${nums.length}`);

  const numMap = {};
  for (let i = 0; i < nums.length; i++) {
    const num = nums[i];
    const numId = num.getAttribute('w:numId');

    // Find which abstractNum this references
    const abstractNumIdNodes = num.getElementsByTagName('w:abstractNumId');
    const abstractNumId = abstractNumIdNodes[0]?.getAttribute('w:val');

    numMap[numId] = abstractNumId;
    console.log(`   numId="${numId}" → abstractNumId="${abstractNumId}"`);
  }

  // ========================================
  // PART 2: DOCUMENT.XML ANALYSIS
  // ========================================
  const documentFile = zip.file('word/document.xml');
  const documentXml = await documentFile.async('string');

  // Save document.xml for inspection
  await writeFile('document-extracted.xml', documentXml);
  console.log('💾 Saved document.xml to: document-extracted.xml');

  const documentDoc = parser.parseFromString(documentXml, 'text/xml');

  // Find all paragraphs with numbering
  const paragraphs = documentDoc.getElementsByTagName('w:p');
  console.log(`\n📝 DOCUMENT STRUCTURE: ${paragraphs.length} total paragraphs`);

  const numIdUsage = {};
  const numIdDetails = [];

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    const numPr = para.getElementsByTagName('w:numPr')[0];

    if (numPr) {
      const numIdNode = numPr.getElementsByTagName('w:numId')[0];
      const ilvlNode = numPr.getElementsByTagName('w:ilvl')[0];

      if (numIdNode && ilvlNode) {
        const numId = numIdNode.getAttribute('w:val');
        const ilvl = ilvlNode.getAttribute('w:val');

        if (!numIdUsage[numId]) {
          numIdUsage[numId] = { count: 0, levels: new Set() };
        }
        numIdUsage[numId].count++;
        numIdUsage[numId].levels.add(ilvl);

        // Get paragraph text (first 50 chars)
        const textNodes = para.getElementsByTagName('w:t');
        let text = '';
        for (let j = 0; j < textNodes.length; j++) {
          text += textNodes[j].textContent;
        }
        text = text.substring(0, 50);

        numIdDetails.push({
          paraIndex: i,
          numId,
          ilvl,
          text: text || '(empty)',
          exists: numMap[numId] !== undefined
        });
      }
    }
  }

  console.log(`\n🎯 NUMBERING USAGE IN DOCUMENT:`);
  Object.entries(numIdUsage).forEach(([numId, info]) => {
    const exists = numMap[numId] !== undefined;
    const status = exists ? '✓ EXISTS' : '❌ MISSING';
    const levels = Array.from(info.levels).sort((a, b) => parseInt(a) - parseInt(b));

    console.log(`   numId="${numId}": ${info.count} paragraphs, levels [${levels.join(', ')}] - ${status}`);

    if (!exists) {
      console.log(`      ⚠️  ERROR: numId "${numId}" not defined in numbering.xml!`);
    }
  });

  // ========================================
  // PART 3: MISMATCH DETECTION
  // ========================================
  console.log(`\n⚠️  CRITICAL ISSUES DETECTED:`);

  // Issue 1: Referenced but undefined numIds
  const undefinedNumIds = Object.keys(numIdUsage).filter(numId => !numMap[numId]);

  if (undefinedNumIds.length > 0) {
    console.log(`\n❌ ISSUE #1: UNDEFINED NUMBERING REFERENCES`);
    console.log(`   Document uses ${undefinedNumIds.length} numIds that don't exist:`);
    undefinedNumIds.forEach(numId => {
      const info = numIdUsage[numId];
      console.log(`   - numId="${numId}": ${info.count} paragraphs affected`);
    });

    console.log(`\n   🔍 Sample paragraphs using undefined numId:`);
    const samples = numIdDetails.filter(d => !d.exists).slice(0, 3);
    samples.forEach(s => {
      console.log(`      Para ${s.paraIndex}: numId=${s.numId}, ilvl=${s.ilvl}`);
      console.log(`         Text: "${s.text}"`);
    });
  } else {
    console.log(`\n✅ All numIds are properly defined`);
  }

  // Issue 2: Defined but unused numIds
  const definedNumIds = Object.keys(numMap);
  const usedNumIds = Object.keys(numIdUsage);
  const unusedNumIds = definedNumIds.filter(numId => !usedNumIds.includes(numId));

  if (unusedNumIds.length > 0) {
    console.log(`\n⚠️  INFO: ${unusedNumIds.length} defined numIds are never used`);
    console.log(`   (This is normal - documents often have unused definitions)`);
  }

  // Issue 3: Indentation problems
  const indentMatches = [...documentXml.matchAll(/<w:ind[^>]*w:left="(-?\d+)"[^>]*>/g)];
  const negativeIndents = indentMatches.filter(m => parseInt(m[1]) < 0);

  if (negativeIndents.length > 0) {
    console.log(`\n❌ ISSUE #2: NEGATIVE INDENTATION VALUES`);
    console.log(`   Found ${negativeIndents.length} paragraphs with negative left indent`);
    console.log(`   This causes "Invalid count value: -1" error in library`);

    // Show sample
    const samples = negativeIndents.slice(0, 3);
    samples.forEach(s => {
      console.log(`      w:left="${s[1]}" (negative!)`);
    });
  }

  // ========================================
  // PART 4: RECOMMENDATIONS
  // ========================================
  console.log(`\n💡 RECOMMENDATIONS:`);

  if (undefinedNumIds.length > 0) {
    console.log(`\n1. FIX MISSING NUMBERING DEFINITIONS:`);
    console.log(`   The document references numIds that don't exist in numbering.xml.`);
    console.log(`   This is likely a corrupted DOCX file or a Word bug.`);
    console.log(`   `);
    console.log(`   Option A: Add missing definitions to numbering.xml`);
    console.log(`   - Create <w:num> elements for missing numIds`);
    console.log(`   - Map them to appropriate abstractNum definitions`);
    console.log(`   `);
    console.log(`   Option B: Pre-process before parsing`);
    console.log(`   - Detect missing numIds`);
    console.log(`   - Add default definitions automatically`);
    console.log(`   `);
    console.log(`   Option C: Fallback in parser`);
    console.log(`   - When numId not found, use abstractNum 0 as default`);
  }

  if (negativeIndents.length > 0) {
    console.log(`\n2. FIX NEGATIVE INDENTATION:`);
    console.log(`   Pre-process document.xml to remove negative indent values`);
    console.log(`   Replace: w:left="-720" with w:left="0"`);
  }

  console.log('\n' + '═'.repeat(80));
  console.log('✅ Detailed analysis complete');
  console.log('📁 Extracted XML files saved for manual inspection\n');
}

// Get file path from command line
const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: node diagnose-detailed.js <path-to-docx>');
  process.exit(1);
}

analyzeDetailedDOCX(filePath).catch(err => {
  console.error('❌ Error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
