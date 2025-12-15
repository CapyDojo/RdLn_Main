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

# --- Updated python-docx function with numbering logic ---
def extract_with_numbering(docx_path):
    """
    Attempts to extract text from a DOCX, focusing on correctly representing
    list numbering by accessing underlying numbering definitions.
    """
    try:
        doc = Document(docx_path)
        full_text = []
        
        # Check if the document has a numbering part
        if doc.part and doc.part.numbering_part and doc.part.numbering_part.numbering:
            numbering_part = doc.part.numbering_part.numbering
        else:
            numbering_part = None
            print("Warning: Document does not contain a numbering part or it's inaccessible.")

        # Keep track of instance counts for simple numbering logic
        # Key: (num_id, ilvl), Value: count
        instance_counts = {} 

        
        for paragraph in doc.paragraphs:
            p_text = paragraph.text.strip()
            
            # Check if the paragraph has list formatting
            if hasattr(paragraph.paragraph_format, 'list_level') and paragraph.paragraph_format.list_level is not None and numbering_part:
                list_level = paragraph.paragraph_format.list_level
                # Get the numId from the paragraph's XML properties
                p_xml = paragraph._element
                pPr = p_xml.pPr
                numPr = getattr(pPr, 'numPr', None)
                
                if numPr and numPr.numId and numPr.ilvl:
                    num_id = int(numPr.numId.val) # Get the concrete numId
                    ilvl = int(numPr.ilvl.val)    # Get the indent level (should match list_level)
                    
                    # --- Instance Count Logic ---
                    # Increment the count for this (num_id, ilvl) combination
                    key = (num_id, ilvl)
                    instance_counts[key] = instance_counts.get(key, 0) + 1
                    current_instance = instance_counts[key]
                    # --- End Instance Count Logic ---
                    
                    # Find the corresponding num in the numbering part
                    ct_num = None
                    for n in numbering_part.nums:
                        if n.numId == num_id:
                            ct_num = n
                            break
                    
                    if ct_num:
                        # Get the abstractNumId from the num object
                        try:
                            abstract_num_id = ct_num.abstractNumId.val
                        except AttributeError:
                            print(f"Warning: Could not get abstractNumId for numId {num_id}")
                            abstract_num_id = None
                        
                        if abstract_num_id is not None:
                            # Find the corresponding abstractNum
                            ct_abstract_num = None
                            for an in numbering_part.abstractNums:
                                if hasattr(an, 'abstractNumId') and an.abstractNumId == abstract_num_id:
                                    ct_abstract_num = an
                                    break
                        
                            if ct_abstract_num:
                                # --- Attempt to get the numbering format and level info ---
                                # Access level information within abstractNum
                                lvl_list = getattr(ct_abstract_num, 'lvlList', None)
                                
                                if lvl_list and len(lvl_list) > ilvl:
                                    lvl = lvl_list[ilvl] # Get the specific level definition
                                    
                                    if lvl:
                                        # Get the number format (e.g., decimal, lowerLetter)
                                        num_fmt_element = getattr(lvl, 'numFmt', None)
                                        num_format = getattr(num_fmt_element, 'val', 'decimal') if num_fmt_element else 'decimal'
                                        
                                        # Get the starting number for this level
                                        start_val = 1
                                        start_element = getattr(lvl, 'start', None)
                                        if start_element:
                                            try:
                                                start_val = int(start_element.val)
                                            except (ValueError, TypeError):
                                                print(f"Warning: Invalid start value for level {ilvl} in abstractNum {abstract_num_id}")
                                        
                                        # --- Simplified Number Calculation ---
                                        try:
                                            calculated_number = current_instance + start_val - 1
                                            
                                            if num_format == 'decimal':
                                                list_number = str(calculated_number)
                                            elif num_format == 'lowerLetter':
                                                if calculated_number > 0:
                                                    list_number = chr(ord('a') + (calculated_number - 1) % 26)
                                                else:
                                                     list_number = '?'
                                            elif num_format == 'upperLetter':
                                                if calculated_number > 0:
                                                    list_number = chr(ord('A') + (calculated_number - 1) % 26)
                                                else:
                                                     list_number = '?'
                                            elif num_format == 'lowerRoman':
                                                list_number = str(calculated_number) # Fallback
                                            elif num_format == 'upperRoman':
                                                list_number = str(calculated_number) # Fallback
                                            else:
                                                list_number = str(calculated_number)
                                            
                                            # --- Construct the prefix ---
                                            # Get level text if defined (e.g., "0.", "%1.")
                                            lvl_text_element = getattr(lvl, 'lvlText', None)
                                            lvl_text_val = getattr(lvl_text_element, 'val', None) if lvl_text_element else None
                                            
                                            if lvl_text_val:
                                                # Check if it's a simple text or contains placeholders
                                                if '%' not in lvl_text_val:
                                                     # Seems like direct text (e.g., "0.")
                                                     list_prefix = lvl_text_val
                                                else:
                                                    # Contains placeholder, need to substitute
                                                    # Simplistic substitution: assume %1 refers to this level's number
                                                    if '%1' in lvl_text_val:
                                                        list_prefix = lvl_text_val.replace('%1', list_number)
                                                    else:
                                                        list_prefix = f"{list_number}." 
                                            else:
                                                list_prefix = f"{list_number}."
                                            
                                        except Exception as e:
                                            print(f"Error calculating number for paragraph (NumId:{num_id}, ILvl:{ilvl}): {e}")
                                            list_prefix = f"{current_instance}." # Simpler fallback
                                        
                                        # Prepend the calculated prefix to the paragraph text
                                        p_text = f"{list_prefix} {p_text}" if p_text else list_prefix
                            
                                    else:
                                        p_text = f"[Lvl:{ilvl}] {p_text}" if p_text else f"[Lvl:{ilvl}]"
                                else:
                                    p_text = f"[LvlList? ILvl:{ilvl}] {p_text}" if p_text else f"[LvlList? ILvl:{ilvl}]"
                            else:
                                p_text = f"[AbsNum:{abstract_num_id}] {p_text}" if p_text else f"[AbsNum:{abstract_num_id}]"
                        else:
                             p_text = f"[NoAbsNumId Num:{num_id}] {p_text}" if p_text else f"[NoAbsNumId Num:{num_id}]"
                    else:
                         p_text = f"[Num:{num_id}] {p_text}" if p_text else f"[Num:{num_id}]"
                else:
                    p_text = f"[List:{list_level}] {p_text}" if p_text else f"[List:{list_level}]"
            
            # Add the processed paragraph text to the output
            if p_text: # Only add non-empty paragraphs
                 full_text.append(p_text)

        return {"text": "\n".join(full_text)}

    except FileNotFoundError:
        return {"error": f"File not found: {docx_path}"}
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        return {"error": f"Error processing file with python-docx numbering: {str(e)}\nDetails:\n{error_details}"}

# Wrapper function to match the prototype's expected signature
def parse_with_python_docx(file_path):
    """Parse DOCX using python-docx with improved numbering."""
    try:
        result = extract_with_numbering(file_path)
        # The extract_with_numbering function already returns the correct format
        return result
    except Exception as e:
        return {"error": f"Wrapper error for python-docx numbering: {str(e)}"}

def parse_with_docx2python(file_path):
    """Parse DOCX using docx2python and return text."""
    try:
       # docx2python returns a nested list structure
        docx_content = docx2python.docx2python(file_path)
        body_text = ""
        if docx_content and len(docx_content.body) > 2:
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
        "python_docx": parse_with_python_docx, # Now points to the updated function
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