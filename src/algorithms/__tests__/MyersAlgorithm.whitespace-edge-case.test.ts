import { describe, it, expect } from 'vitest';
import { MyersAlgorithm } from '../MyersAlgorithm';

describe('MyersAlgorithm - Whitespace Edge Case Bug', () => {
  it('should handle the exact user-reported inputs correctly', async () => {
    // Exact inputs from user report
    const original = "line 1\nline 3";
    const revised = "line a\nline 3";
    
    console.log('Testing exact user inputs:');
    console.log('Original:', JSON.stringify(original));
    console.log('Revised:', JSON.stringify(revised));
    
    const result = await MyersAlgorithm.compare(original, revised);
    
    console.log('\nUser inputs result changes:');
    result.changes.forEach((change, index) => {
      console.log(`${index}: ${change.type} - content: ${JSON.stringify(change.content)} - original: ${JSON.stringify(change.originalContent)} - revised: ${JSON.stringify(change.revisedContent)}`);
    });
    
    // The key issue: we should NOT have a change that includes line breaks
    const problemChanges = result.changes.filter(change => 
      change.type === 'changed' && 
      (change.originalContent?.includes('\n') || change.revisedContent?.includes('\n'))
    );
    
    console.log('\nProblematic changes with line breaks:', problemChanges);
    
    // This should be empty after our fix
    expect(problemChanges).toHaveLength(0);
  });

  it('should handle the version example from user report', async () => {
    // Version example from user report
    const original = "version 1\n";
    const revised = "version 2 \n";
    
    console.log('\nTesting version example:');
    console.log('Original:', JSON.stringify(original));
    console.log('Revised:', JSON.stringify(revised));
    
    const result = await MyersAlgorithm.compare(original, revised);
    
    console.log('\nVersion example result changes:');
    result.changes.forEach((change, index) => {
      console.log(`${index}: ${change.type} - content: ${JSON.stringify(change.content)} - original: ${JSON.stringify(change.originalContent)} - revised: ${JSON.stringify(change.revisedContent)}`);
    });
    
    // Check for problematic changes with line breaks
    const problemChanges = result.changes.filter(change => 
      change.type === 'changed' && 
      (change.originalContent?.includes('\n') || change.revisedContent?.includes('\n'))
    );
    
    console.log('\nProblematic changes with line breaks:', problemChanges);
    expect(problemChanges).toHaveLength(0);
  });

  it('should handle trailing whitespace followed by line break correctly', async () => {
    const original = "version 1\n";
    const revised = "version 2 \n";  // Note the space after "2"
    
    console.log('Testing edge case:');
    console.log('Original:', JSON.stringify(original));
    console.log('Revised:', JSON.stringify(revised));
    
    const result = await MyersAlgorithm.compare(original, revised);
    
    console.log('\nResult changes:');
    result.changes.forEach((change, index) => {
      console.log(`${index}: ${change.type} - content: ${JSON.stringify(change.content)} - original: ${JSON.stringify(change.originalContent)} - revised: ${JSON.stringify(change.revisedContent)}`);
    });
    
    // CRITICAL FIX: After our boundary detection fix, line breaks should NOT be included in substitutions
    // We should now have separate removed/added blocks instead of a problematic changed block with line breaks
    
    // After surgical precision fix, we should have individual changes
    const removedNumber = result.changes.find(change => 
      change.type === 'removed' && change.content === '1'
    );
    
    const removedNewline = result.changes.find(change => 
      change.type === 'removed' && change.content === '\n'
    );
    
    const addedNumber = result.changes.find(change => 
      change.type === 'added' && change.content === '2'
    );
    
    const addedSpaceNewline = result.changes.find(change => 
      change.type === 'added' && change.content === ' \n'
    );
    
    // These individual changes should exist (surgical precision)
    expect(removedNumber).toBeDefined();
    expect(addedNumber).toBeDefined();
    expect(removedNewline).toBeDefined();
    expect(addedSpaceNewline).toBeDefined();
    
    // We should NOT have a 'changed' block that includes line breaks (this was the bug)
    const changeWithLineBreak = result.changes.find(change => 
      change.type === 'changed' && 
      (change.originalContent?.includes('\n') || change.revisedContent?.includes('\n'))
    );
    expect(changeWithLineBreak).toBeUndefined();
    
    // Check that we don't have weird line break fragmentation
    const lineBreakChanges = result.changes.filter(change => 
      change.content.includes('\n') || 
      change.originalContent?.includes('\n') || 
      change.revisedContent?.includes('\n')
    );
    
    console.log('\nLine break changes:');
    lineBreakChanges.forEach((change, index) => {
      console.log(`Line break change ${index}: ${change.type} - content: ${JSON.stringify(change.content)} - original: ${JSON.stringify(change.originalContent)} - revised: ${JSON.stringify(change.revisedContent)}`);
    });
    
    // The line break handling should be clean - it should either:
    // 1. Be part of unchanged content, or
    // 2. Be handled as a whitespace substitution
    
    // What we DON'T want is the line break to be split weirdly causing rendering issues
    
  });
  
  it('should handle the simpler case without trailing space', async () => {
    const original = "version 1\n";
    const revised = "version 2\n";  // No trailing space
    
    console.log('\nTesting simple case:');
    console.log('Original:', JSON.stringify(original));
    console.log('Revised:', JSON.stringify(revised));
    
    const result = await MyersAlgorithm.compare(original, revised);
    
    console.log('\nSimple case result changes:');
    result.changes.forEach((change, index) => {
      console.log(`${index}: ${change.type} - content: ${JSON.stringify(change.content)} - original: ${JSON.stringify(change.originalContent)} - revised: ${JSON.stringify(change.revisedContent)}`);
    });
    
    // This simpler case should work correctly
    const numberChange = result.changes.find(change => 
      change.type === 'changed' && 
      change.originalContent === '1' &&
      change.revisedContent === '2'
    );
    
    expect(numberChange).toBeDefined();
  });

  it('should handle YOUR EXACT edge case: trailing newline removal', async () => {
    const original = "v1\n";
    const revised = "v2";  // No trailing newline - this is your case!
    
    console.log('\n🎯 Testing YOUR EXACT edge case:');
    console.log('Original:', JSON.stringify(original));
    console.log('Revised:', JSON.stringify(revised));
    
    const result = await MyersAlgorithm.compare(original, revised);
    
    console.log('\nYour edge case result changes:');
    result.changes.forEach((change, index) => {
      console.log(`${index}: ${change.type} - content: ${JSON.stringify(change.content)} - original: ${JSON.stringify(change.originalContent)} - revised: ${JSON.stringify(change.revisedContent)}`);
    });
    
    // Check if we have explicit newline removal or if it's hidden in a substitution
    const newlineRemoval = result.changes.find(change => 
      change.type === 'removed' && change.content === '\n'
    );
    
    const newlineInSubstitution = result.changes.find(change =>
      change.type === 'changed' && 
      (change.originalContent?.includes('\n') || change.revisedContent?.includes('\n'))
    );
    
    console.log('\n🔍 Newline removal analysis:');
    console.log('Explicit newline removal found:', !!newlineRemoval);
    console.log('Newline in substitution:', !!newlineInSubstitution);
    console.log('Total changes:', result.changes.length);
    
    // The issue: we should see the newline removal explicitly
    if (!newlineRemoval && !newlineInSubstitution) {
      console.log('❌ PROBLEM: Newline removal is not visible in the output!');
    }
  });
});