import { EventDocFunctions } from './types/EventDocFunctions';

/** Service-side members layered onto a definition at registration (a render that resolves linked docs or assets). */
export type EventDocFunctionsExtensions = {
  render?: EventDocFunctions['render'];
};

/**
 * A definition plus its service-side extensions as one registrable object. Extensions are additive only: redefining a
 * definition member throws, so the registered surface cannot disagree with the definition every other reader sees.
 */
export const extendEventDocFunctions = (definition: EventDocFunctions, extensions?: EventDocFunctionsExtensions): EventDocFunctions => {
  const members = definition as Record<string, unknown>;
  const collisions = Object.keys(extensions ?? {}).filter((extensionName) => members[extensionName] !== undefined);

  if (collisions.length > 0) {
    throw new Error(`event doc functions extensions redefine definition member(s): ${collisions.join(', ')} - extensions are additive only.`);
  }

  return { ...definition, ...extensions };
};
