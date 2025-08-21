
import { OCRTextCleanupService } from '../OCRTextCleanupService';
import { OCRLanguage } from '../../types/ocr-types';

describe('OCRTextCleanupService Legal Text', () => {
  it('should not over-join lines in a legal document', async () => {
    const inputText = `
IN WITNESS WHEREOF, the parties hereto have executed this Agreement as of the date first above written.

PLAINTIFF:
/s/ John Doe
_________________________
John Doe

DEFENDANT:
/s/ Jane Smith
_________________________
Jane Smith
`;
    const languages: OCRLanguage[] = ['eng'];
    const result = await OCRTextCleanupService.processText(inputText, languages);
    expect(result.processedText).toContain('IN WITNESS WHEREOF');
    expect(result.processedText).toContain('PLAINTIFF:');
    expect(result.processedText).toContain('/s/ John Doe');
    expect(result.processedText).toContain('John Doe');
    expect(result.processedText).toContain('DEFENDANT:');
    expect(result.processedText).toContain('/s/ Jane Smith');
    expect(result.processedText).toContain('Jane Smith');
    // Check for multiple newlines to ensure structure is preserved
    expect(result.processedText.match(/\n\n/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it('should preserve numbered lists without joining them', async () => {
    const inputText = `
1. The first party agrees to the following terms.
2. The second party shall also agree to the terms.
   a. Sub-point one.
   b. Sub-point two.
3. Final point.
`;
    const languages: OCRLanguage[] = ['eng'];
    const result = await OCRTextCleanupService.processText(inputText, languages);
    expect(result.processedText).toContain('1. The first party');
    expect(result.processedText).toContain('2. The second party');
    expect(result.processedText).toContain('a. Sub-point one.');
    expect(result.processedText).toContain('b. Sub-point two.');
    expect(result.processedText).toContain('3. Final point.');
  });

  it('should not join lines ending with a comma if the next line starts with a capital letter', async () => {
    const inputText = `
The party of the first part,
And the party of the second part, agree to the terms.
`;
    const languages: OCRLanguage[] = ['eng'];
    const result = await OCRTextCleanupService.processText(inputText, languages);
    expect(result.processedText).not.toContain('The party of the first part, And the party');
  });
});
