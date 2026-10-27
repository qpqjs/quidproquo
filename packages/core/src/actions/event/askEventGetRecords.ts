import { AskResponse } from '../../types/StorySession';
import { createActionRequester } from '../../types/utils/createActionRequester';
import { EventActionType } from './EventActionType';

export const askEventGetRecordsBase = createActionRequester<unknown[]>()({
  actionType: EventActionType.GetRecords,
  getPayload: (eventParams: unknown[]) => ({ eventParams }),
});

// Event shapes are per event source, so the base is untyped and each entry point casts
// to the record types its own source produces.
export function* askEventGetRecords<EventParams extends Array<unknown>, QpqEventRecord>(...eventParams: EventParams): AskResponse<QpqEventRecord[]> {
  return (yield* askEventGetRecordsBase(eventParams)) as QpqEventRecord[];
}
