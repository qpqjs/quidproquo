import { StorySession } from '../../types';

// Strip service-local state before a session crosses a service boundary.
// Local context (created via createLocalContextIdentifier) and the executing function's
// globals must never be serialized onto the wire to another service - they stay within
// the service that owns them. Cross-service send processors run the outgoing session
// through this before serializing it.
export const toCrossServiceSession = (session: StorySession): StorySession => {
  if (!session.localContext && !session.functionGlobals) {
    return session;
  }

  const { localContext, functionGlobals, ...crossServiceSession } = session;
  return crossServiceSession;
};
