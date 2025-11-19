/**
 * Quick test script for Blackstone-Micron DOCX
 * Tests the negative indentation pre-processing fix
 */

import { readFile } from 'fs/promises';
import { DocxListExtractor } from './src/core/DocxListExtractor.ts';

async function testBlackstoneMicron() {
  console.log('═'.repeat(80));
  console.log('🧪 TESTING: Blackstone-Micron NDA Document');
  console.log('═'.repeat(80));
  console.log();

  const filePath = 'input files/Blackstone - Micron (NDA) - FN.docx';

  try {
    // Read the file
    console.log('📄 Reading file:', filePath);
    const buffer = await readFile(filePath);

    // Create a File object from buffer
    const file = new File([buffer], 'Blackstone - Micron (NDA) - FN.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    console.log('📦 File size:', (file.size / 1024).toFixed(2), 'KB');
    console.log();

    // Create extractor
    const extractor = new DocxListExtractor();

    // Extract text
    console.log('⚙️  Starting extraction...');
    console.log('─'.repeat(80));
    const startTime = Date.now();

    const result = await extractor.extractText(file);

    const endTime = Date.now();
    console.log('─'.repeat(80));
    console.log();

    // Display results
    if (result.success) {
      console.log('✅ EXTRACTION SUCCESSFUL');
      console.log();

      console.log('📊 Metadata:');
      console.log('   Processing time:', result.metadata.processingTime.toFixed(2), 'ms');
      console.log('   Extraction date:', result.metadata.extractionDate.toISOString());
      console.log();

      if (result.warning) {
        console.log('⚠️  Warnings:');
        console.log('   ', result.warning);
        console.log();
      }

      console.log('📝 Text Preview (first 500 characters):');
      console.log('─'.repeat(80));
      console.log(result.text.substring(0, 500));
      console.log('─'.repeat(80));
      console.log();

      console.log('📊 Text Statistics:');
      console.log('   Total characters:', result.text.length);
      console.log('   Total lines:', result.text.split('\n').length);
      console.log();

      // Look for numbered list items
      const lines = result.text.split('\n');
      const numberedLines = lines.filter(line => /^\s*\d+\./.test(line));
      const bulletLines = lines.filter(line => /^\s*•/.test(line));

      console.log('📋 List Detection:');
      console.log('   Numbered list items found:', numberedLines.length);
      console.log('   Bullet list items found:', bulletLines.length);
      console.log();

      if (numberedLines.length > 0) {
        console.log('✅ Numbered lists detected:');
        numberedLines.slice(0, 5).forEach(line => {
          console.log('   ', line.trim());
        });
        if (numberedLines.length > 5) {
          console.log('   ... and', numberedLines.length - 5, 'more');
        }
      } else {
        console.log('⚠️  No numbered lists detected (expected 3 items)');
      }
      console.log();

      // Expected: Document has 3 numbered list items
      console.log('🎯 Expected Results:');
      console.log('   ✓ Document should have ~3 numbered list items');
      console.log('   ✓ Warning should mention "negative indentation values"');
      console.log('   ✓ Console should show "Normalized X negative indentation values"');
      console.log();

      if (result.warning && result.warning.includes('negative indentation')) {
        console.log('✅ PASS: Negative indentation was detected and sanitized');
      } else {
        console.log('❓ INFO: No negative indentation warning (may not be needed)');
      }

    } else {
      console.log('❌ EXTRACTION FAILED');
      console.log();
      console.log('Error:', result.error);
      console.log();
      console.log('This suggests the pre-processing fix did not work as expected.');
    }

  } catch (error) {
    console.log('❌ TEST FAILED WITH EXCEPTION');
    console.log();
    console.log('Error:', error.message);
    console.log();
    if (error.stack) {
      console.log('Stack trace:');
      console.log(error.stack);
    }
  }

  console.log('═'.repeat(80));
  console.log('✅ Test complete');
  console.log('═'.repeat(80));
}

// Run the test
testBlackstoneMicron().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
