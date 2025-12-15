#!/usr/bin/env python3
"""
DOCX Test File Generator for Advanced Text Extraction Prototype

This script creates comprehensive test DOCX files with various list formats
to evaluate the effectiveness of different text extraction strategies.

Requirements:
    pip install python-docx

Usage:
    python create_test_files.py
"""

from docx import Document
from docx.shared import Inches
from docx.enum.text import WD_PARAGRAPH_ALIGNMENT
from docx.enum.style import WD_STYLE_TYPE
import os

def create_comprehensive_test_file():
    """Create a comprehensive test file with all list types"""
    doc = Document()
    
    # Title
    title = doc.add_heading('Comprehensive DOCX List Testing Document', 0)
    title.alignment = WD_PARAGRAPH_ALIGNMENT.CENTER
    
    # Introduction
    doc.add_paragraph(
        'This document contains various list formats to test DOCX text extraction '
        'algorithms and their ability to preserve list structure and formatting.'
    )
    
    # Section 1: Basic Numbered Lists
    doc.add_heading('1. Basic Numbered Lists', level=1)
    doc.add_paragraph('Standard decimal numbering:')
    
    for i in range(1, 6):
        p = doc.add_paragraph(f'This is numbered item {i} with standard decimal format.')
        p.style = 'List Number'
    
    doc.add_paragraph('Parenthesized numbering:')
    for i in range(1, 4):
        p = doc.add_paragraph(f'Item {i} with parentheses format.')
        p.style = 'List Number'
    
    # Section 2: Lettered Lists
    doc.add_heading('2. Alphabetic Lists', level=1)
    doc.add_paragraph('Lowercase letters:')
    
    letters = ['a', 'b', 'c', 'd', 'e']
    for i, letter in enumerate(letters):
        doc.add_paragraph(f'{letter}. This is alphabetic item {letter.upper()} using lowercase letters.')
    
    doc.add_paragraph('Uppercase letters:')
    letters_upper = ['A', 'B', 'C', 'D']
    for letter in letters_upper:
        doc.add_paragraph(f'{letter}. This is alphabetic item {letter} using uppercase letters.')
    
    # Section 3: Roman Numerals
    doc.add_heading('3. Roman Numeral Lists', level=1)
    doc.add_paragraph('Lowercase roman numerals:')
    
    romans = ['i', 'ii', 'iii', 'iv', 'v']
    for roman in romans:
        doc.add_paragraph(f'{roman}. This is roman numeral item {roman} in lowercase.')
    
    doc.add_paragraph('Uppercase roman numerals:')
    romans_upper = ['I', 'II', 'III', 'IV']
    for roman in romans_upper:
        doc.add_paragraph(f'{roman}. This is roman numeral item {roman} in uppercase.')
    
    # Section 4: Bullet Lists
    doc.add_heading('4. Bullet Point Lists', level=1)
    doc.add_paragraph('Standard bullet points:')
    
    bullets = [
        'First bullet point item',
        'Second bullet point with more detailed information',
        'Third bullet point demonstrating bullet list extraction',
        'Fourth bullet point for comprehensive testing',
        'Fifth bullet point to complete the set'
    ]
    
    for bullet in bullets:
        p = doc.add_paragraph(bullet)
        p.style = 'List Bullet'
    
    # Section 5: Nested Lists
    doc.add_heading('5. Nested Lists', level=1)
    doc.add_paragraph('Multi-level numbered lists:')
    
    # Level 1
    doc.add_paragraph('1. First main item')
    # Level 2
    doc.add_paragraph('   a. First sub-item under item 1')
    doc.add_paragraph('   b. Second sub-item under item 1')
    doc.add_paragraph('   c. Third sub-item with more nesting:')
    # Level 3
    doc.add_paragraph('      i. Deep nested item 1')
    doc.add_paragraph('      ii. Deep nested item 2')
    
    # Back to level 1
    doc.add_paragraph('2. Second main item')
    doc.add_paragraph('   a. Sub-item under item 2')
    doc.add_paragraph('   b. Another sub-item under item 2')
    
    doc.add_paragraph('3. Third main item without sub-items')
    
    # Section 6: Mixed Lists
    doc.add_heading('6. Mixed List Types', level=1)
    doc.add_paragraph('Combination of different list formats:')
    
    doc.add_paragraph('A. Primary section in letters')
    doc.add_paragraph('   1. Numbered subsection')
    doc.add_paragraph('   2. Another numbered subsection')
    doc.add_paragraph('      • Bullet point under numbers')
    doc.add_paragraph('      • Another bullet point')
    
    doc.add_paragraph('B. Second primary section')
    doc.add_paragraph('   i. Roman numeral subsection')
    doc.add_paragraph('   ii. Another roman subsection')
    
    # Section 7: Custom Formats
    doc.add_heading('7. Custom List Formats', level=1)
    doc.add_paragraph('Bracketed numbers:')
    
    for i in range(1, 5):
        doc.add_paragraph(f'[{i}] This is a bracketed number format item {i}.')
    
    doc.add_paragraph('Parenthesized letters:')
    for i, letter in enumerate(['a', 'b', 'c', 'd']):
        doc.add_paragraph(f'({letter}) This is a parenthesized letter format item.')
    
    # Section 8: Interrupted Lists
    doc.add_heading('8. Interrupted Lists', level=1)
    doc.add_paragraph('Lists with interrupting text:')
    
    doc.add_paragraph('1. First item in the list')
    doc.add_paragraph('2. Second item in the list')
    
    doc.add_paragraph('This is interrupting text between list items. It should not be treated as a list item.')
    
    doc.add_paragraph('3. Third item continuing the list after interruption')
    doc.add_paragraph('4. Fourth item to complete the interrupted list')
    
    # Section 9: Complex Content
    doc.add_heading('9. Complex List Content', level=1)
    doc.add_paragraph('Lists with complex content:')
    
    complex_items = [
        '1. This item contains multiple sentences. It demonstrates how extraction algorithms handle longer content. The algorithm should preserve the entire content while maintaining the list structure.',
        '2. This item has special characters: @#$%^&*()_+-={}[]|\\:";\'<>?,./~ and numbers 1234567890.',
        '3. This item contains a quote: "The quick brown fox jumps over the lazy dog" and continues with more text.',
        '4. This item mentions dates (January 1, 2025), times (10:30 AM), and percentages (95.5%).',
        '5. This final item tests Unicode characters: é, ñ, ü, 中文, العربية, русский'
    ]
    
    for item in complex_items:
        doc.add_paragraph(item)
    
    # Section 10: Stress Test
    doc.add_heading('10. Stress Test Lists', level=1)
    doc.add_paragraph('Large number of items for performance testing:')
    
    for i in range(1, 26):  # 25 items
        doc.add_paragraph(f'{i}. Stress test item number {i} to evaluate performance with larger lists.')
    
    # Conclusion
    doc.add_heading('Conclusion', level=1)
    doc.add_paragraph(
        'This comprehensive test document covers all major list types and edge cases '
        'that text extraction algorithms should handle correctly. Use this document '
        'to evaluate and compare different extraction strategies.'
    )
    
    return doc

