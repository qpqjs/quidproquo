import { QPQConfig, QpqFunctionRuntime } from '@qpqjs/core';

// Resolves extra own-code markers (see resolveSourceMaps.filterOwnCodeLocations) for the
// story being traced. Opt-in: lambda's federated remotes stay on the plain "not
// node_modules" heuristic that already works for them; hosts whose bundle layout defeats
// that heuristic (the dev server bundles every hosted service plus the whole framework
// into one script) pass a resolver to narrow onlyOwnCode to the traced service.
export type OwnCodeMarkersResolver = (qpqFunctionRuntimeInfo: QpqFunctionRuntime | undefined, qpqConfig: QPQConfig) => string[] | undefined;
