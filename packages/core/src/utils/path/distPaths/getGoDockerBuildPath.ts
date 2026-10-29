import path from 'path';

import { getQpqDistPath } from './getQpqDistPath';

/** The per-service directory a containerized deploy's build half owns. */
export const getGoDockerBuildPath = (root: string, appName: string, serviceName: string): string =>
  path.join(getQpqDistPath(root), 'go-docker', appName, serviceName);
