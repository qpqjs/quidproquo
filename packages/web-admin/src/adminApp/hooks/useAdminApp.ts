import { useQpqRuntime } from 'quidproquo-web-react';

import { adminAppRuntime } from '../adminAppRuntime';

// The ApplyEvent processor and the boot story both live on the definition, so
// every consumer binds the same way; the first bind starts the session.
export const useAdminApp = () => useQpqRuntime(adminAppRuntime);
