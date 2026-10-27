import { ConfigActionType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { REDACTED_STRING } from './constants/REDACTED_STRING';
import { redactStoryResult } from './redactStoryResult';

const toBase64 = (text: string): string => Buffer.from(text).toString('base64');
const toBase64Json = (value: unknown): string => toBase64(JSON.stringify(value));
const fromBase64Json = (text: string): unknown => JSON.parse(Buffer.from(text, 'base64').toString('utf8'));

// An API story: input[0] is the http event, whose body arrives base64 encoded.
const buildStory = (body: unknown, history: unknown[]) =>
  ({
    correlation: 'mod::c1',
    moduleName: 'mod',
    input: [{ path: '/things', body: toBase64Json(body), isBase64Encoded: true }],
    history,
  }) as any;

describe('redactStoryResult with a base64 json input body', () => {
  it('leaves an unremarkable field alone when nothing marks its value as secret', () => {
    const story = buildStory({ hidden: 'abcdefg', other: 'plain' }, []);

    const redacted = redactStoryResult(story);

    expect(fromBase64Json(redacted.input[0].body)).toEqual({ hidden: 'abcdefg', other: 'plain' });
  });

  it('redacts that same field once a secret read returns its value, and only that value', () => {
    const story = buildStory({ hidden: 'abcdefg', other: 'plain' }, [
      { act: { type: ConfigActionType.GetSecret, payload: { secretName: 'hidden-thing' } }, res: ['abcdefg', undefined] },
    ]);

    const redacted = redactStoryResult(story);

    expect(fromBase64Json(redacted.input[0].body)).toEqual({ hidden: REDACTED_STRING, other: 'plain' });
    expect(redacted.history[0].res).toEqual([REDACTED_STRING, undefined]);
    expect(redacted.history[0].act.payload).toEqual({ secretName: 'hidden-thing' });
  });

  it('redacts a login body by key alone, with no secret read involved', () => {
    const story = buildStory({ username: 'joe', password: 'hunter2' }, []);

    const redacted = redactStoryResult(story);

    expect(fromBase64Json(redacted.input[0].body)).toEqual({ username: 'joe', password: REDACTED_STRING });
    expect(redacted.input[0].path).toBe('/things');
    expect(redacted.input[0].isBase64Encoded).toBe(true);
  });

  it('redacts a base64 form-encoded login body by key', () => {
    const story = {
      ...buildStory({}, []),
      input: [{ path: '/login', body: toBase64('username=joe&password=hunter2&remember=on'), isBase64Encoded: true }],
    };

    const redacted = redactStoryResult(story);

    expect(Buffer.from(redacted.input[0].body, 'base64').toString()).toBe(`username=joe&password=${encodeURIComponent(REDACTED_STRING)}&remember=on`);
  });

  it('redacts a plain form-encoded login body by key', () => {
    const story = { ...buildStory({}, []), input: [{ path: '/login', body: 'username=joe&password=hunter2', isBase64Encoded: false }] };

    const redacted = redactStoryResult(story);

    expect(redacted.input[0].body).toBe(`username=joe&password=${encodeURIComponent(REDACTED_STRING)}`);
  });

  it('reaches a secret inside base64 json nested inside a base64 json body', () => {
    const innerBody = { password: 'hunter2', hidden: 'abcdefg' };
    const story = buildStory({ envelope: toBase64Json(innerBody), note: 'outer' }, [
      { act: { type: ConfigActionType.GetSecret, payload: { secretName: 'hidden-thing' } }, res: ['abcdefg', undefined] },
    ]);

    const redacted = redactStoryResult(story);

    const outer = fromBase64Json(redacted.input[0].body) as { envelope: string; note: string };
    expect(outer.note).toBe('outer');
    expect(fromBase64Json(outer.envelope)).toEqual({ password: REDACTED_STRING, hidden: REDACTED_STRING });
  });

  it('sweeps a secret out of a base64 plain-text property inside a base64 json body', () => {
    const story = buildStory({ blob: toBase64('the code is abcdefg'), note: 'outer' }, [
      { act: { type: ConfigActionType.GetSecret, payload: { secretName: 'hidden-thing' } }, res: ['abcdefg', undefined] },
    ]);

    const redacted = redactStoryResult(story);

    const outer = fromBase64Json(redacted.input[0].body) as { blob: string; note: string };
    expect(outer.note).toBe('outer');
    expect(Buffer.from(outer.blob, 'base64').toString()).toBe(`the code is ${REDACTED_STRING}`);
  });
});
