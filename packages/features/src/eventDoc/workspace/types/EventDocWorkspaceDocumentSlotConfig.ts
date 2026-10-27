import { EventDocDocument } from '../../models';
import { EventDocWorkspaceDocumentSlotFoldConfig } from './EventDocWorkspaceDocumentSlotFoldConfig';
import { EventDocWorkspaceStoryApi } from './EventDocWorkspaceStoryApi';

/** A document slot's config: its fold config plus its api. */
export type EventDocWorkspaceDocumentSlotConfig<
  TView extends EventDocDocument = EventDocDocument,
  TApi extends EventDocWorkspaceStoryApi = EventDocWorkspaceStoryApi,
> = EventDocWorkspaceDocumentSlotFoldConfig<TView> & {
  api: TApi;
};
