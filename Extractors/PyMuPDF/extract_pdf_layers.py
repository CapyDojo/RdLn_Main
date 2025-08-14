import json
import math
import sys
from pathlib import Path
from typing import Dict, List, Tuple, Any

try:
    import fitz  # PyMuPDF
except Exception as e:
    print("ERROR: PyMuPDF (fitz) is required. Install via: pip install PyMuPDF", file=sys.stderr)
    raise

LEGEND_LABELS = [
    "Add",
    "Delete",
    "Move From",
    "Move To",
    "Table Insert",
    "Table Delete",
]


def is_horizontal(p1: Tuple[float, float], p2: Tuple[float, float], tol: float = 0.75) -> bool:
    return abs(p1[1] - p2[1]) <= tol and abs(p1[0] - p2[0]) >= 0.1


def color_to_rgb_tuple(c: Any) -> Tuple[float, float, float]:
    """PyMuPDF may return colors as tuples already; normalize to 0..1 floats."""
    if c is None:
        return (0.0, 0.0, 0.0)
    if isinstance(c, (list, tuple)) and len(c) >= 3:
        r, g, b = c[0], c[1], c[2]
        # Many returns are already 0..1
        return (
            float(max(0, min(1, r))),
            float(max(0, min(1, g))),
            float(max(0, min(1, b))),
        )
    # Fallback: single number or unexpected
    try:
        v = float(c)
        return (v, v, v)
    except Exception:
        return (0.0, 0.0, 0.0)


def extract_text_spans(page: "fitz.Page") -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    raw = page.get_text("rawdict")
    for block in raw.get("blocks", []):
        if block.get("type", 0) != 0:
            continue
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                x0, y0, x1, y1 = span.get("bbox", (0, 0, 0, 0))
                text = span.get("text", "")
                size = span.get("size", 0)
                font = span.get("font", "")
                color = color_to_rgb_tuple(span.get("color", (0, 0, 0)))
                out.append({
                    "text": text,
                    "bbox": [x0, y0, x1, y1],
                    "x": x0,
                    "y": y0,
                    "w": max(0.0, x1 - x0),
                    "h": max(0.0, y1 - y0),
                    "font": font,
                    "size": size,
                    "fillRGB": {"r": color[0], "g": color[1], "b": color[2]},
                })
    return out


def extract_draw_spans(page: "fitz.Page") -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    drawings = page.get_drawings()
    for dr in drawings:
        stroke = color_to_rgb_tuple(dr.get("stroke", (0, 0, 0)))
        width_val = dr.get("width", 0.0)
        try:
            width = float(width_val) if width_val is not None else 0.0
        except Exception:
            width = 0.0
        for item in dr.get("items", []):
            op = item[0]
            if op == "l":  # line segment
                p1, p2 = item[1], item[2]
                if is_horizontal(p1, p2):
                    x1, y1 = p1
                    x2, y2 = p2
                    if x2 < x1:
                        x1, x2 = x2, x1
                    out.append({
                        "x1": float(x1),
                        "y": float(y1),
                        "x2": float(x2),
                        "strokeRGB": {"r": stroke[0], "g": stroke[1], "b": stroke[2]},
                        "lineWidth": float(width),
                    })
            elif op == "re":
                # rectangle: add top/bottom edges as horizontals
                x, y, w, h = item[1]
                top = (x, y)
                bottom = (x, y + h)
                if h <= 0.5 and w >= 1.0:
                    out.append({
                        "x1": float(x),
                        "y": float(y),
                        "x2": float(x + w),
                        "strokeRGB": {"r": stroke[0], "g": stroke[1], "b": stroke[2]},
                        "lineWidth": float(width),
                    })
                if h >= 1.0 and w <= 0.5:
                    # ignore vertical rules
                    pass
            # ignore other ops for now (curves, etc.)
    return out


def bbox_overlap_x(span: Dict[str, Any], seg: Dict[str, Any]) -> float:
    x, w = float(span["x"]), float(span["w"])
    x1, x2 = float(seg["x1"]), float(seg["x2"])
    return max(0.0, min(x + w, x2) - max(x, x1))


