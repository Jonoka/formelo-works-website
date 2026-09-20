# Project instructions

## Read before work

Read `docs/decisions/0001-approved-direction.md`, `docs/product/prd-v1.0.md`, `docs/design/visual-baseline.md`, and `docs/development/backlog.md`.
Open `assets/reference/homepage-selected-v1.webp` for visual work. Do not invent a different design or regenerate alternatives after the user selected this direction.
Repository Markdown is the working documentation; imported v1 documents are snapshots, not an alternative evolving source of truth.

## Boundaries

- Factory-owned identity, English public site; website team owns web / SEO, factory owns sales and fulfillment.
- Ten content URLs / eight templates. Use `config/routes.json`.
- No inquiry forms, customer uploads, customer database, CRM, checkout, payments, order portal, chatbot API, or extra SEO pages without an explicit scope change.
- Astro + TypeScript static site and a separate Sanity Studio use root npm workspaces. Current concept structure is ten content URLs in config/routes.json plus engineering 404 (11 HTML files). PR #9–#13 / DEV-05C–G are user-merged; all planned CMS template paths exist. DEV-05H prepares launch copy on content/cms-launch-drafts; the approved limited read scope remains valid, but batch cloud Draft writes still require separate approval. Default content remains mock; the existing one-Draft preview remains actual-dev/local/loopback-only.
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

## Current DEV-05H launch-copy boundary

PR #13 was user-merged at `2026-09-20T11:41:09Z`, reviewed head `2af2e2a7e56f832fba1e7314c8c94ac10b20a83a`, actual merge/base `b8624a0fba90a4442dc3cbe45c47112e428b23f8`. Continue `content/cms-launch-drafts`, not merged `chore/cms-live-readiness`. Recheck latest main, PRs and Windows status before further work; the recorded base is historical, not a permanent development starting point.

Read `docs/content/cms-launch-drafts.en.md` for proposed English copy and its exact write allowlist. The original factory-materials checklist remains the sole factual-gap register; Chinese questions are not public copy. This stage changes documentation only, not templates/schema/query/runtime/tests/dependencies. Drafts may remain incomplete: never fill fake factory facts, images, samples, author/contact/legal values, review/public dates or an unconfirmed projectBased MOQ policy.

No current batch-write approval is recorded. The scoped read refresh found the same original quote Draft/revision, not a permanent unconditional creation list. A later explicit approval may cover at most ten still-missing logical Drafts and only the original quote excerpt. Reread selectors/IDs/revision; do not overwrite a newly existing record. Require non-overwriting create and revision-guarded field patches through an authorized supported tool; report refusal or unsupported protection rather than bypassing it. Do not migrate the quote body or replace unknown fields. This batch leaves unready references unset; no weak refs, invented targets or publication to resolve them.

Keep required published validation, default mock, existing one-Draft isolation, contacts disabled, Privacy not in effect, analytics off, noindex and production block. No media, publishing/unpublishing, messages, preview expansion or deployment. Actual Draft saves, if later approved, must be reported separately from Git. Run the appropriate docs/repository checks; do not manually repeat full browser suites for these Markdown edits. Automatic Linux CI and artifact retention remain separate; retain the closed check-order fix and do not claim CI all green. Keep the PR Draft.

## Historical DEV-05G limited live readiness

PR #12 was merged by Jonoka at `2026-09-20T08:10:40Z`; reviewed head `d3b4de2dc6e22fb3fe85dae1a7e61a9e4da237ad`, actual merge/base `15155608981d0c092de928e319e717dd7f7af731`. Work on `chore/cms-live-readiness`, not the merged fixed-page branch. Five-page visual confirmation is already accepted. Prior 288/461/Linux22 results are historical; artifact quota/retention exceptions remain distinct and are not a green CI claim or waiver.

On 2026-09-20 the user replied “批准” to an explicit scope: `iajvl7ka/production`, this site's siteSettings, six pageKeys (home/manufacturing/factory/contact/blogIndex/privacy), two category slugs (t-shirts/hoodies), two article slugs (what-to-send-for-a-clothing-quote/moq-per-style-per-color), and necessary references/public media metadata. Read-only ID discovery by these selectors, draft/published metadata, necessary bodies and existing local loopback validation are permitted. Safely use the existing local server credential; do not print it, persist activation flags or alter real environment files. This newly approved read scope supersedes only the older live-read prohibition below; it does not grant any cloud write or deployment.

