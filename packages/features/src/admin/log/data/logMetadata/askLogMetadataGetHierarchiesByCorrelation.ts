import {
  askFileExists,
  askFileGenerateTemporarySecureUrl,
  askFileWriteObjectJson,
  AskResponse,
  QPQ_LOG_REPORTS_STORAGE_DRIVE_NAME,
} from '@qpqjs/core';

import { askLogMetadataCreateHierarchy } from './askLogMetadataCreateHierarchy';
import { askLogMetadataFindRoot } from './askLogMetadataFindRoot';

export function* askLogMetadataGetHierarchiesByCorrelation(correlation: string, forceRefresh: boolean): AskResponse<string | undefined> {
  const root = yield* askLogMetadataFindRoot(correlation);
  if (root) {
    const rootReportFilename = `${root.correlation}-tree.json`;
    const reportExists = yield* askFileExists(QPQ_LOG_REPORTS_STORAGE_DRIVE_NAME, rootReportFilename);

    if (!reportExists || forceRefresh) {
      const report = yield* askLogMetadataCreateHierarchy(root);
      yield* askFileWriteObjectJson(QPQ_LOG_REPORTS_STORAGE_DRIVE_NAME, rootReportFilename, report);
    }

    return yield* askFileGenerateTemporarySecureUrl(QPQ_LOG_REPORTS_STORAGE_DRIVE_NAME, rootReportFilename, 1 * 60 * 1000);
  }

  return undefined;
}