def legend_probe(pages_text: List[List[Dict[str, Any]]], pages_draw: List[List[Dict[str, Any]]]) -> Dict[str, Any]:
    legend: Dict[str, Any] = {}
    consider_pages = pages_text[:2]
    for pi, (text_spans, draw_spans) in enumerate(zip(consider_pages, pages_draw[:2])):
        for span in text_spans:
            raw = span.get("text", "").strip()
            if not raw:
                continue
            label = next((lbl for lbl in LEGEND_LABELS if lbl.lower() in raw.lower()), None)
            if not label:
                continue
            # Estimate baseline & midline from bbox
            y = float(span["y"])  # top-left
            h = float(span["h"]) if span.get("h") else (span.get("size", 10) * 0.8)
            baseline_y = y + 0.06 * h
            midline_y = y + 0.52 * h
            b_tol = max(0.8, 0.18 * h)
            m_tol = max(0.8, 0.28 * h)
            best = None
            for seg in draw_spans:
                frac = bbox_overlap_x(span, seg) / max(1.0, float(span["w"]))
                if frac < 0.3:
                    continue
                yseg = float(seg["y"])  # already horizontal
                band = None
                ydist = 1e9
                if abs(yseg - baseline_y) <= b_tol:
                    band = "baseline"
                    ydist = abs(yseg - baseline_y)
                if abs(yseg - midline_y) <= m_tol and abs(yseg - midline_y) < ydist:
                    band = "midline"
                    ydist = abs(yseg - midline_y)
                if not band:
                    continue
                score = frac - (ydist / (b_tol if band == "baseline" else m_tol))
                if not best or score > best[0]:
                    best = (score, band, seg["strokeRGB"])
            if best:
                legend.setdefault(label, {"samples": [], "bandCounts": {"baseline": 0, "midline": 0}})
                legend[label]["samples"].append(best[2])
                legend[label]["bandCounts"][best[1]] += 1
    # reduce
    reduced: Dict[str, Any] = {}
    for label, entry in legend.items():
        samples = entry["samples"]
        n = len(samples)
        if not n:
            continue
        avg = {"r": 0.0, "g": 0.0, "b": 0.0}
        for c in samples:
            avg["r"] += float(c["r"]) if isinstance(c, dict) else float(c[0])
            avg["g"] += float(c["g"]) if isinstance(c, dict) else float(c[1])
            avg["b"] += float(c["b"]) if isinstance(c, dict) else float(c[2])
        avg = {k: v / n for k, v in avg.items()}
        band = "baseline" if entry["bandCounts"]["baseline"] >= entry["bandCounts"]["midline"] else "midline"
        reduced[label] = {"color": avg, "band": band, "samples": n}
    return reduced


def extract(pdf_path: Path) -> Dict[str, Any]:
    doc = fitz.open(pdf_path)
    pages_text: List[List[Dict[str, Any]]] = []
    pages_draw: List[List[Dict[str, Any]]] = []

    for pno in range(len(doc)):
        page = doc[pno]
        text_spans = extract_text_spans(page)
        draw_spans = extract_draw_spans(page)
        pages_text.append(text_spans)
        pages_draw.append(draw_spans)

    legend = legend_probe(pages_text, pages_draw)

    # build compact output
    pages_out: List[Dict[str, Any]] = []
    for idx, (tspans, dspans) in enumerate(zip(pages_text, pages_draw), start=1):
        pages_out.append({
            "page": idx,
            "textSpans": tspans,
            "drawSpans": dspans,
        })

    return {
        "file": str(pdf_path.name),
        "legendPalette": legend,
        "pages": pages_out,
    }


def main(argv: List[str]) -> int:
    if len(argv) < 2:
        print("Usage: python extract_pdf_layers.py <input.pdf> [output.json]", file=sys.stderr)
        return 2
    in_path = Path(argv[1])
    if not in_path.exists():
        print(f"ERROR: Input not found: {in_path}", file=sys.stderr)
        return 2
    out_path = Path(argv[2]) if len(argv) >= 3 else in_path.with_suffix("")
    if out_path.suffix.lower() != ".json":
        out_path = Path(str(out_path) + "_layers.json")

    data = extract(in_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Wrote: {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
