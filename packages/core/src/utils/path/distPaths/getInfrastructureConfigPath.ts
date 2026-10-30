import path from 'path';

import { getAppDistPath } from './getAppDistPath';

/** Where `qpq synth` writes each service's `<module>-config.json`. */
export const getInfrastructureConfigPath = (root: string, appName: string): string => path.join(getAppDistPath(root, appName), 'infrastructure');
