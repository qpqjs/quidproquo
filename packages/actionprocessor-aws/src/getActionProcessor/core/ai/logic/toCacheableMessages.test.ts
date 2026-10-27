import { AiCacheTtl, AiModel } from 'quidproquo-core';

import type { ModelMessage } from 'ai';
import { describe, expect, it } from 'vitest';

import { toCacheableMessages } from './toCacheableMessages';

const cachePoint = { bedrock: { cachePoint: { type: 'default' } } };

// Explicit five minutes keeps the structural cases on the plain point; the dynamic policy has
// its own case below.
const cache = { model: AiModel.ClaudeSonnet46, cacheTtl: AiCacheTtl.FiveMinutes };

const countCachePoints = (messages: ModelMessage[]): number =>
  messages.filter((message) => message.providerOptions?.bedrock?.cachePoint || message.providerOptions?.amazonBedrock?.cachePoint).length;

describe('toCacheableMessages', () => {
  it('returns the messages unchanged when caching is not requested', () => {
    const messages = [{ role: 'user' as const, content: 'hi' }];

    expect(toCacheableMessages(messages, false, cache)).toBe(messages);
    expect(toCacheableMessages(messages, undefined, cache)).toBe(messages);
  });

  it('returns an empty array unchanged', () => {
    expect(toCacheableMessages([], true, cache)).toEqual([]);
  });

  it('marks the last message with a bedrock cache point', () => {
    const messages = [
      { role: 'user' as const, content: 'what is 1+1' },
      { role: 'assistant' as const, content: 'it is 2' },
      { role: 'user' as const, content: 'oh nice' },
    ];

    expect(toCacheableMessages(messages, true, cache)).toEqual([
      { role: 'user', content: 'what is 1+1' },
      { role: 'assistant', content: 'it is 2' },
      { role: 'user', content: 'oh nice', providerOptions: cachePoint },
    ]);
  });

  it('marks a lone message with a cache point', () => {
    const messages = [{ role: 'user' as const, content: 'hi' }];

    expect(toCacheableMessages(messages, true, cache)).toEqual([{ role: 'user', content: 'hi', providerOptions: cachePoint }]);
  });

  it('merges into any existing providerOptions on the marked message rather than overwriting them', () => {
    const messages = [{ role: 'user' as const, content: 'hi', providerOptions: { other: { keep: true }, bedrock: { reasoning: 'on' } } }];

    expect(toCacheableMessages(messages, true, cache)).toEqual([
      {
        role: 'user',
        content: 'hi',
        providerOptions: { other: { keep: true }, bedrock: { reasoning: 'on', cachePoint: { type: 'default' } } },
      },
    ]);
  });

  it('strips stale cache points from earlier messages so only the new ones remain', () => {
    const messages: ModelMessage[] = [
      { role: 'user', content: 'q1', providerOptions: cachePoint },
      { role: 'assistant', content: 'a1', providerOptions: { amazonBedrock: { cachePoint: { type: 'default' } } } },
      { role: 'user', content: 'q2' },
    ];

    const result = toCacheableMessages(messages, true, cache);

    expect(countCachePoints(result)).toBe(1);
    expect(result[0]).toEqual({ role: 'user', content: 'q1' });
    expect(result[1]).toEqual({ role: 'assistant', content: 'a1' });
    expect(result[2]).toEqual({ role: 'user', content: 'q2', providerOptions: cachePoint });
  });

  it('keeps unrelated provider options when stripping a stale point and leaves no empty objects behind', () => {
    const messages: ModelMessage[] = [
      { role: 'user', content: 'q1', providerOptions: { other: { keep: true }, bedrock: { cachePoint: { type: 'default' }, reasoning: 'on' } } },
      { role: 'user', content: 'q2' },
    ];

    const [first] = toCacheableMessages(messages, true, cache);

    expect(first).toEqual({ role: 'user', content: 'q1', providerOptions: { other: { keep: true }, bedrock: { reasoning: 'on' } } });
  });

  it('marks the last saved message and leaves the turn context after it unmarked', () => {
    const messages: ModelMessage[] = [
      { role: 'user', content: 'q1' },
      { role: 'assistant', content: 'a1' },
      { role: 'user', content: 'q2' },
      { role: 'user', content: 'current state' },
      { role: 'user', content: 'continue' },
    ];

    const result = toCacheableMessages(messages, true, { ...cache, durableCount: 3, markTail: false });

    expect(countCachePoints(result)).toBe(1);
    expect(result[2].providerOptions).toEqual(cachePoint);
    expect(result[3].providerOptions).toBeUndefined();
    expect(result[4].providerOptions).toBeUndefined();
  });

  it('also marks the newest tool message when asked to mark the tail', () => {
    const messages: ModelMessage[] = [
      { role: 'user', content: 'q1' },
      { role: 'assistant', content: 'a1' },
      { role: 'user', content: 'q2', providerOptions: cachePoint },
      { role: 'user', content: 'current state' },
      { role: 'assistant', content: [{ type: 'tool-call', toolCallId: 't1', toolName: 'read', input: {} }] },
      { role: 'tool', content: [{ type: 'tool-result', toolCallId: 't1', toolName: 'read', output: { type: 'text', value: 'ok' } }] },
    ];

    const result = toCacheableMessages(messages, true, { ...cache, durableCount: 3, markTail: true });

    expect(countCachePoints(result)).toBe(2);
    expect(result[2].providerOptions).toEqual(cachePoint);
    expect(result[3].providerOptions).toBeUndefined();
    expect(result[4].providerOptions).toBeUndefined();
    expect(result[5].providerOptions).toEqual(cachePoint);
  });

  it('does not mark the tail while the list is only the saved conversation', () => {
    const messages: ModelMessage[] = [
      { role: 'user', content: 'q1' },
      { role: 'user', content: 'q2' },
    ];

    const result = toCacheableMessages(messages, true, { ...cache, durableCount: 2, markTail: true });

    expect(countCachePoints(result)).toBe(1);
    expect(result[1].providerOptions).toEqual(cachePoint);
  });

  it('marks nothing when every message is turn context', () => {
    const messages: ModelMessage[] = [{ role: 'user', content: 'current state' }];

    expect(countCachePoints(toCacheableMessages(messages, true, { ...cache, durableCount: 0 }))).toBe(0);
  });

  it('keeps the anchor for an hour and the tail for five minutes under the dynamic default', () => {
    const messages: ModelMessage[] = [
      { role: 'user', content: 'q1' },
      { role: 'user', content: 'current state' },
      { role: 'assistant', content: [{ type: 'tool-call', toolCallId: 't1', toolName: 'read', input: {} }] },
      { role: 'tool', content: [{ type: 'tool-result', toolCallId: 't1', toolName: 'read', output: { type: 'text', value: 'ok' } }] },
    ];

    const result = toCacheableMessages(messages, true, { model: AiModel.ClaudeSonnet46, durableCount: 1, markTail: true });

    expect(result[0].providerOptions).toEqual({ bedrock: { cachePoint: { type: 'default', ttl: '1h' } } });
    expect(result[1].providerOptions).toBeUndefined();
    expect(result[3].providerOptions).toEqual(cachePoint);
  });

  it('keeps the anchor for an hour when asked, never the tail, and omits the ttl otherwise', () => {
    const messages: ModelMessage[] = [
      { role: 'user', content: 'q1' },
      { role: 'assistant', content: 'a1' },
      { role: 'tool', content: [] },
    ];

    const oneHour = toCacheableMessages(messages, true, { ...cache, cacheTtl: AiCacheTtl.OneHour, durableCount: 1, markTail: true });
    expect(oneHour[0].providerOptions).toEqual({ bedrock: { cachePoint: { type: 'default', ttl: '1h' } } });
    expect(oneHour[2].providerOptions).toEqual(cachePoint);

    const fiveMinutes = toCacheableMessages(messages, true, { ...cache, cacheTtl: AiCacheTtl.FiveMinutes, durableCount: 1, markTail: true });
    expect(fiveMinutes[0].providerOptions).toEqual(cachePoint);
    expect(fiveMinutes[2].providerOptions).toEqual(cachePoint);
  });
});
