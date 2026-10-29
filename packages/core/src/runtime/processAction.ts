import { actionResultError } from '../logic/actionResult';
import { DynamicModuleLoader, QpqLogger, StorySession, StreamRegistry } from '../types';
import { Action, ActionProcessorList, ActionProcessorResult } from '../types/Action';
import { ErrorTypeEnum } from '../types/ErrorTypeEnum';

export async function processAction(
  action: Action<any>,
  actionProcessors: ActionProcessorList,
  session: StorySession,
  logger: QpqLogger,
  updateSession: (session: Partial<StorySession>) => void,
  dynamicModuleLoader: DynamicModuleLoader,
  streamRegistry: StreamRegistry,
): Promise<ActionProcessorResult<any>> {
  try {
    // A plain string index resolves inherited Object.prototype members for action
    // types like 'constructor' or 'toString' and would invoke them as processors.
    // Reject anything that is just an inherited prototype member so unknown types
    // hit the error path below. This stays an identity check (not an own-property
    // check) because some processor lists are Proxies that synthesize processors
    // in their get trap (see createDebugLogActionProcessor in qpqExecuteLog).
    const candidate = actionProcessors?.[action?.type];
    const processor = candidate === (Object.prototype as any)[action?.type] ? undefined : candidate;
    // The registered list goes in the stack, not the text: the text reaches callers, and the list
    // describes the runtime. The user-script sandbox relies on this text naming the action.
    if (!processor) {
      return actionResultError(
        ErrorTypeEnum.GenericError,
        `Unable to process action: ${action?.type}`,
        `Registered actions: [${Object.keys(actionProcessors).join(', ')}]`,
      );
    }

    // Merge any context carried on the action into the session
    // This allows context providers to propagate values to sub-runtimes
    // TODO: @joe-coady: do the same thing with auth, currently we mutate the runtime when set new auth.
    const effectiveSession = {
      ...session,
      context: { ...session.context, ...action.context },
      localContext: { ...session.localContext, ...action.localContext },
    };

    return await processor(action.payload, effectiveSession, actionProcessors, logger, updateSession, dynamicModuleLoader, streamRegistry);
  } catch (e: unknown) {
    // The exception's own message stays in the stack for the logs. The text reaches callers, and an
    // unmapped failure's message can name resources, paths, or accounts.
    if (e instanceof Error) {
      const errorName = e.name ? ` [${e.name}]` : '';
      return actionResultError(ErrorTypeEnum.GenericError, `An unexpected error occurred in [${action?.type}]${errorName}.`, e.stack);
    }
    return actionResultError(ErrorTypeEnum.GenericError, `An unknown error occurred in [${action?.type}]`);
  }
}
