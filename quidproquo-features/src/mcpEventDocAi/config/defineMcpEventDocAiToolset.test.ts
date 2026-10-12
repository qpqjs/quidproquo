import { InlineFunctionQPQConfigSetting, QPQConfigSetting, QPQCoreConfigSettingType, QpqFunctionRuntimeAdvanced } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { EVENT_DOC_USER_DIRECTORY_GLOBAL } from '../../eventDoc/constants/eventDocGlobalNames';
import { MCP_TOOLSET_CONFIG_SETTING_TYPE } from '../../mcp/constants/mcpToolsetConfigSettingType';
import { McpToolsetQPQConfigSetting } from '../../mcp/types/McpToolsetQPQConfigSetting';
import { defineMcpEventDocAiToolset } from './defineMcpEventDocAiToolset';

const settings = defineMcpEventDocAiToolset({ userDirectoryName: 'users' }) as QPQConfigSetting[];

describe('defineMcpEventDocAiToolset', () => {
  it('registers a toolset whose two inline functions are defined alongside it', () => {
    const toolset = settings.find(
      (setting): setting is McpToolsetQPQConfigSetting => setting.configSettingType === MCP_TOOLSET_CONFIG_SETTING_TYPE,
    )?.toolset;
    const inlineFunctionNames = settings
      .filter((setting): setting is InlineFunctionQPQConfigSetting => setting.configSettingType === QPQCoreConfigSettingType.inlineFunction)
      .map(({ functionName }) => functionName);

    expect(inlineFunctionNames).toEqual([toolset?.listTools, toolset?.runTool]);
  });

  it('gives both inline functions the eventDoc user-directory global that collection hooks resolve the caller with', () => {
    const inlineFunctions = settings.filter(
      (setting): setting is InlineFunctionQPQConfigSetting => setting.configSettingType === QPQCoreConfigSettingType.inlineFunction,
    );

    for (const { runtime } of inlineFunctions) {
      expect((runtime as QpqFunctionRuntimeAdvanced).globals).toEqual({ [EVENT_DOC_USER_DIRECTORY_GLOBAL]: 'users' });
    }
  });
});
