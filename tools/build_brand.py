"""Build the rumo brand assets from the real Epilogue 800 outlines.

Wordmark: "rumo" with the final "o" cut by a fine parallel slot at 2 o'clock (the heading).
Symbol / app icon: the same notched "o" on parchment with the solar Farol glow behind it.
"""
import math, json, os
import pathops
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

SP = "/private/tmp/claude-501/-Users-wanghley-Workspace-entrepreneurship-rumo/dcb70536-3bdb-493a-8cd2-3ed05d0a7be6/scratchpad"
DEST = "/Users/wanghley/Workspace/entrepreneurship/rumo/rumo-landing/assets/brand"
os.makedirs(DEST, exist_ok=True)

ESPRESSO, PARCHMENT, SOLAR, MOSS = "#2D1E1B", "#FCF9F3", "#FFC247", "#2E4735"
SLOT_W = 52          # notch width in font units (stroke is ~350)
SLOT_ANGLE = 30      # maths angle: 2 o'clock = 30 degrees above the +x axis

font = TTFont(f"{SP}/fonts-dl/epilogue-800-instance.ttf")
gs = font.getGlyphSet()
cmap = font.getBestCmap()
ADV = lambda ch: font["hmtx"][cmap[ord(ch)]][0]
ASC = 1083  # top of r/m ascending bump, used as baseline offset for the y flip

def glyph_path(ch):
    p = pathops.Path()
    gs[cmap[ord(ch)]].draw(p.getPen(glyphSet=gs))
    return p

def bounds(path):
    bp = BoundsPen(None); path.draw(bp); return bp.bounds

def slot(cx, cy, angle_deg, width, r=2000):
    a = math.radians(angle_deg)
    dx, dy = math.cos(a), math.sin(a)
    nx, ny = -dy * width / 2, dx * width / 2
    p = pathops.Path(); pen = p.getPen()
    pen.moveTo((cx - nx, cy - ny)); pen.lineTo((cx + nx, cy + ny))
    pen.lineTo((cx + nx + r * dx, cy + ny + r * dy)); pen.lineTo((cx - nx + r * dx, cy - ny + r * dy))
    pen.closePath()
    return p

def fmt(v):
    s = ("%.1f" % v).rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s

def d_of(path, matrix):
    spen = SVGPathPen(None, ntos=fmt)
    path.draw(TransformPen(spen, matrix))
    return spen.getCommands()

# the notched o, in font coordinates
o_raw = glyph_path("o")
ob = bounds(o_raw)
ocx, ocy = (ob[0] + ob[2]) / 2, (ob[1] + ob[3]) / 2
o_notched = pathops.op(o_raw, slot(ocx, ocy, SLOT_ANGLE, SLOT_W), pathops.PathOp.DIFFERENCE)
OW, OH = ob[2] - ob[0], ob[3] - ob[1]

# ---------- wordmark ----------
x = 0
word_paths = []
for ch in "rumo":
    gp = o_notched if ch == "o" else glyph_path(ch)
    word_paths.append(d_of(gp, (1, 0, 0, -1, x, ASC)))
    x += ADV(ch)
WORD_W, WORD_H = x, ASC + 24
PAD = 30
word_vb = f"{-PAD} {-PAD} {WORD_W + 2*PAD} {WORD_H + 2*PAD}"
word_d = "".join(word_paths)

def wordmark_svg(fill):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{word_vb}" role="img" aria-label="rumo">'
            f'<title>rumo</title><path fill="{fill}" d="{word_d}"/></svg>\n')

open(f"{DEST}/rumo-wordmark.svg", "w").write(wordmark_svg(ESPRESSO))
open(f"{DEST}/rumo-wordmark-parchment.svg", "w").write(wordmark_svg(PARCHMENT))
open(f"{DEST}/rumo-wordmark-moss.svg", "w").write(wordmark_svg(MOSS))

# ---------- symbol (notched o alone) ----------
SP_PAD = 60
sym_vb = f"0 0 {OW + 2*SP_PAD:.0f} {OH + 2*SP_PAD:.0f}"
sym_d = d_of(o_notched, (1, 0, 0, -1, -ob[0] + SP_PAD, ob[3] + SP_PAD))
open(f"{DEST}/rumo-symbol.svg", "w").write(
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{sym_vb}" role="img" aria-label="rumo"><title>rumo</title>'
    f'<path fill="{ESPRESSO}" d="{sym_d}"/></svg>\n')

# ---------- app icon / favicon with the Farol glow ----------
def icon_svg(size, o_width, rounded=0, glow=0.78):
    s = o_width / OW
    m = (s, 0, 0, -s, size / 2 - s * ocx, size / 2 + s * ocy)
    d = d_of(o_notched, m)
    r = f' rx="{rounded}"' if rounded else ""
    clip = f'<clipPath id="c"><rect width="{size}" height="{size}"{r}/></clipPath>' if rounded else ""
    cp = ' clip-path="url(#c)"' if rounded else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" width="{size}" height="{size}">'
            f'<defs><radialGradient id="g" cx="50%" cy="50%" r="50%">'
            f'<stop offset="0" stop-color="{SOLAR}" stop-opacity="{glow}"/>'
            f'<stop offset="0.5" stop-color="{SOLAR}" stop-opacity="{glow*0.42:.2f}"/>'
            f'<stop offset="1" stop-color="{SOLAR}" stop-opacity="0"/></radialGradient>{clip}</defs>'
            f'<g{cp}><rect width="{size}" height="{size}" fill="{PARCHMENT}"/>'
            f'<circle cx="{size/2}" cy="{size/2}" r="{size*0.5}" fill="url(#g)"/>'
            f'<path fill="{ESPRESSO}" d="{d}"/></g></svg>\n')

open(f"{DEST}/rumo-app-icon.svg", "w").write(icon_svg(1024, 580))                  # full bleed, for App Store / PNG exports
open(f"{DEST}/favicon.svg", "w").write(icon_svg(64, 38, rounded=14, glow=0.9))     # rounded for browser tabs

# ---------- snippets for inline use in index.html ----------
json.dump({"wordmark_viewBox": word_vb, "wordmark_d": word_d, "symbol_viewBox": sym_vb, "symbol_d": sym_d,
           "wordmark_ratio": (WORD_W + 2*PAD) / (WORD_H + 2*PAD)},
          open(f"{SP}/logo-work/brand-paths.json", "w"))
print("wordmark", word_vb, "ratio %.3f" % ((WORD_W + 2*PAD) / (WORD_H + 2*PAD)))
print("symbol", sym_vb)
