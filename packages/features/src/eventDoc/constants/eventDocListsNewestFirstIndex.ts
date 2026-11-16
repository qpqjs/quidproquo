/**
 * The lists store index that reads one list view newest first (pk, then updatedAt). Named, where an index otherwise
 * takes its partition key's name, because `pk` is shorter than DynamoDB allows an index name to be.
 */
export const EVENT_DOC_LISTS_NEWEST_FIRST_INDEX = 'newestFirst';
