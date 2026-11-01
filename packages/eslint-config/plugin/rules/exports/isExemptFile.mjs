import path from 'node:path';

// Files the one-export and filename rules never look at: barrels, declarations and tests.
export const isExemptFile = (filename) => {
  const base = path.basename(filename);
  return /^index\.tsx?$/.test(base) || base.endsWith('.d.ts') || /\.(test|spec)\.[jt]sx?$/.test(base);
};
