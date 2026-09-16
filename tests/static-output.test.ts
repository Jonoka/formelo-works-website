import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import routes from '../config/routes.json';
import sources from '../config/editorial-sources.json';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const validScript = '<script type="module" src="/_astro/navigation.fixture.js"></script>';
const sourceHref = sources.sources[0]!.href;

// Isolated synthetic HTML exercises the ACTUAL checker CLI before the Astro build runs.
// These fixtures are never published and are not website/browser acceptance evidence.
function runFixture(script = validScript, bodySuffix = '', moduleCode = '// Local test fixture', missingModule = false, mutate?: (root: string) => void) {
  const root = mkdtempSync(join(tmpdir(), 'formelo-static-policy-'));
  try {
    const dist = join(root, 'web', 'dist');
    mkdirSync(join(root, 'scripts'), { recursive: true });
    mkdirSync(join(dist, '_astro'), { recursive: true });
    mkdirSync(join(dist, 'media'), { recursive: true });
    const checker = join(root, 'scripts', 'check-built-site.mjs');
    copyFileSync(fileURLToPath(new URL('../scripts/check-built-site.mjs', import.meta.url)), checker);
    if (!missingModule) writeFileSync(join(dist, '_astro', 'navigation.fixture.js'), moduleCode);
    writeFileSync(join(dist, 'media', 'pending.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
    writeFileSync(join(dist, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
    mkdirSync(join(root, 'config'), { recursive: true });
    mkdirSync(join(root, 'assets'), { recursive: true });
    writeFileSync(join(root, 'config', 'routes.json'), JSON.stringify(routes));
    writeFileSync(join(root, 'config', 'editorial-sources.json'), JSON.stringify(sources));
    const assetIds = ['HERO-001', 'CAT-TS-001', 'CAT-HD-001'];
    writeFileSync(join(root, 'assets', 'manifest.json'), JSON.stringify({ assets: [...assetIds.map(id => ({ id, status: 'pending_generation', path: 'web/public/media/pending.svg', productionAllowed: false, replacementRequiredBeforeLaunch: true })), { id: 'FACTORY-001', status: 'awaiting_factory', path: null, productionAllowed: false }] }));
    const pageNames = ['404.html', ...routes.previewPages.map(page => page.path === '/' ? 'index.html' : `${page.path.slice(1)}index.html`)];
    for (const name of pageNames) {
      mkdirSync(join(dist, name, '..'), { recursive: true });
      const sections = name === 'index.html'
        ? ['capabilities', 'categories', 't-shirts', 'hoodies', 'factory', 'production', 'journal', 'enquiry-guide', 'contact']
            .map(id => `<section id="${id}"></section>`).join('') +
          '<p>Not published or factory-approved</p>' +
          '<details class="faq-item"><summary>Fixture question</summary>Fixture answer</details>'.repeat(3) +
          ['HERO-001', 'CAT-TS-001', 'CAT-HD-001', 'CAT-TS-001', 'CAT-HD-001'].map(id => `<figure data-asset-id="${id}" data-media-kind="placeholder"><img src="/media/pending.svg" width="1200" height="900" alt="Fixture only" loading="lazy"><figcaption>Image pending — no garment photograph is shown.</figcaption></figure>`).join('')
        : name === '404.html' ? '' :
          '<nav aria-label="Breadcrumb"><a href="/">Home</a><span aria-current="page">Fixture category</span></nav>' +
          '<details class="faq-item"><summary>Fixture question</summary>Fixture answer</details>'.repeat(3) +
          (routes.previewPages.find(page => name === `${page.path.slice(1)}index.html`)?.assetIds ?? []).map(id => `<figure data-asset-id="${id}" data-media-kind="placeholder"><img src="/media/pending.svg" width="1200" height="900" alt="Fixture only" loading="eager"><figcaption>Image pending — no garment photograph is shown.</figcaption></figure>`).join('');
      const policy = routes.previewPages.find(page => name === (page.path === '/' ? 'index.html' : `${page.path.slice(1)}index.html`));
      const plan = routes.pages.find(page => page.path === policy?.path);
      const core = policy && ['/manufacturing/', '/our-factory/', '/contact/'].includes(policy.path);
      const article = plan?.template === 'Article';
      const contacts = !plan || plan.template === 'Legal' ? 0 : article ? 2 : 3;
      const safety = `<div class="pending-contact" data-reference-code="${plan?.referenceCode}"><button disabled>Fixture channel</button></div>`.repeat(contacts) +
        (policy?.factoryPlaceholder ? '<div data-factory-media-status="awaiting_factory">Factory photography pending</div>' : '') +
        (core ? '<div data-preview-status="concept_only" data-facts-status="unconfirmed" data-production-allowed="false"></div>' : '') +
        (policy?.path === '/manufacturing/' ? ['options', 'moq', 'prepare', 'sampling', 'production', 'faq'].map(id => `<section id="${id}"></section>`).join('') : '') +
        (policy?.path === '/contact/' ? ['email', 'whatsapp', 'person', 'hours', 'timezone', 'address'].map(field => `<div data-contact-field="${field}" data-contact-state="unconfigured"></div>`).join('') : '');
      let rendered = sections;
      if (article) rendered = rendered.replace('<span aria-current="page">', '<li><a href="/blog/">Journal</a></li><span aria-current="page">').replace('<a href="/">Home</a>', '<li><a href="/">Home</a></li>').replace('<span aria-current="page">Fixture category</span>', '<li><span aria-current="page">Fixture article</span></li>');
      const editorial = (plan?.template === 'Home' || plan?.template === 'BlogIndex' ? ['what-to-send-for-a-clothing-quote', 'moq-per-style-per-color'].map(slug => `<article data-article-card="${slug}" data-preview-status="editorial_draft" data-production-allowed="false"><p>Editorial draft / Not published</p><a href="/blog/${slug}/">Draft</a></article>`).join('') : '') +
        (article ? `<article data-preview-kind="article_preview" data-preview-status="editorial_draft" data-production-allowed="false" data-cover-usage="registered_concept_reuse"><p>Editorial draft / Not published</p><p>A dedicated editorial cover is pending.</p><nav aria-label="On this page">${[1,2,3].map(i => `<a href="#section-fixture-${i}">Section</a>`).join('')}</nav>${[1,2,3].map(i => `<h2 id="section-fixture-${i}">Fixture section</h2>`).join('')}<div class="editorial-template">Fixture manually selectable text</div><p>Hypothetical example — not this factory’s MOQ</p>${['/blog/', '/contact/', '/clothing/t-shirts/', '/clothing/hoodies/', '/manufacturing/#' + (plan.referenceCode === 'WEB-QUOTE-GUIDE' ? 'prepare' : 'moq')].map(href => `<a href="${href}">Related fixture</a>`).join('')}</article>` : '') +
        (plan?.template === 'Legal' ? '<article data-preview-status="draft_not_in_effect" data-production-allowed="false">Draft privacy notice — not in effect</article>' : '');
      writeFileSync(join(dist, name), `<!doctype html><html lang="en"><head><title>Fixture ${name}</title><meta name="description" content="Static policy fixture ${name}"><meta name="robots" content="noindex, nofollow"></head><body><h1>Fixture</h1>${rendered}${safety}${editorial}${bodySuffix}${script}</body></html>`);
    }
    mutate?.(root);
    const result = spawnSync(process.execPath, [checker], { cwd: root, encoding: 'utf8', timeout: 5000 });
    assert.equal(result.error, undefined);
    assert.notEqual(result.status, null, 'Checker must exit, not time out');
    return { status: result.status, output: result.stdout + result.stderr };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('static checker accepts an emitted local external module', () => {
  const result = runFixture();
  assert.equal(result.status, 0, result.output);
});

for (const [name, script, error] of [
  ['inline module', '<script type="module">console.log("fixture")</script>', /local compiled module/],
  ['inline body with an external source', validScript.replace('</script>', 'console.log("fixture")</script>'), /no inline scripts/],
  ['remote module', validScript.replace('/_astro/', 'https://example.invalid/'), /local compiled module/],
  ['data-src masquerading as src', validScript.replace(' src=', ' data-src='), /local compiled module/],
  ['classic script', validScript.replace(' type="module"', ''), /only the local enhancement module/],
  ['missing enhancement', '', /exactly one local enhancement module/],
  ['duplicate enhancement', validScript + validScript, /exactly one local enhancement module/],
] as const) {
  test(`static checker rejects ${name}`, () => {
    const result = runFixture(script);
    assert.notEqual(result.status, 0);
    assert.match(result.output, error);
  });
}

test('static checker rejects a missing emitted module file', () => {
  const result = runFixture(validScript, '', '', true);
  assert.notEqual(result.status, 0);
  assert.match(result.output, /missing link target/);
});

test('static checker still rejects inline event handlers', () => {
  const result = runFixture(validScript, '<button onclick="alert(1)">Fixture</button>');
  assert.notEqual(result.status, 0);
  assert.match(result.output, /inline event handlers/);
});

test('external modules still cannot make API requests', () => {
  const result = runFixture(validScript, '', 'fetch("/fixture-api")');
  assert.notEqual(result.status, 0);
  assert.match(result.output, /must not make network\/API requests/);
});

test('static checker rejects adding an unregistered image beyond each page policy', () => {
  const result = runFixture(validScript, '<img src="/media/pending.svg" width="1200" height="900" alt="Unlabelled extra">');
  assert.notEqual(result.status, 0);
  assert.match(result.output, /Registered image slots only/);
});

for (const [name, path, from, to, message] of [
  ['wrong new-page reference', 'web/dist/manufacturing/index.html', 'WEB-MANUFACTURING', 'WEB-HOME', /wrong page referenceCode/],
  ['missing contact-group reference', 'web/dist/contact/index.html', 'data-reference-code="WEB-CONTACT"', '', /contact-group referenceCode/],
  ['false fact status', 'web/dist/our-factory/index.html', 'data-facts-status="unconfirmed"', 'data-facts-status="confirmed"', /unconfirmed/],
  ['missing manufacturing anchor', 'web/dist/manufacturing/index.html', 'id="sampling"', 'id="removed-sampling"', /anchor missing/],
  ['configured null contact', 'web/dist/contact/index.html', 'data-contact-state="unconfigured"', 'data-contact-state="configured"', /must remain unconfigured/],
  ['executable contact button', 'web/dist/contact/index.html', '<button disabled>', '<button>', /no executable buttons/],
] as const) {
  test(`static checker rejects ${name}`, () => {
    const result = runFixture(validScript, '', '// Fixture', false, root => {
      const file = join(root, path);
      writeFileSync(file, readFileSync(file, 'utf8').replace(from, to));
    });
    assert.notEqual(result.status, 0); assert.match(result.output, message);
  });
}
test('route expansion and image-policy changes require explicit checker review', () => {
  for (const extra of [true, false]) {
    const result = runFixture(validScript, '', '// Fixture', false, root => {
      const changed = structuredClone(routes);
      if (extra) changed.previewPages.push({ path: '/extra-journal/', assetIds: [], imagePolicy: 'no_images', factoryPlaceholder: false });
      else changed.previewPages.find(page => page.path === '/contact/')!.assetIds.push('HERO-001');
      writeFileSync(join(root, 'config/routes.json'), JSON.stringify(changed));
    });
    assert.notEqual(result.status, 0); assert.match(result.output, /ten implemented|policy mismatch/);
  }
});
test('null channels cannot acquire a copy or sent success state', () => {
  assert.notEqual(runFixture(validScript, '<p>Email copied</p>').status, 0);
  assert.notEqual(runFixture(validScript, '', 'navigator.clipboard.writeText("fixture")').status, 0);
});
test('reviewed source anchors pass without granting permission to external resources', () => {
  const inject = (markup: string) => runFixture(validScript, '', '// Fixture', false, root => {
    const file = join(root, 'web/dist/blog/moq-per-style-per-color/index.html');
    writeFileSync(file, readFileSync(file, 'utf8').replace('</body>', `${markup}</body>`));
  });
  const valid = `<a href="${sourceHref}" rel="nofollow noreferrer noopener" data-editorial-source="reviewed">Definition source</a>`;
  const pass = inject(valid); assert.equal(pass.status, 0, pass.output);
  for (const markup of [valid.replace(sourceHref, 'https://unreviewed.invalid/'), valid.replace(' data-editorial-source="reviewed"', ''), valid.replace('nofollow noreferrer noopener', 'nofollow'), `<link rel="stylesheet" href="${sourceHref}">`, `<link rel="prefetch" href="${sourceHref}">`, '<a href="javascript:alert(1)">Unsafe</a>']) {
    const fail = inject(markup); assert.notEqual(fail.status, 0); assert.match(fail.output, /unexpected external resource|unreviewed source/);
  }
});
for (const [name, path, from, to, message] of [
  ['legal marketing bar', 'privacy/index.html', '</body>', '<aside class="mobile-contact-bar"></aside></body>', /Legal and 404/],
  ['legal fake effective date', 'privacy/index.html', '</body>', '<time datetime="2026-09-01">Effective</time></body>', /No fake legal dates/],
  ['article fake publication', 'blog/moq-per-style-per-color/index.html', 'data-preview-status="editorial_draft"', 'data-preview-status="published"', /editorial_draft/],
  ['article incorrect reference', 'blog/moq-per-style-per-color/index.html', 'WEB-MOQ-GUIDE', 'WEB-HOME', /wrong page referenceCode/],
  ['article broken TOC ordering', 'blog/moq-per-style-per-color/index.html', 'href="#section-fixture-1"', 'href="#section-fixture-3"', /Stable article TOC/],
  ['article fabricated third card', 'blog/index.html', '</body>', '<div data-article-card="invented"></div></body>', /exactly two real draft cards/],
  ['article send success', 'blog/what-to-send-for-a-clothing-quote/index.html', '</body>', '<p>Message sent</p></body>', /no fake copy or delivery success/],
] as const) test(`static policy rejects ${name}`, () => {
  const result = runFixture(validScript, '', '// Fixture', false, root => {
    const file = join(root, 'web/dist', path); writeFileSync(file, readFileSync(file, 'utf8').replace(from, to));
  });
  assert.notEqual(result.status, 0); assert.match(result.output, message);
});
test('robots accepts only the same deny-all directives with Windows or Unix line endings', () => {
  const run = (text: string) => runFixture(validScript, '', '// Fixture', false, root => writeFileSync(join(root, 'web/dist/robots.txt'), text));
  assert.equal(run('User-agent: *\r\nDisallow: /\r\n').status, 0);
  assert.notEqual(run('User-agent: *\r\nAllow: /\r\n').status, 0);
  assert.notEqual(run('User-agent: *\nDisallow: /\nAllow: /contact/').status, 0);
});
