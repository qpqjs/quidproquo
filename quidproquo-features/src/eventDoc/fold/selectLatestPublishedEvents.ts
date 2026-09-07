import { EventDocEffect, EventDocEvent } from '../models';

/**
 * The events up to and including the most recent PUBLISH; events after it belong to the next, unpublished draft.
 * Returns [] when the doc has never been published.
 */
export const selectLatestPublishedEvents = (events: EventDocEvent[]): EventDocEvent[] => {
  const lastPublishIndex = events.map((event) => event.type).lastIndexOf(EventDocEffect.Publish);

  return lastPublishIndex === -1 ? [] : events.slice(0, lastPublishIndex + 1);
};
