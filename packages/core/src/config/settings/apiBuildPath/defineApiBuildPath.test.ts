import { describe, expect, it } from 'vitest';

import { QPQCoreConfigSettingType } from '../../QPQConfig';
import { defineApiBuildPath } from './defineApiBuildPath';

describe('defineApiBuildPath', () => {
  it('builds an ApiBuildPath setting with the given path', () => {
    expect(defineApiBuildPath('./build')).toEqual({
      configSettingType: QPQCoreConfigSettingType.apiBuildPath,
      uniqueKey: './build',
      apiBuildPath: './build',
    });
  });
});
