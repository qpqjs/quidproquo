import { QpqPagedData } from 'quidproquo-core';

import { AttributeValue } from '@aws-sdk/client-dynamodb';

import { lastEvaluatedKeyToString } from './lastEvaluatedKeyToString';

/** Wrap a page of items as QpqPagedData, encoding LastEvaluatedKey as the opaque nextPageKey. */
export const itemsToQpqPagedData = <T>(items: T[], lastEvaluatedKey?: Record<string, AttributeValue>): QpqPagedData<T> => ({
  items,
  nextPageKey: lastEvaluatedKey ? lastEvaluatedKeyToString(lastEvaluatedKey) : undefined,
});
