const slug = (value: string): string => value.replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/^-+|-+$/g, '') || 'doc';

/** Download name for an exported bundle: `{type}-{code or N-docs}-{exportedAt}.json`, slugged so it is safe on every OS. */
export const eventDocTransferBundleFilename = (type: string, code: string, exportedAt: string, rootCount = 1): string => {
  const subject = rootCount > 1 ? `${rootCount}-docs` : slug(code);

  return `${slug(type)}-${subject}-${slug(exportedAt)}.json`;
};
