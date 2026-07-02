#!/usr/bin/env python3
"""
generate-index.py

Rewrites the baked-in default view in index.html from audiences/default.json
and the card files in cards/. Run this after editing the default cards so the
static baseline (what shows with JavaScript off) stays in sync with the JSON.

Usage, from the repo root:
    python3 tools/generate-index.py

It updates, in index.html:
  - each section grid's cards, in the order listed in default.json
  - the featured tile
  - the positioning line
  - the headline, only if default.json has a "headline"
  - hides any section, subsection, nav link, or group that has no cards

It is re-runnable and idempotent. Standard library only, no dependencies.
"""

import json
import pathlib
import re
import sys
from html import escape

ROOT = pathlib.Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"
DEFAULT = ROOT / "audiences" / "default.json"
CARDS_DIR = ROOT / "cards"

MAIN_IDS = ["sales-ops", "marketing-ops", "sales-dev", "retention", "ai-automation"]
SUB_IDS = ["sys-process", "sys-custom", "sys-research", "sys-other"]
ALL_IDS = MAIN_IDS + SUB_IDS

GROUPS = {
    "Revenue Engine": ["sales-ops", "marketing-ops", "sales-dev", "retention"],
    "Cross-cutting": ["ai-automation"],
    "Code": SUB_IDS,
}


def et(s):
    return escape(s or "", quote=False)


def ea(s):
    return escape(s or "", quote=True)


def load_cards():
    out = {}
    for p in CARDS_DIR.glob("*.json"):
        c = json.loads(p.read_text())
        out[c["id"]] = c
    return out


def render_media(card, cls, indent, default_label=None):
    """Optional graphic: an <img> when card.image is set, a placeholder box when
    only mediaLabel (or default_label) is set, else empty."""
    if card.get("image"):
        alt = ea(card.get("imageAlt") or card.get("title") or "")
        return indent + '<img class="' + cls + '" src="' + ea(card["image"]) + '" alt="' + alt + '" loading="lazy">'
    label = card.get("mediaLabel") or default_label
    if label:
        return indent + '<div class="' + cls + ' ph-box">' + et(label) + "</div>"
    return ""


def render_card(card):
    p = []
    p.append('                <article class="card">')
    media = render_media(card, "card-media", "                  ")
    if media:
        p.append(media)
    top = '                  <div class="card-top"><div class="card-eyebrow">' + et(card.get("eyebrow", "")) + "</div>"
    if card.get("flag"):
        top += '<span class="flag">' + et(card["flag"]) + "</span>"
    top += "</div>"
    p.append(top)
    p.append('                  <h3>' + et(card.get("title", "")) + "</h3>")
    if card.get("meta"):
        p.append('                  <div class="meta">' + et(card["meta"]) + "</div>")
    p.append('                  <div class="desc">' + et(card.get("description", "")) + "</div>")
    if card.get("tags"):
        chips = "".join('<span class="tag-chip">' + et(t) + "</span>" for t in card["tags"])
        p.append('                  <div class="tags">' + chips + "</div>")
    if card.get("supports"):
        p.append('                  <div class="supports">' + et(card["supports"]) + "</div>")
    if card.get("proves"):
        p.append('                  <div class="proves">' + et(card["proves"]) + "</div>")
    acts = ""
    for a in card.get("actions", []):
        cls = "btn btn-primary" if a.get("primary") else "btn btn-secondary"
        acts += '<a href="' + ea(a.get("href", "#")) + '" class="' + cls + '">' + et(a.get("label", "")) + "</a>"
    p.append('                  <div class="actions">' + acts + "</div>")
    p.append("                </article>")
    return "\n".join(p)


def render_grid_inner(ids, cards):
    present = [c for c in ids if c in cards]
    if not present:
        return ""
    body = "\n".join(render_card(cards[c]) for c in present)
    return "\n" + body + "\n              "


def render_featured_inner(card):
    s = '\n        <span class="tag">Featured project tile (swap in any project)</span>'
    s += "\n" + render_media(card, "feat-media", "        ", default_label="Project visual: dashboard or diagram")
    s += '\n        <div class="feat-body">'
    s += '\n          <div class="feat-top"><span class="feat-eyebrow">Featured project</span>'
    if card.get("flag"):
        s += '<span class="flag">' + et(card["flag"]) + "</span>"
    s += "</div>"
    s += '\n          <h2 class="feat-title">' + et(card.get("title", "")) + "</h2>"
    if card.get("meta"):
        s += '\n          <div class="meta">' + et(card["meta"]) + "</div>"
    s += '\n          <div class="feat-desc">' + et(card.get("description", "")) + "</div>"
    if card.get("tags"):
        s += '\n          <div class="tags">' + "".join('<span class="tag-chip">' + et(t) + "</span>" for t in card["tags"]) + "</div>"
    acts = "".join(
        '<a href="' + ea(a.get("href", "#")) + '" class="' + ("btn btn-primary" if a.get("primary") else "btn btn-secondary") + '">' + et(a.get("label", "")) + "</a>"
        for a in card.get("actions", [])
    )
    s += '\n          <div class="actions">' + acts + "</div>"
    s += "\n        </div>\n      "
    return s


