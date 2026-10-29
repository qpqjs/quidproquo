import path from 'path';

import { getQpqDistPath } from './getQpqDistPath';

/** The cloud assembly `cdk deploy` / `cdk destroy` synth into. */
export const getCdkOutPath = (root: string): string => path.join(getQpqDistPath(root), 'cdk.out');
