import { captureRequester } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askMcpReadConfig } from './askMcpReadConfig';
import { McpActionType } from './McpActionType';

describe('askMcpReadConfig', () => {
  it('yields a ReadConfig action with no payload', () => {
    const { action } = captureRequester(askMcpReadConfig());

    expect(action).toEqual({ type: McpActionType.ReadConfig, payload: undefined });
  });

  it('returns the value the runtime resolves', () => {
    const { returned } = captureRequester(askMcpReadConfig(), { name: 'mcp' });

    expect(returned).toEqual({ name: 'mcp' });
  });
});
