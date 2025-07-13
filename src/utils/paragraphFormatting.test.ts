import { formatPastedText } from './paragraphFormatting';

describe('formatPastedText - Legal Contract Headers', () => {
  test('preserves document title structure', () => {
    const input = `CONFIDENTIALITY AGREEMENT\nThis Agreement is made...`;
    const expected = `CONFIDENTIALITY AGREEMENT\n\nThis Agreement is made...`;
    expect(formatPastedText(input)).toBe(expected);
  });

  test('handles party sections correctly', () => {
    const input = `Between\nAIA Investment Management...\nand\nBlackstone Alternative...`;
    const expected = `Between\n\nAIA Investment Management...\n\nand\n\nBlackstone Alternative...`;
    expect(formatPastedText(input)).toBe(expected);
  });

  test('preserves effective date clauses', () => {
    const input = `This Agreement is made on 22 January, 2025 (\"Effective Date\").`;
    const expected = input; // Should remain unchanged
    expect(formatPastedText(input)).toBe(expected);
  });

  test('handles full contract header example', () => {
    const input = `CONFIDENTIALITY AGREEMENT\nThis Agreement is made on 22 January, 2025...\nBetween\nAIA Investment Management...\nand\nBlackstone Alternative...\n(collectively referred to as \"Parties\").`;
    
    const expected = `CONFIDENTIALITY AGREEMENT\n\nThis Agreement is made on 22 January, 2025...\n\nBetween\n\nAIA Investment Management...\n\nand\n\nBlackstone Alternative...\n\n(collectively referred to as \"Parties\").`;
    
    expect(formatPastedText(input)).toBe(expected);
  });

  test('does not affect regular paragraphs', () => {
    const input = `This is a regular paragraph.\nIt should be joined normally.`;
    const expected = `This is a regular paragraph. It should be joined normally.`;
    expect(formatPastedText(input)).toBe(expected);
  });
});