The actual scoped metadata read at `2026-09-20T08:19:49.763Z` found one inquiry Draft and no matching other records in the current credential-visible scope. The same inquiry revision remains `41ad5fd0-211a-4ea2-89e8-433c2906b8a7`; the unchanged official one-Draft converter passes, but author/publication/update/fact-date/cover fields are absent and fact review remains pending. See the current matrix in the same factory-materials checklist. An empty authorized result is not proof about documents hidden by ACLs, differently keyed records or unrelated content; do not enumerate them.

Keep the one-off readiness diagnostic separate from the unchanged published reader. Do not relax strict conversion, synthesize missing content, create another provider/builder or add URLs. No qualifying published bundle currently exists; only the existing inquiry Draft preview may be locally checked, with the surrounding mock shell clearly identified. Do not call a partial Draft screenshot a real full-site page.

No document creation/edit/migration/import, asset upload, publish/withdraw/delete, broader draft-preview implementation, messages, policy activation, analytics/indexing/production changes, schema/Studio/site/Webhook/Cloudflare deployment without a separate explicit authorization. Record metadata/status/revisions and controlled errors only in Git; raw responses, private bodies, credentials and screenshots stay in ignored local evidence. Docs-only changes need repository/doc checks, not repeated full browser suites; application changes still require targeted tests and full verify. Preserve all prior evidence and mandatory-check-before-upload CI order. Keep the task PR Draft; no automatic Ready, merge or deploy.

## Historical DEV-05F fixed-page template integration

PR #11 was user-merged at `2026-09-20T06:02:42Z`; accepted head `dd2690892826384548ab24a4dfb33e09c0290ba6`, actual merge/base `53604896f5a554231389455596489eb22d9fabb4`. Continue `feat/cms-fixed-page-integration`, not the merged Home/Category branch. Read the latest PR/main/Windows HEAD and full porcelain status before edits or safe fast-forward. Preserve all local, untracked, ignored environment and historical evidence. No reset, clean, force push, automatic Ready/merge/deploy.

Deliver Manufacturing, Factory, Contact, Journal column and Privacy through pageKey-controlled `pageTemplateContent`, the existing fixed GROQ/strict reader, shared site-delivery/middleware and original differentiated templates. See the current DEV-05F section in `docs/development/cms-editorial-mapping.md`. Missing required CMS bodies fail; never fill from local copy in a selected published mode or cast CMS objects to concept previews. Journal cards/details remain the existing article delivery. Manufacturing keeps six anchors and derives MOQ from validated settings; factory photos/credentials are optional, missing photographs stay explicitly non-photographic. Privacy stays not in effect, without marketing/sticky contact and with referenceCode=null; recorded legal review is not activation.

`HOME_CATEGORY_CONTENT_MODE` keeps its three-body meaning. Add only `FIXED_PAGE_CONTENT_MODE` for all five bodies, default mock. Legal page-mode pairs are mock/mock, published/mock and published/published; mock/published fails before network. The independent article mode and reference compatibility checks remain. Every site bundle still validates all six pages and both categories. Legacy Home objects remain reader-compatible; no cloud migration or schema deployment is authorized.

Only fake configuration, injected transport and `FORMELO_ENV_FILES=ignore` are permitted. Do not read/change real env files or activate local `SANITY_SITE_READ_ENABLED`; no real siteSettings/page/category enumeration, cloud writes, media, publish/withdraw, messages, schema/Studio/site deploy, Webhook or Cloudflare. Same-build snapshots remain protected; new builds and dev requests reread. Keep auth/timeout/size/envelope/unknown-field/secret checks, zero-network Draft-build negatives, production block, analytics off and noindex. Contact actions/copying remain disabled regardless of CMS account/enabled flags.

Use the exact runtime and serial validation; never let multiple test runs rebuild one dist. Separate Windows, Linux CI, mock, offline CMS and real CMS evidence. PR #11's Linux 22/22 and 241/445 results are historical; its missing-check issue is closed but artifact quota was not fixed. Preserve mandatory-before-upload ordering and both regressions. Generate/inspect/retain screenshots as separate statuses, comparing five pages with actual base; do not reopen already approved pages or erase historical logs. Keep any new PR Draft. Next comes explicitly authorized real materials/content, local checks, publish/rebuild/withdraw, channel delivery, formal SEO and approved deployment, not another provider-only increment.

## Historical DEV-05E Home and Category template integration

PR #10 / DEV-05D was merged by the user. Accepted head `eac1e27191c576cdb960a3effbe2a133d4d9322c`; merge/base `a83a01822a4310597dc2e8106a1a0c04339506e1`. Continue `feat/cms-home-category-integration`, never the merged provider/article branches. Re-read actual main, PR and Windows status before further edits or sync; only safe fast-forward, preserve all local/untracked/ignored evidence. No reset, clean, force push, automatic Ready/merge/deploy.

