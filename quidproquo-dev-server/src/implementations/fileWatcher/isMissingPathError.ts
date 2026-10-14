/** True for the errno codes a path raises once it, or a parent directory, no longer exists. */
export const isMissingPathError = (error: unknown): boolean => {
  const code = (error as { code?: unknown } | null)?.code;

  return code === 'ENOENT' || code === 'ENOTDIR';
};
