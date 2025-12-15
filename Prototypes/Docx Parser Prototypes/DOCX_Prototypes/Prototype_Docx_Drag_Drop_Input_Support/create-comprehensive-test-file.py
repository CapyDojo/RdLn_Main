from docx import Document

# Create a new Document
doc = Document()

# Add a title
doc.add_heading('Comprehensive List Formatting Test Document', 0)

# Add introduction
doc.add_paragraph('This document contains various list formats to test DOCX processing capabilities.')

# Add a heading for standard numbered lists
doc.add_heading('Standard Numbered Lists', 1)

# Add a standard numbered list
doc.add_paragraph('First numbered item', style='List Number')
doc.add_paragraph('Second numbered item', style='List Number')
doc.add_paragraph('Third numbered item', style='List Number')

# Add a heading for bulleted lists
doc.add_heading('Standard Bulleted Lists', 1)

# Add a standard bulleted list
doc.add_paragraph('First bulleted item', style='List Bullet')
doc.add_paragraph('Second bulleted item', style='List Bullet')
doc.add_paragraph('Third bulleted item', style='List Bullet')

# Add a heading for alphabetic lists
doc.add_heading('Alphabetic Lists', 1)

# Note: Python-docx doesn't directly support custom numbering formats
# But we can add paragraphs that will be recognized as lists
doc.add_paragraph('a. First alphabetic item')
doc.add_paragraph('b. Second alphabetic item')
doc.add_paragraph('c. Third alphabetic item')

# Add a heading for roman numeral lists
doc.add_heading('Roman Numeral Lists', 1)

doc.add_paragraph('i. First roman numeral item')
doc.add_paragraph('ii. Second roman numeral item')
doc.add_paragraph('iii. Third roman numeral item')

# Add a heading for custom format lists
doc.add_heading('Custom Format Lists', 1)

doc.add_paragraph('(1) First parenthesized item')
doc.add_paragraph('(2) Second parenthesized item')
doc.add_paragraph('(3) Third parenthesized item')

# Add a heading for bracketed lists
doc.add_heading('Bracketed Lists', 1)

doc.add_paragraph('[1] First bracketed item')
doc.add_paragraph('[2] Second bracketed item')
doc.add_paragraph('[3] Third bracketed item')

# Add a heading for nested lists
doc.add_heading('Nested List Example', 1)

# Add a nested list structure
doc.add_paragraph('Main item 1', style='List Number')
doc.add_paragraph('Sub-item 1.1', style='List Number 2')
doc.add_paragraph('Sub-item 1.2', style='List Number 2')
doc.add_paragraph('Main item 2', style='List Number')
doc.add_paragraph('Sub-item 2.1', style='List Number 2')
doc.add_paragraph('Sub-sub-item 2.1.1', style='List Number 3')
doc.add_paragraph('Sub-sub-item 2.1.2', style='List Number 3')
doc.add_paragraph('Main item 3', style='List Number')

# Add a heading for mixed lists
doc.add_heading('Mixed List Types', 1)

doc.add_paragraph('1. Numbered item')
doc.add_paragraph('• Bulleted item')
doc.add_paragraph('a. Alphabetic item')
doc.add_paragraph('• Another bulleted item')

# Save the document
doc.save('comprehensive-lists-test.docx')

print("Comprehensive test DOCX file with various list formats created successfully: comprehensive-lists-test.docx")