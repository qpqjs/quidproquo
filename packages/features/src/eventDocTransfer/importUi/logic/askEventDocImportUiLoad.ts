import { AskResponse } from '@qpqjs/core';

import { askUiCatch } from '../../../ui/logic/askUiCatch';
import { EventDocTransferPlanResult } from '../../models';
import { askUIEventDocImportSetError } from '../actionCreators/askUIEventDocImportSetError';
import { askUIEventDocImportSetLoading } from '../actionCreators/askUIEventDocImportSetLoading';
import { askUIEventDocImportSetPlan } from '../actionCreators/askUIEventDocImportSetPlan';
import { askEventDocBundleUpload } from '../transport/askEventDocBundleUpload';
import { askEventDocPlanFetch } from '../transport/askEventDocPlanFetch';
import { askEventDocUploadTargetFetch } from '../transport/askEventDocUploadTargetFetch';

type LoadedBundle = EventDocTransferPlanResult & {
  transferId: string;
};

// One story so a single askCatch covers every step.
function* askEventDocImportUiUploadAndPlan(serviceName: string, file: File): AskResponse<LoadedBundle> {
  const target = yield* askEventDocUploadTargetFetch(serviceName);

  yield* askEventDocBundleUpload(target.uploadUrl, file);

  const planResult = yield* askEventDocPlanFetch(serviceName, target.transferId);

  return { transferId: target.transferId, ...planResult };
}

/** Uploads the chosen bundle file and stores its plan. Writes nothing. */
export function* askEventDocImportUiLoad(serviceName: string, file: File): AskResponse<void> {
  const loaded = yield* askUiCatch(askEventDocImportUiUploadAndPlan(serviceName, file), {
    askSetError: askUIEventDocImportSetError,
    askSetBusy: askUIEventDocImportSetLoading,
    errorText: 'Could not read that bundle. Is it a file exported from this app?',
  });

  if (!loaded.success) {
    return;
  }

  yield* askUIEventDocImportSetPlan(loaded.result.transferId, loaded.result.source, loaded.result.rows);
}
