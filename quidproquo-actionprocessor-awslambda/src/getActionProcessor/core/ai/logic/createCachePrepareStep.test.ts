import { AiCacheTtl, AiModel } from 'quidproquo-core';

import type { ModelMessage, PrepareStepResult, ToolSet } from 'ai';
import { describe, expect, it } from 'vitest';

import { createCachePrepareStep } from './createCachePrepareStep';

const cachePoint = { bedrock: { cachePoint: { type: 'default' } } };

const history: ModelMessage[] = [
  { role: 'user', content: 'q1' },
  { role: 'assistant', content: 'a1' },
  { role: 'user', content: 'q2' },
];

const turnContext: ModelMessage = { role: 'user', content: 'current state' };

const toolTraffic: ModelMessage[] = [
  { role: 'assistant', content: [{ type: 'tool-call', toolCallId: 't1', toolName: 'read', input: {} }] },
  { role: 'tool', content: [{ type: 'tool-result', toolCallId: 't1', toolName: 'read', output: { type: 'text', value: 'ok' } }] },
];

const stepMessages = (result: PrepareStepResult<ToolSet> | PromiseLike<PrepareStepResult<ToolSet>>): ModelMessage[] => {
  if (!result || typeof (result as PromiseLike<unknown>).then === 'function') {
    throw new Error('expected a synchronous prepare step result');
  }
  return (result as { messages: ModelMessage[] }).messages;
};

const runStep = (durableCount: number, stepNumber: number, messages: ModelMessage[], cacheTtl?: AiCacheTtl): ModelMessage[] =>
  stepMessages(createCachePrepareStep({ model: AiModel.ClaudeSonnet46, cacheTtl, durableCount })({ messages, stepNumber } as never));

const markedIndexes = (messages: ModelMessage[]): number[] =>
  messages.flatMap((message, index) => (message.providerOptions?.bedrock?.cachePoint ? [index] : []));

describe('createCachePrepareStep', () => {
  it('marks only the last saved message on step 0, leaving the turn context unmarked', () => {
    const result = runStep(3, 0, [...history, turnContext]);

    expect(markedIndexes(result)).toEqual([2]);
    expect(result[2].providerOptions).toEqual(cachePoint);
    expect(result[3]).toEqual(turnContext);
  });

  it('marks the last message on step 0 when there is no turn context', () => {
    expect(markedIndexes(runStep(3, 0, history))).toEqual([2]);
  });

  it('re-marks a later step: the saved anchor stays and the newest tool message is added', () => {
    const stepZero = runStep(3, 0, [...history, turnContext]);

    const result = runStep(3, 1, [...stepZero, ...toolTraffic]);

    expect(markedIndexes(result)).toEqual([2, 5]);
  });

  it('never accumulates points across steps', () => {
    const stepZero = runStep(3, 0, [...history, turnContext]);
    const stepOne = runStep(3, 1, [...stepZero, ...toolTraffic]);

    const stepTwo = runStep(3, 2, [...stepOne, ...toolTraffic]);

    expect(markedIndexes(stepTwo)).toEqual([2, 7]);
  });

  it('marks nothing on step 0 when every message is turn context', () => {
    expect(markedIndexes(runStep(0, 0, [turnContext]))).toEqual([]);
  });

  it('applies the ttl to the points it places', () => {
    const result = runStep(3, 1, [...history, turnContext, ...toolTraffic], AiCacheTtl.OneHour);

    expect(result[2].providerOptions).toEqual({ bedrock: { cachePoint: { type: 'default', ttl: '1h' } } });
    expect(result[5].providerOptions).toEqual({ bedrock: { cachePoint: { type: 'default', ttl: '1h' } } });
  });
});
