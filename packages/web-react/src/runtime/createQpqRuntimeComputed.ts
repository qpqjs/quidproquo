import { QpqRuntimeDefinition } from './createQpqRuntimeDefinition';
import { QpqApi } from './QpqMappedApi';

export type QpqRuntimeComputed<TState, TSlice> = {
  definition: QpqRuntimeDefinition<TState, any, any>;
  compute: (state: TState) => TSlice;
};

export function createQpqRuntimeComputed<TState, TAction, TApi extends QpqApi, TSlice>(
  definition: QpqRuntimeDefinition<TState, TAction, TApi>,
  compute: (state: TState) => TSlice,
): QpqRuntimeComputed<TState, TSlice> {
  return { definition, compute };
}
