import type { ClientEventDocEventPayload } from './ClientEventDocEventPayload';

/** What the client POSTs to append an event. `modelId` comes from the URL path. */
export type EventDocEventInput<T = unknown> = {
  type: string;
  payload: ClientEventDocEventPayload<T>;
};
