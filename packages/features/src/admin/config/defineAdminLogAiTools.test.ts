import { InlineFunctionQPQConfigSetting } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { adminLogAiTools, defineAdminLogAiTools } from './defineAdminLogAiTools';

describe('defineAdminLogAiTools', () => {
  it('defines an inline function for every tool executor', () => {
    const config = defineAdminLogAiTools() as InlineFunctionQPQConfigSetting[];
    const functionNames = config.map((setting) => setting.functionName);

    for (const tool of adminLogAiTools) {
      expect(functionNames).toContain(tool.executor);
    }
  });

  it('requires an index for getLogAction but no input for getLogActions', () => {
    const getLogActions = adminLogAiTools.find((t) => t.name === 'getLogActions')!;
    const getLogAction = adminLogAiTools.find((t) => t.name === 'getLogAction')!;

    expect(getLogActions.inputSchema).toEqual({ type: 'object', properties: {}, additionalProperties: false });
    expect(getLogAction.inputSchema).toMatchObject({ required: ['index'] });
  });
});
