import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const validScript = '<script type="module" src="/_astro/navigation.fixture.js"></script>';

// Isolated synthetic HTML exercises the ACTUAL checker CLI before the Astro build runs.
// These fixtures are never published and are not website/browser acceptance evidence.
function runFixture(script = validScript, bodySuffix = '', moduleCode = '// Local test fixture', missingModule = false) {
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
    for (const name of ['index.html', '404.html']) {
      const sections = name === 'index.html'
        ? ['capabilities', 'categories', 't-shirts', 'hoodies', 'factory', 'production', 'journal', 'enquiry-guide', 'contact']
            .map(id => `<section id="${id}"></section>`).join('') +
          '<p>No articles have been published in this preview</p>' +
          '<details class="faq-item"><summary>Fixture question</summary>Fixture answer</details>'.repeat(3) +
          '<img src="/media/pending.svg" width="1200" height="900" alt="Fixture only" loading="lazy">'.repeat(3)
        : '';
      writeFileSync(join(dist, name), `<!doctype html><html lang="en"><head><title>Fixture ${name}</title><meta name="description" content="Static policy fixture"><meta name="robots" content="noindex, nofollow"></head><body><h1>Fixture</h1>${sections}${bodySuffix}${script}</body></html>`);
    }
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
