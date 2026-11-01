import {
  askCatch,
  askDateNow,
  askFileReadTextContents,
  askFilter,
  askMapParallelBatch,
  askPagedDataDrain,
  AskResponse,
  askSecondsElapsedFrom,
  QPQ_LOGS_STORAGE_DRIVE_NAME,
  QpqPagedData,
  StoryResult,
} from '@qpqjs/core';

import { ADMIN_LOG_DEEP_SEARCH_BATCH_SIZE, ADMIN_LOG_SEARCH_MAX_ITEMS, ADMIN_LOG_SEARCH_TIMEOUT_SECONDS } from '../../../constants';
import { askLogMetadataList } from '../../data/logMetadata';
import { LogDeepSearchQuery, LogMetadata, LogSearchQuery } from '../../entry/domain';
import { redactStoryResult } from '../redaction/redactStoryResult';

// The deep filter is a substring oracle over the log text, so it has to run over the same redacted log the admin
// can read, never the raw file. Anything that is not a story result is unsearchable.
const toSearchableLogText = (rawLogText: string): string => {
  try {
    return JSON.stringify(redactStoryResult(JSON.parse(rawLogText) as StoryResult<any>));
  } catch {
    return '';
  }
};

// Reads one log's redacted, searchable text; a log whose file cannot be read searches as empty.
function* askLogSearchableText(log: LogMetadata): AskResponse<string> {
  const logData = yield* askCatch(askFileReadTextContents(QPQ_LOGS_STORAGE_DRIVE_NAME, `${log.correlation}.json`));

  return logData.success ? toSearchableLogText(logData.result) : '';
}

// One page of the search: the metadata page as stored, narrowed to the logs whose redacted text contains `deep`
// when a deep filter is set.
function* askLogSearchPage(search: Omit<LogSearchQuery, 'nextPageKey'>, deep: string, pageKey?: string): AskResponse<QpqPagedData<LogMetadata>> {
  const logPage = yield* askLogMetadataList({ ...search, nextPageKey: pageKey });

  if (!deep) {
    return logPage;
  }

  const texts = yield* askMapParallelBatch(logPage.items, ADMIN_LOG_DEEP_SEARCH_BATCH_SIZE, askLogSearchableText);
  const items = yield* askFilter(logPage.items, function* (_log, index) {
    return (texts[index] ?? '').includes(deep);
  });

  return { items, nextPageKey: logPage.nextPageKey };
}

// Searches the log metadata from the caller's page, deep-filtering each page against the redacted log text when
// `deep` is set, until the item cap or the time budget is reached; the unread page key comes back with the items.
export function* askLogGetAll(query: LogDeepSearchQuery): AskResponse<QpqPagedData<LogMetadata>> {
  const { deep, nextPageKey, ...search } = query;

  const startTime = yield* askDateNow();

  return yield* askPagedDataDrain(
    function* (pageKey) {
      return yield* askLogSearchPage(search, deep, pageKey);
    },
    {
      startPageKey: nextPageKey,
      *askShouldContinue(collected) {
        return collected.length < ADMIN_LOG_SEARCH_MAX_ITEMS && (yield* askSecondsElapsedFrom(startTime)) < ADMIN_LOG_SEARCH_TIMEOUT_SECONDS;
      },
    },
  );
}
