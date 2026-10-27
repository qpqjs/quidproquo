import { EventDocWorkspaceLocalSlotFoldConfig } from './EventDocWorkspaceLocalSlotFoldConfig';
import { EventDocWorkspaceStoryApi } from './EventDocWorkspaceStoryApi';

/** A local slot's config: its fold config plus its api. */
export type EventDocWorkspaceLocalSlotConfig<
  TView = unknown,
  TApi extends EventDocWorkspaceStoryApi = EventDocWorkspaceStoryApi,
> = EventDocWorkspaceLocalSlotFoldConfig<TView> & {
  api: TApi;
};
