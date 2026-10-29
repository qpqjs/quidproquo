import { AskResponse } from '@qpqjs/core';

import { askApplyEventDocEvent } from '../../../actions/askApplyEventDocEvent';
import { EventDocWorkspaceChromeEffect } from '../effects/EventDocWorkspaceChromeEffect';
import { EventDocWorkspaceChromeSetHistoryAssetUrlsEffect } from '../effects/EventDocWorkspaceChromeSetHistoryAssetUrlsEffect';

/** Replaces the links to assets the history panel shows (pass the whole map: last write wins). */
export function* askChromeSetHistoryAssetUrls(urls: Record<string, string>): AskResponse<void> {
  yield* askApplyEventDocEvent<EventDocWorkspaceChromeSetHistoryAssetUrlsEffect>(EventDocWorkspaceChromeEffect.SetHistoryAssetUrls, { urls });
}
