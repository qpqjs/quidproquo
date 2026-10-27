import { EventDocEventPayload } from '../../../models';
import { EventDocWorkspaceChromeSetHistoryAssetUrlsPayload } from '../effects/EventDocWorkspaceChromeSetHistoryAssetUrlsEffect';
import { EventDocWorkspaceChromeState } from '../types/EventDocWorkspaceChromeState';

/** Folds a SetHistoryAssetUrls event (replaces the map). */
export const setHistoryAssetUrls = (
  state: EventDocWorkspaceChromeState,
  payload: EventDocEventPayload<EventDocWorkspaceChromeSetHistoryAssetUrlsPayload>,
): EventDocWorkspaceChromeState => ({
  ...state,
  historyAssetUrls: payload.data.urls,
});
