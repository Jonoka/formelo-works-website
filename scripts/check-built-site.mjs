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
  'DEV-01 implements one content URL and the engineering 404, not the full planned site.');
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
  assert.doesNotMatch(html, /<(?:form|input|textarea|iframe|script)\b/i, `${name}: unexpected active markup`);
  assert.doesNotMatch(html, /(?:mailto:|wa\.me\/|rel="canonical"|homepage-selected-v1|assets\/reference)/i,
    `${name}: contact, canonical or reference asset must not be published in this foundation`);
  const sourcePath = name === 'index.html' ? '/' : '/404.html';
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const target = new URL(match[1], `http://127.0.0.1${sourcePath}`);
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
  if (!['.html', '.css', '.js', '.json', '.txt'].includes(extname(path))) continue;
  const text = readFileSync(path, 'utf8');
  assert.doesNotMatch(text, /(?:github_pat_[A-Za-z0-9_]{30,}|gh[pousr]_[A-Za-z0-9]{30,}|SANITY_READ_TOKEN|BEGIN PRIVATE KEY)/,
    `Potential secret in ${relative(root, path)} (value withheld)`);
}
assert.equal(readFileSync(join(root, 'robots.txt'), 'utf8').trim(), 'User-agent: *\nDisallow: /');
assert.ok(!files.some(path => /sitemap/i.test(path)), 'No sitemap is emitted for the local concept.');
console.log(`Static foundation checks passed: ${htmlFiles.length} HTML files, all internal links and fragments resolved, no active contact links or reference image.`);
