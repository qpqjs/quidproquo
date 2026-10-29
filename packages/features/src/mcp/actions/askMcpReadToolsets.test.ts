import { captureRequester } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askMcpReadToolsets } from './askMcpReadToolsets';
import { McpActionType } from './McpActionType';

describe('askMcpReadToolsets', () => {
  it('yields a ReadToolsets action with no payload', () => {
    const { action } = captureRequester(askMcpReadToolsets());

    expect(action).toEqual({ type: McpActionType.ReadToolsets, payload: undefined });
  });

  it('returns the value the runtime resolves', () => {
    const { returned } = captureRequester(askMcpReadToolsets(), [{ name: 'tools' }]);

    expect(returned).toEqual([{ name: 'tools' }]);
  });
});