def create_simple_test_file():
    """Create a simple test file for basic testing"""
    doc = Document()
    
    doc.add_heading('Simple DOCX Test Document', 0)
    
    doc.add_paragraph('This is a simple test document with basic list formats.')
    
    doc.add_heading('Simple Numbered List', level=1)
    for i in range(1, 4):
        doc.add_paragraph(f'{i}. Simple numbered item {i}')
    
    doc.add_heading('Simple Bullet List', level=1)
    bullets = ['First bullet', 'Second bullet', 'Third bullet']
    for bullet in bullets:
        p = doc.add_paragraph(bullet)
        p.style = 'List Bullet'
    
    return doc

def create_complex_nested_file():
    """Create a file with complex nested structures"""
    doc = Document()
    
    doc.add_heading('Complex Nested Lists Test', 0)
    
    doc.add_paragraph('Testing deep nesting and complex hierarchies:')
    
    # Create a complex outline structure
    doc.add_paragraph('I. First Major Section')
    doc.add_paragraph('   A. First Subsection')
    doc.add_paragraph('      1. First numbered item')
    doc.add_paragraph('         a. First lettered sub-item')
    doc.add_paragraph('            i. First roman sub-sub-item')
    doc.add_paragraph('            ii. Second roman sub-sub-item')
    doc.add_paragraph('         b. Second lettered sub-item')
    doc.add_paragraph('      2. Second numbered item')
    doc.add_paragraph('   B. Second Subsection')
    doc.add_paragraph('      1. Another numbered item')
    doc.add_paragraph('      2. Yet another numbered item')
    
    doc.add_paragraph('II. Second Major Section')
    doc.add_paragraph('   A. Complex mixed formatting')
    doc.add_paragraph('      • Bullet point in outline')
    doc.add_paragraph('      • Another bullet point')
    doc.add_paragraph('         1. Number under bullet')
    doc.add_paragraph('         2. Another number under bullet')
    
    return doc

