/**
 * DOCX Diagnostic Tool
 * Analyzes DOCX XML structure to understand numbering issues
 */

import JSZip from 'jszip';
import { readFile } from 'fs/promises';

async function analyzeDOCX(filePath) {
  console.log('📄 Analyzing DOCX:', filePath);
  console.log('═'.repeat(80));

  // Read the file
  const buffer = await readFile(filePath);
  const zip = await JSZip.loadAsync(buffer);

  // Check if numbering.xml exists
  const numberingFile = zip.file('word/numbering.xml');
  console.log('\n📋 Numbering.xml:', numberingFile ? '✓ EXISTS' : '✗ MISSING');

  if (numberingFile) {
    const numberingXml = await numberingFile.async('string');

    // Extract numId definitions
    const numIdMatches = [...numberingXml.matchAll(/<w:num w:numId="(\d+)">/g)];
    const numIds = numIdMatches.map(m => m[1]);

    console.log(`   Found ${numIds.length} numbering instances: ${numIds.join(', ')}`);

    // Extract abstract numbering definitions
    const abstractMatches = [...numberingXml.matchAll(/<w:abstractNum[^>]*w:abstractNumId="(\d+)"/g)];
    const abstractNums = abstractMatches.map(m => m[1]);

    console.log(`   Found ${abstractNums.length} abstract numbering definitions: ${abstractNums.join(', ')}`);
  }

  // Analyze document.xml
  const documentFile = zip.file('word/document.xml');
  if (documentFile) {
    const documentXml = await documentFile.async('string');

    // Find all paragraphs with numbering
    const numPrMatches = [...documentXml.matchAll(/<w:numPr>[\s\S]*?<w:numId w:val="(\d+)"[\s\S]*?<w:ilvl w:val="(\d+)"[\s\S]*?<\/w:numPr>/g)];

    console.log(`\n📝 Document.xml:`);
    console.log(`   Total paragraphs with numbering: ${numPrMatches.length}`);

    // Count by numId
    const numIdCount = {};
    numPrMatches.forEach(match => {
      const numId = match[1];
      numIdCount[numId] = (numIdCount[numId] || 0) + 1;
    });

    console.log(`   Numbering usage:`);
    Object.entries(numIdCount).forEach(([numId, count]) => {
      console.log(`      numId ${numId}: ${count} paragraphs`);
    });

    // Check for tables
    const tables = documentXml.match(/<w:tbl>/g) || [];
    console.log(`\n🗂️  Tables: ${tables.length} found`);

    // Check for indentation issues
    const negativeIndents = documentXml.match(/<w:ind[^>]*w:left="-\d+"[^>]*>/g) || [];
    const negativeHanging = documentXml.match(/<w:ind[^>]*w:hanging="-\d+"[^>]*>/g) || [];
    const negativeFirstLine = documentXml.match(/<w:ind[^>]*w:firstLine="-\d+"[^>]*>/g) || [];

    console.log(`\n⚠️  Potential indentation issues:`);
    console.log(`   Negative left indent: ${negativeIndents.length}`);
    console.log(`   Negative hanging indent: ${negativeHanging.length}`);
    console.log(`   Negative first-line indent: ${negativeFirstLine.length}`);

    if (negativeIndents.length > 0 || negativeHanging.length > 0 || negativeFirstLine.length > 0) {
      console.log(`   ⚠️  This likely causes the "Invalid count value: -1" error`);
    }
  }

  console.log('\n' + '═'.repeat(80));
  console.log('✅ Analysis complete\n');
}

// Get file path from command line
const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: node diagnose-docx.js <path-to-docx>');
  process.exit(1);
}

analyzeDOCX(filePath).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
