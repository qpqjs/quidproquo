import path from 'path';

import { getQpqDistPath } from './getQpqDistPath';

/** Where the bundler writes the default entry files for a views package that ships none of its own (E8). */
export const getViewsEntryDistPath = (root: string, appName: string, serviceName: string): string =>
  path.join(getQpqDistPath(root), 'views-entry', appName, serviceName);
