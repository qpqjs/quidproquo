import { describe, expect, it } from 'vitest';

import { QPQCoreConfigSettingType } from '../QPQConfig';
import { definePromiseMode } from './definePromiseMode';

describe('definePromiseMode', () => {
  it('builds a single actionProcessors setting pointing at the promiseify story processor', () => {
    const config = definePromiseMode();

    expect(config).toHaveLength(1);

    const [setting] = config as any[];
    expect(setting.configSettingType).toBe(QPQCoreConfigSettingType.actionProcessors);
    expect(setting.runtime.functionName).toBe('getSystemExecuteStoryActionProcessor');
    expect(setting.runtime.relativePath).toBe('../../proiseify/getSystemExecuteStoryActionProcessor');
  });
});
