import { KvsAdvancedDataType } from 'quidproquo-core';

import { getHash } from './getHash';

/**
 * Placeholder (:hash) for a value in a DynamoDB expression. The hash is
 * derived from the value's type and JSON form, so equal values share one
 * placeholder and values equal only after coercion (1 vs '1') do not.
 */
export const getValueName = (value: KvsAdvancedDataType): string => {
  return `:${getHash(`${typeof value}-${JSON.stringify(value)}`)}`;
};