def find_div_inner(html, open_tag):
    """Return (inner_start, inner_end) for the element whose opening tag equals open_tag,
    handling nested <div> elements."""
    s = html.index(open_tag)
    open_end = html.index(">", s) + 1
    depth = 1
    i = open_end
    while True:
        nd = html.find("<div", i)
        cd = html.find("</div>", i)
        if cd == -1:
            raise ValueError("Unbalanced <div> while scanning for: " + open_tag)
        if nd != -1 and nd < cd:
            depth += 1
            i = nd + 4
        else:
            depth -= 1
            if depth == 0:
                return open_end, cd
            i = cd + 6


def replace_div_inner(html, open_tag, new_inner):
    a, b = find_div_inner(html, open_tag)
    return html[:a] + new_inner + html[b:]


def set_hidden(html, pattern, hidden, addition):
    """Toggle a hidden marker on a tag matched by pattern (two capture groups)."""
    def repl(m):
        return m.group(1) + (addition if hidden else "") + m.group(2)
    new_html, n = pattern.subn(repl, html, count=1)
    if n == 0:
        raise ValueError("Pattern did not match: " + pattern.pattern)
    return new_html


def hide_section(html, sid, hidden):
    pat = re.compile(r'(<section id="' + re.escape(sid) + r'" class="region)(?: is-hidden)?(">)')
    return set_hidden(html, pat, hidden, " is-hidden")


def hide_subsection(html, sid, hidden):
    pat = re.compile(r'(<details class="sub region)(?: is-hidden)?(" id="' + re.escape(sid) + r'">)')
    return set_hidden(html, pat, hidden, " is-hidden")


def hide_navlink(html, spy, hidden):
    pat = re.compile(r'(<a href="#' + re.escape(spy) + r'" data-spy="' + re.escape(spy) + r'")(?: class="is-hidden")?(>)')
    return set_hidden(html, pat, hidden, ' class="is-hidden"')


def hide_sublinks(html, hidden):
    pat = re.compile(r'(<div class="sub-links)(?: is-hidden)?(">)')
    return set_hidden(html, pat, hidden, " is-hidden")


def hide_group(html, label, hidden):
    pat = re.compile(r'(<div class="grp)(?: is-hidden)?(">' + re.escape(label) + r"</div>)")
    return set_hidden(html, pat, hidden, " is-hidden")


def main():
    if not INDEX.exists() or not DEFAULT.exists():
        print("Run this from the repo root: python3 tools/generate-index.py", file=sys.stderr)
        return 1

    manifest = json.loads(DEFAULT.read_text())
    cards = load_cards()
    sections = manifest.get("sections", {})
    html = INDEX.read_text()

    def has(sid):
        return any(c in cards for c in sections.get(sid, []))

    # 1) fill grids
    for sid in ALL_IDS:
        html = replace_div_inner(html, '<div class="grid-flex" data-grid="' + sid + '">', render_grid_inner(sections.get(sid, []), cards))

    # 2) featured
    fid = manifest.get("featured")
    if fid and fid in cards:
        html = replace_div_inner(html, '<div class="featured region" id="featured">', render_featured_inner(cards[fid]))

    # 3) positioning
    if manifest.get("positioning"):
        pos_inner = '<div class="positioning-text">' + et(manifest["positioning"]) + "</div>"
    else:
        pos_inner = '<div class="ph-line w90"></div><div class="ph-line w75"></div><div class="ph-line w60"></div>'
    html = replace_div_inner(html, '<div class="positioning-body">', pos_inner)

    # 4) headline, only when provided
    if manifest.get("headline"):
        html = re.sub(r'(<h1 id="page-headline">).*?(</h1>)', lambda m: m.group(1) + et(manifest["headline"]) + m.group(2), html, count=1, flags=re.S)

    # 5) hide empty sections, subsections, nav links, groups
    hidden_report = []
    for sid in MAIN_IDS:
        h = not has(sid)
        html = hide_section(html, sid, h)
        html = hide_navlink(html, sid, h)
        if h:
            hidden_report.append(sid)
    for sid in SUB_IDS:
        h = not has(sid)
        html = hide_subsection(html, sid, h)
        html = hide_navlink(html, sid, h)
        if h:
            hidden_report.append(sid)
    any_sub = any(has(sid) for sid in SUB_IDS)
    html = hide_section(html, "systems", not any_sub)
    html = hide_navlink(html, "systems", not any_sub)
    html = hide_sublinks(html, not any_sub)
    for label, ids in GROUPS.items():
        visible = any(has(sid) for sid in ids)
        html = hide_group(html, label, not visible)

    INDEX.write_text(html)

    shown = [sid for sid in ALL_IDS if has(sid)]
    print("Wrote", INDEX)
    print("Featured:", fid)
    print("Sections with cards:", ", ".join(shown) if shown else "(none)")
    print("Hidden (no cards):", ", ".join(hidden_report) if hidden_report else "(none)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
