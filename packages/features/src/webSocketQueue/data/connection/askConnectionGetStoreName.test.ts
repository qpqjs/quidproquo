import { ContextActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askConnectionGetStoreName } from './askConnectionGetStoreName';

describe('askConnectionGetStoreName', () => {
  it('derives the store name from the override without reading context', () => {
    expect(runStory(askConnectionGetStoreName('myApi'))).toBe('qpq-wsq-myApi');
  });

  it('derives the store name from the connection-info api name', () => {
    const result = runStory(askConnectionGetStoreName(), {
      [ContextActionType.Read]: { apiName: 'demo' },
    });

    expect(result).toBe('qpq-wsq-demo');
  });
});
