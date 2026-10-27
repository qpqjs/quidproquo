import { Effect } from 'quidproquo-core';

import { EventDocWorkspaceChromeEffect } from './EventDocWorkspaceChromeEffect';

/** Payload of the SetHistoryAssetUrls effect: the whole map (the effect is last-write-wins). */
export type EventDocWorkspaceChromeSetHistoryAssetUrlsPayload = {
  urls: Record<string, string>;
};

/** Replaces the links to assets the history panel shows. */
export type EventDocWorkspaceChromeSetHistoryAssetUrlsEffect = Effect<
  EventDocWorkspaceChromeEffect.SetHistoryAssetUrls,
  EventDocWorkspaceChromeSetHistoryAssetUrlsPayload
>;
