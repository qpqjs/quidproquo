import { QpqRuntimeDefinition } from './createQpqRuntimeDefinition';
import { QpqApi } from './QpqMappedApi';

export const getQpqRuntimeAreaKey = <TState, TAction, TApi extends QpqApi>(
  definition: QpqRuntimeDefinition<TState, TAction, TApi>,
  instanceName?: string,
): string => (instanceName ? `${definition.uniqueName}:${instanceName}` : definition.uniqueName);
