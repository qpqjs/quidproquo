import { describe, expect, it } from 'vitest';

import { QPQCoreConfigSettingType } from '../QPQConfig';
import { defineInlineFunction } from './inlineFunction';

describe('defineInlineFunction', () => {
  it('builds an InlineFunction setting keyed by the runtime story name', () => {
    expect(defineInlineFunction('/entry/fn::handler')).toEqual({
      configSettingType: QPQCoreConfigSettingType.inlineFunction,
      uniqueKey: 'handler',
      runtime: '/entry/fn::handler',
      functionName: 'handler',
      owner: undefined,
    });
  });

  it('prefers an explicit functionName from options', () => {
    const setting = defineInlineFunction('/entry/fn::handler', { functionName: 'customName' });

    expect(setting.functionName).toBe('customName');
    expect(setting.uniqueKey).toBe('customName');
  });
});
