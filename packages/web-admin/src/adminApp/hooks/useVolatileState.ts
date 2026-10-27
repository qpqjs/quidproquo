import { createQpqRuntimeComputed, useQpqRuntimeComputed } from '@qpqjs/web-react';

import { adminAppRuntime } from '../adminAppRuntime';
import { VolatileState } from '../VolatileState';

const volatileStateComputed = createQpqRuntimeComputed(adminAppRuntime, (state) => state.volatile);

export const useVolatileState = (): VolatileState => useQpqRuntimeComputed(volatileStateComputed);
