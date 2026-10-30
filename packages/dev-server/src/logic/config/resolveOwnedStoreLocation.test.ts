import { defineApplication, defineModule } from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import { resolveOwnedStoreLocation } from './resolveOwnedStoreLocation';

const config = [defineApplication('app', 'dev', 'root'), defineModule('svc')];

describe('resolveOwnedStoreLocation', () => {
  it("is this service's store under the given name without an owner", () => {
    expect(resolveOwnedStoreLocation('apiKey', undefined, config)).toEqual({ serviceName: 'svc', key: 'apiKey' });
  });

  it("is the owner's store under its override with one", () => {
    expect(resolveOwnedStoreLocation('apiKey', { module: 'other', resourceNameOverride: 'sharedKey' }, config)).toEqual({
      serviceName: 'other',
      key: 'sharedKey',
    });
  });
});
