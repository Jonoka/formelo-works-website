import { defineCliConfig } from 'sanity/cli';
import { requireStudioEnvironment } from './environment';

export default defineCliConfig({
  api: requireStudioEnvironment(),
  // No deployment app, token or automatic updates are configured.
});
