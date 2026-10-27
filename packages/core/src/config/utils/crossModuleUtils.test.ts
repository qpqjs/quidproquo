import { describe, expect, it } from 'vitest';

import { convertCrossModuleOwnerToGenericResourceNameOverride, isSameCrossModuleOwner } from './crossModuleUtils';

describe('isSameCrossModuleOwner', () => {
  it('treats two undefined owners as the same (both local)', () => {
    expect(isSameCrossModuleOwner(undefined, undefined)).toBe(true);
  });

  it('matches owners with identical scope fields, ignoring the resource-name key', () => {
    expect(
      isSameCrossModuleOwner(
        { module: 'mod', application: 'app', feature: 'feat', environment: 'env', queueName: 'a' } as any,
        { module: 'mod', application: 'app', feature: 'feat', environment: 'env', queueName: 'b' } as any,
      ),
    ).toBe(true);
  });

  it('rejects owners that differ in any scope field', () => {
    expect(isSameCrossModuleOwner({ module: 'mod-a' }, { module: 'mod-b' })).toBe(false);
    expect(isSameCrossModuleOwner({ module: 'mod', environment: 'dev' }, { module: 'mod', environment: 'prod' })).toBe(false);
    expect(isSameCrossModuleOwner({ module: 'mod' }, undefined)).toBe(false);
  });
});

describe('convertCrossModuleOwnerToGenericResourceNameOverride', () => {
  it('returns undefined when no owner is given', () => {
    expect(convertCrossModuleOwnerToGenericResourceNameOverride(undefined)).toBeUndefined();
  });

  it('copies the non-scope key value into resourceNameOverride', () => {
    expect(convertCrossModuleOwnerToGenericResourceNameOverride({ module: 'other', queueName: 'Jobs' } as any)).toEqual({
      module: 'other',
      queueName: 'Jobs',
      resourceNameOverride: 'Jobs',
    });
  });

  it('ignores scope keys when picking the resource name', () => {
    const owner = { application: 'app', module: 'mod', feature: 'feat', environment: 'env', secretName: 'apiKey' };

    expect(convertCrossModuleOwnerToGenericResourceNameOverride(owner as any)?.resourceNameOverride).toBe('apiKey');
  });
});
