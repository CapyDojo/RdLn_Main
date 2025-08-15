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


def extract_words(page: fitz.Page) -> List[Dict[str, Any]]:
    """Extract words with geometry from the page using PyMuPDF 'words' API.
    Returns a list of { text, x, y, w, h, bbox } in reading order.
    """
    words = page.get_text("words") or []
    out: List[Dict[str, Any]] = []
    for w in words:
        # w = (x0, y0, x1, y1, word, block_no, line_no, word_no)
        if len(w) < 5:
            continue
        x0, y0, x1, y1, text = w[:5]
        if not text:
            continue
        out.append({
            "text": str(text),
            "bbox": [float(x0), float(y0), float(x1), float(y1)],
            "x": float(x0),
            "y": float(y0),
            "w": float(x1) - float(x0),
            "h": float(y1) - float(y0),
        })
    return out


def _is_red(rgb: Dict[str, float]) -> bool:
    r = float(rgb.get("r", 0.0)); g = float(rgb.get("g", 0.0)); b = float(rgb.get("b", 0.0))
    # strong red dominance (slightly relaxed)
    return (r > 0.5) and (r - max(g, b) > 0.15)


def _is_blue(rgb: Dict[str, float]) -> bool:
    r = float(rgb.get("r", 0.0)); g = float(rgb.get("g", 0.0)); b = float(rgb.get("b", 0.0))
    # strong blue dominance
    return (b > 0.5) and (b - max(r, g) > 0.22)


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

