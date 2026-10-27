import { describe, expect, it } from 'vitest';

import { QPQCoreConfigSettingType } from '../QPQConfig';
import { defineActionProcessors } from './actionProcessors';

describe('defineActionProcessors', () => {
  it('builds an actionProcessors setting keyed by a relative runtime path', () => {
    expect(defineActionProcessors('/entry/processors::get')).toEqual({
      configSettingType: QPQCoreConfigSettingType.actionProcessors,
      uniqueKey: '/entry/processors::get',
      runtime: '/entry/processors::get',
    });
  });

  it('keys an advanced runtime by its base path, relative path and function name', () => {
    const runtime = { basePath: '/repo/src', relativePath: '/processors', functionName: 'get' };

    expect(defineActionProcessors(runtime).uniqueKey).toBe('/repo/src//processors::get');
  });
});
