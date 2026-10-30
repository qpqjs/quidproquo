import path from 'path';

import { getQpqDistPath } from './getQpqDistPath';

/** The docker build context assembled for an app's image. */
export const getDockerImageContextPath = (root: string, appName: string): string => path.join(getQpqDistPath(root), 'docker-image', appName);
