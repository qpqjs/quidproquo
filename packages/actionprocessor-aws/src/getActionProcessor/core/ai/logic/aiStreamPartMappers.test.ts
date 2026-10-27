import { AiStreamPartType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { aiStreamPartMappers } from './aiStreamPartMappers';

describe('aiStreamPartMappers', () => {
  it.each([
    ['start', { type: 'start' }, { type: AiStreamPartType.Start }],
    ['start-step', { type: 'start-step' }, { type: AiStreamPartType.StartStep }],
    ['raw', { type: 'raw' }, { type: AiStreamPartType.Raw }],
    [
      'finish',
      { type: 'finish', finishReason: 'stop', totalUsage: { inputTokens: 1, outputTokens: 2, totalTokens: 3 } },
      { type: AiStreamPartType.Finish, finishReason: 'stop', usage: { inputTokens: 1, outputTokens: 2, totalTokens: 3 } },
    ],
    [
      'finish-step',
      { type: 'finish-step', finishReason: 'length', usage: { inputTokens: 4, outputTokens: 5, totalTokens: 9 } },
      { type: AiStreamPartType.FinishStep, finishReason: 'length', usage: { inputTokens: 4, outputTokens: 5, totalTokens: 9 } },
    ],
    ['abort', { type: 'abort', reason: 'cancelled' }, { type: AiStreamPartType.Abort, reason: 'cancelled' }],
    ['error', { type: 'error', error: new Error('bad') }, { type: AiStreamPartType.Error, message: 'bad' }],
    [
      'file',
      { type: 'file', file: { base64: 'AAA', mediaType: 'image/png' } },
      { type: AiStreamPartType.File, file: { base64: 'AAA', mediaType: 'image/png' } },
    ],
    [
      'reasoning-file',
      { type: 'reasoning-file', file: { base64: 'BBB', mediaType: 'application/octet-stream' } },
      { type: AiStreamPartType.ReasoningFile, file: { base64: 'BBB', mediaType: 'application/octet-stream' } },
    ],
    ['custom', { type: 'custom', kind: 'provider.event' }, { type: AiStreamPartType.Custom, kind: 'provider.event' }],
    [
      'source',
      { type: 'source', sourceType: 'url', id: 's1', url: 'http://x', title: 't', mediaType: 'text/html', filename: 'f' },
      {
        type: AiStreamPartType.Source,
        source: { sourceType: 'url', id: 's1', url: 'http://x', title: 't', mediaType: 'text/html', filename: 'f' },
      },
    ],
    ['text-start', { type: 'text-start', id: 't1' }, { type: AiStreamPartType.TextStart, id: 't1' }],
    ['text-end', { type: 'text-end', id: 't1' }, { type: AiStreamPartType.TextEnd, id: 't1' }],
    ['text-delta', { type: 'text-delta', id: 't1', text: 'hi' }, { type: AiStreamPartType.TextDelta, id: 't1', text: 'hi' }],
    ['reasoning-start', { type: 'reasoning-start', id: 'r1' }, { type: AiStreamPartType.ReasoningStart, id: 'r1' }],
    ['reasoning-end', { type: 'reasoning-end', id: 'r1' }, { type: AiStreamPartType.ReasoningEnd, id: 'r1' }],
    ['reasoning-delta', { type: 'reasoning-delta', id: 'r1', text: 'think' }, { type: AiStreamPartType.ReasoningDelta, id: 'r1', text: 'think' }],
    [
      'tool-input-start',
      { type: 'tool-input-start', id: 'i1', toolName: 'calc' },
      { type: AiStreamPartType.ToolInputStart, id: 'i1', toolName: 'calc' },
    ],
    ['tool-input-end', { type: 'tool-input-end', id: 'i1' }, { type: AiStreamPartType.ToolInputEnd, id: 'i1' }],
    ['tool-input-delta', { type: 'tool-input-delta', id: 'i1', delta: '{' }, { type: AiStreamPartType.ToolInputDelta, id: 'i1', delta: '{' }],
    [
      'tool-call',
      { type: 'tool-call', toolCallId: 'c1', toolName: 'calc', input: { a: 1 } },
      { type: AiStreamPartType.ToolCall, toolCallId: 'c1', toolName: 'calc', input: { a: 1 } },
    ],
    [
      'tool-result',
      { type: 'tool-result', toolCallId: 'c1', toolName: 'calc', input: { a: 1 }, output: 42 },
      { type: AiStreamPartType.ToolResult, toolCallId: 'c1', toolName: 'calc', input: { a: 1 }, output: 42 },
    ],
    [
      'tool-error',
      { type: 'tool-error', toolCallId: 'c1', toolName: 'calc', input: { a: 1 }, error: new Error('nope') },
      { type: AiStreamPartType.ToolError, toolCallId: 'c1', toolName: 'calc', input: { a: 1 }, message: 'nope' },
    ],
    [
      'tool-output-denied',
      { type: 'tool-output-denied', toolCallId: 'c1', toolName: 'calc' },
      { type: AiStreamPartType.ToolOutputDenied, toolCallId: 'c1', toolName: 'calc' },
    ],
    [
      'tool-approval-request',
      { type: 'tool-approval-request', approvalId: 'a1', toolCall: { toolCallId: 'c1', toolName: 'calc', input: { a: 1 } } },
      { type: AiStreamPartType.ToolApprovalRequest, approvalId: 'a1', toolCallId: 'c1', toolName: 'calc', input: { a: 1 } },
    ],
    [
      'tool-approval-response',
      {
        type: 'tool-approval-response',
        approvalId: 'a1',
        approved: true,
        reason: 'ok',
        toolCall: { toolCallId: 'c1', toolName: 'calc', input: { a: 1 } },
      },
      { type: AiStreamPartType.ToolApprovalResponse, approvalId: 'a1', toolCallId: 'c1', toolName: 'calc', approved: true, reason: 'ok' },
    ],
  ])('maps a %s part', (type: string, part: unknown, expected: unknown) => {
    const mapper = aiStreamPartMappers[type as keyof typeof aiStreamPartMappers] as (p: unknown) => unknown;

    expect(mapper(part)).toEqual(expected);
  });

  it('omits absent optional source fields', () => {
    expect(aiStreamPartMappers.source({ type: 'source', sourceType: 'document', id: 's2' } as never)).toEqual({
      type: AiStreamPartType.Source,
      source: { sourceType: 'document', id: 's2', url: undefined, title: undefined, mediaType: undefined, filename: undefined },
    });
  });
});
