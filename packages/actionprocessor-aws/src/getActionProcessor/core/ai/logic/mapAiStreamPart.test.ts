import { AiStreamPartType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { mapAiStreamPart } from './mapAiStreamPart';

describe('mapAiStreamPart', () => {
  it('dispatches to the mapper for the part type', () => {
    expect(mapAiStreamPart({ type: 'text-delta', id: 't1', text: 'hi' } as never)).toEqual({
      type: AiStreamPartType.TextDelta,
      id: 't1',
      text: 'hi',
    });
  });

  it('dispatches no-payload parts', () => {
    expect(mapAiStreamPart({ type: 'start' } as never)).toEqual({ type: AiStreamPartType.Start });
  });
});
