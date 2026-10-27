import {
  ActionProcessorResult,
  EventActionType,
  isErroredActionResult,
  KvsStreamRecord,
  QpqRuntimeType,
  resolveActionResult,
  resolveActionResultError,
  StoryResult,
} from 'quidproquo-core';

// A row with no scope is unscoped, which is a real state rather than missing data. Spelling
// it out keeps the two apart in search: an empty `[]` reads as a truncated log, and a bare
// scope-less string would match every unscoped row when someone searches for a tenant.
const UNSCOPED_LABEL = 'unscoped';

const describeKeys = (keys: Record<string, unknown>): string =>
  Object.entries(keys ?? {})
    .map(([attribute, value]) => `${attribute}=${String(value)}`)
    .join(' ');

/**
 * What someone chasing a projection actually needs to search on: which store changed, what
 * happened to it, whose data it was, and which item.
 *
 * The scope is the one that matters most. It is the tenant, and without it a search for a
 * document id returns every tenant's copy of that id with nothing to tell them apart.
 *
 * Reads the whole batch out of the GetRecords action rather than the story input, so all
 * records in an invocation are searchable — a stream delivers up to 100 at a time, and
 * indexing only the first would leave the rest invisible.
 */
export const kvsStreamEventGenericTextExtractor = (storyResult: StoryResult<any>): string[] => {
  if (storyResult.runtimeType !== QpqRuntimeType.KVS_STREAM_EVENT) {
    return [];
  }

  const getRecordsHistory = storyResult.history.find((h) => h.act.type === EventActionType.GetRecords);

  if (!getRecordsHistory) {
    return [];
  }

  const actionResult: ActionProcessorResult<KvsStreamRecord[]> = getRecordsHistory.res;

  if (isErroredActionResult(actionResult)) {
    return [resolveActionResultError(actionResult).errorText];
  }

  return resolveActionResult(actionResult).map((record) =>
    `${record.eventType}::${record.keyValueStoreName} - [${record.scope || UNSCOPED_LABEL}] ${describeKeys(record.keys)}`.trimEnd(),
  );
};
