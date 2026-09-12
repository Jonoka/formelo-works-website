# Project instructions

## Read before work

Read `docs/decisions/0001-approved-direction.md`, `docs/product/prd-v1.0.md`, `docs/design/visual-baseline.md`, and `docs/development/backlog.md`.
Open `assets/reference/homepage-selected-v1.webp` for visual work. Do not invent a different design or regenerate alternatives after the user selected this direction.
Repository Markdown is the working documentation; imported v1 documents are snapshots, not an alternative evolving source of truth.

## Boundaries

- Factory-owned identity, English public site; website team owns web / SEO, factory owns sales and fulfillment.
- Ten content URLs / eight templates. Use `config/routes.json`.
- No inquiry forms, customer uploads, customer database, CRM, checkout, payments, order portal, chatbot API, or extra SEO pages without an explicit scope change.
- Astro + TypeScript static site and a separate Sanity Studio are the intended stack. No application has been scaffolded in this bootstrap.
- Preserve the chosen serif editorial headings, warm off-white, charcoal, brick-red CTA, thin dividers, garment photography and dark footer. Fine spacing / contrast / mobile refinements are allowed; unrelated redesigns are not.

## Source and truth rules

FORMELO WORKS is provisional. Categories, manufacturing claims and figures are unconfirmed.
AI imagery is concept imagery, never factory evidence. Do not fabricate certificates, customer logos, plant photos, MOQ, price, lead time, sustainability claims, live contact accounts or test results.
The approved screenshot is reference-only and must never be served as the webpage or a production asset.
No font files are included in this package. Do not export or redistribute fonts from the tool environment. A later implementation must obtain a permitted web font source separately or use system fonts.

## Preview / production

Concept mode may render null contacts as disabled controls with explicit `Contact details pending` explanation. Do not generate live `mailto:` or `wa.me` targets for null / dummy contacts. Do not show sent / received inquiry success states.
Production release is blocked until real brand, capability facts, approved assets, real channels and required tests are confirmed. Do not silently override a production failure to publish a concept preview.
Analytics remains off unless separately approved. Never log contact links, email addresses, numbers, messages or client files in analytics.

## Git workflow

Read the current branch, commit and status before editing. Never overwrite a dirty worktree or another contributor's work.
Start a task branch from up-to-date `main` (or use the explicitly supplied branch). Do not force push or merge / publish without the user's instruction.
Use small commits. Report branch, base SHA, changed paths, executed checks and push / PR status accurately. Local files are not a remote push; a push is not a deployment.
If the environment only has read access, prepare a patch or archive and state that the push remains unperformed; do not seek tokens in unrelated files or ask users to paste secrets.

## Current runnable checks

```bash
python3 scripts/check_repository.py
python3 -m unittest discover -s tests -p 'test_*.py' -v
bash -n scripts/publish-github.sh
```

No `npm run dev` exists yet. First implementation task is DEV-01: scaffold Astro, choose compatible stable dependencies, commit lockfiles and record actual successful commands.
After scaffolding, update this file and README with verified setup, build and test commands. Do not claim browser, CI, contact delivery or Sanity integration tests ran unless they actually did.
