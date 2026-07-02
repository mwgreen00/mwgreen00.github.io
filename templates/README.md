# Card templates

Copy-ready starting points for a project card. Files here are templates only. They
are ignored by the site: the loader and `tools/generate-index.py` read `cards/`, not
`templates/`.

- `card-with-graphic.json` - a card that shows an image at the top.
- `card-plain.json` - the same card with no graphic.
- `audience.json` - a curated view: which cards show, in what order, per section.

## How to use

1. Copy a template into `cards/` with a real, unique filename, for example
   `cards/my-project.json`.
2. Set `id` to match the filename without `.json` (here, `my-project`).
3. Edit the fields (see below), then reference the id in `audiences/default.json`
   and any audience manifest that should show the card.
4. If the card is in the default view, run `python3 tools/generate-index.py` so the
   baked-in baseline updates.

## Fields

Required:

- `id` - unique slug, must equal the filename without `.json`.
- `title` - project title, sentence case.
- `description` - two or three sentences. Numbers must match your resume and LinkedIn.
- `actions` - list of buttons. Each is `{ "label": "...", "href": "...", "primary": true|false }`.
  Mark one `primary` for the filled button; omit `primary` for the outline style.

Optional (delete the line to leave it off):

- `eyebrow` - small label above the title, usually `Case study` or `GitHub build`.
- `flag` - coral badge in the top corner, for example `Flagship`.
- `meta` - one line, usually `Client | Role | Dates`.
- `tags` - list of short chips.
- `supports` - muted line, for a case study noting the second pillar it helps.
- `proves` - muted line, for a GitHub build noting the capability it demonstrates.

Graphic (only in `card-with-graphic.json`):

- `image` - path to the graphic, relative, for example `assets/my-dashboard.png`.
  Put the file in `assets/`. Renders a fixed-height thumbnail at the top of the card.
- `imageAlt` - alt text for the image. Defaults to the title if omitted.
- `mediaLabel` - instead of `image`, show a labeled placeholder box until the real
  image is ready. Ignored when `image` is set.

To turn a plain card into one with a graphic, just add an `image` line. To go the
other way, delete `image`, `imageAlt`, and `mediaLabel`.

---

# Audience template (`audience.json`)

An audience is a curated view of the site for a specific visitor. You pick which
cards appear in each section and which one is featured at the top. Visitors reach it
with a link like `yoursite.com/?audience=datacenter`.

## How to use

1. Copy `audience.json` into `audiences/` with a lowercase filename, for example
   `audiences/datacenter.json`. The filename (without `.json`) is the name used in
   the `?audience=` link, so keep it short and URL-friendly.
2. Set `featured` and the `sections` lists to real card ids (a card id is the
   filename in `cards/` without `.json`).
3. Share the link as `?audience=<filename>`, for example `?audience=datacenter`.

No generator run is needed. Audiences are assembled in the browser at load time.
Only the `default` view is baked into the page and needs `generate-index.py`.

## Fields

- `name` - a label for your own reference. It does not drive the link; the filename
  does. You can set it to match the filename.
- `featured` - the card id shown in the large featured tile at the top.
- `sections` - an object. Each key is a section on the page; its value is the
  ordered list of card ids to show there. Order in the list is the order on the page.
- `headline` - optional. Replaces the main H1 for this audience. Delete to keep the default.
- `positioning` - optional. Replaces the sidebar positioning line. Delete to keep the default.

## Section keys

Five main sections and four Systems Labs subsections:

- Main: `sales-ops`, `marketing-ops`, `sales-dev`, `retention`, `ai-automation`
- Systems Labs: `sys-process`, `sys-custom`, `sys-research`, `sys-other`

A section you leave out, or leave as an empty list, is hidden along with its menu
link. If all four `sys-*` subsections are empty, the whole Systems Labs section is
hidden. A bad or missing audience name falls back to the default view.

