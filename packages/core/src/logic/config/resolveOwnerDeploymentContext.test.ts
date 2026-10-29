import { describe, expect, it } from 'vitest';

import { defineApplication } from '../../config/settings/applicationName';
import { defineModule } from '../../config/settings/moduleName';
import { resolveOwnedResourceLocalName } from './resolveOwnedResourceLocalName';
import { resolveOwnerDeploymentContext } from './resolveOwnerDeploymentContext';

const config = [defineApplication('app', 'dev', 'root', 'beta'), defineModule('svc')];

describe('resolveOwnerDeploymentContext', () => {
  it('falls back to this deployment when there is no owner', () => {
    expect(resolveOwnerDeploymentContext(config)).toEqual({ application: 'app', module: 'svc', environment: 'dev', feature: 'beta' });
  });

  it('takes every field the owner names and falls back on the rest', () => {
    expect(resolveOwnerDeploymentContext(config, { module: 'other', environment: 'production' })).toEqual({
      application: 'app',
      module: 'other',
      environment: 'production',
      feature: 'beta',
    });
  });
});

describe('resolveOwnedResourceLocalName', () => {
  it("uses the owner's override when it renamed the resource", () => {
    expect(resolveOwnedResourceLocalName('mine', { module: 'other', resourceNameOverride: 'theirs' })).toBe('theirs');
    expect(resolveOwnedResourceLocalName('mine', { module: 'other' })).toBe('mine');
    expect(resolveOwnedResourceLocalName('mine')).toBe('mine');
  });
});
