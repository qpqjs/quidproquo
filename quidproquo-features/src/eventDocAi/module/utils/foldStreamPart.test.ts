import { type AiStreamPart, AiStreamPartType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { foldStreamPart } from './foldStreamPart';
import { mergeStreamParts } from './mergeStreamParts';

const parts: AiStreamPart[] = [
  { type: AiStreamPartType.Start } as AiStreamPart,
  { type: AiStreamPartType.TextDelta, id: 't1', text: 'Hel' } as AiStreamPart,
  { type: AiStreamPartType.TextDelta, id: 't1', text: 'lo' } as AiStreamPart,
  { type: AiStreamPartType.ToolInputStart, id: 'c1', toolName: 'createContent' } as AiStreamPart,
  { type: AiStreamPartType.ToolInputDelta, id: 'c1', delta: '{"a":' } as AiStreamPart,
  { type: AiStreamPartType.ToolInputDelta, id: 'c1', delta: '1}' } as AiStreamPart,
  { type: AiStreamPartType.ToolCall, toolCallId: 'c1', toolName: 'createContent', input: { a: 1 } } as AiStreamPart,
  { type: AiStreamPartType.ToolResult, toolCallId: 'c1', toolName: 'createContent', input: { a: 1 }, output: { id: 'x' } } as AiStreamPart,
];

describe('foldStreamPart', () => {
  it('merges deltas, tracks a streamed tool call by id, and pairs its result', () => {
    expect(mergeStreamParts(parts)).toEqual([
      { type: 'text', text: 'Hello' },
      { type: 'tool-use', tools: [{ toolName: 'createContent', toolCallId: 'c1', input: { a: 1 }, output: { id: 'x' } }] },
    ]);
  });

  it('shows the raw argument fragment while the call is still being written', () => {
    expect(mergeStreamParts(parts.slice(0, 6))).toEqual([
      { type: 'text', text: 'Hello' },
      { type: 'tool-use', tools: [{ toolName: 'createContent', toolCallId: 'c1', input: '{"a":1}' }] },
    ]);
  });

  it('still resolves a call when the argument deltas were never forwarded', () => {
    const withoutDeltas = parts.filter((part) => part.type !== AiStreamPartType.ToolInputDelta);

    expect(mergeStreamParts(withoutDeltas)[1]).toEqual({
      type: 'tool-use',
      tools: [{ toolName: 'createContent', toolCallId: 'c1', input: { a: 1 }, output: { id: 'x' } }],
    });
  });

  it('never mutates the segments it is given', () => {
    const before = mergeStreamParts(parts.slice(0, 4));
    const snapshot = JSON.parse(JSON.stringify(before));

    foldStreamPart(before, parts[4]);

    expect(before).toEqual(snapshot);
  });
});
