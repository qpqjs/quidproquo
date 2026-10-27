import { describe, expect, it } from 'vitest';

import { qpqApplicationVersionGlobal } from '../../constants';
import { QPQCoreConfigSettingType } from '../QPQConfig';
import { defineApplicationVersion } from './applicationVersion';

describe('defineApplicationVersion', () => {
  it('builds a single global setting holding the version', () => {
    expect(defineApplicationVersion('1.2.3')).toEqual([
      {
        configSettingType: QPQCoreConfigSettingType.global,
        uniqueKey: qpqApplicationVersionGlobal,
        key: qpqApplicationVersionGlobal,
        value: '1.2.3',
      },
    ]);
  });
});
