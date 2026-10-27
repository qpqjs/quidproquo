import { ActionProcessorListResolver } from 'quidproquo-core';

import { Dispatch } from 'react';

export type ActionProcessorListResolverFactory<TState = any> = (
  dispatch: Dispatch<any>,
  getCurrentState: () => TState,
) => ActionProcessorListResolver;
