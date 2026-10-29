import { buildActionProcessorList, buildTestStorySession, createStubLogger, noopDynamicModuleLoader } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { actionResult, isErroredActionResult, resolveActionResult, resolveActionResultError } from '../logic/actionResult';
import { ErrorTypeEnum } from '../types/ErrorTypeEnum';
import { StorySession } from '../types/StorySession';
import { processAction } from './processAction';

const logger = createStubLogger();
const updateSession = () => {};
const streamRegistry = {} as any;

describe('processAction', () => {
  it('returns the processor result for a known action type', async () => {
    const processors = buildActionProcessorList({ Known: async () => actionResult('done') });

    const result = await processAction(
      { type: 'Known' },
      processors,
      buildTestStorySession(),
      logger,
      updateSession,
      noopDynamicModuleLoader as any,
      streamRegistry,
    );

    expect(resolveActionResult(result)).toBe('done');
  });

  it('returns a GenericError when no processor matches the type', async () => {
    const result = await processAction(
      { type: 'Missing' },
      buildActionProcessorList({}),
      buildTestStorySession(),
      logger,
      updateSession,
      noopDynamicModuleLoader as any,
      streamRegistry,
    );

    expect(isErroredActionResult(result)).toBe(true);
    expect(resolveActionResultError(result).errorType).toBe(ErrorTypeEnum.GenericError);
  });

  it('does not resolve inherited Object.prototype members as processors', async () => {
    // 'constructor' and 'toString' exist on the prototype chain of a plain
    // processor map; a plain string index would invoke them as processors.
    for (const type of ['constructor', 'toString', 'hasOwnProperty']) {
      const result = await processAction(
        { type },
        buildActionProcessorList({ Known: async () => actionResult('done') }),
        buildTestStorySession(),
        logger,
        updateSession,
        noopDynamicModuleLoader as any,
        streamRegistry,
      );

      expect(isErroredActionResult(result)).toBe(true);
      expect(resolveActionResultError(result).errorType).toBe(ErrorTypeEnum.GenericError);
      expect(resolveActionResultError(result).errorText).toContain('Unable to process action');
    }
  });

  it('wraps a thrown Error as a GenericError naming the action and error, with the message only in the stack', async () => {
    const processors = buildActionProcessorList({
      Boom: async () => {
        throw Object.assign(new Error('it broke: table arn:aws:dynamodb:internal'), { name: 'CustomError' });
      },
    });

    const result = await processAction(
      { type: 'Boom' },
      processors,
      buildTestStorySession(),
      logger,
      updateSession,
      noopDynamicModuleLoader as any,
      streamRegistry,
    );

    expect(isErroredActionResult(result)).toBe(true);
    const error = resolveActionResultError(result);
    expect(error.errorText).toBe('An unexpected error occurred in [Boom] [CustomError].');
    expect(error.errorText).not.toContain('arn:aws');
    expect(error.errorStack).toContain('it broke: table arn:aws:dynamodb:internal');
  });

  it('names only the unknown action in the text, keeping the registered list in the stack', async () => {
    const result = await processAction(
      { type: 'Nope' },
      buildActionProcessorList({ KnownOne: async () => actionResult('a'), KnownTwo: async () => actionResult('b') }),
      buildTestStorySession(),
      logger,
      updateSession,
      noopDynamicModuleLoader as any,
      streamRegistry,
    );

    const error = resolveActionResultError(result);
    expect(error.errorText).toBe('Unable to process action: Nope');
    expect(error.errorText).not.toContain('KnownOne');
    expect(error.errorStack).toContain('KnownOne');
    expect(error.errorStack).toContain('KnownTwo');
  });

  it('merges action.context and action.localContext into the session given to the processor', async () => {
    let captured: StorySession | undefined;
    const processors = buildActionProcessorList({
      Capture: async (_payload, session) => {
        captured = session;
        return actionResult(null);
      },
    });

    await processAction(
      { type: 'Capture', context: { a: 1 } as any, localContext: { b: 2 } as any },
      processors,
      buildTestStorySession({ context: { base: 0 } as any }),
      logger,
      updateSession,
      noopDynamicModuleLoader as any,
      streamRegistry,
    );

    expect(captured?.context).toEqual({ base: 0, a: 1 });
    expect(captured?.localContext).toEqual({ b: 2 });
  });
});
