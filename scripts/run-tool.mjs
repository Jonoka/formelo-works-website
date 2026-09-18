import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';

// Cross-platform CLI launch with telemetry disabled for this process only.
const [tool, command, ...args] = process.argv.slice(2);
const allowed = { astro: ['dev', 'preview', 'check', 'build'], sanity: ['dev', 'build'] };
if (!allowed[tool]?.includes(command)) throw new Error('Unsupported project tool command.');
const workspace = tool === 'astro' ? 'web' : 'studio';
if (tool === 'sanity') {
  // Fail before loading the CLI, prompting for an account or contacting Sanity.
  for (const name of process.env.FORMELO_ENV_FILES === 'ignore' ? [] : ['.env.local', '.env']) {
    const path = fileURLToPath(new URL(`../studio/${name}`, import.meta.url));
    if (existsSync(path)) loadEnvFile(path);
  }
  const { requireStudioEnvironment } = await import('../studio/environment.ts');
  requireStudioEnvironment();
}
const require = createRequire(new URL(`../${workspace}/package.json`, import.meta.url));
const manifestPath = require.resolve(`${tool}/package.json`);
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const bin = typeof manifest.bin === 'string' ? manifest.bin : manifest.bin[tool];
const child = spawn(process.execPath, [resolve(dirname(manifestPath), bin), command, ...args], {
  stdio: 'inherit',
  env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1', DO_NOT_TRACK: '1' },
});
child.once('error', error => { console.error(error.message); process.exitCode = 1; });
child.once('exit', (code, signal) => { process.exitCode = code ?? (signal ? 1 : 0); });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
