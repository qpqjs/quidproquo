import { EventDocWorkspaceSlotFoldConfigBase } from './EventDocWorkspaceSlotFoldConfigBase';
import { EventDocWorkspaceStoryApi } from './EventDocWorkspaceStoryApi';

/** Fold config plus the slot's api (scope-blind verbs the factory binds to the slot). */
export type EventDocWorkspaceSlotConfigBase<TView, TApi extends EventDocWorkspaceStoryApi> = EventDocWorkspaceSlotFoldConfigBase<TView> & {
  api: TApi;
};
