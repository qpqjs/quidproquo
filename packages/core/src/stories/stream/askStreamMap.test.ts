import { describe, expect, it, vi } from 'vitest';

import { StreamActionType } from '../../actions/stream/StreamActionType';
import { expectError, runStory, StoryError, throwsError } from '../../testing/storyTesting';
import { AskResponse } from '../../types';
import { StreamChunk, StreamHandle } from '../../types/StreamRegistry';
import { askCatch } from '../system/askCatch';
import { askStreamMap } from './askStreamMap';

const handle: StreamHandle<'text', string> = { id: 'stream-1', encoding: 'text' };

// Answers each Read with the next chunk in the queue, ending with a done chunk.
const readsFrom = (chunks: StreamChunk<string>[]) => {
  const queue = [...chunks];
  return () => queue.shift() ?? { done: true };
};

describe('askStreamMap', () => {
  it('maps each chunk through the callback and closes the stream', () => {
    const close = vi.fn();

    const result = runStory(
      askStreamMap(handle, function* (item, index): AskResponse<string> {
        return `${index}:${item}`;
      }),
      {
        [StreamActionType.Read]: readsFrom([{ done: false, data: 'a' }, { done: false, data: 'b' }, { done: true }]),
        [StreamActionType.Close]: close,
      },
    );

    expect(result).toEqual(['0:a', '1:b']);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('skips skipped chunks and chunks with no data', () => {
    const result = runStory(askStreamMap(handle), {
      [StreamActionType.Read]: readsFrom([{ done: false, data: 'a' }, { done: false, skipped: true }, { done: false, data: 'c' }, { done: true }]),
      [StreamActionType.Close]: undefined,
    });

    expect(result).toEqual(['a', 'c']);
  });

  it('returns an empty array for an immediately-done stream', () => {
    const result = runStory(askStreamMap(handle), {
      [StreamActionType.Read]: { done: true },
      [StreamActionType.Close]: undefined,
    });

    expect(result).toEqual([]);
  });

  it('closes the stream and rethrows when a read fails', () => {
    const close = vi.fn();

    expect(() =>
      runStory(askStreamMap(handle), {
        [StreamActionType.Read]: throwsError('GenericError', 'source went away'),
        [StreamActionType.Close]: close,
      }),
    ).toThrow(StoryError);

    expect(close).toHaveBeenCalledTimes(1);
  });

  it('closes the stream and rethrows when the callback fails', () => {
    const close = vi.fn();

    function* failingCallback(): AskResponse<string> {
      throw new Error('callback exploded');
    }

    expect(() =>
      runStory(askStreamMap(handle, failingCallback), {
        [StreamActionType.Read]: readsFrom([{ done: false, data: 'a' }, { done: true }]),
        [StreamActionType.Close]: close,
      }),
    ).toThrow('An unexpected error occurred [Error].');

    expect(close).toHaveBeenCalledTimes(1);
  });

  it('surfaces a read failure to a surrounding askCatch with the original error, after closing', () => {
    const close = vi.fn();

    function* story(): AskResponse<any> {
      return yield* askCatch(askStreamMap(handle));
    }

    const result = runStory(story(), {
      [StreamActionType.Read]: throwsError('GenericError', 'source went away'),
      [StreamActionType.Close]: close,
    });

    expect(expectError(result).errorText).toBe('source went away');
    expect(close).toHaveBeenCalledTimes(1);
  });
});