def classify_simple_words(words: List[Dict[str, Any]], draw_spans: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Strict classification for words (relaxed for deletions):
    - ins: word has BLUE double underline (>=2 blue lines within baseline band, distinct y within small delta)
    - del: word has RED strikethrough (>=1 red line near midline; allow a broader strike band for short words)
    Else equal.
    """
    out: List[Dict[str, Any]] = []
    for span in words:
        txt = (span.get("text") or "").strip()
        if not txt:
            continue
        x = float(span["x"]) ; y = float(span["y"]) ; w = float(span.get("w", 0.0)) ; h = float(span.get("h", 0.0))
        if w <= 0 or h <= 0:
            out.append({**span, "type": "equal"})
            continue

        baseline_y = y + 0.06 * h
        midline_y = y + 0.48 * h
        b_tol = max(0.6, 0.14 * h)
        m_tol = max(0.8, 0.28 * h)  # wider midline tolerance for strike
        cov_thr_ins = 0.5  # keep strong overlap for underlines
        cov_thr_del = 0.35 # allow smaller overlap for short words

        baseline_hits: List[float] = []
        red_midline_hit = False
        for seg in draw_spans:
            x1 = float(seg["x1"]) ; x2 = float(seg["x2"]) ; yseg = float(seg["y"]) ;
            overlap = max(0.0, min(x + w, x2) - max(x, x1))
            frac = overlap / max(1.0, w)
            rgb = seg.get("strokeRGB", {"r": 0.0, "g": 0.0, "b": 0.0})
            # Deletion: allow lower overlap threshold and broader vertical band (0.35h..0.75h around top)
            if frac >= cov_thr_del and _is_red(rgb):
                strike_band_low = y + 0.35 * h
                strike_band_high = y + 0.75 * h
                if strike_band_low <= yseg <= strike_band_high:
                    red_midline_hit = True
            # Insertion: require stronger overlap and baseline band and blue
            if frac >= cov_thr_ins and _is_blue(rgb) and abs(yseg - (y + 0.06 * h)) <= b_tol:
                baseline_hits.append(yseg)

        # Double-underline detection: at least two distinct y's within small delta
        is_double = False
        if len(baseline_hits) >= 2:
            baseline_hits.sort()
            # group adjacent lines if within delta; need 2 lines not identical
            delta = max(0.4, 0.10 * h)  # small band separation allowed
            for i in range(len(baseline_hits) - 1):
                if abs(baseline_hits[i+1] - baseline_hits[i]) <= delta:
                    is_double = True
                    break

        t = "equal"
        if red_midline_hit:
            t = "del"
        elif is_double:
            t = "ins"
        out.append({**span, "type": t})
    return out


def extract_draw_spans(page: "fitz.Page") -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    drawings = page.get_drawings()
    for dr in drawings:
        stroke = color_to_rgb_tuple(dr.get("stroke", (0, 0, 0)))
        fill = color_to_rgb_tuple(dr.get("fill", (0, 0, 0)))
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
                # choose color: prefer stroke when present, else fill (strikethroughs are often filled rectangles)
                use_rgb = stroke if (width > 0.0 or any(stroke)) else fill
                if h <= 0.5 and w >= 1.0:
                    # very thin rectangle: treat as a single horizontal line at top edge
                    out.append({
                        "x1": float(x),
                        "y": float(y),
                        "x2": float(x + w),
                        "strokeRGB": {"r": use_rgb[0], "g": use_rgb[1], "b": use_rgb[2]},
                        "lineWidth": float(max(width, h)),
                    })
                elif h <= 3.5 and w >= 5.0:
                    # low-height filled rectangle typical of strikethrough: emit centerline
                    cy = y + (h / 2.0)
                    out.append({
                        "x1": float(x),
                        "y": float(cy),
                        "x2": float(x + w),
                        "strokeRGB": {"r": use_rgb[0], "g": use_rgb[1], "b": use_rgb[2]},
                        "lineWidth": float(max(width, h)),
                    })
                if h >= 1.0 and w <= 0.5:
                    # ignore vertical rules
                    pass
            # ignore other ops for now (curves, etc.)
    # Merge adjacent/overlapping horizontals with similar y and same color
    return _merge_horizontal_segments(out)


def _merge_horizontal_segments(segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not segments:
        return []
    # group by approximate y (within y_eps) and color bucket
    y_eps = 0.8
    gap_eps = 2.0
    out: List[Dict[str, Any]] = []
    # sort by y then x1
    segs = sorted(segments, key=lambda s: (round(float(s.get("y", 0.0)) / y_eps), float(s.get("x1", 0.0))))
    def color_key(rgb: Dict[str, float]) -> Tuple[int,int,int]:
        r = int(round(float(rgb.get("r", 0.0)) * 255))
        g = int(round(float(rgb.get("g", 0.0)) * 255))
        b = int(round(float(rgb.get("b", 0.0)) * 255))
        return (r, g, b)
    i = 0
    while i < len(segs):
        cur = segs[i]
        cx1 = float(cur["x1"]) ; cx2 = float(cur["x2"]) ; cy = float(cur["y"]) ; crgb = cur.get("strokeRGB", {"r":0,"g":0,"b":0})
        ckey = color_key(crgb)
        sumy = cy ; n = 1
        i += 1
        while i < len(segs):
            s = segs[i]
            if color_key(s.get("strokeRGB", {"r":0,"g":0,"b":0})) != ckey:
                break
            sy = float(s["y"]) ; sx1 = float(s["x1"]) ; sx2 = float(s["x2"]) ;
            if abs(sy - cy) > y_eps:
                break
            # if overlapping or small gap, merge
            if sx1 <= cx2 + gap_eps:
                cx2 = max(cx2, sx2)
                sumy += sy ; n += 1
                i += 1
            else:
                break
        avg_y = sumy / n
        out.append({
            "x1": cx1,
            "y": avg_y,
            "x2": cx2,
            "strokeRGB": crgb,
            "lineWidth": float(max(float(cur.get("lineWidth", 0.0)), 0.0)),
        })
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

def classify_simple(text_spans: List[Dict[str, Any]], draw_spans: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Strict span-level version of the same rules as classify_simple_words."""
    out: List[Dict[str, Any]] = []
    for span in text_spans:
        txt = (span.get("text") or "").strip()
        if not txt:
            out.append({**span, "type": "equal"})
            continue
        x = float(span["x"]) ; y = float(span["y"]) ; w = float(span.get("w", 0.0)) ; h = float(span.get("h", 0.0))
        if w <= 0 or h <= 0:
            out.append({**span, "type": "equal"})
            continue
        baseline_y = y + 0.06 * h
        midline_y = y + 0.48 * h
        b_tol = max(0.6, 0.14 * h)
        m_tol = max(0.8, 0.28 * h)
        cov_thr_ins = 0.5
        cov_thr_del = 0.35
        baseline_hits: List[float] = []
        red_midline_hit = False
        for seg in draw_spans:
            x1 = float(seg["x1"]) ; x2 = float(seg["x2"]) ; yseg = float(seg["y"]) ;
            overlap = max(0.0, min(x + w, x2) - max(x, x1))
            frac = overlap / max(1.0, w)
            rgb = seg.get("strokeRGB", {"r": 0.0, "g": 0.0, "b": 0.0})
            # Deletion: lower overlap threshold and broader strike band to catch typical strikethroughs
            if frac >= cov_thr_del and _is_red(rgb):
                strike_band_low = y + 0.35 * h
                strike_band_high = y + 0.75 * h
                if strike_band_low <= yseg <= strike_band_high:
                    red_midline_hit = True
            # Insertion: require stronger overlap, blue, and baseline band
            if frac >= cov_thr_ins and _is_blue(rgb) and abs(yseg - baseline_y) <= b_tol:
                baseline_hits.append(yseg)
        is_double = False
        if len(baseline_hits) >= 2:
            baseline_hits.sort()
            delta = max(0.4, 0.10 * h)
            for i in range(len(baseline_hits) - 1):
                if abs(baseline_hits[i+1] - baseline_hits[i]) <= delta:
                    is_double = True
                    break
        t = "equal"
        if red_midline_hit:
            t = "del"
        elif is_double:
            t = "ins"
        out.append({**span, "type": t})
    return out


def extract(pdf_path: Path) -> Dict[str, Any]:
    doc = fitz.open(pdf_path)
    pages_text: List[List[Dict[str, Any]]] = []
    pages_words: List[List[Dict[str, Any]]] = []
    pages_draw: List[List[Dict[str, Any]]] = []

    for pno in range(len(doc)):
        page = doc[pno]
        text_spans = extract_text_spans(page)
        word_spans = extract_words(page)
        draw_spans = extract_draw_spans(page)
        pages_text.append(text_spans)
        pages_words.append(word_spans)
        pages_draw.append(draw_spans)

    legend = legend_probe(pages_text, pages_draw)

    # build compact output
    pages_out: List[Dict[str, Any]] = []
    for idx in range(len(pages_text)):
        tspans = pages_text[idx]
        wspans = pages_words[idx]
        dspans = pages_draw[idx]
        classified = classify_simple(tspans, dspans)
        classified_words = classify_simple_words(wspans, dspans)
        pages_out.append({
            "page": idx + 1,
            "textSpans": tspans,
            "drawSpans": dspans,
            "words": wspans,
            "classifiedText": classified,
            "classifiedWords": classified_words,
        })

    result = {
        "schemaVersion": 2,
        "file": str(pdf_path.name),
        "legendPalette": legend,
        "pages": pages_out,
    }

    # Debug summary to stdout
    try:
        for p in pages_out:
            tcnt = len(p.get("textSpans", []))
            dcnt = len(p.get("drawSpans", []))
            wcnt = len(p.get("words", []))
            ctc = len(p.get("classifiedText", []))
            cwc = len(p.get("classifiedWords", []))
            print(f"Page {p.get('page')}: textSpans={tcnt} drawSpans={dcnt} words={wcnt} classifiedText={ctc} classifiedWords={cwc}")
    except Exception:
        pass

    return result


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
