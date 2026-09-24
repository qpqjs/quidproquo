import { KvsStreamEventType } from 'quidproquo';

// The marker row id for one stream record: the changed item's key plus the
// event type, so an insert and its remove are two rows the test polls for.
export const smokeStreamMarkerId = (
  key: string,
  eventType: KvsStreamEventType
): string => `${key}-stream-${eventType.toLowerCase()}`;
