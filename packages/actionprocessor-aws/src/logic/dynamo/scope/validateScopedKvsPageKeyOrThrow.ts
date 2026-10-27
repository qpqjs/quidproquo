import { InvalidScopeError, InvalidScopeErrorCode, KVS_RESERVED_MARKER } from 'quidproquo-core';

import { AttributeValue } from '@aws-sdk/client-dynamodb';

import { stringToLastEvaluatedKey } from '../utils/stringToLastEvaluatedKey';
import { KVS_SCOPE_DELIMITER } from './scopedKvsValue';

const readString = (value: AttributeValue | undefined): string | undefined => {
  const stringValue = (value as { S?: unknown } | undefined)?.S;
  return typeof stringValue === 'string' ? stringValue : undefined;
};

/**
 * Refuse a client-supplied page key unless it belongs to this scope: its pk, and every hidden index copy
 * in it, must carry the scope's prefix. DynamoDB already bounds a query to its key condition and a scoped
 * scan filters every row, so this is defence in depth that also stops a client probing with edited keys.
 */
export const validateScopedKvsPageKeyOrThrow = (scope: string, pageKey: string, pkAttributeName: string): void => {
  const startKey = stringToLastEvaluatedKey(pageKey);
  const scopePrefix = `${scope}${KVS_SCOPE_DELIMITER}`;

  const scopedValues = [
    readString(startKey?.[pkAttributeName]),
    ...Object.entries(startKey ?? {})
      .filter(([attributeName]) => attributeName.includes(KVS_RESERVED_MARKER))
      .map(([, value]) => readString(value)),
  ];

  if (!scopedValues.every((value) => value?.startsWith(scopePrefix))) {
    throw new InvalidScopeError(InvalidScopeErrorCode.pageKeyOutOfScope, 'The page key was not issued under this scope.');
  }
};
