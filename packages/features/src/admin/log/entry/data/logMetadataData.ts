import {
  askFileExists,
  askFileGenerateTemporarySecureUrl,
  askFileWriteObjectJson,
  askKeyValueStoreQuery,
  askKeyValueStoreQueryAll,
  askKeyValueStoreUpdatePartialProperties,
  askKeyValueStoreUpsert,
  askMapParallel,
  AskResponse,
  kvsAnd,
  kvsBetween,
  kvsContains,
  kvsEqual,
  kvsExists,
  KvsQueryCondition,
  QPQ_LOG_REPORTS_STORAGE_DRIVE_NAME,
  QPQ_LOGS_STORAGE_DRIVE_NAME,
  QpqPagedData,
  QpqRuntimeType,
  StoryResultMetadata,
  StoryResultMetadataWithChildren,
} from '@qpqjs/core';

import { LogMetadata } from '../domain/LogMetadata';

const metadataStoreName = QPQ_LOGS_STORAGE_DRIVE_NAME;
export function* askLogMetadataUpsert(logMetadata: LogMetadata): AskResponse<void> {
  yield* askKeyValueStoreUpsert(metadataStoreName, logMetadata);
}

export function* askLogMetadataSetChecked(correlation: string, checked: boolean, checkedBy: string): AskResponse<LogMetadata> {
  return yield* askKeyValueStoreUpdatePartialProperties<LogMetadata, 'correlation'>(metadataStoreName, 'correlation', {
    correlation,
    checked,
    checkedBy,
  });
}

export function* askLogMetadataList(
  runtimeType: QpqRuntimeType,
  startDateTime: string,
  endDateTime: string,
  errorFilter: string,
  serviceFilter: string,
  infoFilter: string,
  userFilter: string,
  onlyErrors: boolean,
  nextPageKey?: string,
): AskResponse<QpqPagedData<LogMetadata>> {
  const filters: KvsQueryCondition[] = [];

  if (onlyErrors) {
    filters.push(kvsExists('error'));
  }

  if (serviceFilter) {
    filters.push(kvsEqual('moduleName', serviceFilter));
  }

  if (infoFilter) {
    filters.push(kvsContains('generic', infoFilter));
  }

  if (errorFilter) {
    filters.push(kvsContains('error', errorFilter));
  }

  if (userFilter) {
    filters.push(kvsContains('userInfo', userFilter));
  }

  const logs = yield* askKeyValueStoreQuery<LogMetadata>(
    metadataStoreName,
    kvsAnd([kvsEqual('runtimeType', runtimeType), kvsBetween('startedAt', startDateTime, endDateTime)]),
    {
      nextPageKey,
      filter: filters.length > 0 ? kvsAnd(filters) : undefined,
    },
  );

  return logs;
}

export function* askLogMetadataGetByCorrelation(correlation: string): AskResponse<LogMetadata | undefined> {
  const logs = yield* askKeyValueStoreQuery<LogMetadata>(metadataStoreName, kvsEqual('correlation', correlation));

  return logs.items[0];
}

export function* askLogMetadataGetByFromCorrelation(fromCorrelation: string): AskResponse<QpqPagedData<LogMetadata>> {
  const logs = yield* askKeyValueStoreQuery<LogMetadata>(metadataStoreName, kvsEqual('fromCorrelation', fromCorrelation));

  return logs;
}

export function* askLogMetadataGetAllByFromCorrelation(fromCorrelation: string): AskResponse<LogMetadata[]> {
  return yield* askKeyValueStoreQueryAll<LogMetadata>(metadataStoreName, kvsEqual('fromCorrelation', fromCorrelation));
}

function* askFindRootLog(fromCorrelation?: string): AskResponse<LogMetadata | undefined> {
  if (!fromCorrelation) {
    return;
  }

  const parentLog = yield* askLogMetadataGetByCorrelation(fromCorrelation);
  return (yield* askFindRootLog(parentLog?.fromCorrelation)) || parentLog;
}

function* askCreateHierarchy(rootStoryResultMetadata: StoryResultMetadata): AskResponse<StoryResultMetadataWithChildren> {
  const childrenLogs: StoryResultMetadata[] = yield* askLogMetadataGetAllByFromCorrelation(rootStoryResultMetadata.correlation);

  const sortedChildren = childrenLogs.sort((a, b) => {
    return a.startedAt < b.startedAt ? -1 : 1;
  });

  const childrenWithHierarchies = yield* askMapParallel(sortedChildren, askCreateHierarchy);
  return {
    ...rootStoryResultMetadata,
    children: childrenWithHierarchies,
  };
}

export function* askLogMetadataGetHierarchiesByCorrelation(correlation: string, forceRefresh: boolean): AskResponse<string | undefined> {
  const root = yield* askFindRootLog(correlation);
  if (root) {
    const rootReportFilename = `${root.correlation}-tree.json`;
    const reportExists = yield* askFileExists(QPQ_LOG_REPORTS_STORAGE_DRIVE_NAME, rootReportFilename);

    if (!reportExists || forceRefresh) {
      const report = yield* askCreateHierarchy(root);
      yield* askFileWriteObjectJson(QPQ_LOG_REPORTS_STORAGE_DRIVE_NAME, rootReportFilename, report);
    }

    return yield* askFileGenerateTemporarySecureUrl(QPQ_LOG_REPORTS_STORAGE_DRIVE_NAME, rootReportFilename, 1 * 60 * 1000);
  }

  return undefined;
}
