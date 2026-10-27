import { InlineFunctionQPQConfigSetting, QPQConfigSetting, QPQCoreConfigSettingType, QpqFunctionRuntimeAdvanced } from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import { MCP_REMOTE_PREFIX_GLOBAL } from '../constants/mcpRemotePrefixGlobal';
import { MCP_REMOTE_SERVICE_GLOBAL } from '../constants/mcpRemoteServiceGlobal';
import { MCP_TOOLSET_CONFIG_SETTING_TYPE } from '../constants/mcpToolsetConfigSettingType';
import { McpToolsetQPQConfigSetting } from '../types/McpToolsetQPQConfigSetting';
import { defineMcpRemoteToolset } from './defineMcpRemoteToolset';

const settings = [
  defineMcpRemoteToolset({ service: 'template', prefix: 'template' }),
  defineMcpRemoteToolset({ service: 'flow', prefix: 'flow' }),
].flat() as QPQConfigSetting[];

const inlineFunctions = settings.filter(
  (setting): setting is InlineFunctionQPQConfigSetting => setting.configSettingType === QPQCoreConfigSettingType.inlineFunction,
);
const toolsets = settings.filter((setting): setting is McpToolsetQPQConfigSetting => setting.configSettingType === MCP_TOOLSET_CONFIG_SETTING_TYPE);

describe('defineMcpRemoteToolset', () => {
  it('gives each remote its own prefixed toolset and its own pair of inline functions', () => {
    expect(toolsets.map(({ toolset }) => toolset.prefix)).toEqual(['template', 'flow']);
    expect(new Set(inlineFunctions.map(({ functionName }) => functionName)).size).toBe(4);
    expect(toolsets.flatMap(({ toolset }) => [toolset.listTools, toolset.runTool])).toEqual(inlineFunctions.map(({ functionName }) => functionName));
  });

  it('tells each pair which service and prefix it serves through its runtime globals', () => {
    expect(inlineFunctions.map(({ runtime }) => (runtime as QpqFunctionRuntimeAdvanced).globals)).toEqual([
      { [MCP_REMOTE_SERVICE_GLOBAL]: 'template', [MCP_REMOTE_PREFIX_GLOBAL]: 'template' },
      { [MCP_REMOTE_SERVICE_GLOBAL]: 'template', [MCP_REMOTE_PREFIX_GLOBAL]: 'template' },
      { [MCP_REMOTE_SERVICE_GLOBAL]: 'flow', [MCP_REMOTE_PREFIX_GLOBAL]: 'flow' },
      { [MCP_REMOTE_SERVICE_GLOBAL]: 'flow', [MCP_REMOTE_PREFIX_GLOBAL]: 'flow' },
    ]);
  });
});
