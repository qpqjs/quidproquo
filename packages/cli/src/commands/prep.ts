// `qpq prep` — regenerates apps/<app>/tsconfig.federated.json (the TypeScript
// path aliases for cross-view federated imports). Run after adding/removing a
// `// federated.export` marker.
import { writeFederatedTsconfigForApp } from 'quidproquo-deploy-rspack';

import { getAvailableApps, getRoot } from '../lib/discovery';
import { resolveAppSelection } from '../lib/resolveAppSelection';

export const prepCommand = async (argv: string[]): Promise<void> => {
  const selection = await resolveAppSelection({ argv, allowAll: true });
  const appNames = selection === 'all' ? getAvailableApps() : [selection];

  for (const appName of appNames) {
    const exposeCount = writeFederatedTsconfigForApp(getRoot(), appName);
    console.log(`prep: wrote ${exposeCount} federated aliases to apps/${appName}/tsconfig.federated.json`);
  }
};
