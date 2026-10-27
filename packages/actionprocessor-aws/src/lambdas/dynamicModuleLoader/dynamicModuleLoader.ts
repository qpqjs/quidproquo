// ─────────────────────────────────────────────────────────────────────────────
// The dynamic module loader: the single seam every lambda entry uses to turn a
// QpqFunctionRuntime (e.g. "/src/routes/getOrders::getOrders") into the actual
// story function to run. Each lambda entry file (apiGatewayEventHandler, etc.)
// imports THIS and hands it to the qpq runtime.
//
// Two tiers, tried in order:
//   1. FEDERATED  : loadFederatedStory reads the service's code bucket and returns
//                   the published version of the story (see ../../logic/
//                   federatedModuleStore/loadFederatedStory.ts for the whole flow).
//   2. BUNDLED    : qpqDynamicModuleLoader is a build-time-generated function
//                   (the 'quidproquo-dynamic-loader' virtual module, produced by the
//                   deploy-webpack/deploy-rspack QpqPlugin), an if-chain that
//                   require()s the story code statically bundled into the lambda zip.
//
// loadFederatedStory returns undefined on any miss (no store configured, nothing
// published, runtime not in the manifest), which is the signal to fall back to the
// bundled tier. If the service opted into `bundleFallback: false` (a "thin shell"),
// the bundled tier itself throws instead of resolving, so an unpublished thin shell
// fails loudly rather than silently serving stale code.
// ─────────────────────────────────────────────────────────────────────────────
import { QpqFunctionRuntime } from 'quidproquo-core';
// @ts-expect-error - injected at build time by QpqPlugin (virtual module)
import { qpqConfig, qpqDynamicModuleLoader } from 'quidproquo-dynamic-loader';

import { loadFederatedStory } from '../../logic/federatedModuleStore';

export const dynamicModuleLoader = async <T = any>(qpqFunctionRuntime: QpqFunctionRuntime): Promise<T> => {
  // Tier 1: federated. undefined means "nothing published for this runtime" -> fall through.
  const federatedStory = await loadFederatedStory<T>(qpqConfig, qpqFunctionRuntime);
  if (federatedStory !== undefined) {
    return federatedStory;
  }

  // Tier 2: the statically bundled story (or a fail-fast throw for a thin shell).
  return qpqDynamicModuleLoader(qpqFunctionRuntime);
};
