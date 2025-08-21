import { OCRTextCleanupService } from './OCRTextCleanupService';

describe('OCRTextCleanupService', () => {
  describe('fixLegalTerminology', () => {
    it('should uppercase legal terms only at sentence starts', () => {
      const input = 'Whereas the parties agree. whereas mid-sentence.';
      const expected = 'WHEREAS the parties agree. whereas mid-sentence.';
      expect(OCRTextCleanupService['fixLegalTerminology'](input)).toBe(expected);
    });

    it('should skip corrections inside quoted text', () => {
      const input = 'The contract states: "whereas the parties agree, now therefore" but Whereas outside.';
      const expected = 'The contract states: "whereas the parties agree, now therefore" but WHEREAS outside.';
      expect(OCRTextCleanupService['fixLegalTerminology'](input)).toBe(expected);
    });

    it('should handle common legal abbreviations correctly', () => {
      const input = 'See sec. 5 and para. 3 of the inc contract.';
      const expected = 'See Sec. 5 and Para. 3 of the Inc contract.';
      expect(OCRTextCleanupService['fixLegalTerminology'](input)).toBe(expected);
    });

    it('should not alter text inside quotes for abbreviations', () => {
      const input = '"inc. vs corp." but LLC outside.';
      const expected = '"inc. vs corp." but LLC outside.';
      expect(OCRTextCleanupService['fixLegalTerminology'](input)).toBe(expected);
    });
  });

  describe('fixSpacingAndPunctuation', () => {
    it('should preserve spacing in legal lists', () => {
      const input = '1.   First item\n   (a) Subitem\nB. Second item';
      const expected = '1.   First item\n   (a) Subitem\nB. Second item';
      expect(OCRTextCleanupService['fixSpacingAndPunctuation'](input)).toBe(expected);
    });

    it('should fix general spacing issues', () => {
      const input = 'This  is a test .With( extra )spaces';
      const expected = 'This is a test. With(extra) spaces';
      expect(OCRTextCleanupService['fixSpacingAndPunctuation'](input)).toBe(expected);
    });

    it('should handle punctuation spacing in legal contexts', () => {
      const input = 'The parties agree:Now therefore,they proceed.';
      const expected = 'The parties agree: Now therefore, they proceed.';
      expect(OCRTextCleanupService['fixSpacingAndPunctuation'](input)).toBe(expected);
    });

    it('should not alter intentional spacing in numbered paragraphs', () => {
      const input = 'Section 1.  Definitions.\n   1.1 "Term" means...';
      const expected = 'Section 1.  Definitions.\n   1.1 "Term" means...';
      expect(OCRTextCleanupService['fixSpacingAndPunctuation'](input)).toBe(expected);
    });
  });
});