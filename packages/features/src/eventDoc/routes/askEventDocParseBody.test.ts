import { ErrorTypeEnum } from '@qpqjs/core';
import { runStory, StoryError } from '@qpqjs/testing';
import { HTTPEvent } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { askEventDocParseBody } from './askEventDocParseBody';

const event = (body: string | undefined, isBase64Encoded = false): HTTPEvent => ({ body, isBase64Encoded, headers: {} }) as unknown as HTTPEvent;

// Security regression: a route body is JSON and an object, nothing else; malformed or scalar bodies are a clean
// BadRequest rather than something a controller destructures.
describe('askEventDocParseBody', () => {
  it('parses a JSON object, base64 encoded or not, and treats no body as an empty object', () => {
    expect(runStory(askEventDocParseBody(event('{"name":"a"}')), {})).toEqual({ name: 'a' });
    expect(runStory(askEventDocParseBody(event(Buffer.from('{"name":"b"}').toString('base64'), true)), {})).toEqual({ name: 'b' });
    expect(runStory(askEventDocParseBody(event(undefined)), {})).toEqual({});
  });

  it.each(['{not json', '"a string"', '42', 'null', 'true', ''])('throws BadRequest for the body %j', (body) => {
    const run = () => runStory(askEventDocParseBody(event(body)), {});

    expect(run).toThrow(StoryError);
    try {
      run();
    } catch (error) {
      expect((error as StoryError).errorType).toBe(ErrorTypeEnum.BadRequest);
    }
  });
});
