import path from 'path';
import { describe, expect, it } from 'vitest';

import { getCdkOutPath } from './getCdkOutPath';
import { getDevServerDistPath } from './getDevServerDistPath';
import { getGoDockerBuildPath } from './getGoDockerBuildPath';
import { getInfrastructureConfigPath } from './getInfrastructureConfigPath';
import { getServiceBundleDistPath } from './getServiceBundleDistPath';
import { getServiceRemoteDistPath } from './getServiceRemoteDistPath';
import { getViewsDistPath } from './getViewsDistPath';

const root = path.join(path.sep, 'repo');

describe('dist paths', () => {
  it('lays every build output out under dist/', () => {
    expect(getServiceBundleDistPath(root, 'app', 'svc')).toBe(path.join(root, 'dist', 'apps', 'app', 'services', 'svc', 'service'));
    expect(getServiceRemoteDistPath(root, 'app', 'svc')).toBe(path.join(root, 'dist', 'apps', 'app', 'services', 'svc', 'service-remote'));
    expect(getViewsDistPath(root, 'app', 'svc')).toBe(path.join(root, 'dist', 'apps', 'app', 'services', 'svc', 'views'));
    expect(getInfrastructureConfigPath(root, 'app')).toBe(path.join(root, 'dist', 'apps', 'app', 'infrastructure'));
    expect(getDevServerDistPath(root)).toBe(path.join(root, 'dist', 'qpq', 'dev-server'));
    expect(getCdkOutPath(root)).toBe(path.join(root, 'dist', 'qpq', 'cdk.out'));
    expect(getGoDockerBuildPath(root, 'app', 'svc')).toBe(path.join(root, 'dist', 'qpq', 'go-docker', 'app', 'svc'));
  });
});
