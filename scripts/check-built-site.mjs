import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const project = fileURLToPath(new URL('../', import.meta.url));
const root = join(project, 'web', 'dist');
const routes = JSON.parse(readFileSync(join(project, 'config', 'routes.json'), 'utf8'));
const assets = JSON.parse(readFileSync(join(project, 'assets', 'manifest.json'), 'utf8')).assets;
const previewPages = routes.previewPages;
// Exact ten-route concept boundary. Editing the route plan alone cannot admit a new page.
const sourcePolicy = JSON.parse(readFileSync(join(project, 'config', 'editorial-sources.json'), 'utf8'));
const reviewedSources = new Set(sourcePolicy.sources.map(source => {
  const url = new URL(source.href);
  assert.ok(url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash && url.href === source.href && source.title && /^\d{4}-\d{2}-\d{2}$/.test(source.reviewedAt), 'Invalid reviewed source policy.');
  return source.href;
}));
const implementedPolicies = {
  '/': { assetIds: ['HERO-001', 'CAT-TS-001', 'CAT-HD-001', 'CAT-TS-001', 'CAT-HD-001'], imagePolicy: 'registered_concepts', factoryPlaceholder: true },
  '/clothing/t-shirts/': { assetIds: ['CAT-TS-001'], imagePolicy: 'registered_concepts', factoryPlaceholder: false },
  '/clothing/hoodies/': { assetIds: ['CAT-HD-001'], imagePolicy: 'registered_concepts', factoryPlaceholder: false },
  '/manufacturing/': { assetIds: [], imagePolicy: 'no_images', factoryPlaceholder: false },
  '/our-factory/': { assetIds: [], imagePolicy: 'factory_placeholder', factoryPlaceholder: true },
  '/contact/': { assetIds: [], imagePolicy: 'no_images', factoryPlaceholder: false },
  '/blog/': { assetIds: ['CAT-TS-001', 'CAT-HD-001'], imagePolicy: 'registered_concepts', factoryPlaceholder: false },
  '/blog/what-to-send-for-a-clothing-quote/': { assetIds: ['CAT-TS-001'], imagePolicy: 'registered_concepts', factoryPlaceholder: false },
  '/blog/moq-per-style-per-color/': { assetIds: ['CAT-HD-001'], imagePolicy: 'registered_concepts', factoryPlaceholder: false },
  '/privacy/': { assetIds: [], imagePolicy: 'no_images', factoryPlaceholder: false },
};
assert.ok(Array.isArray(previewPages) && previewPages.length > 0, 'Explicit implemented preview routes required.');
assert.equal(new Set(previewPages.map(page => page.path)).size, previewPages.length, 'Duplicate preview paths.');
assert.deepEqual(previewPages.map(page => page.path).sort(), Object.keys(implementedPolicies).sort(), 'Exactly ten implemented content routes required.');
for (const page of previewPages) {
  assert.ok(routes.pages.some(plan => plan.path === page.path && ['Home', 'Category', 'Manufacturing', 'Factory', 'Contact', 'BlogIndex', 'Article', 'Legal'].includes(plan.template)), 'Preview route outside this increment.');
  assert.ok(Array.isArray(page.assetIds), 'Page asset policy required.');
  const { path, ...policy } = page;
  assert.deepEqual(policy, implementedPolicies[path], 'Explicit route/image policy mismatch.');
}
const htmlName = path => path === '/' ? 'index.html' : `${path.slice(1)}index.html`;
assert.ok(existsSync(root), 'Build web/ before checking the static output.');
function filesIn(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    assert.ok(!entry.isSymbolicLink(), 'Static output must not contain symlinks.');
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesIn(path) : [path];
  });
}
const files = filesIn(root);
const htmlFiles = files.filter(path => extname(path) === '.html');
assert.deepEqual(htmlFiles.map(path => relative(root, path).replaceAll('\\', '/')).sort(), ['404.html', ...previewPages.map(page => htmlName(page.path))].sort(),
  'Only ten explicitly implemented content routes and the existing 404 may be emitted.');
