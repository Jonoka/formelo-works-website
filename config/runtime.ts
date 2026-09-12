import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';

export type Environment = Record<string, string | undefined>;
export interface RuntimeConfig {
  deployEnv: 'local' | 'preview';
  contentMode: 'mock';
  conceptMode: true;
  analyticsMode: 'off';
}

/** Local files are optional; existing shell/CI variables always win. */
export function loadLocalEnvironment(): void {
  for (const relative of ['../.env.local', '../.env']) {
    const path = fileURLToPath(new URL(relative, import.meta.url));
    if (existsSync(path)) loadEnvFile(path);
  }
}

/** Fail closed before Astro creates a build. Production is deliberately unavailable in DEV-01. */
export function readRuntime(env: Environment = process.env): RuntimeConfig {
  const deployEnv = env['DEPLOY_ENV'] ?? 'local';
  if (deployEnv === 'production') {
    throw new Error('PRODUCTION_BLOCKED: DEV-01 has mock content, unconfirmed facts and no verified contact channels.');
  }
  if (deployEnv !== 'local' && deployEnv !== 'preview') {
    throw new Error('DEPLOY_ENV must be local, preview or production.');
  }
  if ((env['CONTENT_MODE'] ?? 'mock') !== 'mock') {
    throw new Error('CONTENT_MODE: Sanity reading is not implemented. No fallback to mock is allowed.');
  }
  if ((env['CONCEPT_MODE'] ?? 'true') !== 'true') {
    throw new Error('CONCEPT_MODE must remain true until the production release gate is implemented.');
  }
  if ((env['ANALYTICS_MODE'] ?? 'off') !== 'off') {
    throw new Error('ANALYTICS_MODE must remain off. No analytics provider is approved.');
  }
  return { deployEnv, contentMode: 'mock', conceptMode: true, analyticsMode: 'off' };
}
