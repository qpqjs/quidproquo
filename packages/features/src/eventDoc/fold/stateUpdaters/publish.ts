import { EventDocDocument, EventDocStatus } from '../../models';

/** Marks the document published. */
export const publish = <TState extends EventDocDocument>(state: TState): TState => ({
  ...state,
  status: EventDocStatus.Published,
});
