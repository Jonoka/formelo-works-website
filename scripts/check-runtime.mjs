import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Run with npm run check:runtime. Check actual tools, not just configuration text.
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const manifest = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
const { node, npm } = manifest.engines;
assert.match(node, /^24\.\d+\.\d+$/, 'Node must be an exact reviewed 24.x release.');
assert.match(npm, /^\d+\.\d+\.\d+$/, 'npm must be an exact reviewed version.');
assert.equal(read('.nvmrc').trim(), node, '.nvmrc must match engines.node.');
assert.equal(read('.node-version').trim(), node, '.node-version must match engines.node.');
assert.equal(manifest.packageManager, `npm@${npm}`, 'packageManager must match engines.npm.');
assert.deepEqual(lock.packages[''].engines, manifest.engines, 'Regenerate root lock metadata with npm.');
assert.equal(process.versions.node, node, 'Switch Node versions before running project commands.');
const actualNpm = process.env.npm_config_user_agent?.match(/^npm\/(\S+)/)?.[1];
assert.equal(actualNpm, npm, 'Use the pinned npm and invoke npm run check:runtime.');
console.log(`Runtime baseline verified: Node ${process.versions.node}, npm ${actualNpm}; version files and root lock agree.`);
