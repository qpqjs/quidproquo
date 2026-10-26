import { StorySession } from '../../types';

/**
 * Strips service-local state before a session crosses a service boundary (queue, event bus,
 * service function) or comes back in from one. Local context, the executing function's globals
 * and the raw access token stay inside the service that owns them; only the decoded token travels.
 * Receivers run the inbound session through this too, so a crafted message cannot plant them.
 */
export const toCrossServiceSession = (session: StorySession): StorySession => {
  if (!session.localContext && !session.functionGlobals && !session.accessToken) {
    return session;
  }

  const { localContext, functionGlobals, accessToken, ...crossServiceSession } = session;
  return crossServiceSession;
};