const titles = new Set();
const descriptions = new Set();
const emittedModules = new Set();
for (const path of htmlFiles) {
  const html = readFileSync(path, 'utf8');
  const name = relative(root, path).replaceAll('\\', '/');
  const pagePolicy = previewPages.find(page => htmlName(page.path) === name);
  assert.match(html, /<html\b[^>]*lang="en"/i, `${name}: English language missing`);
  assert.equal((html.match(/<h1(?:\s|>)/gi) ?? []).length, 1, `${name}: require one H1`);
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1];
  assert.ok(title && !titles.has(title), `${name}: missing or duplicate title`);
  titles.add(title);
  const description = html.match(/name="description"\s+content="([^"]+)"/i)?.[1];
  assert.ok(description && !descriptions.has(description), `${name}: missing or duplicate description`);
  descriptions.add(description);
  const plan = pagePolicy && routes.pages.find(page => page.path === pagePolicy.path);
  const references = [...html.matchAll(/data-reference-code="([^"]+)"/g)].map(match => match[1]);
  const contactGroups = (html.match(/class="pending-contact"/g) ?? []).length;
  const expectedContacts = !plan || plan.template === 'Legal' ? 0 : plan.template === 'Article' ? 2 : 3;
  assert.equal(contactGroups, expectedContacts, `${name}: contact groups must match page type (commercial/Journal 3, Article 2, Legal/404 0).`);
  if (expectedContacts === 0) assert.doesNotMatch(html, /mobile-contact-bar|footer-contact-row|data-reference-code|Get in touch\./, `${name}: Legal and 404 must have no marketing contacts.`);
  assert.ok(references.every(code => code === plan?.referenceCode), `${name}: wrong page referenceCode`);
  for (const group of html.matchAll(/<div\b(?=[^>]*class="pending-contact")([^>]*)>/g)) {
    assert.ok(group[1].includes(`data-reference-code="${plan?.referenceCode}"`), `${name}: missing or wrong contact-group referenceCode`);
  }
  assert.doesNotMatch(html, /\son[a-z]+\s*=/i, `${name}: inline event handlers are not allowed`);
  for (const button of html.matchAll(/<button\b([^>]*)>/gi)) {
    assert.match(button[1], /(?:^|\s)disabled(?:\s|=|$)/, `${name}: no executable buttons with null contacts`);
  }
  assert.doesNotMatch(html, /(?:Email copied|Message sent|Enquiry submitted|data-copy-email)/i, `${name}: no fake copy or delivery success`);
  assert.match(html, /name="description"\s+content="[^"]+"/i, `${name}: missing description`);
  assert.match(html, /name="robots"\s+content="noindex, nofollow"/i, `${name}: preview must be noindex`);
  assert.doesNotMatch(html, /<(?:form|input|textarea|iframe)\b/i, `${name}: unexpected active markup`);
  assert.doesNotMatch(html, /href="\/clothing\/"/, 'No empty Clothing hub.');
  assert.doesNotMatch(html, /(?:mailto:|wa\.me\/|rel="canonical"|homepage-selected-v1|assets\/reference)/i,
    `${name}: contact, canonical or reference asset must not be published in this preview`);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, `${name}: duplicate element IDs`);
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  assert.equal(scripts.length, 1, `${name}: exactly one local enhancement module is required`);
  for (const script of scripts) {
    assert.match(script[1], /(?:^|\s)type="module"(?:\s|$)/, `${name}: only the local enhancement module is allowed`);
    assert.match(script[1], /(?:^|\s)src="\/_astro\/[^"?#]+\.js"(?:\s|$)/, `${name}: enhancement must be a local compiled module`);
    assert.equal(script[2].trim(), '', `${name}: no inline scripts`);
    emittedModules.add(script[1].match(/(?:^|\s)src="([^"]+)"/)?.[1]);
  }
  if (name === 'index.html') {
    for (const id of ['capabilities', 'categories', 't-shirts', 'hoodies', 'factory', 'production', 'journal', 'enquiry-guide', 'contact']) {
      assert.ok(ids.includes(id), `Homepage section missing: ${id}`);
    }
    assert.match(html, /Not published or factory-approved/, 'Home Journal must retain its draft explanation.');
    assert.equal((html.match(/class="faq-item"/g) ?? []).length, 3, 'Three native purchasing FAQs are required.');
  }
  if (plan?.template === 'Home' || plan?.template === 'BlogIndex') {
    const cards = [...html.matchAll(/data-article-card="([^"]+)"/g)].map(match => match[1]);
    assert.deepEqual(cards, ['what-to-send-for-a-clothing-quote', 'moq-per-style-per-color'], `${name}: exactly two real draft cards required.`);
    assert.equal((html.match(/Editorial draft \/ Not published/g) ?? []).length, 2, `${name}: two visible draft labels required.`);
    for (const slug of cards) assert.ok(html.includes(`href="/blog/${slug}/"`), `${name}: draft card target missing.`);
  }
  if (plan?.template === 'Article' || plan?.template === 'BlogIndex') {
    assert.match(html, /data-preview-status="editorial_draft"/);
    assert.match(html, /data-production-allowed="false"/);
    assert.doesNotMatch(html, /<(?:time)\b|publishedAt|datePublished|dateModified|rel="author"|data-preview-status="published"/, 'No invented editorial dates or publication state.');
  }
  if (plan?.template === 'Article') {
    assert.match(html, /data-preview-kind="article_preview"/);
    assert.match(html, /Editorial draft \/ Not published/);
    const crumb = html.match(/<nav\b[^>]*aria-label="Breadcrumb"[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? '';
    assert.equal((crumb.match(/<li\b/g) ?? []).length, 3, 'Article breadcrumb must have three levels.');
    assert.match(crumb, /href="\/blog\/"/);
    const headingIds = [...html.matchAll(/<h2\b[^>]*\sid="(section-[^"]+)"/g)].map(match => match[1]);
    assert.ok(headingIds.length >= 3, 'Complete article sections required.');
    const toc = html.match(/<nav\b[^>]*aria-label="On this page"[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? '';
    assert.deepEqual([...toc.matchAll(/href="#([^"]+)"/g)].map(match => match[1]), headingIds, 'Stable article TOC must match every H2 in order.');
    assert.match(html, /data-cover-usage="registered_concept_reuse"/);
    assert.match(html, /Dedicated editorial cover|dedicated editorial cover/);
    assert.match(html, /href="\/contact\/"/);
    assert.match(html, /href="\/clothing\/t-shirts\/"/);
    assert.match(html, /href="\/clothing\/hoodies\/"/);
    assert.match(html, /href="\/blog\/"/);
    assert.ok(html.includes(`href="/manufacturing/#${plan.referenceCode === 'WEB-QUOTE-GUIDE' ? 'prepare' : 'moq'}"`), 'Article must link to its correct manufacturing anchor.');
    if (plan.referenceCode === 'WEB-MOQ-GUIDE') assert.match(html, /Hypothetical example — not this factory/);
    if (plan.referenceCode === 'WEB-QUOTE-GUIDE') assert.match(html, /class="editorial-template"/);
  }
  if (plan?.template === 'Legal') {
    assert.match(html, /Draft privacy notice — not in effect/);
    assert.match(html, /data-preview-status="draft_not_in_effect"/);
    assert.match(html, /data-production-allowed="false"/);
    assert.doesNotMatch(html, /<time\b|mailto:|wa\.me\/|effectiveAt|publishedAt/, 'No fake legal dates or contact accounts.');
  }
  const expectedAssets = pagePolicy?.assetIds ?? [];
  const factorySlots = (html.match(/data-factory-media-status="awaiting_factory"/g) ?? []).length;
  assert.equal(factorySlots, pagePolicy?.factoryPlaceholder ? 1 : 0, `${name}: factory photography policy mismatch`);
  if (factorySlots) {
    const factoryAsset = assets.find(asset => asset.id === 'FACTORY-001');
    assert.ok(factoryAsset?.status === 'awaiting_factory' && factoryAsset.path === null && factoryAsset.productionAllowed === false,
      'Factory photography must remain awaiting verified originals.');
    assert.match(html, /Factory photography/);
  }
  if (['/manufacturing/', '/our-factory/', '/contact/'].includes(pagePolicy?.path)) {
    assert.match(html, /data-preview-status="concept_only"/);
    assert.match(html, /data-facts-status="unconfirmed"/);
    assert.match(html, /data-production-allowed="false"/);
  }
  if (pagePolicy?.path === '/manufacturing/') {
    for (const id of ['options', 'moq', 'prepare', 'sampling', 'production', 'faq']) assert.ok(ids.includes(id), `Manufacturing anchor missing: ${id}`);
    assert.ok((html.match(/class="faq-item"/g) ?? []).length >= 3, 'Manufacturing native FAQs required.');
  }
  if (pagePolicy?.path === '/contact/') {
    for (const field of ['email', 'whatsapp', 'person', 'hours', 'timezone', 'address']) {
      assert.ok(new RegExp(`data-contact-field="${field}"[^>]*data-contact-state="unconfigured"`).test(html), `Contact field must remain unconfigured: ${field}`);
    }
    assert.doesNotMatch(html, /href="\/contact\/"/, 'Contact page must not link to itself.');
  }
  if (pagePolicy && pagePolicy.path !== '/') {
    assert.match(html, /aria-label="Breadcrumb"/, 'Inner-page breadcrumb required.');
    assert.match(html, /aria-current="page"/, 'Current page must be identified.');
  }
  assert.equal((html.match(/<img\b/g) ?? []).length, expectedAssets.length, `${name}: Registered image slots only.`);
  const figures = [...html.matchAll(/<figure\b([^>]*)>([\s\S]*?)<\/figure>/gi)];
  assert.equal(figures.length, expectedAssets.length, `${name}: All media slots need persistent provenance captions.`);
  for (const [index, figure] of figures.entries()) {
    const assetId = expectedAssets[index];
    const asset = assets.find(item => item.id === assetId);
    assert.ok(asset && asset.productionAllowed === false && asset.replacementRequiredBeforeLaunch === true, 'Registered non-production asset required.');
    assert.ok(figure[1].includes(`data-asset-id="${assetId}"`), `${name}: Unexpected page asset ID.`);
    assert.match(figure[1], /data-media-kind="(?:concept|placeholder)"/, 'Media status must be explicit.');
    const concept = figure[1].includes('data-media-kind="concept"');
    assert.equal(concept, asset.status === 'generated_concept', 'Media must match registered state.');
    assert.ok(figure[2].includes(concept ? 'AI-generated garment concept — not a factory sample.' : 'Image pending — no garment photograph is shown.'), 'Media provenance caption does not match its state.');
    if (concept) assert.doesNotMatch(figure[2], /src="[^"]+\.svg"/, 'A concept cannot be the old SVG placeholder.');
    const allowed = new Set([asset.path, ...(asset.renditions ?? []).map(item => item.path)].filter(Boolean).map(path => path.replace(/^web\/public/, '')));
    const images = [...figure[2].matchAll(/<img\b([^>]*)>/gi)];
    assert.equal(images.length, 1, 'One image per registered slot.');
    for (const image of images) {
      assert.match(image[1], /width="[1-9]\d*"/);
      assert.match(image[1], /height="[1-9]\d*"/);
      assert.match(image[1], /alt="[^"]+"/);
      assert.match(image[1], /loading="(?:eager|lazy)"/);
    }
    for (const item of figure[2].matchAll(/(?:^|\s)(src|srcset)="([^"]+)"/g)) {
      const paths = item[1] === 'srcset' ? item[2].split(',').map(part => part.trim().split(/\s+/)[0]) : [item[2]];
      for (const imagePath of paths) assert.ok(allowed.has(imagePath), `${name}: Image source not registered for this page slot.`);
    }
  }
  if (pagePolicy?.path.startsWith('/clothing/')) {
    assert.match(html, /aria-label="Breadcrumb"/, 'Category breadcrumb required.');
    assert.match(html, /aria-current="page"/, 'Current breadcrumb must be identified.');
    assert.doesNotMatch(html, /href="\/clothing\/"/, 'No empty Clothing hub.');
    assert.ok((html.match(/class="faq-item"/g) ?? []).length >= 3, 'Category-specific native FAQs required.');
  }
  const sourcePath = pagePolicy?.path ?? '/404.html';
  // Only an explicitly labelled <a href> can be an external reviewed source.
  // The same allowlisted URL must never become a script/image/style/preload destination.
  const destinations = [];
  for (const tag of html.matchAll(/<([a-z][a-z0-9-]*)\b([^>]*)>/gi)) {
    for (const attr of tag[2].matchAll(/(?:^|\s)(href|src)="([^"]+)"/g)) {
      const destination = attr[2];
      const target = new URL(destination, `http://127.0.0.1${sourcePath}`);
      if (target.origin !== 'http://127.0.0.1') {
        assert.ok(tag[1].toLowerCase() === 'a' && attr[1] === 'href' && plan?.template === 'Article' && reviewedSources.has(destination) && /(?:^|\s)data-editorial-source="reviewed"/.test(tag[2]) && /(?:^|\s)rel="nofollow noreferrer noopener"/.test(tag[2]), `${name}: unexpected external resource or unreviewed source link`);
      } else destinations.push(destination);
    }
  }
  for (const set of html.matchAll(/\bsrcset="([^"]+)"/g)) {
    destinations.push(...set[1].split(',').map(item => item.trim().split(/\s+/)[0]));
  }
  for (const destination of destinations) {
    assert.ok(destination && destination !== '#' && destination !== '/#', `${name}: empty destination`);
    const target = new URL(destination, `http://127.0.0.1${sourcePath}`);
    assert.equal(target.origin, 'http://127.0.0.1', `${name}: unexpected external resource`);
    const pathname = decodeURIComponent(target.pathname);
    const targetPath = join(root, `.${pathname}`, pathname.endsWith('/') ? 'index.html' : '');
    assert.ok(existsSync(targetPath), `${name}: missing link target ${pathname}`);
    if (target.hash) {
      const id = decodeURIComponent(target.hash.slice(1));
      assert.ok(readFileSync(targetPath, 'utf8').includes(`id="${id}"`), `${name}: missing fragment ${target.hash}`);
    }
  }
}
assert.equal(emittedModules.size, 1, 'All pages must reuse the single shared enhancement module.');
for (const path of files) {
  assert.doesNotMatch(path, /\.(?:woff2?|ttf|otf|pem|key|env)$/i, 'Unexpected font or credential file.');
  if (!['.html', '.css', '.js', '.json', '.txt', '.svg'].includes(extname(path))) continue;
  const text = readFileSync(path, 'utf8');
  if (extname(path) === '.js') {
    assert.doesNotMatch(text, /\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon)\s*\(/, 'Static enhancement must not make network/API requests.');
    assert.doesNotMatch(text, /(?:clipboard|writeText)/, 'Null-contact previews must not implement email copying.');
  }
  if (extname(path) === '.css' || extname(path) === '.svg') assert.doesNotMatch(text, /(?:@import|url\(\s*['"]?(?:https?:|data:|\/\/)|(?:href|src)=["'](?:https?:|data:|\/\/))/i, 'No third-party CSS/SVG resources.');
  assert.doesNotMatch(text, /(?:github_pat_[A-Za-z0-9_]{30,}|gh[pousr]_[A-Za-z0-9]{30,}|SANITY_READ_TOKEN|BEGIN PRIVATE KEY)/,
    `Potential secret in ${relative(root, path)} (value withheld)`);
}
// Git may use CRLF in a Windows checkout; preserve the exact deny-all directives.
assert.equal(readFileSync(join(root, 'robots.txt'), 'utf8').replace(/\r\n/g, '\n').trim(), 'User-agent: *\nDisallow: /');
assert.ok(!files.some(path => /sitemap/i.test(path)), 'No sitemap is emitted for the local concept.');
console.log(`Static concept checks passed: ${htmlFiles.length} HTML files, all internal links and fragments resolved, no active contact links or reference image.`);
