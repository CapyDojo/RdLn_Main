# app.py
import os
import tempfile
from flask import Flask, request, jsonify, send_from_directory

# Import parsing libraries
import mammoth
from docx import Document
import docx2python

# Optional imports (uncomment if you have them installed and configured)
# import tika
# from tika import parser as tika_parser
# import pypandoc

app = Flask(__name__)

# --- Parsing Functions ---

def parse_with_mammoth(file_path):
    """Parse DOCX using Mammoth."""
    try:
        with open(file_path, "rb") as docx_file:
            result = mammoth.convert_to_html(docx_file)
            # Mammoth returns 'html' and potential 'messages'
            return {"html": result.value, "messages": result.messages}
    except Exception as e:
        return {"error": f"Mammoth error: {str(e)}"}

def parse_with_python_docx(file_path):
    """Parse DOCX using python-docx and return plain text."""
    try:
        doc = Document(file_path)
        full_text = []

        def get_text_from_paragraphs(paragraphs):
            text_parts = []
            for p in paragraphs:
                text_parts.append(p.text)
            return "\n".join(text_parts)

        # Iterate through document elements
        for element in doc.element.body:
            # Check if it's a paragraph
            if element.tag.endswith('p'): # w:p tag
                paragraph = doc.element.paragraphs[doc.element.index(element)]
                full_text.append(paragraph.text)
            # Check if it's a table (basic handling)
            elif element.tag.endswith('tbl'): # w:tbl tag
                 table = doc.tables[doc.element.index(element)]
                 full_text.append("--- Table ---")
                 for row in table.rows:
                     row_data = [cell.text for cell in row.cells]
                     full_text.append("\t".join(row_data))
                 full_text.append("-------------")

        # Basic list handling attempt (might not be perfect)
        # python-docx doesn't directly expose rendered numbers easily
        # This just gets paragraph text, which might include list markers if they are text
        # For complex numbering, deeper analysis of paragraph properties (pPr, numPr) is needed.
        # This is a simplified version focusing on text content.

        return {"text": "\n".join(full_text)}
    except Exception as e:
        return {"error": f"python-docx error: {str(e)}"}

def parse_with_docx2python(file_path):
    """Parse DOCX using docx2python and return text."""
    try:
       # docx2python returns a nested list structure
        docx_content = docx2python.docx2python(file_path)
        # Extract text from the main body (docx_content.body)
        # The structure is quite nested: [header, body, footer, footnotes, endnotes, comments]
        # body itself is [[[paragraphs/runs]]]
        # Let's try to flatten it reasonably for display
        body_text = ""
        if docx_content and len(docx_content.body) > 2: # Check if body exists and has content
             # Iterate through paragraphs in the body (roughly)
             # docx2python structure: [header, [[[para1_runs], [para2_runs]], properties], footer, ...]
             body_structure = docx_content.body[2] # Index 2 is usually the main body paragraphs list
             if isinstance(body_structure, list) and len(body_structure) > 0:
                 paragraphs_list = body_structure[0] # Get the list of paragraphs
                 if isinstance(paragraphs_list, list):
                     for paragraph_runs in paragraphs_list:
                         if isinstance(paragraph_runs, list):
                             # Join runs within a paragraph
                             paragraph_text = "".join(run[0] if isinstance(run, list) and len(run) > 0 else str(run) for run in paragraph_runs)
                             body_text += paragraph_text + "\n"

        return {"text": body_text}
    except Exception as e:
        return {"error": f"docx2python error: {str(e)}"}

# Placeholder functions for Tika and Pandoc (require setup)
def parse_with_tika(file_path):
    """Placeholder for Tika parsing. Requires Java and tika-python setup."""
    return {"error": "Tika parsing not implemented/configured."}
    # Example (uncomment and configure if needed):
    # try:
    #     parsed = tika_parser.from_file(file_path)
    #     return {"text": parsed.get("content", "")}
    # except Exception as e:
    #     return {"error": f"Tika error: {str(e)}"}

def parse_with_pandoc(file_path):
    """Placeholder for Pandoc parsing. Requires Pandoc executable and pypandoc."""
    return {"error": "Pandoc parsing not implemented/configured."}
    # Example (uncomment and configure if needed):
    # try:
    #     output = pypandoc.convert_file(file_path, 'html') # Or 'plain' for text
    #     return {"html": output}
    # except Exception as e:
    #     return {"error": f"Pandoc error: {str(e)}"}


# --- Flask Routes ---

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/parse', methods=['POST'])
def parse_document():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    parsers = request.form.getlist('parsers')
    if not parsers:
        return jsonify({"error": "No parsers selected"}), 400

    # Create a temporary file to save the uploaded DOCX
    with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as tmp_file:
        file.save(tmp_file.name)
        tmp_file_path = tmp_file.name

    results = {}

    # Map parser names to functions
    parser_functions = {
        "mammoth": parse_with_mammoth,
        "python_docx": parse_with_python_docx,
        "docx2python": parse_with_docx2python,
        "tika": parse_with_tika,
        "pandoc": parse_with_pandoc,
    }

    try:
        for parser_name in parsers:
            if parser_name in parser_functions:
                print(f"Parsing with {parser_name}...")
                results[parser_name] = parser_functions[parser_name](tmp_file_path)
            else:
                results[parser_name] = {"error": "Unknown parser selected."}
    finally:
        # Clean up the temporary file
        try:
            os.unlink(tmp_file_path)
        except OSError:
            pass # Ignore if file was already deleted or error

    return jsonify(results)


if __name__ == '__main__':
    # Initialize Tika if needed (uncomment if using Tika)
    # tika.TikaClientOnly = True # Optional: Use client only mode if preferred
    # tika.initVM() # Initialize Tika VM (requires Java)
    app.run(debug=True, port=5001) # Use a different port than default 5000