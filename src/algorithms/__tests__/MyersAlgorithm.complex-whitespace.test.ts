import { describe, it, expect } from 'vitest';
import { MyersAlgorithm } from '../MyersAlgorithm';

describe('MyersAlgorithm - Complex Whitespace Test Cases', () => {
  it('should handle multiple consecutive spaces', async () => {
    const original = "word1    word2";  // 4 spaces
    const revised = "word1  word2";     // 2 spaces
    
    console.log('\n=== Multiple Spaces Test ===');
    console.log('Original:', JSON.stringify(original));
    console.log('Revised:', JSON.stringify(revised));
    
    const result = await MyersAlgorithm.compare(original, revised);
    
    console.log('Result changes:');
    result.changes.forEach((change, index) => {
      console.log(`${index}: ${change.type} - content: ${JSON.stringify(change.content)} - original: ${JSON.stringify(change.originalContent)} - revised: ${JSON.stringify(change.revisedContent)}`);
    });
  });

  it('should handle mixed whitespace types', async () => {
    const original = "line1\t\n\tline2";  // tab, newline, tab
    const revised = "line1  \n  line2";  // 2 spaces, newline, 2 spaces
    
    console.log('\n=== Mixed Whitespace Test ===');
    console.log('Original:', JSON.stringify(original));
    console.log('Revised:', JSON.stringify(revised));
    
    const result = await MyersAlgorithm.compare(original, revised);
    
    console.log('Result changes:');
    result.changes.forEach((change, index) => {
      console.log(`${index}: ${change.type} - content: ${JSON.stringify(change.content)} - original: ${JSON.stringify(change.originalContent)} - revised: ${JSON.stringify(change.revisedContent)}`);
    });
  });

  it('should handle paragraph formatting changes', async () => {
    const original = "Section 1.\n\nSection 2.";     // double newline
    const revised = "Section 1.\n \n \nSection 2.";  // newline, space, newline, space, newline
    
    console.log('\n=== Paragraph Formatting Test ===');
    console.log('Original:', JSON.stringify(original));
    console.log('Revised:', JSON.stringify(revised));
    
    const result = await MyersAlgorithm.compare(original, revised);
    
    console.log('Result changes:');
    result.changes.forEach((change, index) => {
      console.log(`${index}: ${change.type} - content: ${JSON.stringify(change.content)} - original: ${JSON.stringify(change.originalContent)} - revised: ${JSON.stringify(change.revisedContent)}`);
    });
  });

  it('should handle trailing whitespace variations', async () => {
    const original = "contract  \nterm  \n";    // 2 spaces before each newline
    const revised = "contract\nterm    \n";     // no space before first, 4 spaces before second
    
    console.log('\n=== Trailing Whitespace Test ===');
    console.log('Original:', JSON.stringify(original));
    console.log('Revised:', JSON.stringify(revised));
    
    const result = await MyersAlgorithm.compare(original, revised);
    
    console.log('Result changes:');
    result.changes.forEach((change, index) => {
      console.log(`${index}: ${change.type} - content: ${JSON.stringify(change.content)} - original: ${JSON.stringify(change.originalContent)} - revised: ${JSON.stringify(change.revisedContent)}`);
    });
  });

  it('should handle legal document indentation', async () => {
    const original = "    (a) First clause\n        (i) Sub-clause";     // 4 spaces, then 8 spaces
    const revised = "  (a) First clause\n      (i) Sub-clause";        // 2 spaces, then 6 spaces
    
    console.log('\n=== Legal Indentation Test ===');
    console.log('Original:', JSON.stringify(original));
    console.log('Revised:', JSON.stringify(revised));
    
    const result = await MyersAlgorithm.compare(original, revised);
    
    console.log('Result changes:');
    result.changes.forEach((change, index) => {
      console.log(`${index}: ${change.type} - content: ${JSON.stringify(change.content)} - original: ${JSON.stringify(change.originalContent)} - revised: ${JSON.stringify(change.revisedContent)}`);
    });
  });

  it('should handle word with embedded spaces to underscores', async () => {
    const original = "file name.pdf";
    const revised = "file_name.pdf";
    
    console.log('\n=== Space to Underscore Test ===');
    console.log('Original:', JSON.stringify(original));
    console.log('Revised:', JSON.stringify(revised));
    
    const result = await MyersAlgorithm.compare(original, revised);
    
    console.log('Result changes:');
    result.changes.forEach((change, index) => {
      console.log(`${index}: ${change.type} - content: ${JSON.stringify(change.content)} - original: ${JSON.stringify(change.originalContent)} - revised: ${JSON.stringify(change.revisedContent)}`);
    });
  });

  it('should handle the Engine/Engines case that breaks line structure', async () => {
    const original = "Engine\n\nPower";
    const revised = "Engines\n \nPower";
    
    console.log('\n=== Engine/Engines Line Structure Test ===');
    console.log('Original:', JSON.stringify(original));
    console.log('Revised:', JSON.stringify(revised));
    
    const result = await MyersAlgorithm.compare(original, revised);
    
    console.log('Result changes:');
    result.changes.forEach((change, index) => {
      console.log(`${index}: ${change.type} - content: ${JSON.stringify(change.content)} - original: ${JSON.stringify(change.originalContent)} - revised: ${JSON.stringify(change.revisedContent)}`);
    });
    
    console.log(`Total changes: ${result.changes.length}`);
  });

  it('should handle the original edge case for reference', async () => {
    const original = "version 1\n";
    const revised = "version 2 \n";
    
    console.log('\n=== Original Edge Case ===');
    console.log('Original:', JSON.stringify(original));
    console.log('Revised:', JSON.stringify(revised));
    
    const result = await MyersAlgorithm.compare(original, revised);
    
    console.log('Result changes:');
    result.changes.forEach((change, index) => {
      console.log(`${index}: ${change.type} - content: ${JSON.stringify(change.content)} - original: ${JSON.stringify(change.originalContent)} - revised: ${JSON.stringify(change.revisedContent)}`);
    });
    
    // Count how many individual whitespace changes we get
    const whitespaceChanges = result.changes.filter(change => 
      /^\s+$/.test(change.content || '') || 
      /^\s+$/.test(change.originalContent || '') || 
      /^\s+$/.test(change.revisedContent || '')
    );
    
    console.log(`Total whitespace-only changes: ${whitespaceChanges.length}`);
  });
});