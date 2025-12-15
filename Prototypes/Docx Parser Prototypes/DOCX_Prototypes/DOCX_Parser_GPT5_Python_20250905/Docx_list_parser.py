import zipfile
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
W = "{" + W_NS + "}"

# -----------------------
# Utilities: formatting
# -----------------------

def int_to_alpha(n: int, upper: bool = False) -> str:
    # 1->a, 26->z, 27->aa, etc.
    if n <= 0:
        return str(n)
    s = []
    while n > 0:
        n, r = divmod(n - 1, 26)
        s.append(chr(ord('a') + r))
    res = "".join(reversed(s))
    return res.upper() if upper else res

def int_to_roman(n: int, upper: bool = True) -> str:
    if not (0 < n < 4000):
        return str(n)
    vals = [
        (1000, "M"), (900, "CM"), (500, "D"), (400, "CD"),
        (100, "C"), (90, "XC"), (50, "L"), (40, "XL"),
        (10, "X"), (9, "IX"), (5, "V"), (4, "IV"), (1, "I"),
    ]
    res = []
    for v, sym in vals:
        while n >= v:
            res.append(sym)
            n -= v
    out = "".join(res)
    return out if upper else out.lower()

def ordinal(n: int) -> str:
    # Basic English ordinal (1st, 2nd, 3rd, 4th, ...)
    if 10 <= (n % 100) <= 20:
        suf = "th"
    else:
        suf = {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
    return f"{n}{suf}"

def format_number(n: int, num_fmt: str) -> str:
    fmt = (num_fmt or "decimal").lower()
    if fmt == "decimal":
        return str(n)
    if fmt in ("lowerletter", "loweralpha"):
        return int_to_alpha(n, upper=False)
    if fmt in ("upperletter", "upperalpha"):
        return int_to_alpha(n, upper=True)
    if fmt == "lowerroman":
        return int_to_roman(n, upper=False)
    if fmt == "upperroman":
        return int_to_roman(n, upper=True)
    if fmt == "ordinal":
        return ordinal(n)
    # A bunch of Word formats exist; fallback to decimal
    return str(n)

# -----------------------
# Numbering model
# -----------------------

@dataclass
class LevelDef:
    ilvl: int
    num_fmt: str = "decimal"
    lvl_text: str = "%1"
    start: int = 1
    restart_after_level: Optional[int] = None  # from w:lvlRestart/@w:val
    suff: Optional[str] = None  # nothing|space|tab (not used here)

@dataclass
class AbstractNum:
    abs_id: int
    levels: Dict[int, LevelDef] = field(default_factory=dict)

@dataclass
class NumDef:
    num_id: int
    abs_id: int
    start_overrides: Dict[int, int] = field(default_factory=dict)  # ilvl -> startOverride

@dataclass
class NumberingModel:
    abstract_nums: Dict[int, AbstractNum] = field(default_factory=dict)
    nums: Dict[int, NumDef] = field(default_factory=dict)

    def get_level_def(self, num_id: int, ilvl: int) -> Optional[LevelDef]:
        num = self.nums.get(num_id)
        if not num:
            return None
        abs_def = self.abstract_nums.get(num.abs_id)
        if not abs_def:
            return None
        return abs_def.levels.get(ilvl)

    def get_effective_start(self, num_id: int, ilvl: int) -> int:
        num = self.nums.get(num_id)
        lvl = self.get_level_def(num_id, ilvl)
        if not num or not lvl:
            return 1
        if ilvl in num.start_overrides:
            return num.start_overrides[ilvl]
        return lvl.start or 1

# -----------------------
# Document model
# -----------------------

@dataclass
class Paragraph:
    text: str
    is_list: bool
    num_id: Optional[int]
    ilvl: Optional[int]
    label: Optional[str] = None  # computed label like "1.", "1.1.", "•", etc.

@dataclass
class ParsedDocument:
    paragraphs: List[Paragraph]
    numbering: NumberingModel

# -----------------------
# Parsing .docx parts
# -----------------------

def _safe_int(s: Optional[str], default: Optional[int] = None) -> Optional[int]:
    try:
        return int(s) if s is not None else default
    except Exception:
        return default

def parse_numbering_xml(xml_bytes: bytes) -> NumberingModel:
    model = NumberingModel()
    root = ET.fromstring(xml_bytes)

    # Parse abstractNum
    for abs_el in root.findall(f".//{W}abstractNum"):
        abs_id = _safe_int(abs_el.get(f"{W}abstractNumId"), None)
        if abs_id is None:
            continue
        abs_def = AbstractNum(abs_id=abs_id)

        for lvl_el in abs_el.findall(f"{W}lvl"):
            ilvl = _safe_int(lvl_el.get(f"{W}ilvl"), None)
            if ilvl is None:
                continue
            num_fmt = (lvl_el.findtext(f"{W}numFmt/{W}val") or "decimal")
            lvl_text = (lvl_el.findtext(f"{W}lvlText/{W}val") or "%1")
            start = _safe_int(lvl_el.findtext(f"{W}start/{W}val"), 1)
            suff = lvl_el.findtext(f"{W}suff/{W}val")
            restart_after_level = _safe_int(lvl_el.findtext(f"{W}lvlRestart/{W}val"), None)

            abs_def.levels[ilvl] = LevelDef(
                ilvl=ilvl,
                num_fmt=num_fmt,
                lvl_text=lvl_text,
                start=start,
                restart_after_level=restart_after_level,
                suff=suff
            )
        model.abstract_nums[abs_id] = abs_def

    # Parse num
    for num_el in root.findall(f"{W}num"):
        num_id = _safe_int(num_el.get(f"{W}numId"), None)
        if num_id is None:
            continue
        abs_id = _safe_int(num_el.findtext(f"{W}abstractNumId/{W}val"), None)
        if abs_id is None:
            continue
        num_def = NumDef(num_id=num_id, abs_id=abs_id)

        for ov_el in num_el.findall(f"{W}lvlOverride"):
            ilvl = _safe_int(ov_el.get(f"{W}ilvl"), None)
            if ilvl is None:
                continue
            start_override = _safe_int(ov_el.findtext(f"{W}startOverride/{W}val"), None)
            if start_override is not None:
                num_def.start_overrides[ilvl] = start_override

        model.nums[num_id] = num_def

    return model

def extract_paragraph_text(p_el: ET.Element) -> str:
    text_parts: List[str] = []
    for node in p_el.iter():
        if node.tag == f"{W}t" and node.text:
            text_parts.append(node.text)
        elif node.tag == f"{W}tab":
            text_parts.append("\t")
        elif node.tag == f"{W}br":
            text_parts.append("\n")
    return "".join(text_parts).strip()

def parse_document_xml(xml_bytes: bytes, numbering: NumberingModel) -> List[Paragraph]:
    root = ET.fromstring(xml_bytes)
    paragraphs: List[Paragraph] = []

    for p in root.findall(f".//{W}p"):
        ppr = p.find(f"{W}pPr")
        num_pr = ppr.find(f"{W}numPr") if ppr is not None else None

        num_id = None
        ilvl = None
        if num_pr is not None:
            num_id = _safe_int(num_pr.findtext(f"{W}numId/{W}val"), None)
            ilvl = _safe_int(num_pr.findtext(f"{W}ilvl/{W}val"), 0)

        text = extract_paragraph_text(p)
        is_list = (num_id is not None and ilvl is not None)
        paragraphs.append(Paragraph(text=text, is_list=is_list, num_id=num_id, ilvl=ilvl, label=None))

    return paragraphs

# -----------------------
# Number computation
# -----------------------

class NumberingState:
    def __init__(self):
        # counters[level] = current integer value at that level
        self.counters: Dict[int, int] = {}
        # last level visited (for this numId)
        self.last_level: Optional[int] = None
        # parent signatures to detect restarts for lvlRestart rule
        # parent_sig[level] = tuple of counters up to restart_after_level
        self.parent_sig: Dict[int, Tuple[int, ...]] = {}

def compute_labels(paragraphs: List[Paragraph], model: NumberingModel) -> None:
    # Maintain separate state per numId
    states: Dict[int, NumberingState] = {}

    for p in paragraphs:
        if not p.is_list or p.num_id is None or p.ilvl is None:
            continue

        num_id = p.num_id
        ilvl = p.ilvl
        lvl_def = model.get_level_def(num_id, ilvl)
        if not lvl_def:
            # Cannot compute without definition
            p.label = None
            continue

        state = states.setdefault(num_id, NumberingState())

        # ensure parents exist if missing (rare malformed cases)
        for parent_level in range(0, ilvl):
            if parent_level not in state.counters:
                state.counters[parent_level] = model.get_effective_start(num_id, parent_level)

        # Determine whether to restart due to lvlRestart and parent changes
        should_restart = False
        if lvl_def.restart_after_level is not None:
            r = lvl_def.restart_after_level
            sig = tuple(state.counters.get(i, 0) for i in range(0, r + 1))
            prev_sig = state.parent_sig.get(ilvl)
            if prev_sig is not None and prev_sig != sig:
                should_restart = True

        # Decide next value on this level
        start_val = model.get_effective_start(num_id, ilvl)

        if state.last_level is None:
            # First item for this numId
            state.counters[ilvl] = start_val
        else:
            if ilvl > state.last_level:
                # Going deeper: init intermediates and start this level
                for mid in range(state.last_level + 1, ilvl):
                    state.counters[mid] = model.get_effective_start(num_id, mid)
                state.counters[ilvl] = start_val
            elif ilvl == state.last_level:
                if should_restart:
                    state.counters[ilvl] = start_val
                else:
                    state.counters[ilvl] = state.counters.get(ilvl, start_val) + 1
            else:  # ilvl < last_level
                # Clear deeper levels
                for k in list(state.counters.keys()):
                    if k > ilvl:
                        del state.counters[k]
                if should_restart:
                    state.counters[ilvl] = start_val
                else:
                    state.counters[ilvl] = state.counters.get(ilvl, start_val) + 1

        # Update parent signature for restart detection on this level
        if lvl_def.restart_after_level is not None:
            r = lvl_def.restart_after_level
            sig = tuple(state.counters.get(i, 0) for i in range(0, r + 1))
            state.parent_sig[ilvl] = sig

        # Compute label text using lvlText pattern (e.g., "%1.%2.")
        # Replace %1..%9 with properly formatted numbers for those levels
        abs_def = model.abstract_nums.get(model.nums[num_id].abs_id)
        pattern = lvl_def.lvl_text or "%1"
        label = pattern
        for ref in range(1, 10):
            placeholder = f"%{ref}"
            if placeholder in label:
                ref_ilvl = ref - 1
                ref_lvl_def = abs_def.levels.get(ref_ilvl) if abs_def else None
                fmt = ref_lvl_def.num_fmt if ref_lvl_def else lvl_def.num_fmt
                val = state.counters.get(ref_ilvl, model.get_effective_start(num_id, ref_ilvl))
                label = label.replace(placeholder, format_number(val, fmt))

        p.label = label
        state.last_level = ilvl

# -----------------------
# Optional: to HTML
# -----------------------

def list_style_type_for_fmt(fmt: str) -> Optional[str]:
    f = (fmt or "decimal").lower()
    return {
        "decimal": "decimal",
        "lowerletter": "lower-alpha",
        "loweralpha": "lower-alpha",
        "upperletter": "upper-alpha",
        "upperalpha": "upper-alpha",
        "lowerroman": "lower-roman",
        "upperroman": "upper-roman",
        # Others default to decimal
    }.get(f, "decimal")

def to_html(paragraphs: List[Paragraph], model: NumberingModel) -> str:
    # Render lists using nested <ol>/<ul> based on numFmt at each level.
    # Note: HTML cannot perfectly replicate custom lvlText patterns without CSS counters,
    # but this gives standard list styling.
    html: List[str] = []
    # Stack of (numId, level, tag)
    stack: List[Tuple[int, int, str]] = []

    def close_until(level_target: int, num_id: int):
        while stack and (stack[-1][0] != num_id or stack[-1][1] >= level_target):
            html.append("</li>")
            html.append(f"</{stack[-1][2]}>")
            stack.pop()

    i = 0
    n = len(paragraphs)
    while i < n:
        p = paragraphs[i]
        if not p.is_list:
            # Close any open lists
            close_until(-1, stack[-1][0] if stack else -1)
            html.append(f"<p>{escape_html(p.text)}</p>")
            i += 1
            continue

        num_id = p.num_id
        ilvl = p.ilvl or 0
        lvl_def = model.get_level_def(num_id, ilvl)
        fmt = (lvl_def.num_fmt if lvl_def else "decimal").lower()
        is_bullet = (fmt == "bullet")
        tag = "ul" if is_bullet else "ol"

        # Open or adjust the stack
        if not stack or stack[-1][0] != num_id:
            # Different list series: close existing lists completely
            close_until(-1, stack[-1][0] if stack else -1)
            # Open from level 0 to ilvl
            for l in range(0, ilvl + 1):
                ldef = model.get_level_def(num_id, l)
                lf = (ldef.num_fmt if ldef else "decimal")
                ltag = "ul" if lf.lower() == "bullet" else "ol"
                style = ""
                if ltag == "ol":
                    lst = list_style_type_for_fmt(ldef.num_fmt if ldef else "decimal")
                    style = f' style="list-style-type:{lst};"'
                html.append(f"<{ltag}{style}>")
                html.append("<li>")
                stack.append((num_id, l, ltag))
        else:
            # Same list series numId
            # If deeper, open until ilvl
            if ilvl > stack[-1][1]:
                for l in range(stack[-1][1] + 1, ilvl + 1):
                    ldef = model.get_level_def(num_id, l)
                    lf = (ldef.num_fmt if ldef else "decimal")
                    ltag = "ul" if lf.lower() == "bullet" else "ol"
                    style = ""
                    if ltag == "ol":
                        lst = list_style_type_for_fmt(ldef.num_fmt if ldef else "decimal")
                        style = f' style="list-style-type:{lst};"'
                    html.append(f"<{ltag}{style}>")
                    html.append("<li>")
                    stack.append((num_id, l, ltag))
            elif ilvl == stack[-1][1]:
                # same level -> close previous li
                html.append("</li>")
                html.append("<li>")
            else:
                # shallower: close until current level, then new li
                close_until(ilvl, num_id)
                html.append("<li>")

        # Content (omit computed label text because HTML renders its own markers)
        html.append(escape_html(p.text))
        i += 1

    # Close any remaining
    if stack:
        close_until(-1, stack[-1][0])

    return "".join(html)

def escape_html(s: str) -> str:
    return (
        s.replace("&", "&amp;")
         .replace("<", "&lt;")
         .replace(">", "&gt;")
    )

# -----------------------
# Public API
# -----------------------

def parse_docx(path: str) -> ParsedDocument:
    with zipfile.ZipFile(path, "r") as z:
        # Numbering is optional
        numbering_xml = z.read("word/numbering.xml") if "word/numbering.xml" in z.namelist() else None
        numbering = parse_numbering_xml(numbering_xml) if numbering_xml else NumberingModel()

        doc_xml = z.read("word/document.xml")
        paragraphs = parse_document_xml(doc_xml, numbering)

        # Compute labels if numbering exists
        if numbering.nums:
            compute_labels(paragraphs, numbering)

        return ParsedDocument(paragraphs=paragraphs, numbering=numbering)

# -----------------------
# CLI demo
# -----------------------

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python docx_list_parser.py path/to/file.docx")
        sys.exit(1)

    doc = parse_docx(sys.argv[1])
    for p in doc.paragraphs:
        if p.is_list:
            print(f"{p.label} {p.text}")
        else:
            print(p.text)