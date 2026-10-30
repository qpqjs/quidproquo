import { captureRequester } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askMcpEventDocAiReadConfig } from './askMcpEventDocAiReadConfig';
import { McpEventDocAiActionType } from './McpEventDocAiActionType';

describe('askMcpEventDocAiReadConfig', () => {
  it('yields a ReadConfig action with no payload', () => {
    const { action } = captureRequester(askMcpEventDocAiReadConfig());

    expect(action).toEqual({ type: McpEventDocAiActionType.ReadConfig, payload: undefined });
  });

  it('returns the value the runtime resolves', () => {
    const { returned } = captureRequester(askMcpEventDocAiReadConfig(), [{ name: 'docs' }]);

    expect(returned).toEqual([{ name: 'docs' }]);
  });
});
