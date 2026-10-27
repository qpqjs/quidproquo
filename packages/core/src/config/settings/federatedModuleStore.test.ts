import { describe, expect, it } from 'vitest';

import { QPQCoreConfigSettingType } from '../QPQConfig';
import { defineFederatedModuleStore } from './federatedModuleStore';

describe('defineFederatedModuleStore', () => {
  it('builds a FederatedModuleStore setting with bundleFallback defaulting to true', () => {
    expect(defineFederatedModuleStore('artifacts')).toEqual({
      configSettingType: QPQCoreConfigSettingType.federatedModuleStore,
      uniqueKey: 'FederatedModuleStore',
      storageDrive: 'artifacts',
      recheckMs: undefined,
      bundleFallback: true,
    });
  });

  it('keeps an explicit bundleFallback of false (thin shell mode)', () => {
    expect(defineFederatedModuleStore('artifacts', { bundleFallback: false }).bundleFallback).toBe(false);
  });

  it('passes recheckMs through', () => {
    expect(defineFederatedModuleStore('artifacts', { recheckMs: 5000 }).recheckMs).toBe(5000);
  });

  it('uses a fixed unique key so a service only ever has one store', () => {
    expect(defineFederatedModuleStore('a').uniqueKey).toBe(defineFederatedModuleStore('b').uniqueKey);
  });
});
