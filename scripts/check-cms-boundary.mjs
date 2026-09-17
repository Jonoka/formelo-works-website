import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Inspect browser output only. Server source may name variables but must never enter this tree.
// Check only the explicitly scoped server token, not unrelated machine/account credentials.
const root = process.argv[2] ?? 'web/dist';
const token = process.env.SANITY_READ_TOKEN;
const forbidden = /SANITY_READ_TOKEN|SANITY_ARTICLE_READ_IDS|cms-article-query|OFFLINE FIXTURE|OFFLINE_TEST_|cdn\.sanity\.io\/images\//;
let count = 0;
function inspect(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error('CMS_BOUNDARY: unexpected output symlink.');
    if (entry.isDirectory()) inspect(file);
    else if (/\.(?:html|[cm]?js|json|map|css|txt)$/.test(entry.name)) {
      const text = readFileSync(file, 'utf8'); count++;
      if (forbidden.test(text) || (token && text.includes(token))) throw new Error('CMS_BOUNDARY: server-only content or a secret reached browser output; offending content withheld.');
    }
  }
}
inspect(root);
if (!count) throw new Error('CMS_BOUNDARY: no browser artifacts were checked.');
console.log(`CMS boundary passed: ${count} browser text artifacts; no CMS provider, fixture or configured token detected.`);
