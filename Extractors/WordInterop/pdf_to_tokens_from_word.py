import json
import os
import sys
import zipfile
from pathlib import Path
from typing import List, Dict, Any

# This script automates Microsoft Word to open a PDF, save as DOCX,
# then parses the DOCX to extract runs with color/underline/strikethrough
# and converts them into tokens suitable for Track Changes mapping.
#
# Usage:
#   python pdf_to_tokens_from_word.py <input.pdf> <output.json>
#
# Requirements:
#   - Windows with Microsoft Word installed
#   - pywin32 (pip install pywin32)
#
# Output JSON schema (simple):
#   {
#     "schemaVersion": 1,
#     "file": "...pdf",
#     "paras": [
#       [ {"text": "...", "type": "ins|del|equal"}, ... ],
#       ...
#     ]
#   }


def hex_to_rgb(hexval: str) -> Dict[str, float]:
    if not hexval:
        return {"r": 0.0, "g": 0.0, "b": 0.0}
    hv = hexval.strip().lstrip('#')
    if len(hv) == 3:
        hv = ''.join([c*2 for c in hv])
    if len(hv) != 6:
        return {"r": 0.0, "g": 0.0, "b": 0.0}
    try:
        r = int(hv[0:2], 16) / 255.0
        g = int(hv[2:4], 16) / 255.0
        b = int(hv[4:6], 16) / 255.0
        return {"r": r, "g": g, "b": b}
    except Exception:
        return {"r": 0.0, "g": 0.0, "b": 0.0}


def is_red(rgb: Dict[str, float]) -> bool:
    r, g, b = rgb.get('r', 0.0), rgb.get('g', 0.0), rgb.get('b', 0.0)
    return (r > 0.5) and (r - max(g, b) > 0.15)


def is_blue(rgb: Dict[str, float]) -> bool:
    r, g, b = rgb.get('r', 0.0), rgb.get('g', 0.0), rgb.get('b', 0.0)
    return (b > 0.5) and (b - max(r, g) > 0.22)


def open_pdf_save_docx_via_word(pdf_path: Path, out_docx: Path) -> None:
    import win32com.client  # type: ignore

    word = win32com.client.Dispatch("Word.Application")
    word.Visible = False
    try:
        # Open PDF (Word will reflow to an editable doc)
        doc = word.Documents.Open(str(pdf_path))
        try:
            # 12 = wdFormatXMLDocument (docx)
            doc.SaveAs2(str(out_docx), FileFormat=12)
        finally:
            doc.Close(False)
    finally:
        word.Quit()


def parse_docx_to_tokens(docx_path: Path) -> List[List[Dict[str, Any]]]:
    import xml.etree.ElementTree as ET

    ns = {
        'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
    }
    with zipfile.ZipFile(docx_path, 'r') as z:
        xml_bytes = z.read('word/document.xml')
    root = ET.fromstring(xml_bytes)

    paras: List[List[Dict[str, Any]]] = []

    def run_style(rPr) -> Dict[str, Any]:
        style = {
            'strike': False,
            'dstrike': False,
            'underline': None,   # e.g., 'single', 'double'
            'u_color': None,
            'color': None,       # run color (hex)
        }
        if rPr is None:
            return style
        col = rPr.find('w:color', ns)
        if col is not None and 'val' in col.attrib:
            style['color'] = col.attrib['val']
        u = rPr.find('w:u', ns)
        if u is not None:
            style['underline'] = u.attrib.get('w:val') or u.attrib.get('val')
            # Some producers set underline color
            ucol = u.attrib.get('{%s}color' % ns['w']) or u.attrib.get('color')
            if ucol:
                style['u_color'] = ucol
        if rPr.find('w:strike', ns) is not None:
            style['strike'] = True
        if rPr.find('w:dstrike', ns) is not None:
            style['dstrike'] = True
        return style

    for p in root.findall('.//w:p', ns):
        tokens: List[Dict[str, Any]] = []
        for r in p.findall('w:r', ns):
            rPr = r.find('w:rPr', ns)
            st = run_style(rPr)
            # text may be split across multiple w:t
            texts = [t.text or '' for t in r.findall('w:t', ns)]
            if not texts:
                # try delText if any
                texts = [t.text or '' for t in r.findall('w:delText', ns)]
            if not texts:
                continue
            text = ''.join(texts)
            if not text:
                continue

            # decide type by styling
            rgb = hex_to_rgb(st.get('color')) if st.get('color') else {'r':0.0,'g':0.0,'b':0.0}
            u_rgb = hex_to_rgb(st.get('u_color')) if st.get('u_color') else rgb

            token_type = 'equal'
            # deletion: strike + red
            if (st['strike'] or st['dstrike']) and is_red(rgb):
                token_type = 'del'
            # insertion: double underline + blue (use underline color if present, else run color)
            elif (st['underline'] in ('double', 'dbl')) and is_blue(u_rgb):
                token_type = 'ins'

            tokens.append({'text': text, 'type': token_type})
        if tokens:
            paras.append(tokens)
    return paras


def main(argv: List[str]) -> int:
    if len(argv) < 3:
        print("Usage: python pdf_to_tokens_from_word.py <input.pdf> <output.json>", file=sys.stderr)
        return 2
    pdf_path = Path(argv[1])
    out_json = Path(argv[2])
    if not pdf_path.exists():
        print(f"ERROR: Input not found: {pdf_path}", file=sys.stderr)
        return 2
    tmp_docx = out_json.with_suffix('.docx')

    try:
        open_pdf_save_docx_via_word(pdf_path, tmp_docx)
        paras = parse_docx_to_tokens(tmp_docx)
    finally:
        # leave the docx for debugging unless user wants cleanup
        pass

    data = {
        'schemaVersion': 1,
        'file': str(pdf_path.name),
        'paras': paras,
    }
    out_json.parent.mkdir(parents=True, exist_ok=True)
    with open(out_json, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Wrote tokens: {out_json}")
    print(f"Saved intermediate DOCX: {tmp_docx}")
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