def create_legal_document_test():
    """Create a legal-style document with complex numbering"""
    doc = Document()
    
    doc.add_heading('Legal Document Format Test', 0)
    
    doc.add_paragraph('AGREEMENT')
    
    doc.add_paragraph(
        'This Agreement demonstrates legal document formatting with '
        'complex numbering schemes commonly found in contracts and legal documents.'
    )
    
    doc.add_paragraph('1. DEFINITIONS')
    doc.add_paragraph('   1.1 "Party" means any entity bound by this agreement.')
    doc.add_paragraph('   1.2 "Effective Date" means the date this agreement becomes binding.')
    doc.add_paragraph('   1.3 "Territory" means the geographical area covered by this agreement.')
    
    doc.add_paragraph('2. OBLIGATIONS')
    doc.add_paragraph('   2.1 Party Obligations:')
    doc.add_paragraph('       (a) First obligation with detailed description')
    doc.add_paragraph('       (b) Second obligation with specific requirements')
    doc.add_paragraph('       (c) Third obligation with performance metrics')
    doc.add_paragraph('   2.2 Additional Requirements:')
    doc.add_paragraph('       (i) First additional requirement')
    doc.add_paragraph('       (ii) Second additional requirement')
    
    doc.add_paragraph('3. REMEDIES')
    doc.add_paragraph('   3.1 In case of breach:')
    doc.add_paragraph('       3.1.1 Immediate notification required')
    doc.add_paragraph('       3.1.2 Cure period of thirty (30) days')
    doc.add_paragraph('       3.1.3 Right to terminate upon failure to cure')
    
    return doc

def main():
    """Generate all test files"""
    output_dir = "test_files"
    os.makedirs(output_dir, exist_ok=True)
    
    print("Generating DOCX test files...")
    
    # Generate different test files
    test_files = {
        'comprehensive_test.docx': create_comprehensive_test_file(),
        'simple_test.docx': create_simple_test_file(),
        'complex_nested_test.docx': create_complex_nested_file(),
        'legal_document_test.docx': create_legal_document_test()
    }
    
    for filename, doc in test_files.items():
        filepath = os.path.join(output_dir, filename)
        doc.save(filepath)
        print(f"Created: {filepath}")
    
    print(f"\nAll test files created in '{output_dir}' directory.")
    print("\nFile descriptions:")
    print("- comprehensive_test.docx: Complete test with all list types")
    print("- simple_test.docx: Basic lists for quick testing")
    print("- complex_nested_test.docx: Deep nesting and hierarchy")
    print("- legal_document_test.docx: Legal-style complex numbering")
    print("\nUse these files to test the DOCX extraction prototype.")

if __name__ == "__main__":
    main()