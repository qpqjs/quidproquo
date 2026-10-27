import { describe, expect, it } from 'vitest';

import { QPQCoreConfigSettingType } from '../QPQConfig';
import { defineAi } from './ai';

describe('defineAi', () => {
  it('accepts a missing options argument', () => {
    expect(defineAi('Assistant').tools).toEqual([]);
  });

  it('builds an Ai setting with the given name and defaults tools to an empty array', () => {
    expect(defineAi('Assistant', {})).toEqual({
      configSettingType: QPQCoreConfigSettingType.ai,
      uniqueKey: 'Assistant',
      aiName: 'Assistant',
      tools: [],
      owner: undefined,
    });
  });

  it('passes supplied tools through', () => {
    const tools = [{ name: 't', description: 'd', executor: '/entry::run', inputSchema: {} }];

    expect(defineAi('Assistant', { tools }).tools).toEqual(tools);
  });
});
