import { captureRequester } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askOpenApiGetDocument } from './askOpenApiGetDocument';
import { OpenApiActionType } from './OpenApiActionType';

describe('askOpenApiGetDocument', () => {
  it('yields a GetDocument action carrying the info options', () => {
    const { action } = captureRequester(askOpenApiGetDocument({ title: 'Widgets' }));

    expect(action).toEqual({ type: OpenApiActionType.GetDocument, payload: { options: { title: 'Widgets' } } });
  });

  it('defaults to empty options', () => {
    const { action } = captureRequester(askOpenApiGetDocument());

    expect(action).toEqual({ type: OpenApiActionType.GetDocument, payload: { options: {} } });
  });
});
