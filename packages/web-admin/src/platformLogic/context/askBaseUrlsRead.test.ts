import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askBaseUrlsProvide } from './askBaseUrlsProvide';
import { askBaseUrlsRead } from './askBaseUrlsRead';
import { baseUrlsContext } from './baseUrlsContext';

describe('askBaseUrlsRead', () => {
  it('round-trips the provided urls under the qpq key', () => {
    expect(baseUrlsContext.uniqueName).toBe('qpq-admin-base-urls');

    const urls = { api: 'https://api', ws: 'wss://ws' };
    expect(runStory(askBaseUrlsProvide(urls, askBaseUrlsRead()))).toEqual(urls);
  });
});
