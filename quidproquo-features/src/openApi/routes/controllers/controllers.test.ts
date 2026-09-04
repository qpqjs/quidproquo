import { ConfigActionType, runStory } from 'quidproquo-core';
import { HTTPEvent, OpenApiActionType } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { document } from './document';
import { reference } from './reference';

const buildEvent = (path: string): HTTPEvent => ({
  path,
  query: {},
  headers: {},
  method: 'GET',
  correlation: 'c',
  sourceIp: '127.0.0.1',
  isBase64Encoded: false,
});

describe('openApi controllers', () => {
  it('document serves the generated document built with the configured info', () => {
    let seenOptions: unknown;

    const response = runStory(document(buildEvent('/v1/docs/openapi.json')), {
      [ConfigActionType.GetGlobal]: { title: 'Widgets' },
      [OpenApiActionType.GetDocument]: (action: { payload: { options: unknown } }) => {
        seenOptions = action.payload.options;
        return { openapi: '3.1.0', paths: {} };
      },
    });

    expect(seenOptions).toEqual({ title: 'Widgets' });
    expect(response.status).toBe(200);
    expect(JSON.parse(response.body ?? '')).toEqual({ openapi: '3.1.0', paths: {} });
  });

  it('reference serves a page that resolves the document from its own location', () => {
    const response = runStory(reference(buildEvent('/v1/docs/')), {
      [ConfigActionType.GetGlobal]: { title: 'Widgets' },
    });

    expect(response.status).toBe(200);
    expect(response.headers?.['content-type']).toMatch(/text\/html/);
    expect(response.body).toContain("location.pathname.replace(/\\/$/, '') + '/openapi.json'");
    expect(response.body).toContain('<title>Widgets</title>');
  });
});
