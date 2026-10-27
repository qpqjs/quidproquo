import { EventDocDocument, EventDocEventPayload, EventDocSetNameData } from '../../models';

/** Sets the document name. */
export const setName = <TState extends EventDocDocument>(state: TState, { data }: EventDocEventPayload<EventDocSetNameData>): TState => ({
  ...state,
  name: data.name,
});
