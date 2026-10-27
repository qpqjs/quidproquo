import { createQpqRuntimeComputed, useQpqRuntimeComputed } from 'quidproquo-web-react';

import { adminAppRuntime } from '../adminAppRuntime';
import { AdminSessionState } from '../AdminSessionState';
import { selectSessionState } from '../logic/selectors/selectSessionState';

const sessionStateComputed = createQpqRuntimeComputed(adminAppRuntime, selectSessionState);

// The folded session — subscribes via a computed atom, so components re-render
// only when the fold result actually changes.
export const useSessionState = (): AdminSessionState => useQpqRuntimeComputed(sessionStateComputed);
