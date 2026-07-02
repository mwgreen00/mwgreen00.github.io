# Michael Green - Revenue Operations portfolio

A static site: plain HTML, CSS, and JavaScript. No build step and no framework. Project cards are separate files that get assembled into the page at load time, so you can prebuild a library of cards and swap sets in and out per audience. Hosted on GitHub Pages.

## Files

- `index.html` - the page shell (sidebar, empty section grids, empty featured tile)
- `styles.css` - all styling; design tokens (colors, fonts, spacing) are at the top under `:root`
- `script.js` - accordion, left-menu highlighting, annotation toggle, and the card loader
- `cards/` - one JSON file per project card
- `audiences/` - audience manifests: `default.json` plus any others
- `assets/` - images (banner, headshot), case-study PDFs, diagrams, and `favicon.svg`
- `assets/favicon.svg` - the site icon: a letter "G" in Space Grotesk (the heading font), drawn as a vector outline on a sage tile so it renders correctly everywhere without loading a web font
- `.nojekyll` - tells GitHub Pages not to skip any files
- `CLAUDE.md` - instructions for Claude Code

## How the cards work

The site is static-first. The default view is baked into `index.html` as real HTML, so the page shows content even with JavaScript off or if a load fails. Each card is also a small JSON file in `cards/`, and each manifest in `audiences/` lists a featured card and, per section, the ordered card ids to show, and can override the headline and positioning line.

On load, `script.js` reads `?audience=NAME` from the URL. If it is `default` or absent, the loader does nothing, since the baseline already shows the default. For any other audience it fetches the manifest and the referenced cards, and replaces the baseline only after the fetch succeeds. A section a manifest leaves out is hidden along with its menu link.

If a non-default view fails to load (bad name, blocked fetch, or opened from a file path), the loader keeps the default view in place and shows a banner telling the visitor to reload, remove the `?audience` part, or open the site over http. With JavaScript off, a `<noscript>` banner notes that audience views and some controls are disabled and lists the contact links, while the default cards remain visible below.

Note: the default view is baked into `index.html`, but you do not edit that by hand. Edit `audiences/default.json` and the card files, then run `python3 tools/generate-index.py` to regenerate it. See "Pick the cards on the homepage" below.

Swap content two ways:

1. Edit a manifest to change which cards appear.
2. Send audience-specific links, for example `yoursite.com/?audience=datacenter`. Same page, curated content.

### Add a card

1. Create `cards/<id>.json`. Copy an existing card file and edit the fields: title, meta (client, role, dates), description, tags, the supports or proves line, and the action links. To give the card a graphic, add `"image": "assets/your-file.png"` (optional `"imageAlt"`); leave it out for no graphic, or use `"mediaLabel"` to show a labeled placeholder until the image is ready.
2. Reference the id in `audiences/default.json` and in any audience that should show it.
3. Put any asset (PDF, diagram, screenshot) in `assets/` and point an action `href` at it or at the repo.
4. If the card is in the default view, run `python3 tools/generate-index.py` to update the baked-in baseline.

### Pick the cards on the homepage

The homepage is the `default` audience. To choose what shows:

1. Edit `audiences/default.json`. Each key in `sections` is a section on the page; its array is the ordered list of card ids to show. `featured` is the top tile. A card id is the filename in `cards/` without `.json`. A section you leave empty or delete is hidden.
2. Run `python3 tools/generate-index.py`. It rewrites the baked-in default cards, featured tile, positioning line, and headline in `index.html`, and hides any empty section. It is re-runnable and safe.
3. Commit `index.html` along with your JSON changes.

### Add or curate an audience

1. Copy `audiences/default.json` to `audiences/<name>.json`.
2. Set `featured`, edit the `sections` lists, and optionally set `headline` and `positioning`.
3. Share the link as `?audience=<name>`.

## Run it locally

The cards load with fetch, so open it through a local server, not by double-clicking the file:

```
python3 -m http.server 8000
```

Then visit http://localhost:8000

## Deploy to GitHub Pages

1. Create a public repository. A user site uses the repo name `username.github.io` and serves at that root. A project repo serves at `username.github.io/reponame`.
2. Put these files at the repo root (or in a `/docs` folder).
3. Commit and push. In Settings > Pages, set the source branch and folder.
4. `.nojekyll` is already included.
5. Wait for the green checkmark, then open the Pages URL. GitHub Pages serves over http, so the cards load.

Keep all paths relative so the site works at either URL shape.

## Custom domain (optional)

1. Add a file named `CNAME` at the repo root containing your domain, for example `michaelgreen.com`
2. At your registrar, point the DNS record to GitHub Pages.
3. In Settings > Pages, turn on Enforce HTTPS.

## Design tokens and style guide

Colors, radii, and motion live in `:root` at the top of `styles.css`. Change a token in one place and the rest of the site follows. Do not hardcode colors, radii, or transition times in individual rules.

The look is warm and editorial. Full guide (palette roles, typography scale, shapes, and motion) is in `CLAUDE.md` under "Style guide." The short version:

- Palette (dark theme): deep green-black `#1A2321` canvas with elevated dark `#232E2B` card surfaces, warm off-white `#ECE9E2` text, dark sage containers and `#3A453F` borders, brightened Accent Sage `#6FB090` for primary actions and links, Pop Coral `#FF6B6B` for badges and active/hover accents. Follow the 60-30-10 split (mostly the dark canvas, then dark surfaces and light text, and only about 10% Sage/Coral accents). Keep coral off body text. Switching back to a light theme is a token-only edit; the previous light values are noted in `CLAUDE.md`.
- Fonts: Space Grotesk for headings, section titles, and nav links; Outfit for body copy, descriptions, and buttons. Both load from Google Fonts via a `<link>` in `index.html` and fall back to system-ui.
- Type: H1 `2.5rem`-`3.5rem`, section headers `2rem`, body `1rem`-`1.125rem`.
- Shapes: cards `16px`, self-contained bands and the featured tile `24px`, pill buttons and chips `50px`, images `12px`.
- Motion: `all 0.3s ease` on everything interactive, with a `translateY(-4px)` lift on card and button hover; borders flip to coral when active or hovered.

## Before launch: remove the wireframe scaffolding

- The `body` starts with `class="annotate"`; remove that class, the annotation CSS, and the toggle when you are done reviewing.
- Remove the small `.tag` region labels.
- Rename the brand text `Wireframe / RevOps Portfolio` and clear the top-bar note.
- Keep the `Close all` control if you want it; it is a real feature.

## Maintenance checklist

- Consistency: every number on the site matches your resume and LinkedIn. Change one, change all three the same day.
- Quarterly: confirm outbound links resolve, refresh the featured card, recheck the phone layout, update the footer date.
- Before launch: add the page title, description, Open Graph tags, and a favicon. Placeholders are in the head.
- Images: compress and size them so the page loads fast on a phone.
- Guardrail: anonymize clients and use sample numbers in any dashboard screenshot before it goes in `assets/`.

## Note on SEO

Because cards are injected by JavaScript, they are not in the initial HTML. That is usually fine for a link shared into applications and LinkedIn. If strong search indexing or no-JavaScript robustness becomes a priority, move to a build step (Eleventy, Astro, or Jekyll) that stitches the card files into static HTML at deploy time.
