import { formatPastedText } from './paragraphFormatting';

describe('formatPastedText - Legal Contract Headers', () => {
  test('preserves document title structure', () => {
    const input = `CONFIDENTIALITY AGREEMENT\nThis Agreement is made...`;
    const expected = `CONFIDENTIALITY AGREEMENT\n\nThis Agreement is made...`;
    expect(formatPastedText(input)).toBe(expected);
  });

  test('handles party sections correctly', () => {
    const input = `Between\nAIA Investment Management...\nand\nBlackstone Alternative...`;
    const expected = `Between

AIA Investment Management...

and

Blackstone Alternative...`;
    expect(formatPastedText(input)).toBe(expected);
  });

  test('preserves effective date clauses', () => {
    const input = `This Agreement is made on 22 January, 2025 (\"Effective Date\").`;
    const expected = input; // Should remain unchanged
    expect(formatPastedText(input)).toBe(expected);
  });

  test('handles full contract header example', () => {
    const input = `CONFIDENTIALITY AGREEMENT\nThis Agreement is made on 22 January, 2025...\nBetween\nAIA Investment Management...\nand\nBlackstone Alternative...\n(collectively referred to as \"Parties\").`;
    
    const expected = `CONFIDENTIALITY AGREEMENT

This Agreement is made on 22 January, 2025...

Between

AIA Investment Management...

and

Blackstone Alternative...

(collectively referred to as \"Parties\").`;
    
    expect(formatPastedText(input)).toBe(expected);
  });

  test('does not affect regular paragraphs', () => {
    const input = `This is a regular paragraph.\nIt should be joined normally.`;
    const expected = `This is a regular paragraph.

It should be joined normally.`;
    expect(formatPastedText(input)).toBe(expected);
  });

  test('joins numbered paragraph continuation lines correctly', () => {
    const input = `8. Unless expressly provided to the contrary in this Undertaking, a person who is not a
party to this Undertaking may not enforce any of its terms under The Contracts
(Rights of Third Parties) Act 2001 of Singapore and, notwithstanding any term of this
Undertaking, the consent of any third party is not required for any variation (including
any release or compromise of any liability) or termination of this Undertaking.
9. Notwithstanding anything to the contrary provided elsewhere herein, none of the
provisions of this Undertaking shall in any way limit the activities of Blackstone Inc.`;

    const expected = `8. Unless expressly provided to the contrary in this Undertaking, a person who is not a party to this Undertaking may not enforce any of its terms under The Contracts (Rights of Third Parties) Act 2001 of Singapore and, notwithstanding any term of this Undertaking, the consent of any third party is not required for any variation (including any release or compromise of any liability) or termination of this Undertaking.

9. Notwithstanding anything to the contrary provided elsewhere herein, none of the provisions of this Undertaking shall in any way limit the activities of Blackstone Inc.`;

    expect(formatPastedText(input)).toBe(expected);
  });
});