This phase wires only `/`, `/clothing/t-shirts/`, `/clothing/hoodies/` through the existing strict reader and Astro templates. `HOME_CATEGORY_CONTENT_MODE=mock` is default and makes zero site-transport calls; explicit `published` is a three-body source selection, not full-site `CONTENT_MODE=sanity`. `loadContent` remains the validated local entry for non-migrated bodies; server `site-delivery` + middleware provide one shared brand/navigation/contact presentation. Home/Category display data never pretends to be HomePreview/CategoryPreview. All six fixed pages and both categories must still validate in a CMS bundle.

Home `templateContent` is a controlled `homeTemplateContent` object, not a generic builder. Category cards derive name/intro/image/path from the same Category records in featured order. CategoryLayout must show all samples/images/codes/optional specs, capabilities/limitations, effective MOQ, customization/sampling, evidence/FAQ and compatible references through the existing article delivery. Missing content, unknown fields, bad references, invalid media or transport errors fail; dev shows a sanitized unavailable state and build aborts. No stale or mock recovery.

Only offline synthetic inputs with injected transport are authorized. Do not read or change real `.env` files, set local `SANITY_SITE_READ_ENABLED`, enumerate real settings/pages/categories, create/import/publish/withdraw content, upload media, or deploy schema/Studio/site. The old `iajvl7ka/production` one-Draft permission is not full-site permission. Offline processes explicitly disable dotenv loading and browser image requests are intercepted locally. Keep output in isolated test directories, never normal `web/dist` or cloud content.

CMS channel values remain unchanged in validated server data. The independent website-stage gate always disables actions/copying; configured test accounts must not become active links or fake success states. Production, analytics, concept noindex, inactive Privacy and real-channel gates remain closed. Preserve DEV-05C article delivery, Draft actual-dev/local/loopback limits and every build-entry zero-network negative test. Never delete the provider/secret artifact scanner. Ordinary CI has no real token.

Use exact Node 24.21.0/npm 11.19.1 and the single lockfile; no dependency upgrade or force audit fix. Compare screenshots with the actual current main/base, not old PR #5 PNGs. Separate Windows, Linux CI, default mock, offline synthetic and real CMS evidence. The PR #8/#9 real-Draft visual checks are already accepted and are not new missing items. Keep the task Draft until the current checks/visual review are actually complete; do not automatically mark Ready even after checks.

Next: migrate the other five fixed-page bodies, then separately authorized real content and publish/rebuild/contact validation. Do not start another provider-foundation iteration.

## Historical DEV-05A editorial CMS foundation

PR #6 supplied the Article/Journal baseline and PR #7 merged the offline CMS foundation. That stage used only synthetic/offline fixtures and did not have real CMS authorization. Keep its documentation and evidence as historical records; later DEV-05B authorization must not be rewritten as if DEV-05A had performed live Sanity validation.

## Journal / Article / Legal baseline retained from PR #6

The first full quote draft and Article template were rendered and actually inspected at 1440/390 before the MOQ draft was added. Both article previews and the non-effective legal preview pass through loadContent; formal Sanity articles stay empty. No fake asset references, authors, publication or review dates. The manually selectable enquiry template has no copy button or download gate. Hypothetical MOQ values belong only to the article example and must not enter factory settings. See docs/design/journal-article-legal-handoff.md and docs/development/routes-and-navigation.md. Ten-page concept implementation does not close real content, CMS, production SEO, channels or full-site acceptance.

Use config/page-context.ts for required referenceCode props; no new-page default to WEB-HOME. BaseLayout appends the configured brand to page-specific SEO titles. Contact fields remain null, controls disabled, no copy/email/WhatsApp API or success state. Do not invent factory facts, services, inspection standards, certs, case studies or in-house processing claims.

Reuse the unchanged three garment concepts/manifest. Two dedicated article covers remain pending; reuse is explicitly labelled and registered without inventing new binaries, hashes or asset approval. FactoryPhotographyPending stays non-photographic. Keep exact ten-route image and per-template contact policies and negative guards. Journal links target /blog/ while home #journal remains. Article breadcrumbs are Home → Journal → article; Journal is a parent link, not aria-current on article pages. Legal/404 retain ordinary navigation/footer but no marketing row or sticky contact bar and no referenceCode. Controlled editorial bodies must remain static escaped HTML; no arbitrary HTML, embeds or unsafe protocols. Source allowlisting permits exact reviewed HTTPS anchor navigation only, never remote resource loading. Do not add more sections/routes after this increment: next work is real factory materials and authorized CMS/contact preparation.
