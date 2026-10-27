import { EventDocDocument, EventDocStatus } from '../../models';

/** Flips to draft; bumps documentVersion only when leaving published. */
export const createDraft = <TState extends EventDocDocument>(state: TState): TState => ({
  ...state,
  status: EventDocStatus.Draft,
  documentVersion: state.status === EventDocStatus.Published ? state.documentVersion + 1 : state.documentVersion,
});
