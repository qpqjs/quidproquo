import { askCatch, AskResponse } from 'quidproquo-core';

import { EventDocDocRef } from '../../models';
import { askUIEventDocExportSetError } from '../actionCreators/askUIEventDocExportSetError';
import { askUIEventDocExportSetLoading } from '../actionCreators/askUIEventDocExportSetLoading';
import { askUIEventDocExportSetManifest } from '../actionCreators/askUIEventDocExportSetManifest';
import { askEventDocManifestFetch } from '../transport/askEventDocManifestFetch';

/** Moves from picking to reviewing by fetching the manifest of the picked docs. Builds nothing. */
export function* askEventDocExportUiPreview(serviceName: string, targets: EventDocDocRef[]): AskResponse<void> {
  yield* askUIEventDocExportSetLoading(true);
  yield* askUIEventDocExportSetError(null);

  const result = yield* askCatch(askEventDocManifestFetch(serviceName, targets), askUIEventDocExportSetLoading(false));

  if (!result.success) {
    yield* askUIEventDocExportSetError('Could not work out what these documents depend on.');
    return;
  }

  yield* askUIEventDocExportSetManifest(result.result);
}
