import { ActionProcessorListResolver, EventActionType, QPQConfig, QPQError } from '@qpqjs/core';

import { buildTestQpqConfig } from './configTesting';

/**
 * Resolves a single event action processor from its resolver. Event resolvers return
 * `{ [EventActionType.X]: processor }`, so tests only ever want the one processor function keyed
 * by the action type. Defaults to a minimal app config when the processor under test does not
 * read anything specific out of it. The constraint uses `any[]` because processor params are
 * contravariant; `unknown[]` would reject concretely-typed processors.
 */
export const resolveEventProcessor = async <Processor extends (...args: any[]) => Promise<[unknown, QPQError?]>>(
  resolver: ActionProcessorListResolver,
  actionType: EventActionType,
  qpqConfig: QPQConfig = buildTestQpqConfig(),
): Promise<Processor> => {
  // Event resolvers never touch the dynamic module loader, so a null stub is safe here.
  const processors = await resolver(qpqConfig, null as any);
  return processors[actionType] as Processor;
};
