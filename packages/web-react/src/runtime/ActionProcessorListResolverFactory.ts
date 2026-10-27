import { ActionProcessorListResolver } from '@qpqjs/core';

import { Dispatch } from 'react';

export type ActionProcessorListResolverFactory<TState = any> = (
  dispatch: Dispatch<any>,
  getCurrentState: () => TState,
) => ActionProcessorListResolver;
