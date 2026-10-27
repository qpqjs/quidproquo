import { Action, ActionHistory, ActionProcessorResult } from 'quidproquo-core';

import { FC } from 'react';

export type ActionComponentProps<T = any, R = any> = {
  action: Action<T>;
  result: ActionProcessorResult<R>;
  expanded: boolean;
};

export type ActionComponent<T = any, R = any> = FC<ActionComponentProps<T, R>>;
