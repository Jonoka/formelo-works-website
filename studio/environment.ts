export function requireStudioEnvironment(env: Record<string, string | undefined> = process.env) {
  const projectId = env['SANITY_STUDIO_PROJECT_ID']?.trim();
  const dataset = env['SANITY_STUDIO_DATASET']?.trim();
  if (!projectId || !dataset) {
    throw new Error('STUDIO_NOT_CONFIGURED: supply your authorized SANITY_STUDIO_PROJECT_ID and SANITY_STUDIO_DATASET. No demo account is configured.');
  }
  if (!/^[a-z0-9]+$/.test(projectId) || /^(example|placeholder|yourprojectid|changeme)$/.test(projectId)) {
    throw new Error('Invalid Sanity project ID. Use the ID from your authorized Sanity project.');
  }
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(dataset)) throw new Error('Invalid Sanity dataset name.');
  return { projectId, dataset };
}
