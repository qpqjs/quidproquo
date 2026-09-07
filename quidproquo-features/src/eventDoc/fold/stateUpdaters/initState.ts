import { EventDocDocument, EventDocEventPayload, EventDocInitData, EventDocStatus } from '../../models';

/** Resets to the module's initial state, then stamps identity and timestamps from the INIT event. */
export const initState =
  <TState extends EventDocDocument>(getInitialState: () => TState) =>
  (_state: TState, { data, metadata }: EventDocEventPayload<EventDocInitData>): TState => ({
    ...getInitialState(),
    id: data.id,
    code: data.code,
    name: data.name,
    documentVersion: 1,
    status: EventDocStatus.Draft,
    createdAt: metadata.createdAt,
    updatedAt: metadata.createdAt,
  });
