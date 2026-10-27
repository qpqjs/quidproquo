import { getHash } from './getHash';

/**
 * Placeholder (#hash) for an attribute name in a DynamoDB expression. The raw
 * name is only ever sent via ExpressionAttributeNames, never spliced into the
 * expression itself, so user-supplied names cannot inject expression syntax.
 */
export const getItemName = (name: string): string => {
  return `#${getHash(name)}`;
};
