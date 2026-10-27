import { memo, ReactNode } from 'react';

import { BubbleReducerDispatchContext } from './BubbleReducerDispatchContext';
import { QpqRuntimeDefinition } from './createQpqRuntimeDefinition';
import { useQpqRuntime } from './useQpqRuntime';

type QpqRuntimeEffectCatcherProps = {
  runtime: QpqRuntimeDefinition<any, any, any>;
  name?: string;
  children: ReactNode;
};

const QpqRuntimeEffectCatcherComponent = ({ children, runtime, name }: QpqRuntimeEffectCatcherProps) => {
  const [, , dispatch] = useQpqRuntime(runtime, name);

  return <BubbleReducerDispatchContext.Provider value={dispatch}>{children}</BubbleReducerDispatchContext.Provider>;
};

export const QpqRuntimeEffectCatcher = memo(QpqRuntimeEffectCatcherComponent);
