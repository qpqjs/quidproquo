import { type AiStreamPart, AiStreamPartType } from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import { EVENT_DOC_AI_STREAM_PART_MAX_BYTES } from '../constants/eventDocAiStreamPartMaxBytes';
import { isEventDocAiStreamPartForwarded } from './isEventDocAiStreamPartForwarded';

const toolResult = (output: unknown) =>
  ({ type: AiStreamPartType.ToolResult, toolCallId: 'call-1', toolName: 'readDocument', output }) as AiStreamPart;

describe('isEventDocAiStreamPartForwarded', () => {
  it('forwards an ordinary part', () => {
    expect(isEventDocAiStreamPartForwarded({ type: AiStreamPartType.TextDelta, id: 'text-1', text: 'Done.' } as AiStreamPart)).toBe(true);
    expect(isEventDocAiStreamPartForwarded(toolResult({ ok: true }))).toBe(true);
  });

  it('never forwards a tool argument fragment', () => {
    expect(isEventDocAiStreamPartForwarded({ type: AiStreamPartType.ToolInputDelta, id: 'call-1', delta: '{"a":' } as AiStreamPart)).toBe(false);
  });

  it('holds back a part that would not fit in one websocket message', () => {
    expect(isEventDocAiStreamPartForwarded(toolResult('x'.repeat(EVENT_DOC_AI_STREAM_PART_MAX_BYTES)))).toBe(false);
  });

  // The limit is on bytes sent, and one character can be several bytes.
  it('measures bytes, not characters', () => {
    const characters = Math.ceil(EVENT_DOC_AI_STREAM_PART_MAX_BYTES / 2);

    expect(isEventDocAiStreamPartForwarded(toolResult('x'.repeat(characters)))).toBe(true);
    expect(isEventDocAiStreamPartForwarded(toolResult('\u20ac'.repeat(characters)))).toBe(false);
  });
});
