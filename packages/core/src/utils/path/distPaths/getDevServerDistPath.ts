import path from 'path';

import { getQpqDistPath } from './getQpqDistPath';

/** Where the dev server, migrate and user-script-child bundles land. */
export const getDevServerDistPath = (root: string): string => path.join(getQpqDistPath(root), 'dev-server');
