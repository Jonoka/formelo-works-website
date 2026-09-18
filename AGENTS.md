# Project instructions

## Read before work

Read `docs/decisions/0001-approved-direction.md`, `docs/product/prd-v1.0.md`, `docs/design/visual-baseline.md`, and `docs/development/backlog.md`.
Open `assets/reference/homepage-selected-v1.webp` for visual work. Do not invent a different design or regenerate alternatives after the user selected this direction.
Repository Markdown is the working documentation; imported v1 documents are snapshots, not an alternative evolving source of truth.

## Boundaries

- Factory-owned identity, English public site; website team owns web / SEO, factory owns sales and fulfillment.
- Ten content URLs / eight templates. Use `config/routes.json`.
- No inquiry forms, customer uploads, customer database, CRM, checkout, payments, order portal, chatbot API, or extra SEO pages without an explicit scope change.
- Astro + TypeScript static site and a separate Sanity Studio use root npm workspaces. Current concept structure is ten content URLs in config/routes.json plus engineering 404 (11 HTML files). DEV-05C unifies the two existing article records across Home / Journal / Article while keeping full-site CONTENT_MODE mock; one explicitly authorized real Sanity Draft remains loopback-dev-only and this is not a full-site CMS connection.
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

## Current DEV-05C article delivery

PR #8 is merged at `main@83dec3f23f264ac034d1b7775eff6ca2b71a8d27`, accepted head `5ef5ae3a7ca82c64ec238e7b329c78a0faebde5c`. Continue `feat/cms-editorial-delivery` and PR #9. Re-observe Windows before synchronization; only fast-forward while preserving local changes, untracked files, ignored environment files and historical evidence. Do not reset, clean, force push, replace the branch, merge, mark Ready or deploy automatically.

Read docs/development/cms-editorial-mapping.md and docs/operations/cms-editorial-verification.md. Home Journal cards, the Journal index and Article detail must consume the same server article collection/detail entry. Card title/excerpt/slug/reference/source/status/revision/cover state are projections of that same validated record, not separate hardcoded/query copies.

Article source selection is explicit and independent of full-site `CONTENT_MODE`:
- default `ARTICLE_CONTENT_MODE=mock`: two local editorial drafts;
- `draft-preview`: only the authorized quote Draft from project `iajvl7ka` / dataset `production` / base document `1d86cc37-7f67-47e0-b29a-3eac5aa0a3ae`; MOQ remains an explicitly local editorial draft;
- `published`: strict published-only collection using the existing converter; no draft or local fallback if a record is missing or invalid.

Draft preview still requires `DEV_CMS_DRAFT_PREVIEW=1`, `DEPLOY_ENV=local`, actual Astro command `dev`, and a loopback request/listener. Every build path must reject Draft preview before network access/output. Draft and published dev reads are fresh per request with no-store; one static build may share one immutable-source snapshot only. Do not retain a prior success after auth/query/timeout/conversion failure.

Real Draft cover is absent, so Home / Journal / Article must all show the deliberate no-image state; never substitute a category concept image as if it were an approved CMS cover. Published covers only render after strict permission/asset validation. Reuse EditorialBody and preserve the MOQ quantity-table fix.

Ordinary CI uses only offline/synthetic CMS data and fake credentials. It may run extra Astro dev servers with `--ignore-lock` only for isolated loopback browser fixtures; this does not loosen the real Draft host/command/build guards. Real CMS regression remains local/read-only unless the user separately authorizes mutation. Media upload, publish/withdraw, schema/Studio/site deployment, webhook and full-site CMS migration remain unauthorized. Known moderate dependency findings remain open; do not claim zero vulnerabilities or use `audit fix --force`.

## Historical DEV-05A editorial CMS foundation

PR #6 supplied the Article/Journal baseline and PR #7 merged the offline CMS foundation. That stage used only synthetic/offline fixtures and did not have real CMS authorization. Keep its documentation and evidence as historical records; later DEV-05B authorization must not be rewritten as if DEV-05A had performed live Sanity validation.

## Journal / Article / Legal baseline retained from PR #6

The first full quote draft and Article template were rendered and actually inspected at 1440/390 before the MOQ draft was added. Both article previews and the non-effective legal preview pass through loadContent; formal Sanity articles stay empty. No fake asset references, authors, publication or review dates. The manually selectable enquiry template has no copy button or download gate. Hypothetical MOQ values belong only to the article example and must not enter factory settings. See docs/design/journal-article-legal-handoff.md and docs/development/routes-and-navigation.md. Ten-page concept implementation does not close real content, CMS, production SEO, channels or full-site acceptance.

Use config/page-context.ts for required referenceCode props; no new-page default to WEB-HOME. BaseLayout appends the configured brand to page-specific SEO titles. Contact fields remain null, controls disabled, no copy/email/WhatsApp API or success state. Do not invent factory facts, services, inspection standards, certs, case studies or in-house processing claims.

Reuse the unchanged three garment concepts/manifest. Two dedicated article covers remain pending; reuse is explicitly labelled and registered without inventing new binaries, hashes or asset approval. FactoryPhotographyPending stays non-photographic. Keep exact ten-route image and per-template contact policies and negative guards. Journal links target /blog/ while home #journal remains. Article breadcrumbs are Home → Journal → article; Journal is a parent link, not aria-current on article pages. Legal/404 retain ordinary navigation/footer but no marketing row or sticky contact bar and no referenceCode. Controlled editorial bodies must remain static escaped HTML; no arbitrary HTML, embeds or unsafe protocols. Source allowlisting permits exact reviewed HTTPS anchor navigation only, never remote resource loading. Do not add more sections/routes after this increment: next work is real factory materials and authorized CMS/contact preparation.
