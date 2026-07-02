# This site: an audience-targeted RevOps portfolio

A static portfolio built on GitHub Pages that tailors what each viewer sees. Designed and built by Michael Green (Town Lake Systems Group), assembled with Claude and Claude Code.

## STAR summary

Situation: Michael was running a search for Senior Director and VP Revenue Operations roles while operating Town Lake Systems Group, a RevOps consulting practice. Resume and LinkedIn covered the basics, but there was no place to show the actual projects, the systems, and the code behind the work, and no way to tailor that proof to a specific recruiter or vertical.

Task: Design and ship a portfolio that organizes the work by the four RevOps pillars plus a cross-cutting AI layer and a systems and code section, lets Michael prebuild a library of project cards and swap sets in and out per audience, loads fast on a phone, and stays maintainable with no framework and no build server.

Action: Worked the design as a series of wireframes, from a two-column layout to per-pillar collapsible sections with an accordion and a left menu that highlights the open section. Moved the content into a data-driven system: each project is a small JSON card, and an audience manifest chooses which cards appear and in what order, with a ?audience= value in the URL selecting the set. Made the site static-first so the default view is real HTML that works with JavaScript off, added a no-JavaScript fallback and a load-failure banner, and wrote a Python generator plus a CLAUDE.md so the JSON stays the single source and an AI coding agent can maintain the site within guardrails.

Result: A repo-ready static site on GitHub Pages with a library of project cards, audience-targeted landing pages reachable by a single URL parameter, a default homepage that renders even with JavaScript disabled, and a one-command, idempotent generator that keeps the baked-in baseline in sync with the card files. The audience mechanism applies account-based personalization, the same idea Michael builds for sales teams, to his own job search.

## Project overview

The site presents Michael's work in five parts: the four RevOps pillars (Sales Operations, Marketing Operations, Sales Development, Revenue Retention), a cross-cutting AI and Automation section, and a Systems Labs section for public, synthetic-data code builds. A featured tile sits at the top for the strongest piece. A sticky left sidebar holds identity, positioning, proof-point metrics, and a jump menu.

Each project is a card. Cards are small JSON files. What shows on the page, and in what order, is decided by an audience manifest, not by the HTML. That split is the core idea: the content library and the page assembly are separate.

## What we were solving for

- Show the work, not just claims: projects, systems, and code, each linking to an asset or a repo.
- Tailor the proof to the viewer: a data center recruiter and a general RevOps recruiter should not have to read the same page.
- Speed and mobile: recruiters open links on a phone, so the page has to be light and readable on a small screen.
- No build server and no framework: cheap to host on GitHub Pages, easy to change, and portable.
- Maintainable by Michael and by an AI coding agent, without breaking the interaction model.
- A safe fallback: never show a blank page if JavaScript is off or a load fails.

## Problems and solutions

Problem: a single long page of project text reads as a wall.
Solution: each pillar is its own collapsible section with an accordion, so only one section is open at a time, and a featured tile carries the lead project at the top.

Problem: the left menu did not reflect where the reader was, and a scroll-position highlighter fought the accordion.
Solution: the highlight is driven by which section is open, not by scroll position. Opening a section, by clicking its header or its menu link, highlights it. The same rule extends to the Systems Labs subsections.

Problem: every viewer saw the same page, which is the opposite of how Michael runs go-to-market.
Solution: a data-driven card system. Each project is a JSON card in cards/. An audience manifest in audiences/ lists the featured card and, per section, the ordered card ids. A ?audience= value in the URL selects the manifest, so a tailored view is one link. Sections a manifest leaves out are hidden along with their menu links.

Problem: because cards are loaded with JavaScript, a visitor with JavaScript off, or a failed load, could see an empty page.
Solution: static-first. The default view is baked into the HTML, so it renders with JavaScript off. A noscript banner lists the contact links and the featured project. For the JavaScript-on-but-failed case, the loader keeps the default in place and shows a banner, backed by a timeout, telling the visitor to reload, drop the ?audience part, or open the site over http.

Problem: the default set then lived in two places, the JSON and the baked-in HTML, which can drift.
Solution: a Python generator (tools/generate-index.py) rewrites the baked-in default view from the JSON, so the card files stay the single source. It fills the section grids, the featured tile, the positioning line, and the headline, and hides any empty section. It is re-runnable and idempotent, and uses only the standard library.

Problem: on a phone, the menu sat above the featured project because it lives in the sidebar on desktop.
Solution: at the mobile breakpoint the two columns collapse with display: contents so all blocks become one stack, and CSS order places them in the intended phone sequence. The desktop layout is untouched.

Problem: handing the site to an AI coding agent safely.
Solution: a CLAUDE.md documents the architecture, the do-not-break interaction model, the id-to-manifest matching, the house writing style, and the content guardrails, so an agent can extend the site without breaking it.

## Architecture

- index.html: the page, with the default view baked in as the static baseline.
- styles.css: all styling, with design tokens at the top for a later color pass.
- script.js: the accordion, the menu highlighting, and the audience loader.
- cards/: one JSON file per project card.
- audiences/: manifests. default.json is the homepage; other files are curated views.
- tools/generate-index.py: regenerates the baked-in default view from the JSON.
- assets/: images, PDFs, and this case study.

## Stack

Plain HTML, CSS, and JavaScript. No framework and no bundler. Hosted on GitHub Pages, deployed by a git push. Built iteratively with Claude, and set up to be maintained with Claude Code.

## How it is maintained

To change the homepage, edit audiences/default.json and the card files, then run python3 tools/generate-index.py and commit. To publish a tailored view, copy default.json to a new manifest, edit its cards and featured project, and share the link as ?audience=name. No tailored view needs the generator, since the loader renders those at load time.
