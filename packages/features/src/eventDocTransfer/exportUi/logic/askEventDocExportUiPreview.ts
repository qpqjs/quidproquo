import { AskResponse } from '@qpqjs/core';

import { askUiCatch } from '../../../ui/logic/askUiCatch';
import { EventDocDocRef } from '../../models';
import { askUIEventDocExportSetError } from '../actionCreators/askUIEventDocExportSetError';
import { askUIEventDocExportSetLoading } from '../actionCreators/askUIEventDocExportSetLoading';
import { askUIEventDocExportSetManifest } from '../actionCreators/askUIEventDocExportSetManifest';
import { askEventDocManifestFetch } from '../transport/askEventDocManifestFetch';

/** Moves from picking to reviewing by fetching the manifest of the picked docs. Builds nothing. */
export function* askEventDocExportUiPreview(serviceName: string, targets: EventDocDocRef[]): AskResponse<void> {
  const result = yield* askUiCatch(askEventDocManifestFetch(serviceName, targets), {
    askSetError: askUIEventDocExportSetError,
    askSetBusy: askUIEventDocExportSetLoading,
    errorText: 'Could not work out what these documents depend on.',
  });

  if (!result.success) {
    return;
  }

  yield* askUIEventDocExportSetManifest(result.result);
}
