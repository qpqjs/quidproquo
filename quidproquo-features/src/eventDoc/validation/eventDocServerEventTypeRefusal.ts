/** The one reason text every client path gives for a server-only event type, so the editor and the route agree. */
export const eventDocServerEventTypeRefusal = (type: string): string =>
  `Event type [${type}] is server-only: it can only be appended by server code, never from a client.`;
