import { EventDocDocument, EventDocEventPayload, EventDocSetCodeData } from '../../models';

/** Sets the document code. */
export const setCode = <TState extends EventDocDocument>(state: TState, { data }: EventDocEventPayload<EventDocSetCodeData>): TState => ({
  ...state,
  code: data.code,
});
