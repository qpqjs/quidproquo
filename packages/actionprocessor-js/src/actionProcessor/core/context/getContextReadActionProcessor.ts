import {
  actionResult,
  askContextReadBase,
  ContextActionType,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  QpqContext,
  QpqContextIdentifier,
} from 'quidproquo-core';

// any: one processor serves context identifiers of every value type; the per-call
// generic is only meaningful at the requester, so the variance boundary needs any.
const getContextValue = (context: QpqContext<any>, contextIdentifier: QpqContextIdentifier<any>): any => {
  return contextIdentifier.uniqueName in context ? context[contextIdentifier.uniqueName] : contextIdentifier.defaultValue;
};

const getProcessContextRead = (qpqConfig: QPQConfig): ProcessorFor<typeof askContextReadBase> => {
  return async ({ contextIdentifier }, session) => {
    const context = contextIdentifier.local ? session.localContext || {} : session.context;
    return actionResult(getContextValue(context, contextIdentifier));
  };
};

export const getContextReadActionProcessor = createActionProcessor(askContextReadBase, getProcessContextRead);
