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

  test('preserves line breaks after extended semantic patterns', () => {
    const input = `The requirements are:-
First requirement description goes here in more detail
Second requirement description follows with additional information
The options include; or
Alternative option one with detailed explanation
Alternative option two with comprehensive details`;

    const expected = `The requirements are:-

First requirement description goes here in more detail Second requirement description follows with additional information The options include; or

Alternative option one with detailed explanation Alternative option two with comprehensive details`;

    expect(formatPastedText(input)).toBe(expected);
  });

  test('handles Chinese PDF line wrapping correctly', () => {
    const input = `本协议规定了双方的权利
和义务，包括但不限于
保密条款的执行。
第二条款明确了
违约责任和处理方式。`;

    const expected = `本协议规定了双方的权利

和义务，包括但不限于

保密条款的执行。

第二条款明确了

违约责任和处理方式。`;

    expect(formatPastedText(input)).toBe(expected);
  });

  test('preserves Chinese structural elements', () => {
    const input = `保密协议
本协议于2025年1月22日签署
甲方
北京投资管理有限公司
乙方
上海金融服务公司`;

    const expected = `保密协议

本协议于2025年1月22日签署

甲方

北京投资管理有限公司

乙方

上海金融服务公司`;

    expect(formatPastedText(input)).toBe(expected);
  });

  test('handles mixed Chinese and English content', () => {
    const input = `CONFIDENTIALITY AGREEMENT 保密协议
This Agreement 本协议 is made between
AIA Investment Management
和 Blackstone Alternative`;

    const expected = `CONFIDENTIALITY AGREEMENT 保密协议

This Agreement 本协议 is made between

AIA Investment Management

和 Blackstone Alternative`;

    expect(formatPastedText(input)).toBe(expected);
  });

  test('handles pure English text in bilingual document', () => {
    const input = `saction with the
Company (a "Transaction"), you have requested certain information concerning the Company, its
affiliates and/or the Transaction from the Company's directors, officers, employees,
representatives and/or agents (including without limitation, attorneys, accountants, consultants and
financial advisors) (the Company's "Representatives").`;

    const expected = `saction with the

Company (a "Transaction"), you have requested certain information concerning the Company, its affiliates and/or the Transaction from the Company's directors, officers, employees, representatives and/or agents (including without limitation, attorneys, accountants, consultants and financial advisors) (the Company's "Representatives").`;

    expect(formatPastedText(input)).toBe(expected);
  });

  test('handles Chinese enumeration commas correctly', () => {
    const input = `以及由贵方或贵方代表编制的包含或全部或部分基于任何该等信息的任何分析、
汇编、预测和/或其他文件在本信函协议中合称为"保密信息"。`;

    const expected = `以及由贵方或贵方代表编制的包含或全部或部分基于任何该等信息的任何分析、汇编、预测和/或其他文件在本信函协议中合称为"保密信息"。`;

    expect(formatPastedText(input)).toBe(expected);
  });

});
