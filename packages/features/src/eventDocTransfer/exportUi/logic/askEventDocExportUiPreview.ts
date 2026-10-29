import { AskResponse } from '@qpqjs/core';

import { askUiCatch } from '../../../ui/logic/askUiCatch';
import { EventDocDocRef } from '../../models';
import { askEventDocExportSetError } from '../actionCreators/askEventDocExportSetError';
import { askEventDocExportSetLoading } from '../actionCreators/askEventDocExportSetLoading';
import { askEventDocExportSetManifest } from '../actionCreators/askEventDocExportSetManifest';
import { askEventDocManifestFetch } from '../transport/askEventDocManifestFetch';

/** Moves from picking to reviewing by fetching the manifest of the picked docs. Builds nothing. */
export function* askEventDocExportUiPreview(serviceName: string, targets: EventDocDocRef[]): AskResponse<void> {
  const result = yield* askUiCatch(askEventDocManifestFetch(serviceName, targets), {
    askSetError: askEventDocExportSetError,
    askSetBusy: askEventDocExportSetLoading,
    errorText: 'Could not work out what these documents depend on.',
  });

  if (!result.success) {
    return;
  }

  yield* askEventDocExportSetManifest(result.result);
}
