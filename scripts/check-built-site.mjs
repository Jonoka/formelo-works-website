import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../web/dist/', import.meta.url));
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
assert.deepEqual(htmlFiles.map(path => relative(root, path).replaceAll('\\', '/')).sort(), ['404.html', 'index.html'],
  'This homepage increment implements one content URL and the existing 404, not the ten-page plan.');
const titles = new Set();
for (const path of htmlFiles) {
  const html = readFileSync(path, 'utf8');
  const name = relative(root, path);
  assert.match(html, /<html\b[^>]*lang="en"/i, `${name}: English language missing`);
  assert.equal((html.match(/<h1(?:\s|>)/gi) ?? []).length, 1, `${name}: require one H1`);
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1];
  assert.ok(title && !titles.has(title), `${name}: missing or duplicate title`);
  titles.add(title);
  assert.match(html, /name="description"\s+content="[^"]+"/i, `${name}: missing description`);
  assert.match(html, /name="robots"\s+content="noindex, nofollow"/i, `${name}: preview must be noindex`);
  assert.doesNotMatch(html, /<(?:form|input|textarea|iframe)\b/i, `${name}: unexpected active markup`);
  assert.doesNotMatch(html, /(?:mailto:|wa\.me\/|rel="canonical"|homepage-selected-v1|assets\/reference)/i,
    `${name}: contact, canonical or reference asset must not be published in this preview`);
  assert.doesNotMatch(html, /\son[a-z]+\s*=/i, `${name}: inline event handlers are not allowed`);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, `${name}: duplicate element IDs`);
  for (const script of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    assert.match(script[1], /type="module"/, `${name}: only the local enhancement module is allowed`);
    assert.match(script[1], /src="\/_astro\/[^"?#]+\.js"/, `${name}: enhancement must be a local compiled module`);
    assert.equal(script[2].trim(), '', `${name}: no inline scripts`);
  }
  if (name === 'index.html') {
    for (const id of ['capabilities', 'categories', 't-shirts', 'hoodies', 'factory', 'production', 'journal', 'enquiry-guide', 'contact']) {
      assert.ok(ids.includes(id), `Homepage section missing: ${id}`);
    }
    assert.match(html, /No articles have been published in this preview/, 'Journal must not masquerade as published content.');
    assert.equal((html.match(/class="faq-item"/g) ?? []).length, 3, 'Three native purchasing FAQs are required.');
    assert.equal((html.match(/<img\b/g) ?? []).length, 3, 'Three honest local media slots are required.');
    for (const image of html.matchAll(/<img\b([^>]*)>/gi)) {
      assert.match(image[1], /width="[1-9]\d*"/);
      assert.match(image[1], /height="[1-9]\d*"/);
      assert.match(image[1], /alt="[^"]+"/);
      assert.match(image[1], /loading="(?:eager|lazy)"/);
    }
  }
  const sourcePath = name === 'index.html' ? '/' : '/404.html';
  const destinations = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map(match => match[1]);
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
for (const path of files) {
  assert.doesNotMatch(path, /\.(?:woff2?|ttf|otf|pem|key|env)$/i, 'Unexpected font or credential file.');
  if (!['.html', '.css', '.js', '.json', '.txt', '.svg'].includes(extname(path))) continue;
  const text = readFileSync(path, 'utf8');
  if (extname(path) === '.js') assert.doesNotMatch(text, /\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon)\s*\(/, 'Static enhancement must not make network/API requests.');
  assert.doesNotMatch(text, /(?:github_pat_[A-Za-z0-9_]{30,}|gh[pousr]_[A-Za-z0-9]{30,}|SANITY_READ_TOKEN|BEGIN PRIVATE KEY)/,
    `Potential secret in ${relative(root, path)} (value withheld)`);
}
assert.equal(readFileSync(join(root, 'robots.txt'), 'utf8').trim(), 'User-agent: *\nDisallow: /');
assert.ok(!files.some(path => /sitemap/i.test(path)), 'No sitemap is emitted for the local concept.');
console.log(`Static homepage checks passed: ${htmlFiles.length} HTML files, all internal links and fragments resolved, no active contact links or reference image.`);
