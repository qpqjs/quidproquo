import { describe, expect, it } from 'vitest';

import { itemsToQpqPagedData } from './itemsToQpqPagedData';
import { lastEvaluatedKeyToString } from './lastEvaluatedKeyToString';

describe('itemsToQpqPagedData', () => {
  it('encodes the last evaluated key into nextPageKey', () => {
    const lastEvaluatedKey = { pk: { S: 'a' } };

    expect(itemsToQpqPagedData([1, 2], lastEvaluatedKey)).toEqual({
      items: [1, 2],
      nextPageKey: lastEvaluatedKeyToString(lastEvaluatedKey),
    });
  });

  it('omits nextPageKey when there is no last evaluated key', () => {
    expect(itemsToQpqPagedData(['a'])).toEqual({ items: ['a'], nextPageKey: undefined });
  });
});
