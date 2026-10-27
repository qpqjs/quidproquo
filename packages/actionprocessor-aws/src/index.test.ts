import { describe, expect, it } from 'vitest';

import * as packageRoot from './index';

// Importing the whole package root catches broken barrels and modules that
// fail (or self-execute) at import time, which unit tests on leaf files miss.
describe('quidproquo-actionprocessor-awslambda', () => {
  it('exposes the public api from the package root', () => {
    expect(packageRoot.awsLambdaUtils.matchUrl).toBeTypeOf('function');
    expect(packageRoot.awsNamingUtils.getQpqRuntimeResourceNameFromConfig).toBeTypeOf('function');
    expect(packageRoot.getAwsActionProcessors).toBeTypeOf('function');
    expect(packageRoot.getLambdaEntries).toBeTypeOf('function');
    expect(packageRoot.getLogExtensionLayerPath).toBeTypeOf('function');
  });
});
