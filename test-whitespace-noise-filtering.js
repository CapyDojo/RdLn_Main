/**
 * Test script to verify whitespace noise filtering works correctly
 */

import { MyersAlgorithm } from './src/algorithms/MyersAlgorithm.js';

// Test case: Word document vs PDF-pasted version with different whitespace
const originalText = "This is a sentence.\nThis is another sentence.";
const revisedText = "This is a sentence.\n\nThis is another sentence.";

console.log('🧪 Testing whitespace noise filtering...\n');

console.log('Original text:');
console.log(JSON.stringify(originalText));
console.log('\nRevised text:');
console.log(JSON.stringify(revisedText));

console.log('\n--- Running comparison ---\n');

// Enable debug mode to see filtering in action
try {
  MyersAlgorithm.compare(originalText, revisedText)
    .then(result => {
      console.log('\n📊 Comparison Results:');
      console.log(`Total changes: ${result.changes.length}`);
      console.log('Changes:');
      result.changes.forEach((change, index) => {
        const content = change.type === 'changed' 
          ? `"${change.originalContent}" → "${change.revisedContent}"`
          : `"${change.content}"`;
        console.log(`  ${index + 1}. ${change.type}: ${content}`);
      });
      
      console.log('\n✅ Test completed successfully!');
      
      // Check if noise was filtered
      const whitespaceChanges = result.changes.filter(c => 
        c.type !== 'unchanged' && /^\s*$/.test(c.content || c.originalContent || c.revisedContent || '')
      );
      
      if (whitespaceChanges.length === 0) {
        console.log('🧹 No whitespace-only changes detected - filtering appears to be working!');
      } else {
        console.log(`⚠️ Found ${whitespaceChanges.length} whitespace-only changes:`, whitespaceChanges);
      }
    })
    .catch(error => {
      console.error('❌ Test failed:', error);
    });
} catch (error) {
  console.error('❌ Test setup failed:', error);
}