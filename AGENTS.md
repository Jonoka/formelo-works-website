# Project instructions

## Read before work

Read `docs/decisions/0001-approved-direction.md`, `docs/product/prd-v1.0.md`, `docs/design/visual-baseline.md`, and `docs/development/backlog.md`.
Open `assets/reference/homepage-selected-v1.webp` for visual work. Do not invent a different design or regenerate alternatives after the user selected this direction.
Repository Markdown is the working documentation; imported v1 documents are snapshots, not an alternative evolving source of truth.

## Boundaries

- Factory-owned identity, English public site; website team owns web / SEO, factory owns sales and fulfillment.
- Ten content URLs / eight templates. Use `config/routes.json`.
- No inquiry forms, customer uploads, customer database, CRM, checkout, payments, order portal, chatbot API, or extra SEO pages without an explicit scope change.
- Astro + TypeScript static site and a separate Sanity Studio use root npm workspaces. Current concept structure is ten content URLs in config/routes.json plus engineering 404 (11 HTML files). PR #9 / DEV-05C is merged. DEV-05D now builds a strict published-provider foundation for siteSettings + six fixed pages + two categories, but full-site CONTENT_MODE remains mock and template-specific fixed-page content is not yet migrated; one explicitly authorized real Sanity Draft remains loopback-dev-only.
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
npm ci
npm exec -- playwright install chromium
npm run verify
npm audit --audit-level=high
python3 scripts/check_repository.py
python3 -m unittest discover -s tests -p 'test_*.py' -v
bash -n scripts/publish-github.sh
```

Use Node 24.21.0 and npm 11.19.1 (upgrade the bundled npm explicitly), exact dependency versions and the single root package-lock.json. Keep engine-strict enabled. `npm run check:runtime` verifies the executing versions against both version files, engines, packageManager and root lock metadata; `npm run verify` runs it first. Select future updates from the official supported Node 24.x release/security records and rerun clean installation and all checks; npm audit does not audit the Node binary. `npm run dev` listens on loopback only, default port 4321; read the printed address if the port is occupied. Browser tests require free ports 4321 / 4322 and start their own servers; do not reuse somebody else's running server.
`npm run verify` covers type checking, unit/schema tests, an actual production-build rejection, static-output checks and Chromium tests of both dev and preview. Keep Python bootstrap tests runnable on Linux CI. Never treat these as full PRD or production acceptance.
`DEPLOY_ENV=production`, unsupported content modes and analytics fail closed. Ordinary CI/builds use no Sanity secret and no live cloud request; tests may exercise invalid/synthetic CMS input through injected transport. Preserve DEV-05A / PR #7 and PR #6 / #5 verification as historical evidence. Do not claim browser, CI, contact delivery or live Sanity integration tests ran unless they actually did.

## Current DEV-05D full-site provider foundation

PR #9 / DEV-05C is merged at `main@64e881acd04b4c7ae7269d111dd1d3ea51c22044`. Continue `feat/cms-site-provider` from that exact main. Re-observe Windows before synchronization; only fast-forward while preserving local changes, untracked files, ignored environment files and historical evidence. Do not reset, clean, force push, replace the branch, merge, mark Ready, publish or deploy automatically.

Read docs/development/cms-editorial-mapping.md and docs/operations/cms-editorial-verification.md. DEV-05D adds a server-only published bundle for exactly one siteSettings document, the six planned fixed page keys and the two planned category slugs. It must fail on draft/release identities, duplicate routes/singletons, missing required records, stale/future dates, invalid contact/MOQ/sample data, unapproved or malformed images, bad references and unexpected fields.

The site provider is **foundation only**. Do not import it into `web/src/lib/content.ts`, do not enable `CONTENT_MODE=sanity`, and do not pretend the current local Manufacturing / Factory / Contact / Privacy presentation objects have been migrated. Their template-specific content remains local until a later explicit integration increment with confirmed factory/legal material. Category published validation must include capability rows, at least one evidence image, required customization/sampling notes and at least three samples/FAQs. Default builds must remain mock-only, 11 HTML, production-blocked and secret-free.

Reuse the shared strict public-image conversion for article covers and site/category images. Site provider tests use synthetic fixtures and groq-js in-memory evaluation only; do not use the existing single-article token authorization to enumerate real siteSettings/pages/categories. Environment-based site reading additionally requires `SANITY_SITE_READ_ENABLED=1`; leave it unset until separate explicit scope confirmation for a real full-site read.

Retain DEV-05C article behavior unchanged: Home Journal, Journal index and Article detail share one article delivery entry; draft-preview remains loopback-dev-only for the one authorized quote Draft; published article mode remains strict and never falls back. Media upload, publish/withdraw, schema/Studio/site deployment, webhook and production release remain unauthorized. Known moderate dependency findings remain open; do not claim zero vulnerabilities or use `audit fix --force`.

## Historical DEV-05A editorial CMS foundation

PR #6 supplied the Article/Journal baseline and PR #7 merged the offline CMS foundation. That stage used only synthetic/offline fixtures and did not have real CMS authorization. Keep its documentation and evidence as historical records; later DEV-05B authorization must not be rewritten as if DEV-05A had performed live Sanity validation.

## Journal / Article / Legal baseline retained from PR #6

The first full quote draft and Article template were rendered and actually inspected at 1440/390 before the MOQ draft was added. Both article previews and the non-effective legal preview pass through loadContent; formal Sanity articles stay empty. No fake asset references, authors, publication or review dates. The manually selectable enquiry template has no copy button or download gate. Hypothetical MOQ values belong only to the article example and must not enter factory settings. See docs/design/journal-article-legal-handoff.md and docs/development/routes-and-navigation.md. Ten-page concept implementation does not close real content, CMS, production SEO, channels or full-site acceptance.

Use config/page-context.ts for required referenceCode props; no new-page default to WEB-HOME. BaseLayout appends the configured brand to page-specific SEO titles. Contact fields remain null, controls disabled, no copy/email/WhatsApp API or success state. Do not invent factory facts, services, inspection standards, certs, case studies or in-house processing claims.

Reuse the unchanged three garment concepts/manifest. Two dedicated article covers remain pending; reuse is explicitly labelled and registered without inventing new binaries, hashes or asset approval. FactoryPhotographyPending stays non-photographic. Keep exact ten-route image and per-template contact policies and negative guards. Journal links target /blog/ while home #journal remains. Article breadcrumbs are Home → Journal → article; Journal is a parent link, not aria-current on article pages. Legal/404 retain ordinary navigation/footer but no marketing row or sticky contact bar and no referenceCode. Controlled editorial bodies must remain static escaped HTML; no arbitrary HTML, embeds or unsafe protocols. Source allowlisting permits exact reviewed HTTPS anchor navigation only, never remote resource loading. Do not add more sections/routes after this increment: next work is real factory materials and authorized CMS/contact preparation.
