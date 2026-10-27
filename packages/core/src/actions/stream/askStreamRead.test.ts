import { describe, expect, it } from 'vitest';

import { captureRequester } from '../../testing';
import { StreamChunk, StreamHandle } from '../../types/StreamRegistry';
import { askStreamRead } from './askStreamRead';
import { StreamActionType } from './StreamActionType';

const handle = <E extends 'text' | 'binary' | 'json'>(encoding: E): StreamHandle<E> => ({ id: 'stream-1', encoding });

describe('askStreamRead', () => {
  it('yields a Read action carrying the stream id and noWait flag', () => {
    const { action } = captureRequester(askStreamRead(handle('text'), true), { done: false, data: 'hi' } as StreamChunk<string>);

    expect(action).toEqual({
      type: StreamActionType.Read,
      payload: { streamId: 'stream-1', noWait: true },
    });
  });

  it('leaves noWait undefined when omitted', () => {
    const { action } = captureRequester(askStreamRead(handle('text')), { done: false, data: 'hi' } as StreamChunk<string>);

    expect(action.payload).toEqual({ streamId: 'stream-1', noWait: undefined });
  });

  it('passes a text chunk through untouched', () => {
    const { returned } = captureRequester(askStreamRead(handle('text')), { done: false, data: 'hello' } as StreamChunk<string>);

    expect(returned).toEqual({ done: false, data: 'hello' });
  });

  it('decodes a binary chunk from base64 into a Uint8Array', () => {
    const base64 = btoa('AB');
    const { returned } = captureRequester(askStreamRead(handle('binary')), { done: false, data: base64 } as StreamChunk<string>);

    expect(returned.data).toEqual(new Uint8Array([65, 66]));
    expect(returned.done).toBe(false);
  });

  it('parses a json chunk', () => {
    const { returned } = captureRequester(askStreamRead(handle('json')), { done: false, data: '{"a":1}' } as StreamChunk<string>);

    expect(returned.data).toEqual({ a: 1 });
  });

  it('returns a done chunk untouched without decoding', () => {
    const { returned } = captureRequester(askStreamRead(handle('binary')), { done: true } as StreamChunk<string>);

    expect(returned).toEqual({ done: true });
  });

  it('returns a skipped chunk untouched', () => {
    const { returned } = captureRequester(askStreamRead(handle('json')), { done: false, skipped: true } as StreamChunk<string>);

    expect(returned).toEqual({ done: false, skipped: true });
  });

  it('returns a chunk with no data untouched', () => {
    const { returned } = captureRequester(askStreamRead(handle('json')), { done: false } as StreamChunk<string>);

    expect(returned).toEqual({ done: false });
  });

  it('passes an empty-string data chunk through without decoding', () => {
    const { returned } = captureRequester(askStreamRead(handle('json')), { done: false, data: '' } as StreamChunk<string>);

    expect(returned).toEqual({ done: false, data: '' });
  });

  it('throws when a json chunk contains malformed json', () => {
    const runMalformedJsonRead = () => captureRequester(askStreamRead(handle('json')), { done: false, data: 'not json' } as StreamChunk<string>);

    expect(runMalformedJsonRead).toThrow(SyntaxError);
  });

  it('throws when a binary chunk is not valid base64', () => {
    const runInvalidBase64Read = () => captureRequester(askStreamRead(handle('binary')), { done: false, data: '!!!' } as StreamChunk<string>);

    expect(runInvalidBase64Read).toThrow();
  });
});
