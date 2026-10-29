import path from 'path';

/** `dist/qpq`: the tooling's own build output (dev server bundles, cdk assemblies, docker contexts). */
export const getQpqDistPath = (root: string): string => path.join(root, 'dist', 'qpq');
