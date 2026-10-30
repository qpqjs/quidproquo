import { createQpqRuntimeComputed, useQpqRuntimeComputed } from '@qpqjs/web-react';

import { adminAppRuntime } from '../adminAppRuntime';
import { selectSessionState } from '../logic/selectors/selectSessionState';
import { AdminSessionState } from '../types/AdminSessionState';

const sessionStateComputed = createQpqRuntimeComputed(adminAppRuntime, selectSessionState);

// The folded session, subscribes via a computed atom, so components re-render
// only when the fold result actually changes.
export const useSessionState = (): AdminSessionState => useQpqRuntimeComputed(sessionStateComputed);
